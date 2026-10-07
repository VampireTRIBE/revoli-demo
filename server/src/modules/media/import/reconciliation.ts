import XLSX from 'xlsx';
import type { MediaDataset, ReconciliationCheck } from '../types/media.types.js';
import { numberValue, text, value, type SheetRow } from '../utils/value-utils.js';
import { parsePeriod } from '../utils/period-utils.js';

export function reconcileImport(paths: string[], dataset: MediaDataset): ReconciliationCheck[] {
  const checks: ReconciliationCheck[] = [];
  for (const path of paths) {
    const workbook = XLSX.readFile(path, { cellDates: true });
    const sheet = workbook.Sheets.Reconciliation;
    if (sheet) {
      const rows = XLSX.utils.sheet_to_json<SheetRow>(sheet, { defval: null, raw: true, range: 4 });
    for (const row of rows) {
      const period = parsePeriod(text(value(row, 'Month')));
      if (!period) continue;
      const normalized = dataset.site.filter((record) => record.periodKey === period.periodKey);
      const pairs = [
        ['Items viewed', numberValue(value(row, 'Source items viewed')), normalized.reduce((sum, record) => sum + record.itemsViewed, 0), 0.0001],
        ['Items added to cart', numberValue(value(row, 'Source items added to cart')), normalized.reduce((sum, record) => sum + record.itemsAddedToCart, 0), 0.0001],
        ['Items purchased', numberValue(value(row, 'Source items purchased')), normalized.reduce((sum, record) => sum + record.itemsPurchased, 0), 0.0001],
        ['Site revenue', numberValue(value(row, 'Source revenue (AED)')), normalized.reduce((sum, record) => sum + record.revenue, 0), 0.01],
      ] as const;
      pairs.forEach(([label, sourceValue, importedValue, tolerance]) => {
        const difference = importedValue - sourceValue;
        checks.push({
          name: `${period.sourcePeriodLabel} ${label}`,
          sourceValue,
          importedValue,
          difference,
          tolerance,
          passed: Math.abs(difference) <= tolerance,
          severity: 'ERROR',
        });
      });
    }
    }
    appendPaidControlChecks(workbook, dataset, checks);
    appendStageSpendChecks(workbook, dataset, checks);
  }
  appendGoogleCampaignChecks(dataset, checks);
  return checks;
}

function appendPaidControlChecks(workbook: XLSX.WorkBook, dataset: MediaDataset, checks: ReconciliationCheck[]) {
  const claimsSheet = workbook.Sheets['Claims vs Verified (monthly)'];
  if (claimsSheet) {
    const rows = XLSX.utils.sheet_to_json<SheetRow>(claimsSheet, { defval: null, raw: true });
    rows.forEach((row) => {
      const period = parsePeriod(text(value(row, 'Month')));
      if (!period || !dataset.periods.some((item) => item.periodKey === period.periodKey)) return;
      const periodRows = dataset.platforms.filter((record) => record.periodKey === period.periodKey);
      const googleClaims = periodRows
        .filter((record) => record.platform === 'Google Ads')
        .reduce((total, record) => total + record.claims, 0);
      const metaClaims = periodRows
        .filter((record) => record.platform === 'Meta Ads')
        .reduce((total, record) => total + record.claims, 0);
      checks.push(createCheck(
        `${period.sourcePeriodLabel} Google claims control`,
        numberValue(value(row, 'Google claimed conversions')),
        googleClaims,
        0.51,
        'WARNING',
      ));
      checks.push(createCheck(
        `${period.sourcePeriodLabel} Meta claims control`,
        numberValue(value(row, 'Meta claimed purchases')),
        metaClaims,
        0.51,
        'WARNING',
      ));
    });
  }

  const segmentSheet = workbook.Sheets['Segment Plot (9 mo)'];
  if (!segmentSheet) return;
  const rows = XLSX.utils.sheet_to_json<SheetRow>(segmentSheet, { defval: null, raw: true, range: 2 });
  const sourceSpend = rows.reduce((total, row) => total + numberValue(value(row, 'Total spend')), 0);
  const importedSpend = dataset.platforms.reduce((total, row) => total + row.spend, 0);
  if (sourceSpend > 0) checks.push(createCheck('Paid spend control', sourceSpend, importedSpend, 5, 'WARNING'));
}

function appendStageSpendChecks(workbook: XLSX.WorkBook, dataset: MediaDataset, checks: ReconciliationCheck[]) {
  const sources = [
    { sheetName: 'Stage x Month (AED)', platform: 'Google Ads' as const },
    { sheetName: 'Stage x Month (spend AED)', platform: 'Meta Ads' as const },
  ];

  sources.forEach(({ sheetName, platform }) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    const stageRows = XLSX.utils.sheet_to_json<SheetRow>(sheet, { defval: null, raw: true });
    dataset.periods.forEach((period) => {
      const monthColumn = `${period.monthLabel.slice(0, 3)} ${period.year}`;
      const sourceValues = stageRows
        .map((row) => value(row, monthColumn))
        .filter((entry) => entry !== undefined && entry !== null && text(entry) !== '');

      if (!sourceValues.length) return;

      const sourceSpend = sourceValues.reduce<number>((total, entry) => total + numberValue(entry), 0);
      const importedSpend = dataset.platforms
        .filter((row) => row.platform === platform && row.periodKey === period.periodKey)
        .reduce((total, row) => total + row.spend, 0);

      checks.push(createCheck(
        `${period.sourcePeriodLabel} ${platform} stage spend`,
        sourceSpend,
        importedSpend,
        3,
        'ERROR',
      ));
    });
  });
}

function appendGoogleCampaignChecks(dataset: MediaDataset, checks: ReconciliationCheck[]) {
  dataset.periods.forEach((period) => {
    const platformRows = dataset.platforms.filter((row) => row.platform === 'Google Ads' && row.periodKey === period.periodKey);
    const campaignRows = dataset.campaigns.filter((row) => row.platform === 'Google Ads' && row.periodKey === period.periodKey);
    if (!platformRows.length || !campaignRows.length) return;
    const platformSpend = platformRows.reduce((total, row) => total + row.spend, 0);
    const campaignSpend = campaignRows.reduce((total, row) => total + row.spend, 0);
    const platformImpressions = platformRows.reduce((total, row) => total + (row.impressions ?? 0), 0);
    const campaignImpressions = campaignRows.reduce((total, row) => total + (row.impressions ?? 0), 0);
    const platformInteractions = platformRows.reduce((total, row) => total + (row.interactions ?? 0), 0);
    const campaignInteractions = campaignRows.reduce((total, row) => total + (row.interactions ?? 0), 0);
    const platformClaims = platformRows.reduce((total, row) => total + row.claims, 0);
    const campaignClaims = campaignRows.reduce((total, row) => total + (row.claims ?? 0), 0);
    checks.push(createCheck(`${period.sourcePeriodLabel} Google campaign spend`, platformSpend, campaignSpend, 3, 'ERROR'));
    checks.push(createCheck(`${period.sourcePeriodLabel} Google campaign impressions`, platformImpressions, campaignImpressions, 0.0001, 'ERROR'));
    checks.push(createCheck(`${period.sourcePeriodLabel} Google campaign interactions`, platformInteractions, campaignInteractions, 0.0001, 'ERROR'));
    checks.push(createCheck(`${period.sourcePeriodLabel} Google campaign conversions`, platformClaims, campaignClaims, 0.31, 'ERROR'));
  });
}

function createCheck(
  name: string,
  sourceValue: number,
  importedValue: number,
  tolerance: number,
  severity: ReconciliationCheck['severity'],
): ReconciliationCheck {
  const difference = importedValue - sourceValue;
  return { name, sourceValue, importedValue, difference, tolerance, passed: Math.abs(difference) <= tolerance, severity };
}

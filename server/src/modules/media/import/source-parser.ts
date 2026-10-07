import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import XLSX from 'xlsx';
import type {
  CampaignRecord,
  MediaDataset,
  MediaPeriod,
  OrganicRecord,
  PlatformRecord,
  SiteRecord,
} from '../types/media.types.js';
import { periodFromMonthName, parsePeriod } from '../utils/period-utils.js';
import { numberValue, optionalNumber, text, value, type SheetRow } from '../utils/value-utils.js';
import { reconcileImport } from './reconciliation.js';

interface WorkbookSource {
  path: string;
  name: string;
  workbook: XLSX.WorkBook;
}

function rows(workbook: XLSX.WorkBook, sheetName: string, range = 0): SheetRow[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<SheetRow>(sheet, { defval: null, raw: true, range });
}

function findSource(sources: WorkbookSource[], sheetName: string): WorkbookSource | undefined {
  return sources.find((source) => source.workbook.SheetNames.includes(sheetName));
}

function sourceBatchId(paths: string[]): string {
  const hash = createHash('sha256');
  for (const path of paths.sort()) hash.update(readFileSync(path));
  return `src-${hash.digest('hex').slice(0, 16)}-${randomUUID().slice(0, 8)}`;
}

export function parseMediaSources(paths: string[]): MediaDataset {
  const sources = paths.map((path) => ({ path, name: basename(path), workbook: XLSX.readFile(path, { cellDates: true }) }));
  const batchId = sourceBatchId(paths);
  const warnings: string[] = [];

  const siteSource = findSource(sources, 'Reconciliation');
  const periods = siteSource ? parsePeriods(siteSource.workbook) : [];
  if (!siteSource) warnings.push('Reconciled site workbook was not detected.');
  if (periods.length === 0) warnings.push('No reporting periods were detected.');

  const site = siteSource ? parseSite(siteSource, periods, batchId) : [];
  const googleSource = findSource(sources, 'Google Campaign Map');
  const metaSource = findSource(sources, 'Meta Campaign Brand Map');
  const organicSource = sources.find((source) => source.name.toLowerCase().includes('organic-brand-demand'));
  const platforms = [
    ...(googleSource ? parseGooglePlatform(googleSource, periods, batchId) : []),
    ...(metaSource ? parseMetaPlatform(metaSource, periods, batchId) : []),
  ];
  if (!googleSource) warnings.push('Google media workbook was not detected.');
  if (!metaSource) warnings.push('Meta media workbook was not detected.');

  const campaigns = [
    ...(siteSource ? parseGoogleCampaigns(siteSource, periods, batchId) : []),
    ...(metaSource ? parseMetaCampaigns(metaSource, periods, platforms.filter((row) => row.platform === 'Meta Ads'), batchId) : []),
  ];
  const organic = organicSource ? parseOrganic(organicSource, periods, batchId) : [];
  if (!organicSource) warnings.push('Organic demand workbook was not detected.');

  const dataset: MediaDataset = {
    periods,
    platforms,
    site,
    campaigns,
    organic,
    sourceFiles: sources.map((source) => source.name),
    warnings,
  };
  const controlWarnings = reconcileImport(paths, dataset)
    .filter((check) => !check.passed && check.severity === 'WARNING')
    .map((check) =>
      `${check.name} differs from the detailed monthly sheets by ${check.difference.toFixed(2)}.`);
  dataset.warnings = [...new Set([...dataset.warnings, ...controlWarnings])];
  return dataset;
}

function parsePeriods(workbook: XLSX.WorkBook): MediaPeriod[] {
  const result: MediaPeriod[] = [];
  for (const sheetName of workbook.SheetNames) {
    if (!/^[A-Z][a-z]{2} 20\d{2}$/.test(sheetName)) continue;
    const firstRows = rows(workbook, sheetName).slice(0, 3);
    const note = firstRows.map((row) => Object.values(row).map(text).join(' ')).join(' ');
    const period = parsePeriod(sheetName, /partial/i.test(note));
    if (period) result.push(period);
  }
  return result.sort((a, b) => a.periodKey.localeCompare(b.periodKey));
}

function parseSite(source: WorkbookSource, periods: MediaPeriod[], batchId: string): SiteRecord[] {
  const result: SiteRecord[] = [];
  for (const period of periods) {
    const data = rows(source.workbook, `${period.monthLabel.slice(0, 3)} ${period.year}`, 4);
    data.forEach((row, index) => {
      const brand = text(value(row, 'Final canonical brand'));
      if (!brand || brand === 'TOTAL') return;
      result.push({
        ...period,
        batchId,
        sourceFile: source.name,
        sourceSheet: `${period.monthLabel.slice(0, 3)} ${period.year}`,
        sourceRow: index + 6,
        brand,
        segment: text(value(row, 'Final segment')),
        mappingStatus: text(value(row, 'Mapping status')),
        itemsViewed: numberValue(value(row, 'Items viewed')),
        itemsAddedToCart: numberValue(value(row, 'Items added to cart')),
        itemsPurchased: numberValue(value(row, 'Items purchased')),
        revenue: numberValue(value(row, 'Item revenue (AED)')),
      });
    });
  }
  return result;
}

function parseGooglePlatform(source: WorkbookSource, periods: MediaPeriod[], batchId: string): PlatformRecord[] {
  const result = rows(source.workbook, 'Brand x Month').flatMap((row, index) => {
    const period = parsePeriod(text(value(row, 'Month')));
    if (!period || !periods.some((item) => item.periodKey === period.periodKey)) return [];
    const known = periods.find((item) => item.periodKey === period.periodKey) ?? period;
    return [{
      ...known,
      batchId,
      sourceFile: source.name,
      sourceSheet: 'Brand x Month',
      sourceRow: index + 2,
      platform: 'Google Ads' as const,
      brand: text(value(row, 'Brand / rollup')),
      segment: text(value(row, 'Segment')),
      spend: numberValue(value(row, 'Spend (AED)')),
      claims: numberValue(value(row, 'Conversions')),
      impressions: numberValue(value(row, 'Impressions')),
      interactions: numberValue(value(row, 'Interactions')),
    }];
  });
  return [...result, ...parseZeroActivityPeriods(source, 'Stage x Month (AED)', periods, result, 'Google Ads', batchId)];

}

function parseMetaPlatform(source: WorkbookSource, periods: MediaPeriod[], batchId: string): PlatformRecord[] {
  const result = rows(source.workbook, 'Brand x Month (spend)').flatMap((row, index) => {
    const period = parsePeriod(text(value(row, 'Month')));
    if (!period || !periods.some((item) => item.periodKey === period.periodKey)) return [];
    const known = periods.find((item) => item.periodKey === period.periodKey) ?? period;
    return [{
      ...known,
      batchId,
      sourceFile: source.name,
      sourceSheet: 'Brand x Month (spend)',
      sourceRow: index + 2,
      platform: 'Meta Ads' as const,
      brand: text(value(row, 'Brand')),
      segment: text(value(row, 'Segment')),
      spend: numberValue(value(row, 'Spend (AED)')),
      claims: numberValue(value(row, 'Platform-claimed purchases')),
      impressions: numberValue(value(row, 'Impressions')),
      clicks: numberValue(value(row, 'Link clicks')),
    }];
  });
  return [...result, ...parseZeroActivityPeriods(source, 'Stage x Month (spend AED)', periods, result, 'Meta Ads', batchId)];
}
function parseZeroActivityPeriods(
  source: WorkbookSource,
  stageSheetName: string,
  periods: MediaPeriod[],
  parsedRows: PlatformRecord[],
  platform: PlatformRecord['platform'],
  batchId: string,
): PlatformRecord[] {
  const stageRows = rows(source.workbook, stageSheetName);

  return periods.flatMap((period) => {
    if (parsedRows.some((row) => row.periodKey === period.periodKey)) return [];

    const monthColumn = `${period.monthLabel.slice(0, 3)} ${period.year}`;
    const sourceValues = stageRows
      .map((row) => value(row, monthColumn))
      .filter((entry) => entry !== undefined && entry !== null && text(entry) !== '');

    if (!sourceValues.length) return [];

    const spend = sourceValues.reduce<number>((total, entry) => total + numberValue(entry), 0);
    if (spend !== 0) return [];

    return [{
      ...period,
      batchId,
      sourceFile: source.name,
      sourceSheet: stageSheetName,
      sourceRow: 2,
      platform,
      brand: '',
      segment: '',
      spend: 0,
      claims: 0,
      impressions: 0,
      interactions: 0,
      clicks: 0,
    }];
  });
}


function parseGoogleCampaigns(source: WorkbookSource, periods: MediaPeriod[], batchId: string): CampaignRecord[] {
  return rows(source.workbook, 'Campaign Brand Map', 4).flatMap((row, index) => {
    const period = periodFromMonthName(text(value(row, 'Month')), periods);
    const campaign = text(value(row, 'Campaign'));
    if (!period || !campaign) return [];
    return [{
      batchId,
      sourceFile: source.name,
      sourceSheet: 'Campaign Brand Map',
      sourceRow: index + 6,
      year: period.year,
      month: period.month,
      periodKey: period.periodKey,
      platform: 'Google Ads' as const,
      campaign,
      brand: text(value(row, 'Canonical brand(s) for tech')),
      brandScope: text(value(row, 'Brand scope')),
      segment: text(value(row, 'Final segment(s)')),
      stage: text(value(row, 'Campaign type')),
      campaignType: text(value(row, 'Campaign type')),
      mappingSource: text(value(row, 'Validation')),
      confidence: text(value(row, 'Mapping confidence')),
      spend: numberValue(value(row, 'Cost (AED)')),
      claims: optionalNumber(value(row, 'Conversions')) ?? undefined,
      impressions: optionalNumber(value(row, 'Impressions')) ?? undefined,
      interactions: optionalNumber(value(row, 'Interactions')) ?? undefined,
    }];
  });
}

function parseMetaCampaigns(source: WorkbookSource, periods: MediaPeriod[], platformRows: PlatformRecord[], batchId: string): CampaignRecord[] {
  const templates = rows(source.workbook, 'Meta Campaign Brand Map').flatMap((row, index) => {
    const campaign = text(value(row, 'Campaign'));
    const nineMonthSpend = numberValue(value(row, 'Spend 9-mo (AED)'));
    if (!campaign || nineMonthSpend <= 0) return [];
    return [{
      batchId,
      sourceFile: source.name,
      sourceSheet: 'Meta Campaign Brand Map',
      sourceRow: index + 2,
      platform: 'Meta Ads' as const,
      campaign,
      brand: text(value(row, 'Canonical brand')),
      brandScope: text(value(row, 'Brand scope')),
      segment: text(value(row, 'Final segment')),
      stage: text(value(row, 'Stage')),
      campaignType: text(value(row, 'Stage')),
      mappingSource: text(value(row, 'Note')) || 'T31N naming map',
      confidence: text(value(row, 'Confidence')),
      spend: nineMonthSpend,
    }];
  });

  return periods.flatMap((period) => {
    const monthRows = platformRows.filter((row) => row.periodKey === period.periodKey);
    const monthlySpend = monthRows.reduce((total, row) => total + row.spend, 0);
    if (monthlySpend <= 0) return [];

    return monthRows.flatMap((platformRow) => {
      const brandTemplates = templates.filter((template) => template.brand === platformRow.brand);
      const brandTemplateSpend = brandTemplates.reduce((total, template) => total + template.spend, 0);
      if (brandTemplateSpend <= 0) {
        return [{
          batchId,
          sourceFile: source.name,
          sourceSheet: platformRow.sourceSheet,
          sourceRow: platformRow.sourceRow,
          platform: 'Meta Ads' as const,
          campaign: `Unallocated Meta campaign detail - ${platformRow.brand}`,
          brand: platformRow.brand,
          brandScope: 'Unallocated campaign detail',
          segment: platformRow.segment,
          stage: 'Unallocated',
          campaignType: 'Unallocated',
          mappingSource: 'No matching campaign-map row',
          confidence: 'Unallocated',
          year: period.year,
          month: period.month,
          periodKey: period.periodKey,
          spend: platformRow.spend,
          claims: platformRow.claims,
          impressions: platformRow.impressions,
          clicks: platformRow.clicks,
          calculationBasis: 'Monthly Meta brand total retained as unallocated because no matching campaign map row was supplied.',
        }];
      }
      return brandTemplates.map((template) => {
        const share = template.spend / brandTemplateSpend;
        return {
          ...template,
          year: period.year,
          month: period.month,
          periodKey: period.periodKey,
          spend: platformRow.spend * share,
          claims: platformRow.claims * share,
          impressions: (platformRow.impressions ?? 0) * share,
          clicks: (platformRow.clicks ?? 0) * share,
          calculationBasis: "Monthly Meta brand totals allocated among that brand's campaigns by each campaign's share of nine-month brand campaign spend.",
        };
      });
    });
  });
}

function parseOrganic(source: WorkbookSource, periods: MediaPeriod[], batchId: string): OrganicRecord[] {
  const brandRows: OrganicRecord[] = rows(source.workbook, 'Brand x Month').flatMap((row, index) => {
    const period = parsePeriod(text(value(row, 'Month')));
    if (!period) return [];
    const known = periods.find((item) => item.periodKey === period.periodKey);
    if (!known) return [];
    return [{
      ...known,
      batchId,
      sourceFile: source.name,
      sourceSheet: 'Brand x Month',
      sourceRow: index + 2,
      brand: text(value(row, 'Brand')),
      segment: text(value(row, 'Segment')),
      organicClicks: numberValue(value(row, 'Organic clicks')),
      organicImpressions: numberValue(value(row, 'Impressions')),
      averagePosition: optionalNumber(value(row, 'Avg position (impr-weighted)')),
    }];
  });
  const marketRows = rows(source.workbook, 'Market x Month (clicks)');
  const byMarket: OrganicRecord[] = [];
  marketRows.forEach((row, index) => {
    const market = text(value(row, 'Market'));
    if (!market || market.startsWith('Note:')) return;
    for (const period of periods) {
      const monthKey = `${period.monthLabel.slice(0, 3)} ${period.year}`;
      const clicks = value(row, monthKey);
      if (clicks === undefined) continue;
      byMarket.push({
        ...period,
        batchId,
        sourceFile: source.name,
        sourceSheet: 'Market x Month (clicks)',
        sourceRow: index + 2,
        brand: 'All site',
        segment: 'All segments',
        market,
        organicClicks: numberValue(clicks),
        organicImpressions: 0,
        averagePosition: null,
      });
    }
  });
  return [...brandRows, ...byMarket];
}

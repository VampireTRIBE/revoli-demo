import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseMediaSources } from '../src/modules/media/import/source-parser.js';
import { reconcileImport } from '../src/modules/media/import/reconciliation.js';

const sourceDirectory = resolve(process.cwd(), '../spreadsheets data/media-tab');
const sourcePaths = readdirSync(sourceDirectory)
  .filter((name) => !name.startsWith('~$') && name.toLowerCase().endsWith('.xlsx'))
  .map((name) => resolve(sourceDirectory, name));

describe('supplied Media source parser', () => {
  const dataset = parseMediaSources(sourcePaths);

  it('detects every supplied workbook and reporting period', () => {
    expect(dataset.sourceFiles).toHaveLength(6);
    expect(dataset.periods).toHaveLength(9);
    expect(dataset.periods[0]?.periodKey).toBe('2026-01');
    expect(dataset.periods.at(-1)).toMatchObject({
      periodKey: '2026-09',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-10',
      isPartialPeriod: true,
    });
  });

  it('preserves source business labels and parses every supported domain', () => {
    expect(dataset.platforms.some((row) => row.platform === 'Google Ads' && row.segment === 'Swiss')).toBe(true);
    expect(dataset.platforms.some((row) => row.platform === 'Meta Ads')).toBe(true);
    expect(dataset.site.some((row) => row.brand === 'Tissot' && row.segment === 'Swiss')).toBe(true);
    expect(dataset.campaigns.some((row) => row.campaignType === 'Performance Max')).toBe(true);
    expect(dataset.organic.some((row) => row.market === 'Qatar')).toBe(true);
    expect(dataset.platforms.some((row) => row.platform === 'Meta Ads' && (row.clicks ?? 0) > 0 && (row.impressions ?? 0) > 0)).toBe(true);
    expect(dataset.campaigns.some((row) => row.platform === 'Google Ads' && (row.interactions ?? 0) > 0 && (row.impressions ?? 0) > 0)).toBe(true);
    expect(dataset.campaigns.some((row) => row.platform === 'Meta Ads' && row.periodKey === '2026-08' && (row.clicks ?? 0) > 0)).toBe(true);
    const augustMetaCampaigns = dataset.campaigns.filter((row) => row.platform === 'Meta Ads' && row.periodKey === '2026-08');
    const augustMetaPlatforms = dataset.platforms.filter((row) => row.platform === 'Meta Ads' && row.periodKey === '2026-08');
    expect(augustMetaCampaigns.reduce((total, row) => total + row.spend, 0))
      .toBeCloseTo(augustMetaPlatforms.reduce((total, row) => total + row.spend, 0), 6);
    expect(augustMetaCampaigns.reduce((total, row) => total + (row.claims ?? 0), 0))
      .toBeCloseTo(augustMetaPlatforms.reduce((total, row) => total + row.claims, 0), 6);
    expect(dataset.platforms.find((row) =>
      row.platform === 'Meta Ads' && row.periodKey === '2026-09',
    )).toMatchObject({
      spend: 0, claims: 0, impressions: 0,
    });

    dataset.periods.forEach((period) => {
      const metaPlatforms = dataset.platforms.filter((row) => row.platform === 'Meta Ads' && row.periodKey === period.periodKey);
      metaPlatforms.forEach((platformRow) => {
        const campaignRows = dataset.campaigns.filter((row) =>
          row.platform === 'Meta Ads' && row.periodKey === period.periodKey && row.brand === platformRow.brand);
        if (platformRow.spend === 0) {
          expect(campaignRows).toHaveLength(0);
          return;
        }
        expect(campaignRows.length).toBeGreaterThan(0);
        expect(campaignRows.reduce((total, row) => total + row.spend, 0)).toBeCloseTo(platformRow.spend, 6);
        expect(campaignRows.reduce((total, row) => total + (row.claims ?? 0), 0)).toBeCloseTo(platformRow.claims, 6);
        expect(campaignRows.reduce((total, row) => total + (row.impressions ?? 0), 0)).toBeCloseTo(platformRow.impressions ?? 0, 6);
        expect(campaignRows.reduce((total, row) => total + (row.clicks ?? 0), 0)).toBeCloseTo(platformRow.clicks ?? 0, 6);
      });

      const googlePlatforms = dataset.platforms.filter((row) => row.platform === 'Google Ads' && row.periodKey === period.periodKey);
      const googleCampaigns = dataset.campaigns.filter((row) => row.platform === 'Google Ads' && row.periodKey === period.periodKey);
      expect(Math.abs(googleCampaigns.reduce((total, row) => total + row.spend, 0) - googlePlatforms.reduce((total, row) => total + row.spend, 0))).toBeLessThan(3);
      expect(googleCampaigns.reduce((total, row) => total + (row.impressions ?? 0), 0)).toBe(googlePlatforms.reduce((total, row) => total + (row.impressions ?? 0), 0));
      expect(googleCampaigns.reduce((total, row) => total + (row.interactions ?? 0), 0)).toBe(googlePlatforms.reduce((total, row) => total + (row.interactions ?? 0), 0));
      expect(Math.abs(googleCampaigns.reduce((total, row) => total + (row.claims ?? 0), 0) - googlePlatforms.reduce((total, row) => total + row.claims, 0))).toBeLessThan(0.31);
    });
  });

  it('matches the reconciled January site controls', () => {
    const january = dataset.site.filter((row) => row.periodKey === '2026-01');
    const total = <K extends 'itemsViewed' | 'itemsAddedToCart' | 'itemsPurchased' | 'revenue'>(key: K) =>
      january.reduce((sum, row) => sum + row[key], 0);

    expect(total('itemsViewed')).toBe(1_136_425);
    expect(total('itemsAddedToCart')).toBe(51_561);
    expect(total('itemsPurchased')).toBe(2_145);
    expect(total('revenue')).toBeCloseTo(3_119_536.960731, 6);
  });
  it('keeps calculation inputs source-driven and reports cross-workbook controls separately', () => {
    const checks = reconcileImport(sourcePaths, dataset);
    const errors = checks.filter((check) => check.severity === 'ERROR');
    const warnings = checks.filter((check) => check.severity === 'WARNING' && !check.passed);

    expect(errors.every((check) => check.passed)).toBe(true);
    expect(warnings.some((check) => check.name === 'Paid spend control')).toBe(true);
    expect(warnings.some((check) => check.name === 'Aug 2026 Meta claims control')).toBe(true);
    expect(dataset.warnings.some((warning) => warning.startsWith('Paid spend control'))).toBe(true);
  });

});

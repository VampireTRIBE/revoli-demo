import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseMediaSources } from '../import/source-parser.js';
import { readDataset } from '../repositories/media.repository.js';
import type { MediaDataset, MediaFilter } from '../types/media.types.js';

let sourceCache: MediaDataset | null = null;

function sourceDirectory(): string {
  const candidates = [
    resolve(process.cwd(), 'spreadsheets data/media-tab'),
    resolve(process.cwd(), '../spreadsheets data/media-tab'),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) throw new Error(`Source data directory not found. Checked: ${candidates.join(', ')}`);
  return found;
}

export function sourceDataset(): MediaDataset {
  if (sourceCache) return sourceCache;
  const directory = sourceDirectory();
  const paths = readdirSync(directory)
    .filter((name) => !name.startsWith('~$') && name.toLowerCase().endsWith('.xlsx'))
    .map((name) => resolve(directory, name));
  sourceCache = parseMediaSources(paths);
  console.info(`[media] loaded ${paths.length} source workbooks (${sourceCache.periods.length} periods)`);
  return sourceCache;
}

export async function mediaDataset(filter: MediaFilter = {}): Promise<MediaDataset> {
  const periodFilter: MediaFilter = { year: filter.year, month: filter.month };
  const databaseDataset = await readDataset(periodFilter);
  if (databaseDataset) {
    const source = filterDataset(sourceDataset(), periodFilter);
    return filterDataset(enrichLegacyCampaignMetrics(databaseDataset, source), filter);
  }
  return filterDataset(sourceDataset(), filter);
}

export function clearSourceCache() {
  sourceCache = null;
}

function filterDataset(dataset: MediaDataset, filter: MediaFilter): MediaDataset {
  const matchesPeriod = (record: { year?: number; month?: number }) =>
    (!filter.year || record.year === filter.year) && (!filter.month || record.month === filter.month);
  const matchesDimensions = (record: { segment?: string; brand?: string }) =>
    (!filter.segment || record.segment === filter.segment) && (!filter.brand || record.brand === filter.brand);
  const matches = (record: { year?: number; month?: number; segment?: string; brand?: string }) =>
    matchesPeriod(record) && matchesDimensions(record);
  const selectedPeriod = filter.month ? dataset.periods.find(matchesPeriod) : undefined;
  const warnings = selectedPeriod
    ? dataset.warnings.filter((warning) => !/^[A-Z][a-z]{2} 20\d{2}/.test(warning) || warning.startsWith(`${selectedPeriod.sourcePeriodLabel} `))
    : dataset.warnings;
  return {
    ...dataset,
    periods: dataset.periods.filter(matchesPeriod),
    platforms: dataset.platforms.filter(matches),
    site: dataset.site.filter(matches),
    organic: dataset.organic.filter(matches),
    campaigns: dataset.campaigns.filter((record) => {
      const periodMatches = filter.month
        ? record.year === filter.year && record.month === filter.month
        : filter.year
          ? record.year === filter.year || record.year === undefined
          : true;
      return periodMatches && matchesDimensions(record);
    }),
    warnings,
  };
}

function enrichLegacyCampaignMetrics(databaseDataset: MediaDataset, source: MediaDataset): MediaDataset {
  const sourceCampaigns = new Map(source.campaigns.map((row) => [campaignKey(row), row]));
  const periodizedMetaCampaigns = new Set(source.campaigns
    .filter((row) => row.platform === 'Meta Ads' && row.periodKey)
    .map((row) => row.campaign));
  const databaseCampaigns = databaseDataset.campaigns.filter((row) =>
    !(row.platform === 'Meta Ads' && !row.periodKey && periodizedMetaCampaigns.has(row.campaign)));
  const databaseKeys = new Set(databaseCampaigns.map(campaignKey));
  const enriched = databaseCampaigns.map((row) => {
    const match = sourceCampaigns.get(campaignKey(row));
    if (!match) return row;
    if (row.platform === 'Meta Ads' && match.calculationBasis) return match;
    return {
      ...row,
      impressions: row.impressions ?? match.impressions,
      interactions: row.interactions ?? match.interactions,
      clicks: row.clicks ?? match.clicks,
      claims: row.claims ?? match.claims,
      calculationBasis: row.calculationBasis ?? match.calculationBasis,
    };
  });
  return {
    ...databaseDataset,
    campaigns: [
      ...enriched,
      ...source.campaigns.filter((row) => !databaseKeys.has(campaignKey(row))),
    ],
  };
}

function campaignKey(record: MediaDataset['campaigns'][number]): string {
  return [record.platform, record.periodKey ?? 'all', record.campaign].join('|');
}

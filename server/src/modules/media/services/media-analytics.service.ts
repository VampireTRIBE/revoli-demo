import { benchmarkScore, calculateMetrics, safeDivide, weightedBenchmarkScore, type MediaTotals } from '../calculations/media-calculations.js';
import { sourceDataset, mediaDataset } from './media-data.service.js';
import type { CampaignRecord, MediaDataset, MediaFilter, MediaPeriod, MetricStatus, PlatformRecord } from '../types/media.types.js';

function sum<T>(rows: T[], select: (row: T) => number): number {
  return rows.reduce((total, row) => total + select(row), 0);
}

function round(value: number | null, places = 2): number | null {
  if (value === null) return null;
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function totals(dataset: MediaDataset): MediaTotals {
  const google = dataset.platforms.filter((row) => row.platform === 'Google Ads');
  const meta = dataset.platforms.filter((row) => row.platform === 'Meta Ads');
  return {
    googleSpend: sum(google, (row) => row.spend),
    metaSpend: sum(meta, (row) => row.spend),
    googleClaims: sum(google, (row) => row.claims),
    metaClaims: sum(meta, (row) => row.claims),
    sitePurchases: sum(dataset.site, (row) => row.itemsPurchased),
    siteRevenue: sum(dataset.site, (row) => row.revenue),
    itemsViewed: sum(dataset.site, (row) => row.itemsViewed),
    itemsAddedToCart: sum(dataset.site, (row) => row.itemsAddedToCart),
    googleImpressions: sum(google, (row) => row.impressions ?? 0),
    googleInteractions: sum(google, (row) => row.interactions ?? 0),
    metaImpressions: sum(meta, (row) => row.impressions ?? 0),
    metaClicks: sum(meta, (row) => row.clicks ?? 0),
  };
}

function metadata(dataset: MediaDataset, filter: MediaFilter) {
  const partialPeriods = dataset.periods.filter((period) => period.isPartialPeriod);
  const selected = filter.month ? dataset.periods[0] : undefined;
  return {
    year: filter.year ?? null,
    month: filter.month ?? null,
    segment: filter.segment ?? null,
    brand: filter.brand ?? null,
    partialPeriod: selected?.isPartialPeriod ?? partialPeriods.length > 0,
    periodStart: selected?.periodStart ?? dataset.periods[0]?.periodStart ?? null,
    periodEnd: selected?.periodEnd ?? dataset.periods.at(-1)?.periodEnd ?? null,
    sourcePeriodLabel: selected?.sourcePeriodLabel ?? (filter.year ? `${filter.year} imported periods` : 'All imported periods'),
    status: selected?.isPartialPeriod ? 'PARTIAL' : partialPeriods.length > 0 ? 'PROVISIONAL' : 'COMPLETE',
    sourceFiles: dataset.sourceFiles,
    warnings: dataset.warnings,
  };
}

interface DirectionalReturnEstimate {
  value: number | null;
  basis: string;
  level: 'BRAND' | 'SEGMENT' | 'OVERALL';
  revenue: number;
  spend: number;
}

function directionalReturnEstimate(dataset: MediaDataset, brand: string, segment: string): DirectionalReturnEstimate {
  const resolvedSegment = segment || segmentForBrand(dataset, brand);
  const byBrandPlatforms = dataset.platforms.filter((row) => row.brand === brand);
  const byBrandSite = dataset.site.filter((row) => row.brand === brand);
  const byBrandCampaigns = dataset.campaigns.filter((row) => row.brand === brand);
  const brandSpend = paidSpend(byBrandPlatforms, byBrandCampaigns);
  const brandRevenue = sum(byBrandSite, (row) => row.revenue);
  if (brand && byBrandSite.length > 0 && brandSpend > 0) {
    return {
      value: safeDivide(brandRevenue, brandSpend),
      basis: `Mapped brand directional return: ${brand} site revenue / ${brand} Google + Meta spend`,
      level: 'BRAND',
      revenue: brandRevenue,
      spend: brandSpend,
    };
  }

  const bySegmentPlatforms = dataset.platforms.filter((row) => row.segment === resolvedSegment);
  const bySegmentSite = dataset.site.filter((row) => row.segment === resolvedSegment);
  const bySegmentCampaigns = dataset.campaigns.filter((row) => row.segment === resolvedSegment);
  const segmentSpend = paidSpend(bySegmentPlatforms, bySegmentCampaigns);
  const segmentRevenue = sum(bySegmentSite, (row) => row.revenue);
  if (resolvedSegment && bySegmentSite.length > 0 && segmentSpend > 0) {
    return {
      value: safeDivide(segmentRevenue, segmentSpend),
      basis: `Mapped segment directional return: ${resolvedSegment} site revenue / ${resolvedSegment} Google + Meta spend`,
      level: 'SEGMENT',
      revenue: segmentRevenue,
      spend: segmentSpend,
    };
  }

  const totalSpend = paidSpend(dataset.platforms, dataset.campaigns);
  const totalRevenue = sum(dataset.site, (row) => row.revenue);
  return {
    value: safeDivide(totalRevenue, totalSpend),
    basis: 'Overall directional return: reconciled site revenue / Google + Meta spend',
    level: 'OVERALL',
    revenue: totalRevenue,
    spend: totalSpend,
  };
}

function paidSpend(platformRows: MediaDataset['platforms'], campaignRows: MediaDataset['campaigns']): number {
  const platformSpend = sum(platformRows, (row) => row.spend);
  return platformSpend > 0 ? platformSpend : sum(campaignRows, (row) => row.spend);
}

function segmentForBrand(dataset: MediaDataset, brand: string): string {
  if (!brand) return '';
  const segments = unique([
    ...dataset.platforms.filter((row) => row.brand === brand).map((row) => row.segment),
    ...dataset.site.filter((row) => row.brand === brand).map((row) => row.segment),
    ...dataset.campaigns.filter((row) => row.brand === brand).map((row) => row.segment),
  ]);
  return segments.length === 1 ? segments[0] ?? '' : '';
}

async function directionalReturnContext(filter: MediaFilter, filtered: MediaDataset): Promise<MediaDataset> {
  if (!filter.brand && !filter.segment) return filtered;
  return mediaDataset({ year: filter.year, month: filter.month });
}

function platformDirectionalRevenue(dataset: MediaDataset, platform: PlatformRecord['platform']): number {
  const segments = [...new Set(dataset.platforms.map((row) => row.segment).filter(Boolean))];
  return sum(segments, (segment) => {
    const segmentRows = dataset.platforms.filter((row) => row.segment === segment);
    const segmentSpend = sum(segmentRows, (row) => row.spend);
    const platformSpend = sum(segmentRows.filter((row) => row.platform === platform), (row) => row.spend);
    const segmentRevenue = sum(dataset.site.filter((row) => row.segment === segment), (row) => row.revenue);
    const platformShare = safeDivide(platformSpend, segmentSpend);
    return platformShare === null ? 0 : segmentRevenue * platformShare;
  });
}

export async function getPeriods() {
  const dataset = await mediaDataset();
  const yearMap = new Map<number, MediaPeriod[]>();
  dataset.periods.forEach((period) => yearMap.set(period.year, [...(yearMap.get(period.year) ?? []), period]));
  return {
    years: [...yearMap.entries()].sort(([a], [b]) => b - a).map(([year, periods]) => ({
      year,
      months: periods.sort((a, b) => a.month - b.month).map((period) => ({
        month: period.month,
        label: period.monthLabel,
        available: true,
        partial: period.isPartialPeriod,
        startDate: period.periodStart,
        endDate: period.periodEnd,
        sourcePeriodLabel: period.sourcePeriodLabel,
      })),
    })),
  };
}

export async function getOverview(filter: MediaFilter) {
  const dataset = await mediaDataset(filter);
  const returnContext = await directionalReturnContext(filter, dataset);
  const input = totals(dataset);
  const metrics = calculateMetrics(input);
  const returnEstimate = directionalReturnEstimate(returnContext, filter.brand ?? '', filter.segment ?? '');
  const returnScore = benchmarkScore(returnEstimate.value, 1, 4);
  return {
    metrics: {
      referenceMediaScore: weightedBenchmarkScore([
        { score: returnScore, weight: 40 },
        { score: metrics.cacAovRatio.benchmarkScore ?? null, weight: 30 },
        { score: metrics.blendedCtr.benchmarkScore ?? null, weight: 30 },
      ]),
      directionalReturn: {
        ...metrics.directionalReturn,
        value: round(returnEstimate.value),
        benchmarkScore: returnScore,
        formula: returnEstimate.basis,
        calculationLevel: returnEstimate.level,
        revenue: round(returnEstimate.revenue) ?? 0,
        spend: round(returnEstimate.spend) ?? 0,
      },
      platformClaimedCac: { ...metrics.platformClaimedCac, value: round(metrics.platformClaimedCac.value) },
      claimsVsSite: { ...metrics.claimsVsSite, value: round(metrics.claimsVsSite.value, 4) },
      platformClaims: {
        value: round(metrics.platformClaims, 1),
        status: 'PLATFORM_CLAIMED' as MetricStatus,
        formula: 'Google claimed conversions + Meta claimed purchases',
        definition: 'Claims reported by the advertising platforms; not verified orders.',
        google: round(input.googleClaims, 1),
        meta: round(input.metaClaims, 1),
      },
      siteAov: { ...metrics.siteAov, value: round(metrics.siteAov.value) },
      cacAovRatio: { ...metrics.cacAovRatio, value: round(metrics.cacAovRatio.value, 4) },
      blendedCtr: { ...metrics.blendedCtr, value: round(metrics.blendedCtr.value, 4) },
      paidImpressions: round(metrics.paidImpressions),
      paidTrafficActions: round(metrics.paidTrafficActions),
      googleInteractions: round(input.googleInteractions),
      metaClicks: round(input.metaClicks),
      totalSpend: round(metrics.totalSpend),
      siteRevenue: round(input.siteRevenue),
      sitePurchases: round(input.sitePurchases),
      claimsDifference: round(metrics.claimsDifference, 1),
    },
    metadata: metadata(dataset, filter),
  };
}

export async function getPlatforms(filter: MediaFilter) {
  const dataset = await mediaDataset(filter);
  const allSpend = sum(dataset.platforms, (row) => row.spend);
  const allClaims = sum(dataset.platforms, (row) => row.claims);
  const platforms = (['Google Ads', 'Meta Ads'] as const).map((platform) => {
    const rows = dataset.platforms.filter((row) => row.platform === platform);
    const hasData = rows.length > 0;
    const spend = sum(rows, (row) => row.spend);
    const claims = sum(rows, (row) => row.claims);
    const impressions = sum(rows, (row) => row.impressions ?? 0);
    const interactions = sum(rows, (row) => row.interactions ?? 0);
    const clicks = sum(rows, (row) => row.clicks ?? 0);
    const trafficActions = platform === 'Google Ads' ? interactions : clicks;
    const directionalRevenue = platformDirectionalRevenue(dataset, platform);
    return {
      platform,
      spend: hasData ? round(spend) : null,
      spendShare: hasData ? round(safeDivide(spend, allSpend), 4) : null,
      impressions: hasData ? round(impressions) : null,
      interactions: hasData ? round(interactions) : null,
      clicks: hasData ? round(clicks) : null,
      ctr: hasData ? round(safeDivide(trafficActions, impressions), 4) : null,
      ctrLabel: platform === 'Google Ads' ? 'Interaction rate' : 'Link CTR',
      platformClaims: hasData ? round(claims, 1) : null,
      claimShare: hasData ? round(safeDivide(claims, allClaims), 4) : null,
      claimedCac: hasData ? round(safeDivide(spend, claims)) : null,
      directionalRevenue: hasData ? round(directionalRevenue) : null,
      roas: hasData ? round(safeDivide(directionalRevenue, spend)) : null,
      roasStatus: 'DIRECTIONAL' as MetricStatus,
      roasBasis: "Segment site revenue allocated by each platform's share of paid spend within that segment; no site revenue is counted twice.",
    };
  });
  return { platforms, metadata: metadata(dataset, filter) };
}

interface CampaignFilters extends MediaFilter {
  platform?: string;
  brand?: string;
  segment?: string;
  stage?: string;
  campaignType?: string;
  page: number;
  limit: number;
  sort: 'spend' | 'campaign';
  order: 'asc' | 'desc';
}

export async function getCampaigns(filter: CampaignFilters) {
  const dataset = await mediaDataset(filter);
  const returnContext = await directionalReturnContext(filter, dataset);
  let rows = aggregateCampaignRows(dataset.campaigns).filter((row) =>
    (!filter.platform || row.platform === filter.platform) &&
    (!filter.brand || row.brand === filter.brand) &&
    (!filter.segment || row.segment === filter.segment) &&
    (!filter.stage || row.stage === filter.stage) &&
    (!filter.campaignType || row.campaignType === filter.campaignType));
  rows = [...rows].sort((a, b) => {
    const comparison = filter.sort === 'campaign' ? a.campaign.localeCompare(b.campaign) : a.spend - b.spend;
    return filter.order === 'asc' ? comparison : -comparison;
  });
  const enrichedRows = rows.map((row) => {
    const trafficActions = row.platform === 'Google Ads' ? row.interactions : row.clicks;
    const returnEstimate = directionalReturnEstimate(returnContext, row.brand, row.segment);
    return {
      ...row,
      ctr: round(safeDivide(trafficActions ?? 0, row.impressions ?? 0), 4),
      ctrLabel: row.platform === 'Google Ads' ? 'Interaction rate' : 'Link CTR',
      directionalRevenue: returnEstimate.value === null ? null : round(row.spend * returnEstimate.value),
      roas: round(returnEstimate.value),
      roasStatus: 'DIRECTIONAL' as MetricStatus,
      roasBasis: returnEstimate.basis,
    };
  });
  const start = (filter.page - 1) * filter.limit;
  return {
    campaigns: enrichedRows.slice(start, start + filter.limit),
    topCampaigns: [...enrichedRows].sort((a, b) => b.spend - a.spend).slice(0, 10),
    roasCampaigns: [...enrichedRows]
      .filter((row) => row.spend > 300 && row.roas !== null)
      .sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0)),
    pagination: { page: filter.page, limit: filter.limit, total: rows.length, pages: Math.ceil(rows.length / filter.limit) },
    filters: {
      brands: unique(rows.map((row) => row.brand)),
      segments: unique(rows.map((row) => row.segment)),
      stages: unique(rows.map((row) => row.stage)),
      campaignTypes: unique(rows.map((row) => row.campaignType)),
    },
    metadata: metadata(dataset, filter),
  };
}

function aggregateCampaignRows(rows: CampaignRecord[]): CampaignRecord[] {
  const grouped = new Map<string, CampaignRecord>();
  rows.forEach((row) => {
    const key = `${row.platform}|${row.campaign}`;
    const current = grouped.get(key);
    if (!current) {
      grouped.set(key, { ...row });
      return;
    }
    grouped.set(key, {
      ...current,
      year: current.year === row.year ? current.year : undefined,
      month: current.month === row.month ? current.month : undefined,
      periodKey: current.periodKey === row.periodKey ? current.periodKey : undefined,
      spend: current.spend + row.spend,
      claims: addOptional(current.claims, row.claims),
      impressions: addOptional(current.impressions, row.impressions),
      interactions: addOptional(current.interactions, row.interactions),
      clicks: addOptional(current.clicks, row.clicks),
      calculationBasis: current.calculationBasis ?? row.calculationBasis,
    });
  });
  return [...grouped.values()];
}

function addOptional(left?: number, right?: number): number | undefined {
  if (left === undefined && right === undefined) return undefined;
  return (left ?? 0) + (right ?? 0);
}

export async function getBrands(filter: MediaFilter) {
  const dataset = await mediaDataset(filter);
  const names = unique([
    ...dataset.platforms.map((row) => row.brand),
    ...dataset.site.map((row) => row.brand),
  ]);
  const brands = names.map((brand) => {
    const estimate = directionalReturnEstimate(dataset, brand, filter.segment ?? '');
    return aggregatePerformance(
      brand,
      dataset.platforms.filter((row) => row.brand === brand),
      dataset.site.filter((row) => row.brand === brand),
      estimate,
    );
  }).sort((a, b) => b.totalSpend - a.totalSpend || b.siteRevenue - a.siteRevenue);
  return { brands, metadata: metadata(dataset, filter) };
}

export async function getSegments(filter: MediaFilter) {
  const dataset = await mediaDataset(filter);
  const names = unique([
    ...dataset.platforms.map((row) => row.segment),
    ...dataset.site.map((row) => row.segment),
  ]);
  const segments = names.map((segment) => aggregatePerformance(
    segment,
    dataset.platforms.filter((row) => row.segment === segment),
    dataset.site.filter((row) => row.segment === segment),
    directionalReturnEstimate(dataset, '', segment),
  )).sort((a, b) => b.totalSpend - a.totalSpend || b.siteRevenue - a.siteRevenue);
  return { segments, metadata: metadata(dataset, filter) };
}

function aggregatePerformance(
  label: string,
  platformRows: MediaDataset['platforms'],
  siteRows: MediaDataset['site'],
  returnEstimate: DirectionalReturnEstimate,
) {
  const googleSpend = sum(platformRows.filter((row) => row.platform === 'Google Ads'), (row) => row.spend);
  const metaSpend = sum(platformRows.filter((row) => row.platform === 'Meta Ads'), (row) => row.spend);
  const totalSpend = googleSpend + metaSpend;
  const sitePurchases = sum(siteRows, (row) => row.itemsPurchased);
  const siteRevenue = sum(siteRows, (row) => row.revenue);
  return {
    label,
    googleSpend: round(googleSpend),
    metaSpend: round(metaSpend),
    totalSpend: round(totalSpend) ?? 0,
    sitePurchases: round(sitePurchases),
    siteRevenue: round(siteRevenue) ?? 0,
    siteAov: round(safeDivide(siteRevenue, sitePurchases)),
    directionalReturn: round(returnEstimate.value),
    directionalReturnLevel: returnEstimate.level,
    directionalReturnBasis: returnEstimate.basis,
    directionalReturnRevenue: round(returnEstimate.revenue) ?? 0,
    directionalReturnSpend: round(returnEstimate.spend) ?? 0,
  };
}

export async function getReconciliation(filter: MediaFilter) {
  const dataset = await mediaDataset(filter);
  const rows = dataset.periods.map((period) => {
    const periodData: MediaDataset = {
      ...dataset,
      periods: [period],
      platforms: dataset.platforms.filter((row) => row.periodKey === period.periodKey),
      site: dataset.site.filter((row) => row.periodKey === period.periodKey),
      campaigns: [],
      organic: [],
    };
    const input = totals(periodData);
    const platformClaims = input.googleClaims + input.metaClaims;
    return {
      periodKey: period.periodKey,
      label: period.sourcePeriodLabel,
      partial: period.isPartialPeriod,
      googleClaims: round(input.googleClaims, 1),
      metaClaims: round(input.metaClaims, 1),
      platformClaims: round(platformClaims, 1),
      sitePurchases: round(input.sitePurchases),
      claimsDifference: round(platformClaims - input.sitePurchases, 1),
      claimsVsSite: round(safeDivide(platformClaims, input.sitePurchases), 4),
    };
  });
  const input = totals(dataset);
  const platformClaims = input.googleClaims + input.metaClaims;
  return {
    summary: {
      googleClaims: round(input.googleClaims, 1),
      metaClaims: round(input.metaClaims, 1),
      platformClaims: round(platformClaims, 1),
      sitePurchases: round(input.sitePurchases),
      claimsDifference: round(platformClaims - input.sitePurchases, 1),
      claimsVsSite: round(safeDivide(platformClaims, input.sitePurchases), 4),
    },
    monthlyTrend: rows,
    checks: sourceReconciliationChecks(dataset, filter),
    metadata: metadata(dataset, filter),
  };
}

export async function getFunnel(filter: MediaFilter) {
  const dataset = await mediaDataset(filter);
  const input = totals(dataset);
  return {
    steps: [
      { label: 'Items viewed', value: input.itemsViewed },
      { label: 'Items added to cart', value: input.itemsAddedToCart, rate: round(safeDivide(input.itemsAddedToCart, input.itemsViewed), 4) },
      { label: 'Items purchased', value: input.sitePurchases, rate: round(safeDivide(input.sitePurchases, input.itemsAddedToCart), 4) },
    ],
    viewToCartRate: round(safeDivide(input.itemsAddedToCart, input.itemsViewed), 4),
    cartToPurchaseRate: round(safeDivide(input.sitePurchases, input.itemsAddedToCart), 4),
    viewToPurchaseRate: round(safeDivide(input.sitePurchases, input.itemsViewed), 4),
    metadata: metadata(dataset, filter),
  };
}

export async function getOrganicDemand(filter: MediaFilter & { market?: string }) {
  const dataset = await mediaDataset(filter);
  const brandRows = dataset.organic.filter((row) => !row.market);
  const marketRows = dataset.organic.filter((row) => row.market && (!filter.market || row.market === filter.market));
  const trend = dataset.periods.map((period) => {
    const rows = brandRows.filter((row) => row.periodKey === period.periodKey);
    const clicks = sum(rows, (row) => row.organicClicks);
    const impressions = sum(rows, (row) => row.organicImpressions);
    return { periodKey: period.periodKey, label: period.sourcePeriodLabel, clicks, impressions, ctr: round(safeDivide(clicks, impressions), 4), partial: period.isPartialPeriod };
  });
  const byBrand = aggregateOrganic(brandRows, (row) => row.brand).slice(0, 20);
  const bySegment = aggregateOrganic(brandRows, (row) => row.segment);
  const byMarket = aggregateOrganic(marketRows, (row) => row.market ?? 'Unknown');
  return { trend, byBrand, bySegment, byMarket, metadata: metadata(dataset, filter) };
}

function aggregateOrganic(rows: MediaDataset['organic'], label: (row: MediaDataset['organic'][number]) => string) {
  const groups = new Map<string, typeof rows>();
  rows.forEach((row) => groups.set(label(row), [...(groups.get(label(row)) ?? []), row]));
  return [...groups.entries()].map(([name, values]) => {
    const clicks = sum(values, (row) => row.organicClicks);
    const impressions = sum(values, (row) => row.organicImpressions);
    const positioned = values.filter((row) => row.averagePosition !== null && row.organicImpressions > 0);
    const positionWeight = sum(positioned, (row) => row.organicImpressions);
    const weightedPosition = safeDivide(sum(positioned, (row) => (row.averagePosition ?? 0) * row.organicImpressions), positionWeight);
    return { label: name, clicks, impressions, ctr: round(safeDivide(clicks, impressions), 4), averagePosition: round(weightedPosition) };
  }).sort((a, b) => b.clicks - a.clicks);
}

export async function getCalculationAudit(filter: MediaFilter) {
  const dataset = await mediaDataset(filter);
  const input = totals(dataset);
  const totalSpend = input.googleSpend + input.metaSpend;
  const platformClaims = input.googleClaims + input.metaClaims;
  const rawResult = safeDivide(totalSpend, platformClaims);
  return {
    metric: 'platformClaimedCAC',
    inputs: {
      googleSpend: input.googleSpend,
      metaSpend: input.metaSpend,
      googleClaims: input.googleClaims,
      metaClaims: input.metaClaims,
    },
    formula: '(googleSpend + metaSpend) / (googleClaims + metaClaims)',
    rawResult,
    displayResult: round(rawResult),
    sourcePeriods: dataset.periods.map((period) => period.sourcePeriodLabel),
    sourceBatches: unique([...dataset.platforms.map((row) => row.batchId), ...dataset.site.map((row) => row.batchId)]),
  };
}

function sourceReconciliationChecks(dataset: MediaDataset, filter: MediaFilter) {
  const original = sourceDataset();
  return dataset.periods.flatMap((period) => {
    const sourceRows = original.site.filter((row) =>
      row.periodKey === period.periodKey &&
      (!filter.segment || row.segment === filter.segment) &&
      (!filter.brand || row.brand === filter.brand));
    const importedRows = dataset.site.filter((row) => row.periodKey === period.periodKey);
    const metrics = [
      ['Items viewed', sum(sourceRows, (row) => row.itemsViewed), sum(importedRows, (row) => row.itemsViewed), 0.0001],
      ['Items added to cart', sum(sourceRows, (row) => row.itemsAddedToCart), sum(importedRows, (row) => row.itemsAddedToCart), 0.0001],
      ['Items purchased', sum(sourceRows, (row) => row.itemsPurchased), sum(importedRows, (row) => row.itemsPurchased), 0.0001],
      ['Site revenue', sum(sourceRows, (row) => row.revenue), sum(importedRows, (row) => row.revenue), 0.01],
    ] as const;
    return metrics.map(([label, sourceValue, importedValue, tolerance]) => {
      const difference = importedValue - sourceValue;
      return { name: `${period.sourcePeriodLabel} ${label}`, sourceValue, importedValue, difference, tolerance, passed: Math.abs(difference) <= tolerance, severity: 'ERROR' as const };
    });
  });
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export type { CampaignRecord };

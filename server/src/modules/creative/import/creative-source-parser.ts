import { existsSync, readFileSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';
import { creativeBrands, instagramSourcePrecedence, paidMetaSource } from '../config/creative-source.config.js';
import type {
  CreativeCoverageRecord,
  CreativeMetricConflict,
  CreativePlatform,
  CreativeSourceDataset,
  NormalizedCreativePost,
  NormalizedPaidCreativePost,
  PaidCreativeAccountSummary,
} from '../types/creative.types.js';
import { decodeCsv, nullableNumber, parseCsv, repairMojibake, tableRecords } from './csv-parser.js';
import { parseSouqSources } from './souq-source-parser.js';

const comparedFields = [
  'Published At', 'Post Type', 'Comments', 'Views', 'Shares', 'Saves', 'Reach',
  'Avg. Watch Time (sec)', 'Reactions', 'Follows', 'Watch Time (min)',
] as const;

export function resolveCreativeSourceDirectory(): string {
  const candidates = [
    resolve(process.cwd(), 'spreadsheets data/creative-tab'),
    resolve(process.cwd(), '../spreadsheets data/creative-tab'),
  ];
  const found = candidates.find(existsSync);
  if (!found) throw new Error(`Creative source directory not found. Checked: ${candidates.join(', ')}`);
  return found;
}

export function parseCreativeSources(directory = resolveCreativeSourceDirectory()): CreativeSourceDataset {
  const selectedPath = resolve(directory, ...instagramSourcePrecedence.selected.split('/'));
  const comparedPath = resolve(directory, ...instagramSourcePrecedence.comparisonOnly.split('/'));
  const selectedRows = recordsFromFile(selectedPath);
  const comparedRows = recordsFromFile(comparedPath);
  const conflicts = compareExports(selectedRows, comparedRows);
  const conflictFieldCounts = Object.fromEntries(comparedFields.map((field) => [field, conflicts.filter((row) => row.fields.includes(field)).length]));
  const posts = normalizeInstagram(selectedRows, relative(directory, selectedPath).replaceAll('\\', '/'));
  const coverage: CreativeCoverageRecord[] = [coverageFromPosts(posts, relative(directory, selectedPath).replaceAll('\\', '/'))];
  const souq = parseSouqSources(directory);
  coverage.push(...souq.coverage);

  const paidDetailPath = resolve(directory, ...paidMetaSource.detail.split('/'));
  const paidSummaryPath = resolve(directory, ...paidMetaSource.summary.split('/'));
  const paidPerformancePath = resolve(directory, ...paidMetaSource.performanceSummary.split('/'));
  const paidAveragePath = resolve(directory, ...paidMetaSource.averagePerformanceSummary.split('/'));
  const paidDetailRows = existsSync(paidDetailPath) ? recordsFromFile(paidDetailPath) : [];
  const paidResult = normalizePaidMeta(paidDetailRows, relative(directory, paidDetailPath).replaceAll('\\', '/'));
  const paidSummaryRows = existsSync(paidSummaryPath) ? recordsFromFile(paidSummaryPath) : [];
  const paidPerformanceRows = existsSync(paidPerformancePath) ? recordsFromFile(paidPerformancePath) : [];
  const paidAverageRows = existsSync(paidAveragePath) ? recordsFromFile(paidAveragePath) : [];
  const paidSummary = normalizePaidSummary(paidSummaryRows[0], paidPerformanceRows[0], paidAverageRows[0]);
  const accountPaidPostCount = paidSummary.paidPostCount;
  if (paidResult.posts.length) {
    coverage.push({
      brandId: paidMetaSource.brandId,
      platform: 'instagram',
      metric: 'Paid post performance subset',
      sourceFile: relative(directory, paidDetailPath).replaceAll('\\', '/'),
      startDate: paidMetaSource.reportingPeriodStart,
      endDate: paidMetaSource.reportingPeriodEnd,
      rowCount: paidResult.posts.length,
      grain: 'post',
    });
  }

  return {
    posts,
    paidPosts: paidResult.posts,
    accountDailyMetrics: souq.dailyMetrics,
    accountSummarySections: souq.summarySections,
    accountAudit: souq.audit,
    coverage,
    audit: {
      selectedSource: instagramSourcePrecedence.selected,
      ignoredDuplicateSource: instagramSourcePrecedence.comparisonOnly,
      sourceSelectionRule: instagramSourcePrecedence.rule,
      selectedRecordCount: selectedRows.length,
      duplicateRecordCount: comparedRows.length,
      conflictingPostCount: conflicts.length,
      conflictFieldCounts,
      conflicts,
    },
    paidAudit: {
      detailSource: paidMetaSource.detail,
      summarySource: paidMetaSource.summary,
      identityRule: paidMetaSource.identityRule,
      sourceRows: paidDetailRows.length,
      acceptedRows: paidResult.posts.length,
      malformedRows: paidResult.malformedRows,
      accountPaidPostCount,
    },
    paidSummary,
  };
}

function recordsFromFile(path: string): Array<Record<string, string>> {
  return tableRecords(parseCsv(decodeCsv(readFileSync(path))));
}

function normalizeInstagram(rows: Array<Record<string, string>>, sourceFile: string): NormalizedCreativePost[] {
  return rows.map((row) => {
    const publishedAt = row['Published At'] ?? '';
    const [year, month] = publishedAt.slice(0, 7).split('-').map(Number);
    return {
      brandId: 'union-coop',
      brand: 'Union Coop',
      account: row['Channel Name'] || 'union.coop',
      platform: platformOf(row.Network),
      postId: row['Post Id'] ?? '',
      publishedAt,
      year: year ?? 0,
      month: month ?? 0,
      postType: row['Post Type'] || 'Unknown',
      caption: repairMojibake(row['Post Text (Excerpt)']),
      postUrl: row['Post URL'] || null,
      imageUrl: safeUrl(row['Thumbnail URL'] || row['Image URL'] || row['Media URL']),
      reach: nullableNumber(row.Reach),
      views: nullableNumber(row.Views),
      shares: nullableNumber(row.Shares),
      saves: nullableNumber(row.Saves),
      comments: nullableNumber(row.Comments),
      reactions: nullableNumber(row.Reactions),
      averageWatchTimeSeconds: nullableNumber(row['Avg. Watch Time (sec)']),
      storyExits: nullableNumber(row.exits),
      storyTapsBack: nullableNumber(row.tapsBack),
      storyTapsForward: nullableNumber(row.tapsForward),
      sourceFile,
      sourceKind: 'complete-post-export',
      reportingPeriodStart: '2026-01-01',
      reportingPeriodEnd: '2026-09-23',
    };
  });
}

function normalizePaidMeta(
  rows: Array<Record<string, string>>,
  sourceFile: string,
): { posts: NormalizedPaidCreativePost[]; malformedRows: number } {
  let malformedRows = 0;
  const posts = rows.flatMap((row) => {
    const postId = row.id?.trim();
    const publishedAt = parseBufferDate(row.date);
    if (!postId || !publishedAt) {
      malformedRows += 1;
      return [];
    }
    const [year, month] = publishedAt.slice(0, 7).split('-').map(Number);
    const type = row.type?.trim().toLowerCase();
    const postType: NormalizedPaidCreativePost['postType'] = type === 'video'
      ? 'Video'
      : type === 'image'
        ? 'Static'
        : 'Unknown';
    return [{
      brandId: paidMetaSource.brandId,
      brand: 'Pocari Sweat',
      account: null,
      platform: 'meta' as const,
      postId,
      publishedAt,
      year: year ?? 0,
      month: month ?? 0,
      postType,
      caption: repairMojibake(row.text),
      postUrl: safeUrl(row.serviceLink),
      imageUrl: null,
      paidReach: nullableNumber(row['reach paid']),
      paidImpressions: nullableNumber(row['impressions paid']),
      paidClicks: nullableNumber(row['clicks paid']),
      paidComments: nullableNumber(row['comments_count paid']),
      spendAed: parseAed(row.spend),
      currency: 'AED' as const,
      sourceFile,
      sourceKind: 'paid-post-detail' as const,
      reportingPeriodStart: paidMetaSource.reportingPeriodStart,
      reportingPeriodEnd: paidMetaSource.reportingPeriodEnd,
    }];
  });
  return { posts, malformedRows };
}

function normalizePaidSummary(
  row: Record<string, string> | undefined,
  performanceRow: Record<string, string> | undefined,
  averageRow: Record<string, string> | undefined,
): PaidCreativeAccountSummary {
  const paidPostCount = nullableNumber(row?.['Posts paid']);
  const paidImpressions = nullableNumber(row?.['Impressions paid']);
  const paidReach = nullableNumber(row?.['Reach paid']);
  const paidLikes = nullableNumber(row?.['Likes paid']);
  const paidComments = nullableNumber(row?.['Comments paid']);
  const suppliedEngagementRatePercent = nullableNumber(row?.['Engagement Rate']);
  const performancePaidReachControl = nullableNumber(performanceRow?.['Reach paid']);
  const safeRate = (numerator: number | null, denominator: number | null) =>
    numerator != null && denominator != null && denominator > 0 ? numerator / denominator : null;
  return {
    paidPostCount,
    paidImpressions,
    paidReach,
    paidLikes,
    paidComments,
    suppliedEngagementRatePercent,
    frequency: safeRate(paidImpressions, paidReach),
    measuredCommentRate: safeRate(paidComments, paidReach),
    passiveLikeRate: safeRate(paidLikes, paidReach),
    averageLikesPerPaidPost: nullableNumber(averageRow?.['Average likes per post paid']),
    averageCommentsPerPaidPost: nullableNumber(averageRow?.['Average comments per post paid']),
    performancePaidReachControl,
    paidReachConflict: paidReach != null && performancePaidReachControl != null && paidReach !== performancePaidReachControl,
  };
}

function parseBufferDate(value: string | undefined): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/.exec(value?.trim() ?? '');
  if (!match) return null;
  const [, month, day, year, hour, minute, second] = match;
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

function parseAed(value: string | undefined): number | null {
  if (!value) return null;
  const normalized = value.trim().replace(/^AED[_\s-]*/i, '').replaceAll(',', '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function safeUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function platformOf(value: string | undefined): CreativePlatform {
  const normalized = value?.toLowerCase();
  if (normalized === 'instagram' || normalized === 'facebook' || normalized === 'tiktok') return normalized;
  return 'unknown';
}

function compareExports(selected: Array<Record<string, string>>, compared: Array<Record<string, string>>): CreativeMetricConflict[] {
  const byId = new Map(compared.map((row) => [row['Post Id'], row]));
  return selected.flatMap((row) => {
    const other = byId.get(row['Post Id']);
    if (!other) return [];
    const fields = comparedFields.filter((field) => row[field] !== other[field]);
    return fields.length ? [{
      postId: row['Post Id'] ?? '',
      fields: [...fields],
      selectedSource: instagramSourcePrecedence.selected,
      comparedSource: instagramSourcePrecedence.comparisonOnly,
    }] : [];
  });
}

function coverageFromPosts(posts: NormalizedCreativePost[], sourceFile: string): CreativeCoverageRecord {
  const dates = posts.map((row) => row.publishedAt.slice(0, 10)).filter(Boolean).sort();
  return {
    brandId: 'union-coop',
    platform: 'instagram',
    metric: 'Post-level performance',
    sourceFile,
    startDate: dates[0] ?? null,
    endDate: dates.at(-1) ?? null,
    rowCount: posts.length,
    grain: 'post',
  };
}

export function parseMetaCoverage(path: string, root: string): CreativeCoverageRecord {
  const rows = parseCsv(decodeCsv(readFileSync(path)));
  const metric = rows[0]?.[0]?.trim() || 'Unknown metric';
  const headerIndex = rows.findIndex((row) => row[0]?.trim().toLowerCase() === 'date');
  const datedRows = headerIndex >= 0 ? tableRecords(rows, headerIndex).filter((row) => /^20\d{2}-\d{2}-\d{2}/.test(row.Date ?? '')) : [];
  const dates = datedRows.map((row) => (row.Date ?? '').slice(0, 10)).filter(Boolean).sort();
  const name = basename(path).toLowerCase();
  const brandId = /jubair|juabir/.test(name) ? 'souq-al-jubair' : 'souq-al-bahar';
  const platform: CreativePlatform = /insta/.test(name) || /instagram/i.test(metric) ? 'instagram' : 'facebook';
  return {
    brandId,
    platform,
    metric,
    sourceFile: relative(root, path).replaceAll('\\', '/'),
    startDate: dates[0] ?? null,
    endDate: dates.at(-1) ?? null,
    rowCount: datedRows.length || Math.max(0, rows.length - 1),
    grain: datedRows.length ? 'daily-account' : 'summary',
  };
}

export function configuredBrands() {
  return creativeBrands.map((brand) => ({ ...brand }));
}

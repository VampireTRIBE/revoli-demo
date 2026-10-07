import { creativeBrands, creativeScoringMode, CREATIVE_TIMEZONE, paidMetaSource } from '../config/creative-source.config.js';
import { calculateOrganic, calculatePaidCreative } from '../calculations/creative-calculations.js';
import { parseCreativeSources } from '../import/creative-source-parser.js';
import type { CreativeAccountMetricSummary, CreativeDashboard, CreativeFilter, CreativeOptions, CreativeSourceDataset } from '../types/creative.types.js';

let sourceCache: CreativeSourceDataset | null = null;

function sourceDataset(): CreativeSourceDataset {
  sourceCache ??= parseCreativeSources();
  return sourceCache;
}

export function clearCreativeSourceCache() {
  sourceCache = null;
}

export function getCreativeOptions(): CreativeOptions {
  const dataset = sourceDataset();
  const allDates = [
    ...dataset.posts.map((post) => post.publishedAt.slice(0, 10)),
    ...dataset.paidPosts.map((post) => post.publishedAt.slice(0, 10)),
    ...dataset.coverage.flatMap((row) => [row.startDate, row.endDate]).filter((value): value is string => Boolean(value)),
  ].sort();
  const coverageEnd = allDates.at(-1) ?? '';
  const partialPeriodKeys = new Set(dataset.coverage.flatMap((row) => {
    if (!row.endDate) return [];
    const [year, month, day] = row.endDate.split('-').map(Number);
    if (!year || !month || !day || day >= new Date(Date.UTC(year, month, 0)).getUTCDate()) return [];
    return [`${year}-${String(month).padStart(2, '0')}`];
  }));
  const periods = new Map<number, Set<number>>();
  for (const date of allDates) {
    const [year, month] = date.slice(0, 7).split('-').map(Number);
    if (!year || !month) continue;
    if (!periods.has(year)) periods.set(year, new Set());
    periods.get(year)?.add(month);
  }
  const years = [...periods.entries()].sort(([left], [right]) => right - left).map(([year, months]) => ({
    year,
    months: [
      { month: 0, label: 'All months', partial: false, coverageEnd },
      ...[...months].sort((left, right) => left - right).map((month) => ({
        month,
        label: new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1))),
        partial: partialPeriodKeys.has(`${year}-${String(month).padStart(2, '0')}`),
        coverageEnd: latestDateInPeriod(allDates, year, month),
      })),
    ],
  }));
  const latestYear = years[0];
  const defaultMonth = latestYear?.months.filter((month) => month.month > 0 && !month.partial).at(-1)
    ?? latestYear?.months.filter((month) => month.month > 0).at(-1);
  return {
    years,
    brands: creativeBrands.map((brand) => ({
      id: brand.id,
      label: brand.label,
      postLevelAvailable: brand.postLevelAvailable,
      paidPostLevelAvailable: brand.paidPostLevelAvailable,
      accountLevelAvailable: brand.accountLevelAvailable,
    })),
    defaultSelection: latestYear && defaultMonth ? { year: latestYear.year, month: defaultMonth.month, brand: 'union-coop' } : null,
    timezone: CREATIVE_TIMEZONE,
  };
}

export function getCreativeDashboard(filter: CreativeFilter): CreativeDashboard {
  const options = getCreativeOptions();
  const defaults = options.defaultSelection;
  if (!defaults) throw new Error('No dated Creative source data is available.');
  const selected = {
    year: filter.year ?? defaults.year,
    month: filter.month ?? defaults.month,
    brand: filter.brand ?? defaults.brand,
  };
  const brand = creativeBrands.find((candidate) => candidate.id === selected.brand) ?? creativeBrands[0];
  const dataset = sourceDataset();
  const period = options.years.find((entry) => entry.year === selected.year)?.months.find((month) => month.month === selected.month);
  const filteredPosts = dataset.posts.filter((post) =>
    post.brandId === brand.id && post.year === selected.year && (selected.month === 0 || post.month === selected.month));
  const organic = calculateOrganic(filteredPosts);
  const prepared = brand.id === 'union-coop' ? dataset.preparedImport : null;
  const preparedById = new Map(prepared?.postMetrics.map((row) => [row.postId, row]) ?? []);
  const joinedPosts = organic.posts.map((post) => {
    const supplied = preparedById.get(post.postId);
    return supplied ? {
      ...post,
      giveaway: supplied.giveaway,
      language: supplied.language,
      day: supplied.day,
      timeSlot: supplied.timeSlot,
      theme: supplied.theme,
      eligibleForRanking: supplied.eligibleForRanking,
    } : post;
  });
  const rankedPosts = joinedPosts
    .filter((post) => prepared ? post.eligibleForRanking === true : true)
    .sort((left, right) => right.activeEngagementRate - left.activeEngagementRate);
  const filteredAccountRows = dataset.accountDailyMetrics.filter((row) =>
    row.brandId === brand.id && row.year === selected.year && (selected.month === 0 || row.month === selected.month));
  const accountDailyMetrics = summarizeAccountMetrics(filteredAccountRows);
  const accountSummaries = dataset.accountSummarySections.filter((section) => section.brandId === brand.id);
  const accountLevelAvailable = brand.accountLevelAvailable && (accountDailyMetrics.length > 0 || accountSummaries.length > 0);
  const available = brand.postLevelAvailable && organic.eligiblePostCount > 0;
  const unavailableMessage = brand.postLevelAvailable
    ? `No eligible Instagram Posts or Reels were published for ${brand.label} in the selected period.`
    : `${brand.label} supplies daily account totals only. Post-level reach, shares, saves, comments, captions, and links are required for this gallery and its calculations.`;
  const scoresEnabled = creativeScoringMode === 'html-reference' && available;
  const paidScopeSupported = brand.paidPostLevelAvailable
    && selected.year === Number(paidMetaSource.reportingPeriodStart.slice(0, 4))
    && selected.month === 0;
  const paidRecords = paidScopeSupported ? dataset.paidPosts.filter((post) => post.brandId === brand.id) : [];
  const paid = calculatePaidCreative(paidRecords);
  const paidAvailable = paidScopeSupported && paid.detailRecordCount > 0;
  const paidMessage = paidAvailable
    ? `Five paid post records are available for the whole ${paidMetaSource.reportingPeriodStart} to ${paidMetaSource.reportingPeriodEnd} export. The account summary reports ${dataset.paidAudit.accountPaidPostCount ?? 'N/A'} paid posts, so this is a subset.`
    : brand.paidPostLevelAvailable
      ? `Paid detail is available only for the whole ${paidMetaSource.reportingPeriodStart} to ${paidMetaSource.reportingPeriodEnd} export. Select All months; cumulative paid metrics are not assigned to publication months.`
      : `Data not available. No paid post-detail export is configured for ${brand.label}.`;
  const periodLabel = selected.month === 0
    ? `All months ${selected.year}`
    : `${new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(selected.year, selected.month - 1, 1)))} ${selected.year}`;
  const selectedBenchmark = selected.month > 0
    ? prepared?.monthlyBenchmarks.find((row) => row.year === selected.year && row.month === selected.month) ?? null
    : null;
  const selectedTopPosts = selected.month > 0
    ? prepared?.monthlyTopPosts.filter((row) => row.year === selected.year && row.month === selected.month).sort((left, right) => left.rank - right.rank) ?? []
    : [];
  const rawById = new Map(dataset.posts.filter((post) => post.brandId === brand.id).map((post) => [post.postId, post]));
  const topPostViews = selectedTopPosts.map((post) => {
    const raw = rawById.get(post.postId);
    return {
      ...post,
      postUrl: raw?.postUrl ?? null,
      imageUrl: raw?.imageUrl ?? null,
      matchedPost: Boolean(raw),
    };
  });
  const preparedAvailable = Boolean(prepared && selected.month > 0 && selectedBenchmark && topPostViews.length);

  return {
    filter: selected,
    periodLabel,
    partial: period?.partial ?? false,
    timezone: CREATIVE_TIMEZONE,
    sourceLabel: prepared ? 'Uploaded Buffer and Meta exports plus prepared Union Coop Creative workbook' : 'Uploaded Buffer and Meta CSV exports',
    scoringMode: creativeScoringMode,
    creativeScore: null,
    brand: {
      id: brand.id,
      label: brand.label,
      account: brand.account,
      postLevelAvailable: brand.postLevelAvailable,
      paidPostLevelAvailable: brand.paidPostLevelAvailable,
      accountLevelAvailable: brand.accountLevelAvailable,
    },
    accountLevel: {
      available: accountLevelAvailable,
      message: accountLevelAvailable
        ? null
        : brand.accountLevelAvailable
          ? `No account-level observations are available for ${brand.label} in the selected period.`
          : `No separate account-level summary export is configured for ${brand.label}.`,
      dailyMetrics: accountDailyMetrics,
      wholePeriodSummaries: accountSummaries,
      audit: dataset.accountAudit,
    },
    organic: {
      available,
      availabilityMessage: available ? null : unavailableMessage,
      label: 'Organic + boosted combined',
      eligiblePostCount: available ? organic.eligiblePostCount : 0,
      summedPostReach: available ? organic.summedPostReach : null,
      totalViews: available ? organic.totalViews : null,
      activeActions: available ? organic.activeActions : null,
      activeEngagementRate: available ? organic.activeEngagementRate : null,
      frequency: available ? organic.frequency : null,
      watchTimeCoverage: available ? organic.watchTimeCoverage : { populatedReels: 0, totalReels: 0 },
      score: {
        overall: null,
        attention: scoresEnabled ? organic.score.attention : null,
        activeEngagement: scoresEnabled ? organic.score.activeEngagement : null,
        provisional: scoresEnabled,
      },
      posts: available ? rankedPosts : [],
      preparedInsights: {
        available: preparedAvailable,
        message: preparedAvailable
          ? null
          : brand.id !== 'union-coop'
            ? 'Data not available. Prepared monthly benchmarks and Why it worked analysis are supplied only for Union Coop.'
            : selected.month === 0
              ? 'Data not available for All months. The supplied workbook provides monthly medians and does not provide an all-period median.'
              : 'Data not available for the selected month in the prepared Union Coop workbook.',
        sourceFile: prepared?.sourceFile ?? null,
        typical: selectedBenchmark,
        best: topPostViews[0] ?? null,
        topPosts: topPostViews,
        trend: prepared?.monthlyBenchmarks.filter((row) => row.year === selected.year).sort((left, right) => left.month - right.month) ?? [],
        unmatchedPostIds: topPostViews.filter((row) => !row.matchedPost).map((row) => row.postId),
        rankingFloor: 'reach >= 500',
      },
    },
    paid: {
      available: paidAvailable,
      message: paidMessage,
      meta: {
        available: paidAvailable,
        message: paidMessage,
        reportingPeriodStart: paidAvailable ? paidMetaSource.reportingPeriodStart : null,
        reportingPeriodEnd: paidAvailable ? paidMetaSource.reportingPeriodEnd : null,
        reportingPeriodLabel: paidAvailable ? '1 January to 1 October 2026 (whole export)' : null,
        detailRecordCount: paid.detailRecordCount,
        accountPaidPostCount: dataset.paidAudit.accountPaidPostCount,
        coverageLabel: paidAvailable
          ? `${paid.detailRecordCount} detailed records of ${dataset.paidAudit.accountPaidPostCount ?? 'N/A'} paid posts in the account summary`
          : null,
        accountSummary: dataset.paidSummary,
        totalPaidClicks: paid.totalPaidClicks,
        totalPaidImpressions: paid.totalPaidImpressions,
        totalPaidReach: paid.totalPaidReach,
        totalPaidComments: paid.totalPaidComments,
        totalSpendAed: paid.totalSpendAed,
        paidCtr: paid.paidCtr,
        score: {
          overall: null,
          attention: creativeScoringMode === 'html-reference' && paidAvailable ? paid.attentionScore : null,
          activeEngagement: null,
          provisional: creativeScoringMode === 'html-reference' && paidAvailable,
        },
        records: paid.records,
        videos: paid.videos,
        statics: paid.statics,
        audit: dataset.paidAudit,
      },
      googleShopping: { available: false, message: 'Data not available. Product ID, image, clicks, and impressions are required.' },
    },
    sourceAudit: dataset.audit,
  };
}

function summarizeAccountMetrics(rows: CreativeSourceDataset['accountDailyMetrics']): CreativeAccountMetricSummary[] {
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = `${row.platform}:${row.metric}`;
    const current = groups.get(key) ?? [];
    current.push(row);
    groups.set(key, current);
  }
  const nonAdditive = new Set(['reach', 'viewers']);
  const metricOrder = ['views', 'viewers', 'reach', 'contentInteractions', 'follows', 'visits', 'linkClicks'];
  return [...groups.values()].map((group) => {
    const first = group[0];
    if (!first) throw new Error('Account metric group was unexpectedly empty.');
    const dates = group.map((row) => row.date).sort();
    const useAverage = nonAdditive.has(first.metric);
    const total = group.reduce((sum, row) => sum + row.value, 0);
    return {
      platform: first.platform,
      metric: first.metric,
      label: useAverage ? `Average daily ${first.metricLabel.toLowerCase()}` : first.metricLabel,
      aggregation: useAverage ? 'daily-average-and-peak' : 'sum',
      value: useAverage ? total / group.length : total,
      peak: useAverage ? Math.max(...group.map((row) => row.value)) : null,
      observedDays: group.length,
      periodStart: dates[0] ?? null,
      periodEnd: dates.at(-1) ?? null,
      sourceFiles: [...new Set(group.map((row) => row.sourceFile))],
      note: useAverage
        ? `${first.metricLabel} is shown as a daily average and peak. Daily values are not summed or labelled as unique monthly audience.`
        : `Sum of supplied daily ${first.metricLabel.toLowerCase()} observations. Missing dates are not converted to zero.`,
    } satisfies CreativeAccountMetricSummary;
  }).sort((left, right) => left.platform.localeCompare(right.platform) || metricOrder.indexOf(left.metric) - metricOrder.indexOf(right.metric));
}

function latestDateInPeriod(dates: string[], year: number, month: number): string {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return dates.filter((date) => date.startsWith(prefix)).at(-1) ?? '';
}

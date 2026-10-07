export type CreativeScoringMode = 'disabled' | 'html-reference';

export type CreativePlatform = 'instagram' | 'facebook' | 'tiktok' | 'unknown';

export type CreativeAccountMetricKey = 'views' | 'viewers' | 'reach' | 'contentInteractions' | 'follows' | 'visits' | 'linkClicks';

export interface CreativeAccountDailyMetric {
  brandId: string;
  brand: string;
  platform: CreativePlatform;
  metric: CreativeAccountMetricKey;
  metricLabel: string;
  date: string;
  year: number;
  month: number;
  value: number;
  sourceFile: string;
}

export interface CreativeAccountSummarySection {
  brandId: string;
  brand: string;
  platform: CreativePlatform;
  title: string;
  columns: string[];
  rows: Array<{ label: string; values: Array<number | null> }>;
  sourceFile: string;
  reportingScope: string;
}

export interface CreativeAccountSourceAudit {
  mappedFiles: Array<{ sourceFile: string; brandId: string; platform: CreativePlatform; identityRule: string }>;
  flaggedFiles: Array<{ sourceFile: string; reason: string }>;
  malformedDailyRows: number;
}

export interface CreativeAccountMetricSummary {
  platform: CreativePlatform;
  metric: CreativeAccountMetricKey;
  label: string;
  aggregation: 'sum' | 'daily-average-and-peak';
  value: number | null;
  peak: number | null;
  observedDays: number;
  periodStart: string | null;
  periodEnd: string | null;
  sourceFiles: string[];
  note: string;
}

export interface NormalizedCreativePost {
  brandId: string;
  brand: string;
  account: string;
  platform: CreativePlatform;
  postId: string;
  publishedAt: string;
  year: number;
  month: number;
  postType: string;
  caption: string | null;
  postUrl: string | null;
  imageUrl: string | null;
  reach: number | null;
  views: number | null;
  shares: number | null;
  saves: number | null;
  comments: number | null;
  reactions: number | null;
  averageWatchTimeSeconds: number | null;
  storyExits: number | null;
  storyTapsBack: number | null;
  storyTapsForward: number | null;
  sourceFile: string;
  sourceKind: 'complete-post-export' | 'selected-post-extract' | 'account-summary';
  reportingPeriodStart: string | null;
  reportingPeriodEnd: string | null;
}

export interface NormalizedPaidCreativePost {
  brandId: string;
  brand: string;
  account: string | null;
  platform: 'meta';
  postId: string;
  publishedAt: string;
  year: number;
  month: number;
  postType: 'Video' | 'Static' | 'Unknown';
  caption: string | null;
  postUrl: string | null;
  imageUrl: string | null;
  paidReach: number | null;
  paidImpressions: number | null;
  paidClicks: number | null;
  paidComments: number | null;
  spendAed: number | null;
  currency: 'AED';
  sourceFile: string;
  sourceKind: 'paid-post-detail';
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
}

export interface PaidCreativeSourceAudit {
  detailSource: string;
  summarySource: string;
  identityRule: string;
  sourceRows: number;
  acceptedRows: number;
  malformedRows: number;
  accountPaidPostCount: number | null;
}

export interface PaidCreativeAccountSummary {
  paidPostCount: number | null;
  paidImpressions: number | null;
  paidReach: number | null;
  paidLikes: number | null;
  paidComments: number | null;
  suppliedEngagementRatePercent: number | null;
  frequency: number | null;
  measuredCommentRate: number | null;
  passiveLikeRate: number | null;
  averageLikesPerPaidPost: number | null;
  averageCommentsPerPaidPost: number | null;
  performancePaidReachControl: number | null;
  paidReachConflict: boolean;
}

export interface CreativeMetricConflict {
  postId: string;
  fields: string[];
  selectedSource: string;
  comparedSource: string;
}

export interface CreativeSourceAudit {
  selectedSource: string;
  ignoredDuplicateSource: string;
  sourceSelectionRule: string;
  selectedRecordCount: number;
  duplicateRecordCount: number;
  conflictingPostCount: number;
  conflictFieldCounts: Record<string, number>;
  conflicts: CreativeMetricConflict[];
}

export interface CreativeCoverageRecord {
  brandId: string;
  platform: CreativePlatform;
  metric: string;
  sourceFile: string;
  startDate: string | null;
  endDate: string | null;
  rowCount: number;
  grain: 'post' | 'daily-account' | 'summary';
}

export interface PreparedCreativePostMetric {
  postId: string;
  publishedAtDubai: string;
  year: number;
  month: number;
  day: string;
  timeSlot: string;
  postType: string;
  language: string;
  giveaway: boolean;
  reach: number;
  views: number;
  activeActions: number;
  activeEngagementRate: number;
  frequency: number;
  eligibleForRanking: boolean;
  theme: string;
  caption: string | null;
  sourceFile: string;
  sourceSheet: 'Post Metrics (import)';
}

export interface PreparedCreativeTopPost {
  year: number;
  month: number;
  rank: number;
  postId: string;
  date: string;
  postType: string;
  language: string;
  day: string;
  timeSlot: string;
  giveaway: boolean;
  reach: number;
  activeActions: number;
  activeEngagementRate: number;
  frequency: number;
  theme: string;
  caption: string | null;
  sourceFile: string;
  sourceSheet: 'Why It Worked - Monthly Top 3';
}

export interface PreparedCreativeBenchmark {
  year: number;
  month: number;
  eligiblePosts: number;
  rankingEligiblePosts: number;
  medianActiveEngagementRate: number;
  meanActiveEngagementRate: number;
  medianFrequency: number;
  giveawayPosts: number;
  giveawayActionShare: number;
  sourceFile: string;
  sourceSheet: 'Monthly Benchmarks';
}

export interface PreparedCreativeImport {
  sourceFile: string;
  account: 'Union Coop';
  timezone: 'Asia/Dubai';
  postMetrics: PreparedCreativePostMetric[];
  monthlyTopPosts: PreparedCreativeTopPost[];
  monthlyBenchmarks: PreparedCreativeBenchmark[];
}

export interface CreativeSourceDataset {
  posts: NormalizedCreativePost[];
  paidPosts: NormalizedPaidCreativePost[];
  accountDailyMetrics: CreativeAccountDailyMetric[];
  accountSummarySections: CreativeAccountSummarySection[];
  accountAudit: CreativeAccountSourceAudit;
  coverage: CreativeCoverageRecord[];
  audit: CreativeSourceAudit;
  paidAudit: PaidCreativeSourceAudit;
  paidSummary: PaidCreativeAccountSummary;
  preparedImport: PreparedCreativeImport | null;
}

export interface CreativeFilter {
  year?: number;
  month?: number;
  brand?: string;
}

export interface CreativePeriodOption {
  month: number;
  label: string;
  partial: boolean;
  coverageEnd: string;
}

export interface CreativeOptions {
  years: Array<{ year: number; months: CreativePeriodOption[] }>;
  brands: Array<{ id: string; label: string; postLevelAvailable: boolean; paidPostLevelAvailable: boolean; accountLevelAvailable: boolean }>;
  defaultSelection: { year: number; month: number; brand: string } | null;
  timezone: string;
}

export interface PaidCreativeCalculation {
  detailRecordCount: number;
  totalPaidClicks: number | null;
  totalPaidImpressions: number | null;
  totalPaidReach: number | null;
  totalPaidComments: number | null;
  totalSpendAed: number | null;
  paidCtr: number | null;
  attentionScore: number | null;
  records: NormalizedPaidCreativePost[];
  videos: NormalizedPaidCreativePost[];
  statics: NormalizedPaidCreativePost[];
}

export interface CreativePostView extends NormalizedCreativePost {
  activeActions: number;
  activeEngagementRate: number;
  frequency: number | null;
  attentionBasis: 'watch-time' | 'frequency' | null;
  attentionValue: number | null;
  giveaway: boolean | null;
  language: string | null;
  day: string | null;
  timeSlot: string | null;
  theme: string | null;
  eligibleForRanking: boolean | null;
}

export interface CreativePreparedTopPostView extends PreparedCreativeTopPost {
  postUrl: string | null;
  imageUrl: string | null;
  matchedPost: boolean;
}

export interface CreativeDashboard {
  filter: Required<CreativeFilter>;
  periodLabel: string;
  partial: boolean;
  timezone: string;
  sourceLabel: string;
  scoringMode: CreativeScoringMode;
  creativeScore: null;
  brand: {
    id: string;
    label: string;
    account: string | null;
    postLevelAvailable: boolean;
    paidPostLevelAvailable: boolean;
    accountLevelAvailable: boolean;
  };
  accountLevel: {
    available: boolean;
    message: string | null;
    dailyMetrics: CreativeAccountMetricSummary[];
    wholePeriodSummaries: CreativeAccountSummarySection[];
    audit: CreativeAccountSourceAudit;
  };
  organic: {
    available: boolean;
    availabilityMessage: string | null;
    label: 'Organic + boosted combined';
    eligiblePostCount: number;
    summedPostReach: number | null;
    totalViews: number | null;
    activeActions: number | null;
    activeEngagementRate: number | null;
    frequency: number | null;
    watchTimeCoverage: { populatedReels: number; totalReels: number };
    score: {
      overall: number | null;
      attention: number | null;
      activeEngagement: number | null;
      provisional: boolean;
    };
    posts: CreativePostView[];
    preparedInsights: {
      available: boolean;
      message: string | null;
      sourceFile: string | null;
      typical: PreparedCreativeBenchmark | null;
      best: CreativePreparedTopPostView | null;
      topPosts: CreativePreparedTopPostView[];
      trend: PreparedCreativeBenchmark[];
      unmatchedPostIds: string[];
      rankingFloor: 'reach >= 500';
    };
  };
  paid: {
    available: boolean;
    message: string;
    meta: {
      available: boolean;
      message: string;
      reportingPeriodStart: string | null;
      reportingPeriodEnd: string | null;
      reportingPeriodLabel: string | null;
      detailRecordCount: number;
      accountPaidPostCount: number | null;
      coverageLabel: string | null;
      accountSummary: PaidCreativeAccountSummary;
      totalPaidClicks: number | null;
      totalPaidImpressions: number | null;
      totalPaidReach: number | null;
      totalPaidComments: number | null;
      totalSpendAed: number | null;
      paidCtr: number | null;
      score: {
        overall: null;
        attention: number | null;
        activeEngagement: null;
        provisional: boolean;
      };
      records: NormalizedPaidCreativePost[];
      videos: NormalizedPaidCreativePost[];
      statics: NormalizedPaidCreativePost[];
      audit: PaidCreativeSourceAudit;
    };
    googleShopping: { available: false; message: string };
  };
  sourceAudit: CreativeSourceAudit;
}

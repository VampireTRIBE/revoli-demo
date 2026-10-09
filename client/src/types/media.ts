export type MetricStatus = 'VERIFIED' | 'DERIVED' | 'DIRECTIONAL' | 'PLATFORM_CLAIMED' | 'PARTIAL' | 'UNAVAILABLE';

export interface ApiResponse<T> { success: boolean; message: string; data: T }
export interface MediaFilter { year?: number; month?: number; segment?: string[]; brand?: string[] }
export interface Metadata {
  year: number | null;
  month: number | null;
  segment: string | null;
  brand: string | null;
  partialPeriod: boolean;
  periodStart: string | null;
  periodEnd: string | null;
  sourcePeriodLabel: string;
  status: 'COMPLETE' | 'PARTIAL' | 'PROVISIONAL';
  sourceFiles: string[];
  warnings: string[];
}
export interface Metric {
  value: number | null;
  status: MetricStatus;
  formula: string;
  definition: string;
  benchmarkScore?: number | null;
}
export interface Overview {
  metrics: {
    directionalReturn: Metric & { calculationLevel: 'BRAND' | 'SEGMENT' | 'OVERALL'; revenue: number; spend: number };
    referenceMediaScore: number | null;
    scoreLabel: 'Unscored — baselines pending';
    platformClaimedCac: Metric;
    claimsVsSite: Metric;
    platformClaims: Metric & { google: number; meta: number };
    siteAov: Metric;
    cacAovRatio: Metric;
    blendedCtr: Metric;
    paidImpressions: number | null;
    paidTrafficActions: number | null;
    googleInteractions: number;
    metaClicks: number;
    totalSpend: number;
    siteRevenue: number;
    sitePurchases: number;
    claimsDifference: number;
  };
  metadata: Metadata;
}
export interface Periods {
  years: { year: number; months: { month: number; label: string; available: boolean; partial: boolean; startDate: string; endDate: string; sourcePeriodLabel: string }[] }[];
}
export interface PlatformData { platforms: { platform: string; spend: number | null; spendShare: number | null; impressions: number | null; interactions: number | null; clicks: number | null; ctr: number | null; ctrLabel: string; platformClaims: number | null; claimShare: number | null; claimedCac: number | null; directionalRevenue: number | null; roas: number | null; roasStatus: 'DIRECTIONAL' | 'UNAVAILABLE'; roasBasis: string }[]; metadata: Metadata }
export interface Campaign {
  platform: string; campaign: string; brand: string; brandScope: string; segment: string; stage: string; campaignType: string; mappingSource: string; confidence: string; spend: number; claims?: number; impressions?: number; interactions?: number; clicks?: number; calculationBasis?: string; ctr: number | null; ctrLabel: string; directionalRevenue: number | null; roas: number | null; roasStatus: 'DIRECTIONAL' | 'UNAVAILABLE'; roasBasis: string;
}
export interface CampaignData {
  campaigns: Campaign[];
  topCampaigns: Campaign[];
  roasCampaigns: Campaign[];
  pagination: { page: number; limit: number; total: number; pages: number };
  filters: { brands: string[]; segments: string[]; stages: string[]; campaignTypes: string[] };
  metadata: Metadata;
}
export interface PerformanceRow { label: string; googleSpend: number; metaSpend: number; totalSpend: number; sitePurchases: number; siteRevenue: number; siteAov: number | null; directionalReturn: number | null; directionalReturnLevel: 'BRAND' | 'SEGMENT' | 'OVERALL'; directionalReturnBasis: string; directionalReturnRevenue: number; directionalReturnSpend: number }
export interface PerformanceData { brands?: PerformanceRow[]; segments?: PerformanceRow[]; metadata: Metadata }
export interface ReconciliationData {
  summary: { googleClaims: number; metaClaims: number; platformClaims: number; sitePurchases: number; claimsDifference: number; claimsVsSite: number | null };
  monthlyTrend: { periodKey: string; label: string; partial: boolean; googleClaims: number; metaClaims: number; platformClaims: number; sitePurchases: number; claimsDifference: number; claimsVsSite: number | null }[];
  checks: { name: string; sourceValue: number; importedValue: number; difference: number; tolerance: number; passed: boolean; severity: 'ERROR' | 'WARNING' }[];
  metadata: Metadata;
}
export interface FunnelData { steps: { label: string; value: number; rate?: number | null }[]; viewToCartRate: number | null; cartToPurchaseRate: number | null; viewToPurchaseRate: number | null; metadata: Metadata }
export interface OrganicData {
  trend: { periodKey: string; label: string; clicks: number; impressions: number; ctr: number | null; partial: boolean }[];
  byBrand: OrganicRow[]; bySegment: OrganicRow[]; byMarket: OrganicRow[]; metadata: Metadata;
}
export interface OrganicRow { label: string; clicks: number; impressions: number; ctr: number | null; averagePosition: number | null }

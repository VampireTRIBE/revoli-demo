export type MetricStatus =
  | 'VERIFIED'
  | 'DERIVED'
  | 'DIRECTIONAL'
  | 'PLATFORM_CLAIMED'
  | 'PARTIAL'
  | 'UNAVAILABLE';

export type PeriodStatus = 'COMPLETE' | 'PARTIAL' | 'PROVISIONAL';

export interface MediaPeriod {
  year: number;
  month: number;
  monthLabel: string;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  isPartialPeriod: boolean;
  sourcePeriodLabel: string;
}

export interface PlatformRecord extends MediaPeriod {
  batchId: string;
  sourceFile: string;
  sourceSheet: string;
  sourceRow: number;
  platform: 'Google Ads' | 'Meta Ads';
  brand: string;
  segment: string;
  spend: number;
  claims: number;
  impressions?: number;
  interactions?: number;
  clicks?: number;
}

export interface SiteRecord extends MediaPeriod {
  batchId: string;
  sourceFile: string;
  sourceSheet: string;
  sourceRow: number;
  brand: string;
  segment: string;
  mappingStatus: string;
  itemsViewed: number;
  itemsAddedToCart: number;
  itemsPurchased: number;
  revenue: number;
}

export interface CampaignRecord {
  batchId: string;
  sourceFile: string;
  sourceSheet: string;
  sourceRow: number;
  year?: number;
  month?: number;
  periodKey?: string;
  platform: 'Google Ads' | 'Meta Ads';
  campaign: string;
  brand: string;
  brandScope: string;
  segment: string;
  stage: string;
  campaignType: string;
  mappingSource: string;
  confidence: string;
  spend: number;
  claims?: number;
  impressions?: number;
  interactions?: number;
  clicks?: number;
  calculationBasis?: string;
}

export interface OrganicRecord extends MediaPeriod {
  batchId: string;
  sourceFile: string;
  sourceSheet: string;
  sourceRow: number;
  brand: string;
  segment: string;
  market?: string;
  organicClicks: number;
  organicImpressions: number;
  averagePosition: number | null;
}

export interface MediaDataset {
  periods: MediaPeriod[];
  platforms: PlatformRecord[];
  site: SiteRecord[];
  campaigns: CampaignRecord[];
  organic: OrganicRecord[];
  sourceFiles: string[];
  warnings: string[];
}

export interface ReconciliationCheck {
  name: string;
  sourceValue: number;
  importedValue: number;
  difference: number;
  tolerance: number;
  passed: boolean;
  severity: 'ERROR' | 'WARNING';
}

export interface MediaFilter {
  year?: number;
  month?: number;
  segment?: string[];
  brand?: string[];
}

export interface MetricValue {
  value: number | null;
  status: MetricStatus;
  formula: string;
  definition: string;
  benchmarkScore?: number | null;
}

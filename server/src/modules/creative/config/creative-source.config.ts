import type { CreativeScoringMode } from '../types/creative.types.js';

export const creativeScoringMode: CreativeScoringMode =
  process.env.CREATIVE_SCORING_MODE === 'disabled' ? 'disabled' : 'html-reference';

export const CREATIVE_TIMEZONE = 'UTC';

export const creativePreparedImportSource = 'UnionCoop-Creative-WhyItWorked-Import.xlsx';

export const creativeBrands = [
  {
    id: 'union-coop',
    label: 'Union Coop',
    account: 'union.coop',
    aliases: ['union coop', 'union.coop', 'union coop cooperative'],
    postLevelAvailable: true,
    paidPostLevelAvailable: false,
    accountLevelAvailable: false,
  },
  {
    id: 'souq-al-bahar',
    label: 'Souq Al Bahar',
    account: null,
    aliases: ['souq al bahar', 'sab', 'sabh'],
    postLevelAvailable: false,
    paidPostLevelAvailable: false,
    accountLevelAvailable: true,
  },
  {
    id: 'souq-al-jubair',
    label: 'Souq Al Jubair',
    account: null,
    aliases: ['souq al jubair', 'souq al juabir', 'souq al jubair', 'jubair'],
    postLevelAvailable: false,
    paidPostLevelAvailable: false,
    accountLevelAvailable: true,
  },
  {
    id: 'pocari-sweat',
    label: 'Pocari Sweat',
    account: null,
    aliases: ['pocari sweat', 'pocari', 'pocarisweat'],
    postLevelAvailable: false,
    paidPostLevelAvailable: true,
    accountLevelAvailable: false,
  },
] as const;

const souqFolder = 'SOUQ Al Jubair and Bahar/';
const jubairIdentity = 'The filename explicitly names Souq Al Jubair or the known Juabir spelling variant.';
const baharIdentity = 'SAB is mapped to Souq Al Bahar because the same source set contains explicitly named Souq Al Bahar files with the same 21 April to 22 September reporting window.';

export const souqSourceMappings = [
  { file: `${souqFolder}Souq Al JUbair Views .csv`, brandId: 'souq-al-jubair', platform: 'facebook', kind: 'daily', metric: 'views', identityRule: jubairIdentity },
  { file: `${souqFolder}Souq Al Jubair viewers .csv`, brandId: 'souq-al-jubair', platform: 'facebook', kind: 'daily', metric: 'viewers', identityRule: jubairIdentity },
  { file: `${souqFolder}Souq Al Jubair Links  .csv`, brandId: 'souq-al-jubair', platform: 'facebook', kind: 'daily', metric: 'linkClicks', identityRule: jubairIdentity },
  { file: `${souqFolder}Souq Al Jubair Interactions .csv`, brandId: 'souq-al-jubair', platform: 'facebook', kind: 'daily', metric: 'contentInteractions', identityRule: jubairIdentity },
  { file: `${souqFolder}Souq Al Juabir Vsists .csv`, brandId: 'souq-al-jubair', platform: 'facebook', kind: 'daily', metric: 'visits', identityRule: jubairIdentity },
  { file: `${souqFolder}Souq Al Juabir follows .csv`, brandId: 'souq-al-jubair', platform: 'facebook', kind: 'daily', metric: 'follows', identityRule: jubairIdentity },
  { file: `${souqFolder}Souq Al jubair content formats .csv`, brandId: 'souq-al-jubair', platform: 'facebook', kind: 'summary', identityRule: jubairIdentity },
  { file: `${souqFolder}Souq Al Jubair audience .csv`, brandId: 'souq-al-jubair', platform: 'facebook', kind: 'summary', identityRule: jubairIdentity },
  { file: `${souqFolder}Souq Al Bahar Views .csv`, brandId: 'souq-al-bahar', platform: 'facebook', kind: 'daily', metric: 'views', identityRule: 'The filename explicitly names Souq Al Bahar.' },
  { file: `${souqFolder}Souq Al bahar Viewers .csv`, brandId: 'souq-al-bahar', platform: 'facebook', kind: 'daily', metric: 'viewers', identityRule: 'The filename explicitly names Souq Al Bahar.' },
  { file: `${souqFolder}SAB.csv`, brandId: 'souq-al-bahar', platform: 'facebook', kind: 'daily', metric: 'follows', identityRule: baharIdentity },
  { file: `${souqFolder}SAB vists .csv`, brandId: 'souq-al-bahar', platform: 'facebook', kind: 'daily', metric: 'visits', identityRule: baharIdentity },
  { file: `${souqFolder}SAB Intercations .csv`, brandId: 'souq-al-bahar', platform: 'facebook', kind: 'daily', metric: 'contentInteractions', identityRule: baharIdentity },
  { file: `${souqFolder}SAB visits insta.csv`, brandId: 'souq-al-bahar', platform: 'instagram', kind: 'daily', metric: 'visits', identityRule: baharIdentity },
  { file: `${souqFolder}SAB reach insta .csv`, brandId: 'souq-al-bahar', platform: 'instagram', kind: 'daily', metric: 'reach', identityRule: baharIdentity },
  { file: `${souqFolder}SAB interactions insta .csv`, brandId: 'souq-al-bahar', platform: 'instagram', kind: 'daily', metric: 'contentInteractions', identityRule: baharIdentity },
  { file: `${souqFolder}SAB Insta views .csv`, brandId: 'souq-al-bahar', platform: 'instagram', kind: 'daily', metric: 'views', identityRule: baharIdentity },
  { file: `${souqFolder}SAB follows Insta .csv`, brandId: 'souq-al-bahar', platform: 'instagram', kind: 'daily', metric: 'follows', identityRule: baharIdentity },
  { file: `${souqFolder}SAb content formats .csv`, brandId: 'souq-al-bahar', platform: 'instagram', kind: 'summary', identityRule: `${baharIdentity} The Stories/Posts breakdown is mapped to Instagram because it belongs to the same SAB Instagram export group.` },
  { file: `${souqFolder}SAb audience insta .csv`, brandId: 'souq-al-bahar', platform: 'instagram', kind: 'summary', identityRule: baharIdentity },
] as const;

export const instagramSourcePrecedence = {
  selected: 'Buffer insights Union Coop/UC buffer Instagram/posts.csv',
  comparisonOnly: 'Buffer insights Union Coop/UC Instagram Buffer/posts.csv',
  rule: 'Use the configured UC buffer Instagram complete export. The alternate complete export is comparison-only because both contain the same Post IDs; never concatenate them or choose the largest metric.',
};

export const paidMetaSource = {
  detail: 'buffer-posts-analytics-csv/posts-20260101-to-20261001.csv',
  summary: 'buffer-posts-analytics-csv/posts-summary-20260101-to-20261001.csv',
  performanceSummary: 'buffer-posts-analytics-csv/performance-statistics-20260101-to-20261001.csv',
  averagePerformanceSummary: 'buffer-posts-analytics-csv/average-performance-statistics-20260101-to-20261001.csv',
  brandId: 'pocari-sweat',
  reportingPeriodStart: '2026-01-01',
  reportingPeriodEnd: '2026-10-01',
  timezone: 'UTC',
  identityRule: 'The export has no account identifier. It is configured as Pocari Sweat because all five supplied captions identify Pocari Sweat; it is never combined with Union Coop.',
  summaryRule: 'Use posts-summary for the displayed paid account totals because its reach, comments, and supplied engagement rate share one row. Keep performance-statistics as a source control and report its conflicting reach without combining or selecting the larger value.',
} as const;

export const creativeBenchmarks = {
  organicFrequency: { bad: 1, good: 2 },
  organicWatchSeconds: { bad: 2, good: 8 },
  organicEngagementRate: { bad: 0.005, good: 0.05 },
  paidCtr: { bad: 0.005, good: 0.025 },
  paidVtr: { bad: 0.01, good: 0.1 },
  paidEngagementRate: { bad: 0.0002, good: 0.002 },
  googleProductCtr: { bad: 0.01, good: 0.06 },
} as const;

export interface CompetitionMixRow { label: string; count: number; percentage: number }

export interface CompetitionScreenshot {
  ref: string;
  assetFile: string;
  assetUrl: string;
  libraryIds: string[];
  multiAd: boolean;
  associationVerified: boolean;
}

export interface CompetitionObservation {
  competitorId: string;
  competitor: string;
  clientId: string;
  clientLabel: string;
  metaPage: string;
  libraryId: string;
  captureDate: string;
  startDate: string;
  suppliedDaysRunning: number | null;
  calculatedDaysRunning: number;
  daysRunningDiscrepancy: boolean;
  status: string;
  platforms: string;
  format: string;
  formatGroup: string;
  theme: string | null;
  themeGroup: string | null;
  featuredBrandProduct: string | null;
  adText: string | null;
  clickDestination: string | null;
  language: string | null;
  screenshotRef: string | null;
  screenshot: CompetitionScreenshot | null;
  sourceFile: string;
  sourceSheet: string;
  sourceRow: number;
}

export interface CompetitionOptions {
  years: Array<{ year: number; months: Array<{ month: number; label: string; captureDates: string[]; captureDatesByCompetitor: Record<string, string[]> }> }>;
  competitors: Array<{ id: string; clientId: string; label: string; clientLabel: string; metaPage: string; dataReceived: boolean }>;
  defaultSelection: { year: number; month: number; competitor: string; captureDate: string } | null;
}

export interface CompetitionDashboard {
  available: boolean;
  availabilityMessage: 'Data not received' | null;
  sourceLabel: 'Source: Meta Ad Library. Activity, not spend.';
  filter: { year: number; month: number; competitor: string; captureDate: string | null };
  competitor: { id: string; label: string; clientId: string; clientLabel: string; metaPage: string; website: string | null };
  capture: { date: string | null; availableDates: string[]; allAvailableDates: string[]; matchesReportingPeriod: boolean; sourceFile: string | null; firstCapture: boolean };
  activity: {
    activeAds: number | null;
    averageDaysRunning: number | null;
    historicalTrend: Array<{ captureDate: string; activeAds: number }> | null;
    firstObservedAds: number | null;
    noLongerObservedAds: number | null;
  };
  launches: {
    startedInSelectedMonth: number | null;
    startedOnSeptember28Or29: number | null;
    firstObservedAds: number | null;
    groups: Array<{ startDate: string; count: number }>;
  };
  longestRunning: CompetitionObservation[];
  formatMix: CompetitionMixRow[];
  languageMix: CompetitionMixRow[];
  themeMix: CompetitionMixRow[];
  observations: CompetitionObservation[];
  screenshots: CompetitionScreenshot[];
  audit: {
    sourceRows: number;
    acceptedRows: number;
    malformedRows: number;
    duplicateRows: number;
    conflictingDuplicateRows: number;
    daysRunningDiscrepancies: number;
    verifiedScreenshotAssociations: number;
    unverifiedScreenshotAssociations: number;
  } | null;
  historyNote: string;
}

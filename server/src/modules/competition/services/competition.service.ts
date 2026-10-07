import { activeObservations, averageDays, firstObserved, mixBy, noLongerObserved } from '../calculations/competition-calculations.js';
import { competitionConfigs, COMPETITION_SOURCE_LABEL } from '../config/competition.config.js';
import { parseCompetitionSources } from '../import/competition-source-parser.js';
import { resolveCompetitionAssetDirectory } from '../import/competition-source-parser.js';
import { persistCompetitionDataset } from '../repositories/competition.repository.js';
import type {
  CompetitionDashboard,
  CompetitionFilter,
  CompetitionOptions,
  CompetitionSourceDataset,
} from '../types/competition.types.js';

let sourceCache: CompetitionSourceDataset | null = null;

export function competitionSourceDataset(): CompetitionSourceDataset {
  sourceCache ??= parseCompetitionSources();
  return sourceCache;
}

export function clearCompetitionSourceCache(): void {
  sourceCache = null;
}

export async function syncCompetitionSources(): Promise<void> {
  await persistCompetitionDataset(competitionSourceDataset());
}

export function getCompetitionOptions(clientId?: string): CompetitionOptions {
  const dataset = competitionSourceDataset();
  const configs = clientId ? competitionConfigs.filter((config) => config.clientId === clientId) : competitionConfigs;
  const allowedIds = new Set(configs.map((config) => config.id));
  const scopedCaptures = dataset.captures.filter((capture) => allowedIds.has(capture.competitorId));
  const periodMap = new Map<number, Map<number, Set<string>>>();
  for (const capture of scopedCaptures) {
    const [year, month] = capture.captureDate.split('-').map(Number);
    if (!year || !month) continue;
    if (!periodMap.has(year)) periodMap.set(year, new Map());
    const months = periodMap.get(year) as Map<number, Set<string>>;
    if (!months.has(month)) months.set(month, new Set());
    months.get(month)?.add(capture.captureDate);
  }
  const years = [...periodMap.entries()].sort(([left], [right]) => right - left).map(([year, months]) => ({
    year,
    months: [...months.entries()].sort(([left], [right]) => right - left).map(([month, captureDates]) => ({
      month,
      label: new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1))),
      captureDates: [...captureDates].sort().reverse(),
      captureDatesByCompetitor: Object.fromEntries(configs.map((config) => [
        config.id,
        scopedCaptures
          .filter((capture) => capture.competitorId === config.id && capture.captureDate.startsWith(`${year}-${String(month).padStart(2, '0')}-`))
          .map((capture) => capture.captureDate)
          .sort()
          .reverse(),
      ])),
    })),
  }));
  const latest = [...scopedCaptures].sort((left, right) => left.captureDate.localeCompare(right.captureDate)).at(-1);
  return {
    years,
    competitors: configs.map((config) => ({
      id: config.id,
      clientId: config.clientId,
      label: config.label,
      clientLabel: config.clientLabel,
      metaPage: config.metaPage,
      dataReceived: dataset.captures.some((capture) => capture.competitorId === config.id),
    })),
    defaultSelection: latest ? {
      year: Number(latest.captureDate.slice(0, 4)),
      month: Number(latest.captureDate.slice(5, 7)),
      competitor: latest.competitorId,
      captureDate: latest.captureDate,
    } : null,
  };
}

export function getCompetitionDashboard(filter: CompetitionFilter): CompetitionDashboard {
  const dataset = competitionSourceDataset();
  const options = getCompetitionOptions();
  const defaults = options.defaultSelection;
  const selectedCompetitor = competitionConfigs.find((config) => config.id === filter.competitor)
    ?? competitionConfigs.find((config) => config.id === defaults?.competitor)
    ?? competitionConfigs[0];
  if (!selectedCompetitor) throw new Error('No Competition configuration is available.');
  const allCompetitorCaptures = dataset.captures
    .filter((capture) => capture.competitorId === selectedCompetitor.id)
    .sort((left, right) => left.captureDate.localeCompare(right.captureDate));
  const latestCompetitorCapture = allCompetitorCaptures.at(-1);
  const year = filter.year ?? Number(latestCompetitorCapture?.captureDate.slice(0, 4) ?? defaults?.year ?? new Date().getUTCFullYear());
  const month = filter.month ?? Number(latestCompetitorCapture?.captureDate.slice(5, 7) ?? defaults?.month ?? 1);
  const reportingPrefix = `${year}-${String(month).padStart(2, '0')}-`;
  const matchingCaptures = allCompetitorCaptures.filter((capture) => capture.captureDate.startsWith(reportingPrefix));
  const selectedCapture = filter.captureDate
    ? allCompetitorCaptures.find((capture) => capture.captureDate === filter.captureDate)
    : matchingCaptures.at(-1);
  const base = {
    sourceLabel: COMPETITION_SOURCE_LABEL,
    filter: { year, month, competitor: selectedCompetitor.id, captureDate: selectedCapture?.captureDate ?? null },
    competitor: {
      id: selectedCompetitor.id,
      label: selectedCompetitor.label,
      clientId: selectedCompetitor.clientId,
      clientLabel: selectedCompetitor.clientLabel,
      metaPage: selectedCompetitor.metaPage,
      website: selectedCompetitor.website,
    },
    capture: {
      date: selectedCapture?.captureDate ?? null,
      availableDates: matchingCaptures.map((capture) => capture.captureDate).reverse(),
      allAvailableDates: allCompetitorCaptures.map((capture) => capture.captureDate).reverse(),
      matchesReportingPeriod: selectedCapture?.captureDate.startsWith(reportingPrefix) ?? false,
      sourceFile: selectedCapture?.sourceFile ?? null,
      firstCapture: false,
    },
  };

  if (!selectedCapture) return unavailableDashboard(base);

  const earlier = allCompetitorCaptures.filter((capture) => capture.captureDate < selectedCapture.captureDate);
  const previous = earlier.at(-1);
  const active = activeObservations(selectedCapture);
  const firstObservedIds = firstObserved(selectedCapture, earlier);
  const noLongerIds = noLongerObserved(selectedCapture, previous);
  const historicalTrend = allCompetitorCaptures.length > 1
    ? allCompetitorCaptures.filter((capture) => capture.captureDate <= selectedCapture.captureDate).map((capture) => ({
        captureDate: capture.captureDate,
        activeAds: activeObservations(capture).length,
      }))
    : null;
  const selectedPeriodPrefix = reportingPrefix;
  const launchCounts = new Map<string, number>();
  for (const row of active) launchCounts.set(row.startDate, (launchCounts.get(row.startDate) ?? 0) + 1);

  return {
    ...base,
    available: true,
    availabilityMessage: null,
    capture: { ...base.capture, firstCapture: earlier.length === 0 },
    activity: {
      activeAds: active.length,
      averageDaysRunning: averageDays(active),
      historicalTrend,
      firstObservedAds: firstObservedIds?.length ?? null,
      noLongerObservedAds: noLongerIds?.length ?? null,
    },
    launches: {
      startedInSelectedMonth: active.filter((row) => row.startDate.startsWith(selectedPeriodPrefix)).length,
      startedOnSeptember28Or29: active.filter((row) => ['2026-09-28', '2026-09-29'].includes(row.startDate)).length,
      firstObservedAds: firstObservedIds?.length ?? null,
      groups: [...launchCounts.entries()].map(([startDate, count]) => ({ startDate, count })).sort((left, right) => right.startDate.localeCompare(left.startDate)),
    },
    longestRunning: [...active]
      .sort((left, right) => right.calculatedDaysRunning - left.calculatedDaysRunning || left.libraryId.localeCompare(right.libraryId))
      .slice(0, 3),
    formatMix: mixBy(active, (row) => row.formatGroup),
    languageMix: mixBy(active, (row) => row.language),
    themeMix: mixBy(active, (row) => row.themeGroup),
    observations: [...active].sort((left, right) => right.startDate.localeCompare(left.startDate) || left.libraryId.localeCompare(right.libraryId)),
    screenshots: selectedCapture.screenshots,
    audit: selectedCapture.audit,
    historyNote: earlier.length
      ? 'First observed compares this capture with all earlier captures. No longer observed means absent from the previous capture; it does not confirm inactivity.'
      : 'This is the first stored capture. Earlier-running ads are not labelled as new launches, and historical trend is not available yet.',
  };
}

function unavailableDashboard(base: Omit<CompetitionDashboard, 'available' | 'availabilityMessage' | 'activity' | 'launches' | 'longestRunning' | 'formatMix' | 'languageMix' | 'themeMix' | 'observations' | 'screenshots' | 'audit' | 'historyNote'>): CompetitionDashboard {
  return {
    ...base,
    available: false,
    availabilityMessage: 'Data not received',
    activity: { activeAds: null, averageDaysRunning: null, historicalTrend: null, firstObservedAds: null, noLongerObservedAds: null },
    launches: { startedInSelectedMonth: null, startedOnSeptember28Or29: null, firstObservedAds: null, groups: [] },
    longestRunning: [],
    formatMix: [],
    languageMix: [],
    themeMix: [],
    observations: [],
    screenshots: [],
    audit: null,
    historyNote: 'No capture was supplied for this competitor and capture period.',
  };
}

export function findCaptureAsset(competitorId: string, captureDate: string, assetFile: string): { directory: string; file: string } | null {
  if (!/^[a-z0-9-]+$/.test(competitorId) || !/^\d{4}-\d{2}-\d{2}$/.test(captureDate) || !/^screenshot-\d+\.(png|jpe?g|webp)$/i.test(assetFile)) return null;
  const capture = competitionSourceDataset().captures.find((item) => item.competitorId === competitorId && item.captureDate === captureDate);
  if (!capture?.screenshots.some((screenshot) => screenshot.assetFile === assetFile)) return null;
  const sourceDirectory = resolveCompetitionAssetDirectory().replace(/\\/g, '/');
  return { directory: `${sourceDirectory}/${competitorId}/${captureDate}`, file: assetFile };
}

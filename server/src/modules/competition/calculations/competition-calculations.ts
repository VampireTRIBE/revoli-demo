import type { CompetitionCapture, CompetitionObservation, MixRow } from '../types/competition.types.js';

const DAY_MS = 86_400_000;

export function dateOnlyDifference(later: string, earlier: string): number {
  const laterMs = Date.parse(`${later}T00:00:00Z`);
  const earlierMs = Date.parse(`${earlier}T00:00:00Z`);
  if (!Number.isFinite(laterMs) || !Number.isFinite(earlierMs)) throw new Error(`Invalid date pair: ${earlier} to ${later}`);
  return Math.round((laterMs - earlierMs) / DAY_MS);
}

export function mixBy<T>(rows: T[], selector: (row: T) => string | null): MixRow[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = selector(row);
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count, percentage: total ? count / total : 0 }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

export function activeObservations(capture: CompetitionCapture): CompetitionObservation[] {
  const unique = new Map<string, CompetitionObservation>();
  for (const row of capture.observations) {
    if (row.status.trim().toLowerCase() === 'active' && !unique.has(row.libraryId)) unique.set(row.libraryId, row);
  }
  return [...unique.values()];
}

export function averageDays(rows: CompetitionObservation[]): number | null {
  const eligible = rows.filter((row) => Number.isFinite(row.calculatedDaysRunning) && row.calculatedDaysRunning >= 0);
  if (!eligible.length) return null;
  return eligible.reduce((sum, row) => sum + row.calculatedDaysRunning, 0) / eligible.length;
}

export function firstObserved(current: CompetitionCapture, earlier: CompetitionCapture[]): string[] | null {
  if (!earlier.length) return null;
  const seen = new Set(earlier.flatMap((capture) => capture.observations.map((row) => row.libraryId)));
  return [...new Set(current.observations.map((row) => row.libraryId))].filter((id) => !seen.has(id));
}

export function noLongerObserved(current: CompetitionCapture, previous: CompetitionCapture | undefined): string[] | null {
  if (!previous) return null;
  const currentIds = new Set(current.observations.map((row) => row.libraryId));
  return [...new Set(previous.observations.map((row) => row.libraryId))].filter((id) => !currentIds.has(id));
}

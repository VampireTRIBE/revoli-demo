import type { MediaPeriod } from '../types/media.types.js';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function parsePeriod(label: string, partial = false): MediaPeriod | null {
  const cleaned = label.trim();
  const match = cleaned.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(20\d{2})/i);
  if (!match?.[1] || !match[2]) return null;
  const month = MONTHS.findIndex((name) => name.toLowerCase().startsWith(match[1]!.toLowerCase())) + 1;
  const year = Number(match[2]);
  if (!month || !year) return null;
  const endDay = partial && month === 9 && year === 2026 ? 10 : new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    year,
    month,
    monthLabel: MONTHS[month - 1] ?? cleaned,
    periodKey: `${year}-${String(month).padStart(2, '0')}`,
    periodStart: `${year}-${String(month).padStart(2, '0')}-01`,
    periodEnd: `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
    isPartialPeriod: partial,
    sourcePeriodLabel: cleaned,
  };
}

export function periodFromMonthName(month: string, knownPeriods: MediaPeriod[]): MediaPeriod | null {
  return knownPeriods.find((period) => period.monthLabel.toLowerCase().startsWith(month.toLowerCase().slice(0, 3))) ?? null;
}

export function monthName(month: number): string {
  return MONTHS[month - 1] ?? `Month ${month}`;
}

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import XLSX from 'xlsx';
import { getOverview } from '../../media/services/media-analytics.service.js';
import type { ConsumerCohortRow, ConsumerDashboard, ConsumerMonthRow } from '../types/consumer.types.js';

const SOURCE_FILE = 'Rivoli-Consumer-Import.xlsx';
let cache: { series: ConsumerMonthRow[]; cohorts: ConsumerCohortRow[] } | null = null;

function numeric(value: unknown): number { const result = Number(value); return Number.isFinite(result) ? result : 0; }
function nullableNumeric(value: unknown): number | null { if (value == null || String(value).trim() === '') return null; const result = Number(value); return Number.isFinite(result) ? result : null; }
function monthParts(value: unknown): { year: number; month: number } | null {
  const match = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i.exec(String(value ?? '').trim());
  if (!match) return null;
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  return { year: Number(match[2]), month: months.indexOf(match[1]!.toLowerCase()) + 1 };
}
function sourcePath(): string {
  const candidates = [resolve(process.cwd(), 'spreadsheets data/consumer-tab', SOURCE_FILE), resolve(process.cwd(), '../spreadsheets data/consumer-tab', SOURCE_FILE)];
  const path = candidates.find(existsSync); if (!path) throw new Error(`Consumer workbook not found. Checked: ${candidates.join(', ')}`); return path;
}
function load() {
  if (cache) return cache;
  const workbook = XLSX.readFile(sourcePath(), { cellDates: false });
  const monthlySheet = workbook.Sheets['Monthly Series (import)'];
  const cohortSheet = workbook.Sheets['Cohort Matrix (import)'];
  if (!monthlySheet || !cohortSheet) throw new Error('Consumer workbook is missing a required import sheet.');
  const monthlyRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(monthlySheet, { defval: null, raw: true });
  const series = monthlyRows.flatMap((row): ConsumerMonthRow[] => {
    const parts = monthParts(row.Month); if (!parts) return [];
    return [{ ...parts, label: String(row.Month), firstTimePurchasers: numeric(row['First-time purchasers']), deltaVsPreviousMonth: nullableNumeric(row['Delta vs prev month']), monthlyBuyers: numeric(row['Monthly buyers (cohort size)']), observedRepeatBuyers: numeric(row['Observed repeat buyers (from this cohort, later months)']), observedRepeatPercent: numeric(row['Observed repeat % of cohort']), partial: String(row['Partial month flag'] ?? '').toUpperCase() === 'PARTIAL' }];
  });
  const cohortRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(cohortSheet, { defval: null, raw: true });
  const cohorts = cohortRows.flatMap((row): ConsumerCohortRow[] => monthParts(row['Cohort (month of purchase)']) ? [{ cohort: String(row['Cohort (month of purchase)']), cohortSize: numeric(row['Cohort size (buyers)']), repeatByMonth: ['+1 mo','+2 mo','+3 mo','+4 mo','+5 mo','+6 mo','+7 mo','+8 mo'].map((key) => nullableNumeric(row[key])), totalRepeatObserved: numeric(row['Total repeat observed']), repeatPercent: numeric(row['Repeat % of cohort']) }] : []);
  cache = { series, cohorts }; return cache;
}

export function getConsumerOptions() {
  const { series } = load();
  const years = [...new Set(series.map((row) => row.year))].sort((a,b)=>b-a).map((year) => ({ year, months: [{ month: 0, label: 'All months', partial: false }, ...series.filter((row)=>row.year===year).map((row)=>({ month: row.month, label: row.label.replace(` ${year}`, ''), partial: row.partial }))] }));
  return { years, defaultSelection: years[0] ? { year: years[0].year, month: 0 } : null };
}

export async function getConsumerDashboard(year: number, month: number): Promise<ConsumerDashboard> {
  const { series, cohorts } = load();
  const yearRows = series.filter((row) => row.year === year);
  const selected = month === 0 ? null : yearRows.find((row) => row.month === month) ?? null;
  const full = yearRows.filter((row) => !row.partial);
  const totalIntake = full.reduce((sum,row)=>sum+row.firstTimePurchasers,0);
  const totalBuyers = full.reduce((sum,row)=>sum+row.monthlyBuyers,0);
  const totalRepeat = full.reduce((sum,row)=>sum+row.observedRepeatBuyers,0);
  const biggestMover = full.filter((row)=>row.deltaVsPreviousMonth != null).sort((a,b)=>Math.abs(b.deltaVsPreviousMonth ?? 0)-Math.abs(a.deltaVsPreviousMonth ?? 0))[0] ?? null;
  const aligned = await Promise.all(full.map(async (row) => {
    try { const overview = await getOverview({ year: row.year, month: row.month }); return { year: row.year, month: row.month, label: row.label, mediaSpendAed: overview.metrics.totalSpend, firstTimePurchasers: row.firstTimePurchasers }; }
    catch { return { year: row.year, month: row.month, label: row.label, mediaSpendAed: null, firstTimePurchasers: row.firstTimePurchasers }; }
  }));
  return {
    filter: { year, month }, periodLabel: month === 0 ? `Jan-Aug ${year} full months` : selected?.label ?? `${year}-${String(month).padStart(2,'0')}`,
    partial: selected?.partial ?? false, sourceFile: SOURCE_FILE,
    cards: { customerBase: selected?.monthlyBuyers ?? totalBuyers, newCustomerIntake: selected?.firstTimePurchasers ?? totalIntake, intakeDelta: selected?.partial ? null : selected?.deltaVsPreviousMonth ?? null, repeatBuyingShare: selected?.observedRepeatPercent ?? (totalBuyers > 0 ? totalRepeat / totalBuyers : null), considerationWindow: 0.321, visitorRetention: null, trueRepeatAndValue: null },
    series: yearRows, cohorts, biggestMover, aligned,
    limitations: ['September is partial and excluded from deltas, flags, and comparisons.', 'Visitor-retention Day-1/Day-7/Day-30 values are not supplied in the import workbook.', 'First-touch purchase-channel data is not supplied, so the channel-alignment pair is unavailable.', 'True repeat purchase and customer-value metrics await the Thirty31North order export.'],
  };
}

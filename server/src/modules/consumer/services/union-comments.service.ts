import { existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import XLSX from 'xlsx';

type CommentCategory = 'Contest entries' | 'Product questions' | 'Complaints' | 'Praise';
const CATEGORIES: CommentCategory[] = ['Contest entries', 'Product questions', 'Complaints', 'Praise'];
const SOURCE_NAMES = [
  'UnionCoop-Comment-Types-Import.xlsx',
  'UnionCoop-Comment-Types-Import.csv',
  'UnionCoop-Comment-Type-Export.xlsx',
  'UnionCoop-Comment-Type-Export.csv',
];
const lookup = (row: Record<string, unknown>, ...names: string[]): unknown => {
  const keys = Object.keys(row);
  const key = keys.find((k) => names.some((name) => k.trim().toLowerCase() === name.toLowerCase()));
  return key === undefined ? undefined : row[key];
};
function sourceFile(): string | null {
  for (const root of [process.cwd(), resolve(process.cwd(), '..')]) {
    for (const name of SOURCE_NAMES) {
      const candidate = resolve(root, 'spreadsheets data/consumer/union-coop', name);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}
function parsePeriod(value: unknown): string | null {
  const raw = String(value ?? '').trim();
  const iso = /^(20\d{2})[-/](0?[1-9]|1[0-2])(?:[-/]\d{1,2})?$/.exec(raw);
  if (iso) return `${iso[1]}-${String(Number(iso[2])).padStart(2, '0')}`;
  const words = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[ -](20\d{2})$/i.exec(raw);
  if (words) {
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    return `${words[2]}-${String(months.indexOf(words[1]!.slice(0, 3).toLowerCase()) + 1).padStart(2, '0')}`;
  }
  return null;
}
function count(value: unknown): number | null {
  if (value == null || String(value).trim() === '') return null;
  const numeric = Number(String(value).replaceAll(',', '').trim());
  return Number.isSafeInteger(numeric) && numeric >= 0 ? numeric : null;
}
function normalizeCategory(value: unknown): CommentCategory | null {
  const key = String(value ?? '').toLowerCase().replace(/[_\-]/g, ' ').trim();
  if (/^(contest entries|contest entry|giveaway entries)$/.test(key)) return 'Contest entries';
  if (/^(product questions|product question|questions about products)$/.test(key)) return 'Product questions';
  if (/^(complaints|complaint)$/.test(key)) return 'Complaints';
  if (/^(praise|compliments|positive feedback)$/.test(key)) return 'Praise';
  return null;
}
/** An optional, analyst-prepared monthly import. Nothing is inferred from social comments. */
export function getUnionCoopCommentTypes(year: number, month: number) {
  const file = sourceFile();
  const awaiting = (reason: string) => ({available: false, year, month, sourceFile: file ? basename(file) : SOURCE_NAMES[0]!, reason, categories: [] as Array<{category: CommentCategory; count: number}>, total: null as number | null});
  if (!file) return awaiting('Union Coop monthly comment-type export is not supplied. Required: period, category and verified count.');
  if (!month) return awaiting('Select a month to view verified comment categories. All-month aggregation is not approved.');
  const workbook = XLSX.readFile(file, {cellDates: false});
  const sheet = workbook.Sheets['Comment Types'] ?? workbook.Sheets['Monthly Counts'] ?? workbook.Sheets[workbook.SheetNames[0] ?? ''];
  if (!sheet) return awaiting('Comment-type workbook has no readable import sheet.');
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {defval: null, raw: true});
  const target = `${year}-${String(month).padStart(2, '0')}`;
  const values = new Map<CommentCategory, number>();
  for (const row of rows) {
    const period = parsePeriod(lookup(row, 'Month', 'Period', 'Report month', 'Date'));
    if (period !== target) continue;
    const category = normalizeCategory(lookup(row, 'Category', 'Comment type', 'Type'));
    if (category) {
      const numeric = count(lookup(row, 'Count', 'Comments', 'Total'));
      if (numeric == null || values.has(category)) return awaiting(`Invalid or duplicate ${category} count in approved import.`);
      values.set(category, numeric);
    } else {
      for (const name of CATEGORIES) {
        const numeric = count(lookup(row, name));
        if (numeric != null) {
          if (values.has(name)) return awaiting(`Duplicate ${name} count in approved import.`);
          values.set(name, numeric);
        }
      }
    }
  }
  if (CATEGORIES.some((name) => !values.has(name))) {
    return awaiting(`Source is present, but ${target} does not have all four verified comment categories. Missing counts are not zero.`);
  }
  const categories = CATEGORIES.map((category) => ({category, count: values.get(category)!}));
  return {available: true, year, month, sourceFile: basename(file), reason: null, categories, total: categories.reduce((sum, row) => sum + row.count, 0)};
}

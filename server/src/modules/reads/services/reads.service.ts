import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import XLSX from 'xlsx';
import type { TblRead, TblReadsResponse } from '../types/reads.types.js';

const SOURCE_FILES = ['TBL-Highlights-Import-v2.xlsx', 'TBL-Reads-Signed-Import.xlsx', 'TBL-Reads-Import-Template-and-First-Fill.xlsx', 'TBL-Reads-Import-Template-and-First-Fill (1).xlsx', 'TBL-Reads-Import.xlsx'] as const;
let selectedSource = 'TBL-Reads-Import.xlsx';
let cache: TblRead[] | null = null;
let firstFill: TblRead[] = [];
let cacheKey = '';

function sourcePath(): string | undefined {
  const candidates = SOURCE_FILES.flatMap((name)=>[resolve(process.cwd(), 'spreadsheets data', 'highlights', 'tbl', name), resolve(process.cwd(), '..', 'spreadsheets data', 'highlights', 'tbl', name)]);
  const path = candidates.find(existsSync);
  if (path) selectedSource = SOURCE_FILES.find((name)=>path.endsWith(name)) ?? selectedSource;
  return path;
}

function load(): TblRead[] {
  const file = sourcePath();
  if (!file) { cache = null; firstFill = []; cacheKey = ''; return []; }
  const key = `${file}:${statSync(file).mtimeMs}`;
  if (cache && cacheKey === key) return cache;
  const workbook = XLSX.readFile(file, { cellDates: false });
  const sheet = workbook.Sheets.Reads;
  if (!sheet) throw new Error('TBL Reads workbook is missing the Reads sheet.');
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: true });
  firstFill = [];
  cache = rows.flatMap((row) => {
    const section = String(row.Tab ?? row.Section ?? '').trim() as TblRead['section'];
    const bullet = String(row.Bullet ?? row.Sentence ?? '').trim();
    // Editorial text must be explicitly signed. Legacy imported text without a
    // signed status is not automatically approved for client publication.
    const signed = String(row.Signed ?? row.Approved ?? row['Signed flag'] ?? row['Approval status'] ?? row.Status ?? '').trim().toLowerCase();
    const order = Number(row.Order ?? 1);
    if (!['Media', 'Creative', 'Consumer', 'Competition'].includes(section) || !bullet || !Number.isFinite(order)) return [];
    const record: TblRead = {
      client: String(row.Client ?? '').trim(), section, period: String(row.Period ?? '').trim(), order,
      bullet, linkedCard: String(row['Linked card'] ?? row['Section label'] ?? (row.Tab ? row.Section : '') ?? '').trim(), author: String(row.Author ?? '').trim(),
      dateWritten: String(row['Date written'] ?? '').slice(0, 10), sourceFile: selectedSource, sourceSheet: 'Reads' as const,
    };
    if (!['yes','signed','approved','true','1'].includes(signed)) {
      // The delivered first-fill Read Me authorizes authored tab-level reads.
      // It does NOT provide explicit sign-off for section or competition highlights.
      if (!signed && /^TBL-Reads-Import-Template-and-First-Fill(?: \(1\))?\.xlsx$/i.test(selectedSource) && section !== 'Competition' && /^TBL\b/i.test(record.author) && record.dateWritten) firstFill.push(record);
      return [];
    }
    return [record];
  });
  cacheKey = key;
  return cache;
}

export function getTblReads(client: string, section: TblRead['section'], year: number, month: number): TblReadsResponse {
  const period = month === 0 ? `ALL ${year}` : `${year}-${String(month).padStart(2, '0')}`;
  const reads = load().filter((row) => row.client.toLowerCase() === client.toLowerCase() && row.section === section && row.period === period).sort((a, b) => a.order - b.order);
  const context=firstFill.filter(row=>row.client.toLowerCase()===client.toLowerCase()&&row.section===section);
  const exact=context.filter(row=>row.period===period);
  const legacy=(exact.length?exact:context.filter(row=>row.period===`ALL ${year}`)).sort((a,b)=>a.order-b.order).slice(0,3);
  return { client, section, period, reads, firstFill:legacy, firstFillPeriod:legacy[0]?.period, pending: reads.length === 0, sourceFile: selectedSource };
}

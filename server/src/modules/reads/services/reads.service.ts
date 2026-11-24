import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import XLSX from 'xlsx';
import type { TblRead, TblReadsResponse } from '../types/reads.types.js';

const SOURCE_FILES = ['TBL-Reads-Signed-Import.xlsx', 'TBL-Reads-Import-Template-and-First-Fill.xlsx', 'TBL-Reads-Import-Template-and-First-Fill (1).xlsx', 'TBL-Reads-Import.xlsx'] as const;
let selectedSource = 'TBL-Reads-Import.xlsx';
let cache: TblRead[] | null = null;

function sourcePath(): string {
  const candidates = SOURCE_FILES.flatMap((name)=>[resolve(process.cwd(), 'spreadsheets data', name), resolve(process.cwd(), '..', 'spreadsheets data', name)]);
  const path = candidates.find(existsSync);
  if (path) selectedSource = SOURCE_FILES.find((name)=>path.endsWith(name)) ?? selectedSource;
  if (!path) throw new Error(`TBL Reads workbook not found. Checked: ${candidates.join(', ')}`);
  return path;
}

function load(): TblRead[] {
  if (cache) return cache;
  const workbook = XLSX.readFile(sourcePath(), { cellDates: false });
  const sheet = workbook.Sheets.Reads;
  if (!sheet) throw new Error('TBL Reads workbook is missing the Reads sheet.');
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: true });
  cache = rows.flatMap((row) => {
    const section = String(row.Section ?? '').trim() as TblRead['section'];
    const bullet = String(row.Bullet ?? row.Sentence ?? '').trim();
    // Editorial text must be explicitly signed. Legacy imported text without a
    // signed status is not automatically approved for client publication.
    const signed = String(row.Signed ?? row.Approved ?? row['Signed flag'] ?? row['Approval status'] ?? row.Status ?? '').trim().toLowerCase();
    if (!['yes','signed','approved','true','1'].includes(signed)) return [];
    const order = Number(row.Order);
    if (!['Media', 'Creative', 'Consumer', 'Competition'].includes(section) || !bullet || !Number.isFinite(order)) return [];
    return [{
      client: String(row.Client ?? '').trim(), section, period: String(row.Period ?? '').trim(), order,
      bullet, linkedCard: String(row['Linked card'] ?? '').trim(), author: String(row.Author ?? '').trim(),
      dateWritten: String(row['Date written'] ?? '').slice(0, 10), sourceFile: selectedSource, sourceSheet: 'Reads' as const,
    }];
  });
  return cache;
}

export function getTblReads(client: string, section: TblRead['section'], year: number, month: number): TblReadsResponse {
  const period = month === 0 ? `ALL ${year}` : `${year}-${String(month).padStart(2, '0')}`;
  const reads = load().filter((row) => row.client.toLowerCase() === client.toLowerCase() && row.section === section && row.period === period).sort((a, b) => a.order - b.order).slice(0, 3);
  return { client, section, period, reads, pending: reads.length === 0, sourceFile: selectedSource };
}

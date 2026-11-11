import { existsSync, readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import XLSX from 'xlsx';
import type { CleoCitationDomain, CleoEnginePosition, CleoFunnelStage, CleoPhrase, CleoQuestion, CleoSnapshot, CleoTopic } from './cleo.types.js';

const SOURCE_NAME = 'UnionCoop-CLEO-Market-Import.xlsx';
const SOURCE_PATTERN = /^UnionCoop-CLEO-Market-Import(?:-\d{4}-\d{2}-\d{2})?\.xlsx$/i;
const SOURCE_LABEL = 'Source: CLEO - single-source, not independently verifiable.' as const;
const SHEETS = ['README - Display Rules', 'Market Questions', 'Share of Voice by Topic', 'Position by Engine', 'Visibility Funnel', 'Citation Domains', 'Language of the Market'];
type RawRow = Record<string, unknown>;

export function resolveCleoDirectory(): string {
  const candidates = [resolve(process.cwd(), 'spreadsheets data', 'creative-tab'), resolve(process.cwd(), '..', 'spreadsheets data', 'creative-tab')];
  const found = candidates.find(existsSync);
  if (!found) throw new Error(`CLEO source directory not found. Checked: ${candidates.join(', ')}`);
  return found;
}
function text(value: unknown): string { return String(value ?? '').trim(); }
function requiredText(value: unknown, field: string): string {
  const result = text(value);
  if (!result) throw new Error(`CLEO import missing ${field}`);
  return result;
}
function count(value: unknown, field: string): number {
  const result = Number(value);
  if (value === '' || value == null || !Number.isFinite(result) || result < 0) throw new Error(`Invalid CLEO ${field}: ${text(value)}`);
  return result;
}
function optionalPosition(value: unknown): number | null {
  if (value == null || ['-', 'n/a', 'not cited', ''].includes(text(value).toLowerCase())) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid CLEO citation position: ${text(value)}`);
  return parsed;
}
function window(value: unknown, sheet: string): string { return requiredText(value, `${sheet} window`); }
function percentage(value: unknown, label: string, signed = false): string {
  const result = requiredText(value, label);
  if (!(signed ? /^[+-]?\d+(?:\.\d+)?%$/ : /^\d+(?:\.\d+)?%$/).test(result)) throw new Error(`Invalid CLEO ${label}: ${result}`);
  return result;
}
function date(value: unknown): string {
  const result = text(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(Date.parse(`${result}T00:00:00Z`)) || new Date(`${result}T00:00:00Z`).toISOString().slice(0, 10) !== result) throw new Error(`Invalid CLEO capture date: ${result}`);
  return result;
}
function metadata(rows: RawRow[], field: string, sheet: string, expectedDate: string): string {
  const values = [...new Set(rows.map((row) => window(row[field], sheet)))];
  if (values.length !== 1) throw new Error(`${sheet} contains inconsistent reporting windows: ${values.join(', ')}`);
  for (const row of rows) if (date(row['Capture date']) !== expectedDate) throw new Error(`${sheet} capture date differs from ${expectedDate}`);
  return values[0]!;
}
function worksheetRows(workbook: XLSX.WorkBook, sheetName: string): RawRow[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`CLEO workbook is missing required worksheet: ${sheetName}`);
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { raw: true, defval: null });
  return rows.filter((row) => Object.values(row).some((value) => value !== null && text(value) !== ''));
}
function records(rows: RawRow[], requiredColumn: string): RawRow[] {
  return rows.filter((row) => text(row[requiredColumn]) !== '' && !/^source:|^note:|^summary\s*\(|^what this is:|^how often|^lower is better|^supporting\s*\(/i.test(text(row[requiredColumn])));
}
export function parseCleoWorkbook(filePath: string): CleoSnapshot {
  const book = XLSX.readFile(filePath, { cellDates: false });
  for (const sheet of SHEETS) if (!book.Sheets[sheet]) throw new Error(`CLEO workbook is missing required worksheet: ${sheet}`);
  const marketRaw = worksheetRows(book, 'Market Questions');
  const topicRaw = worksheetRows(book, 'Share of Voice by Topic');
  const positionRaw = worksheetRows(book, 'Position by Engine');
  const funnelRaw = worksheetRows(book, 'Visibility Funnel');
  const domainRaw = worksheetRows(book, 'Citation Domains');
  const phraseRaw = worksheetRows(book, 'Language of the Market');
  const market = records(marketRaw, 'Question (as people ask AI)');
  const topicRows = records(topicRaw, 'Topic');
  const positionRows = records(positionRaw, 'Brand');
  const funnelRows = records(funnelRaw, 'Stage');
  const domainRows = records(domainRaw, 'Domain');
  const phraseRows = records(phraseRaw, 'Phrase AI searches for');
  if (!market.length || !topicRows.length || !positionRows.length || !funnelRows.length || !domainRows.length || !phraseRows.length) {
    throw new Error('CLEO workbook has empty required data sheets.');
  }
  const captureDate = date(market[0]!['Capture date']);
  const windows = {
    topics: metadata(topicRows, 'Window', 'Share of Voice by Topic', captureDate),
    questions: metadata(market, 'Window', 'Market Questions', captureDate),
    positions: metadata(positionRows, 'Window', 'Position by Engine', captureDate),
    funnel: metadata(funnelRows, 'Window', 'Visibility Funnel', captureDate),
    domains: metadata(domainRows, 'Window', 'Citation Domains', captureDate),
    language: metadata(phraseRows, 'Window', 'Language of the Market', captureDate),
  };
  const expectedWindows = { topics: '28 days', questions: '30 days', positions: '30 days', funnel: 'Latest week', domains: '90 days', language: '7 days' };
  for (const [sheet, expected] of Object.entries(expectedWindows)) {
    if (windows[sheet as keyof typeof windows] !== expected) throw new Error(`CLEO ${sheet} window must be ${expected}, got ${windows[sheet as keyof typeof windows]}`);
  }
  const topics: CleoTopic[] = topicRows.map((row) => {
    const topic = requiredText(row.Topic, 'topic');
    const other = count(row['Other %'], 'Other share');
    return {
      topic, answers: count(row['AI answers analysed'], 'AI answers analysed'),
      shares: {
        unionCoop: count(row['Union Coop %'], 'Union Coop share'), carrefour: count(row['Carrefour %'], 'Carrefour share'),
        lulu: count(row['LuLu %'], 'LuLu share'), spinneys: count(row['Spinneys %'], 'Spinneys share'),
        waitrose: count(row['Waitrose %'], 'Waitrose share'), other,
      },
      otherDisplay: topic.toLowerCase() === 'online grocery delivery' && other === 1 ? '<1%' : `${other}%`,
      leader: text(row['Leader and lead']), window: windows.topics,
    };
  });
  const allTopics = topics.find((row) => row.topic.toUpperCase() === 'ALL TOPICS');
  if (!allTopics) throw new Error('CLEO Share of Voice sheet is missing ALL TOPICS row.');
  const questions: CleoQuestion[] = market.map((row) => ({
    question: requiredText(row['Question (as people ask AI)'], 'question'), unionCoopPosition: requiredText(row['Union Coop position in answer'], 'position'),
    competitor: text(row['Top competitor cited']) === '-' ? null : text(row['Top competitor cited']) || null,
    competitorPosition: text(row['Their position']) === '-' ? null : text(row['Their position']) || null,
    unionCoopCitations: count(row['Union Coop citations'], 'Union Coop citations'), totalCitations: count(row['Total citations in answer'], 'total citations'),
    result: requiredText(row.Result, 'result'), window: windows.questions,
  }));
  const positions: CleoEnginePosition[] = positionRows.map((row) => ({
    brand: requiredText(row.Brand, 'brand'), googleAio: optionalPosition(row['Google AIO avg position']),
    perplexity: optionalPosition(row['Perplexity avg position']), claude: optionalPosition(row['Claude avg position']),
    chatgptSearch: optionalPosition(row['ChatGPT Search avg position']), window: windows.positions,
  }));
  const funnel: CleoFunnelStage[] = funnelRows.map((row) => ({
    stage: requiredText(row.Stage, 'stage'), count: count(row.Count, 'funnel count'),
    shareDisplay: percentage(row['Share of answers'], 'funnel share'), window: windows.funnel,
  }));
  for (const required of ['AI answers analysed', 'Union Coop mentioned', 'Union Coop cited (linked)', 'Union Coop recommended']) {
    if (!funnel.some((row) => row.stage === required)) throw new Error(`CLEO Visibility Funnel missing stage: ${required}`);
  }
  const domains: CleoCitationDomain[] = domainRows.map((row) => ({
    rank: count(row.Rank, 'domain rank'), domain: requiredText(row.Domain, 'domain'), citations: count(row.Citations, 'domain citations'),
    shareDisplay: percentage(row['Share of all citations'], 'domain share'), trendDisplay: percentage(row['Trend vs prior period'], 'domain trend', true), window: windows.domains,
  }));
  const language: CleoPhrase[] = phraseRows.map((row) => ({
    phrase: requiredText(row['Phrase AI searches for'], 'phrase'), searches: count(row['Searches containing it (7 days)'], 'phrase searches'),
    distinctQuestions: count(row['Distinct questions producing it'], 'distinct questions'), window: windows.language,
  }));
  const metaLine = (rows: RawRow[], field: string, regex: RegExp): string => rows.map((row) => text(row[field])).find((v) => regex.test(v)) ?? '';
  return {
    source: SOURCE_LABEL, sourceFile: basename(filePath), captureDate, availableCaptures: [captureDate], unscored: true,
    topics, allTopics, questions,
    questionSummary: metaLine(marketRaw, 'Question (as people ask AI)', /^Summary\s*\(/i),
    positions, engineSupport: metaLine(positionRaw, 'Brand', /^How often Union Coop is cited/i),
    funnel, funnelSupport: metaLine(funnelRaw, 'Stage', /^Supporting\s*\(/i),
    domains, language, windowLabels: windows,
    caveats: [
      'Single-source CLEO context; not independently verifiable or scored.',
      'The workbook says three appearances among 844 comparisons and zero wins; the brief incorrectly calls these three wins.',
      'Do not compare statistics across different reporting windows.',
    ],
  };
}

export function listCleoSnapshots(directory = resolveCleoDirectory()): CleoSnapshot[] {
  const fileNames = readdirSync(directory).filter((name) => SOURCE_PATTERN.test(name)).sort();
  const snapshots = fileNames.map((file) => parseCleoWorkbook(resolve(directory, file)));
  const byCapture = new Map<string, CleoSnapshot>();
  for (const snapshot of snapshots) {
    const existing = byCapture.get(snapshot.captureDate);
    if (existing && existing.sourceFile !== snapshot.sourceFile) throw new Error(`Two CLEO workbooks claim capture ${snapshot.captureDate}. Keep only one approved source.`);
    byCapture.set(snapshot.captureDate, snapshot);
  }
  const captures = [...byCapture.keys()].sort().reverse();
  return [...byCapture.values()].sort((a, b) => b.captureDate.localeCompare(a.captureDate)).map((snapshot) => ({ ...snapshot, availableCaptures: captures }));
}
export function getCleoSnapshot(captureDate?: string, directory?: string): CleoSnapshot | null {
  const captures = listCleoSnapshots(directory);
  if (!captures.length) return null;
  if (captureDate) return captures.find((row) => row.captureDate === captureDate) ?? null;
  return captures[0] ?? null;
}
export const defaultCleoImportName = SOURCE_NAME;

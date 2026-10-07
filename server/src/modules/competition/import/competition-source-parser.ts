import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import XLSX from 'xlsx';
import { dateOnlyDifference } from '../calculations/competition-calculations.js';
import {
  competitionConfigs,
  findCompetitionConfig,
  groupCompetitionFormat,
  groupCompetitionTheme,
} from '../config/competition.config.js';
import type {
  CompetitionCapture,
  CompetitionConfig,
  CompetitionObservation,
  CompetitionScreenshot,
  CompetitionSourceDataset,
} from '../types/competition.types.js';

type RawRow = Record<string, unknown>;

const REQUIRED_HEADERS = [
  'Capture date', 'Competitor', 'Meta page', 'Library ID', 'Start date', 'Status',
  'Platforms', 'Format', 'Theme', 'Language', 'Screenshot ref',
];

export function resolveCompetitionSourceDirectory(): string {
  const candidates = [
    path.resolve(process.cwd(), 'spreadsheets data', 'compititaion-tab'),
    path.resolve(process.cwd(), '..', 'spreadsheets data', 'compititaion-tab'),
  ];
  const directory = candidates.find(existsSync);
  if (!directory) throw new Error(`Competition source directory not found. Checked: ${candidates.join(', ')}`);
  return directory;
}

export function resolveCompetitionAssetDirectory(): string {
  return process.cwd().toLowerCase().endsWith(`${path.sep}server`)
    ? path.resolve(process.cwd(), 'data', 'competition-assets')
    : path.resolve(process.cwd(), 'server', 'data', 'competition-assets');
}

export function parseCompetitionSources(): CompetitionSourceDataset {
  const sourceDirectory = resolveCompetitionSourceDirectory();
  const files = listFiles(sourceDirectory).filter((file) => file.toLowerCase().endsWith('.xlsx'));
  const captures: CompetitionCapture[] = [];

  for (const file of files) {
    const matchedConfigs = competitionConfigs.filter((config) => config.workbookPattern.test(path.basename(file)));
    if (!matchedConfigs.length) continue;
    const workbook = XLSX.readFile(file, { cellDates: false, raw: false });
    const captureSheets = workbook.SheetNames.filter((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return false;
      const firstRow = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: null })[0] ?? [];
      const headers = firstRow.map((value) => String(value ?? '').trim());
      return REQUIRED_HEADERS.every((header) => headers.includes(header));
    });

    for (const sheetName of captureSheets) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { raw: false, defval: null });
      for (const config of matchedConfigs) {
        const configRows = rows.filter((row) => findCompetitionConfig(textValue(row['Competitor']) ?? '')?.id === config.id);
        if (!configRows.length) continue;
        captures.push(parseCapture(file, sheetName, configRows, config, workbook));
      }
    }
  }

  return { captures: captures.sort((left, right) => left.captureDate.localeCompare(right.captureDate)) };
}

function parseCapture(
  file: string,
  sheetName: string,
  rows: RawRow[],
  config: CompetitionConfig,
  workbook: XLSX.WorkBook,
): CompetitionCapture {
  const captureDate = dateValue(rows[0]?.['Capture date']);
  if (!captureDate) throw new Error(`Capture date is missing in ${path.basename(file)} / ${sheetName}.`);
  const screenshots = extractScreenshots(file, workbook, config.id, captureDate);
  const screenshotsByRef = new Map(screenshots.map((item) => [normalizeScreenshotRef(item.ref), item]));
  const observations: CompetitionObservation[] = [];
  const keys = new Map<string, CompetitionObservation>();
  let malformedRows = 0;
  let duplicateRows = 0;
  let conflictingDuplicateRows = 0;

  rows.forEach((row, index) => {
    const libraryId = textValue(row['Library ID']);
    const rowCaptureDate = dateValue(row['Capture date']);
    const startDate = dateValue(row['Start date']);
    const format = textValue(row['Format']);
    const status = textValue(row['Status']);
    if (!libraryId || !/^\d+$/.test(libraryId) || !rowCaptureDate || !startDate || !format || !status || rowCaptureDate !== captureDate) {
      malformedRows += 1;
      return;
    }
    const screenshotRef = textValue(row['Screenshot ref']);
    const screenshot = screenshotRef ? screenshotsByRef.get(normalizeScreenshotRef(screenshotRef)) ?? null : null;
    const calculatedDaysRunning = dateOnlyDifference(rowCaptureDate, startDate);
    const suppliedDaysRunning = numberValue(row['Days running']);
    const observation: CompetitionObservation = {
      competitorId: config.id,
      competitor: config.label,
      clientId: config.clientId,
      clientLabel: config.clientLabel,
      metaPage: textValue(row['Meta page']) ?? config.metaPage,
      libraryId,
      captureDate: rowCaptureDate,
      startDate,
      suppliedDaysRunning,
      calculatedDaysRunning,
      daysRunningDiscrepancy: suppliedDaysRunning != null && suppliedDaysRunning !== calculatedDaysRunning,
      status,
      platforms: textValue(row['Platforms']) ?? 'N/A',
      format,
      formatGroup: groupCompetitionFormat(config, format),
      theme: textValue(row['Theme']),
      themeGroup: groupCompetitionTheme(config, textValue(row['Theme'])),
      featuredBrandProduct: textValue(row['Featured brand / product']),
      adText: textValue(row['Ad text (short)']),
      clickDestination: safeDestination(textValue(row['Click destination'])),
      language: textValue(row['Language']),
      screenshotRef,
      screenshot: screenshot ? {
        ...screenshot,
        associationVerified: screenshot.libraryIds.includes(libraryId),
      } : null,
      sourceFile: path.basename(file),
      sourceSheet: sheetName,
      sourceRow: index + 2,
    };
    const key = `${config.id}|${rowCaptureDate}|${libraryId}`;
    const existing = keys.get(key);
    if (existing) {
      duplicateRows += 1;
      if (JSON.stringify(existing) !== JSON.stringify(observation)) conflictingDuplicateRows += 1;
      return;
    }
    keys.set(key, observation);
    observations.push(observation);
  });

  return {
    competitorId: config.id,
    competitor: config.label,
    clientId: config.clientId,
    clientLabel: config.clientLabel,
    metaPage: config.metaPage,
    captureDate,
    sourceFile: path.basename(file),
    observations,
    screenshots,
    audit: {
      sourceRows: rows.length,
      acceptedRows: observations.length,
      malformedRows,
      duplicateRows,
      conflictingDuplicateRows,
      daysRunningDiscrepancies: observations.filter((row) => row.daysRunningDiscrepancy).length,
      verifiedScreenshotAssociations: observations.filter((row) => row.screenshot?.associationVerified).length,
      unverifiedScreenshotAssociations: observations.filter((row) => row.screenshotRef && !row.screenshot?.associationVerified).length,
    },
  };
}

function extractScreenshots(
  file: string,
  workbook: XLSX.WorkBook,
  competitorId: string,
  captureDate: string,
): CompetitionScreenshot[] {
  const screenshotSheet = workbook.Sheets['Ad Screenshots'];
  if (!screenshotSheet) return [];
  const captionRows = XLSX.utils.sheet_to_json<unknown[]>(screenshotSheet, { header: 1, raw: false, defval: null })
    .map((row, index) => ({ text: textValue(row[0]), row: index + 1 }))
    .filter((entry): entry is { text: string; row: number } => Boolean(entry.text))
    .map(({ text, row }) => {
      const match = /^Screenshot\s+(\d+)\s+[^:]*:\s*(.+)$/i.exec(text);
      return match ? { ref: `screenshot ${match[1]}`, row, libraryIds: (match[2] ?? '').split(',').map((id) => id.trim()).filter(Boolean) } : null;
    })
    .filter((entry): entry is { ref: string; row: number; libraryIds: string[] } => Boolean(entry));

  const zip = new AdmZip(file);
  const drawingEntry = zip.getEntries().find((entry) => /^xl\/drawings\/drawing\d+\.xml$/i.test(entry.entryName));
  if (!drawingEntry) return [];
  const relationshipsEntry = zip.getEntry(`xl/drawings/_rels/${path.basename(drawingEntry.entryName)}.rels`);
  if (!relationshipsEntry) return [];
  const relationships = drawingRelationships(relationshipsEntry.getData().toString('utf8'));
  const anchors = drawingAnchors(drawingEntry.getData().toString('utf8'));
  const captionsByAnchorRow = new Map(captionRows.map((caption) => [caption.row, caption]));
  const targetDirectory = path.resolve(resolveCompetitionAssetDirectory(), competitorId, captureDate);
  mkdirSync(targetDirectory, { recursive: true });

  return anchors.flatMap((anchor) => {
    const caption = captionsByAnchorRow.get(anchor.row);
    const mediaPath = relationships.get(anchor.relationshipId);
    const entry = mediaPath ? zip.getEntry(mediaPath) : null;
    if (!caption || !entry) return [];
    const extension = path.extname(entry.entryName).toLowerCase() || '.png';
    const referenceNumber = caption.ref.replace(/\D/g, '');
    const assetFile = `screenshot-${referenceNumber}${extension}`;
    const assetPath = path.resolve(targetDirectory, assetFile);
    if (!existsSync(assetPath)) writeFileSync(assetPath, entry.getData());
    return [{
      ref: caption.ref,
      assetFile,
      assetUrl: `/competition/assets/${encodeURIComponent(competitorId)}/${captureDate}/${assetFile}`,
      libraryIds: caption.libraryIds,
      multiAd: caption.libraryIds.length > 1,
      associationVerified: true,
    }];
  });
}

function drawingRelationships(xml: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const match of xml.matchAll(/<Relationship\b([^>]+)\/?\s*>/g)) {
    const attributes = match[1] ?? '';
    const id = /\bId="([^"]+)"/.exec(attributes)?.[1];
    const target = /\bTarget="([^"]+)"/.exec(attributes)?.[1];
    const type = /\bType="([^"]+)"/.exec(attributes)?.[1];
    if (!id || !target || !type?.endsWith('/image')) continue;
    const normalized = target.startsWith('/')
      ? target.slice(1)
      : path.posix.normalize(path.posix.join('xl/drawings', target));
    result.set(id, normalized);
  }
  return result;
}

function drawingAnchors(xml: string): Array<{ row: number; relationshipId: string }> {
  return [...xml.matchAll(/<(?:\w+:)?(?:oneCellAnchor|twoCellAnchor)\b[\s\S]*?<\/(?:\w+:)?(?:oneCellAnchor|twoCellAnchor)>/g)]
    .flatMap((match) => {
      const block = match[0];
      const row = Number(/<(?:\w+:)?row>(\d+)<\/(?:\w+:)?row>/.exec(block)?.[1]);
      const relationshipId = /\br:embed="([^"]+)"/.exec(block)?.[1];
      return Number.isFinite(row) && relationshipId ? [{ row, relationshipId }] : [];
    })
    .sort((left, right) => left.row - right.row);
}

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.resolve(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

function textValue(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function numberValue(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateValue(value: unknown): string | null {
  const text = textValue(value);
  if (!text) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (iso) return text;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function normalizeScreenshotRef(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function safeDestination(value: string | null): string | null {
  if (!value) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(candidate);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

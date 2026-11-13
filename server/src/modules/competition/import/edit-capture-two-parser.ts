import { existsSync } from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';
import { dateOnlyDifference } from '../calculations/competition-calculations.js';
import { groupCompetitionFormat, groupCompetitionTheme } from '../config/competition.config.js';
import type { CompetitionCapture, CompetitionConfig, CompetitionGalleryEntry, CompetitionObservation, MixRow } from '../types/competition.types.js';
import { resolveCompetitionAssetDirectory } from './competition-source-parser.js';

const CAPTURE_DATE = '2026-11-03';
type Row = Record<string, unknown>;
const field = (row: Row, key: string): string => String(row[key] ?? '').trim();
const number = (row: Row, key: string): number | null => {
  const value = field(row, key).replace(/,/g, '');
  if (!value) return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
};
const requiredSheet = (book: XLSX.WorkBook, name: string): XLSX.WorkSheet => {
  const sheet = book.Sheets[name];
  if (!sheet) throw new Error(`EDIT Capture 2 missing worksheet: ${name}`);
  return sheet;
};
const readRows = (book: XLSX.WorkBook, name: string): Row[] => XLSX.utils.sheet_to_json<Row>(requiredSheet(book, name), { defval: '', raw: false });

/** Strictly parse the analyst-supplied 3 November register and gallery. No editorial text is ingested. */
export function parseEditCaptureTwo(file: string, config: CompetitionConfig): CompetitionCapture {
  const book = XLSX.readFile(file, { raw: false, cellDates: false });
  const rows = readRows(book, 'Ad Register').filter((row) => field(row, 'Start date') || field(row, 'Format') || field(row, 'Platforms')); // exclude analyst footer note
  const required = ['Library ID', 'Start date', 'Days running (at 3 Nov)', 'Format', 'Platforms', 'Theme (analyst)', 'Campaign platform (analyst)', 'New since 1 Oct capture'];
  for (const col of required) {
    if (!Object.prototype.hasOwnProperty.call(rows[0] ?? {}, col)) throw new Error(`EDIT Capture 2 missing Ad Register header: ${col}`);
  }
  const assetDirectory = path.resolve(resolveCompetitionAssetDirectory(), config.id, CAPTURE_DATE);
  const observations: CompetitionObservation[] = [];
  const seen = new Set<string>();
  let malformedRows = 0;
  let daysRunningDiscrepancies = 0;
  rows.forEach((row, index) => {
    const libraryId = field(row, 'Library ID');
    const startDate = field(row, 'Start date');
    const suppliedDaysRunning = number(row, 'Days running (at 3 Nov)');
    const format = field(row, 'Format');
    if (!/^\d{10,20}$/.test(libraryId) || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !format || suppliedDaysRunning === null) {
      malformedRows += 1;
      return;
    }
    if (seen.has(libraryId)) throw new Error(`Duplicate EDIT Capture 2 Library ID: ${libraryId}`);
    seen.add(libraryId);
    const calculatedDaysRunning = dateOnlyDifference(CAPTURE_DATE, startDate);
    const discrepancy = calculatedDaysRunning !== suppliedDaysRunning;
    if (discrepancy) daysRunningDiscrepancies += 1;
    const theme = field(row, 'Theme (analyst)') || null;
    const newFlag = field(row, 'New since 1 Oct capture').toLowerCase();
    const observation: CompetitionObservation = {
      competitorId: config.id, competitor: config.label, clientId: config.clientId, clientLabel: config.clientLabel,
      metaPage: config.metaPage, libraryId, captureDate: CAPTURE_DATE, startDate, suppliedDaysRunning,
      calculatedDaysRunning, daysRunningDiscrepancy: discrepancy, status: 'Active',
      platforms: field(row, 'Platforms') || 'n/a', format, formatGroup: groupCompetitionFormat(config, format),
      theme, themeGroup: groupCompetitionTheme(config, theme), featuredBrandProduct: field(row, 'Featured brand / product') || null,
      adText: null, clickDestination: null, language: null, screenshotRef: null, screenshot: null,
      campaignPlatform: field(row, 'Campaign platform (analyst)') || null,
      newSincePreviousCapture: newFlag === 'yes',
      offerCode: field(row, 'Offer code') || null,
      celebrity: field(row, 'Celebrity') || null,
      sourceFile: path.basename(file), sourceSheet: 'Ad Register', sourceRow: index + 2,
    };
    observations.push(observation);
  });
  if (malformedRows || observations.length !== rows.length) throw new Error(`EDIT Capture 2 rejected ${malformedRows} invalid register rows`);
  const adsById = new Map(observations.map((ad) => [ad.libraryId, ad]));
  const galleryRows = readRows(book, 'Gallery - The Wall').filter((row) => field(row, 'Library ID')); // skip footer display rules
  const gallery: CompetitionGalleryEntry[] = galleryRows.map((row) => {
    const libraryId = field(row, 'Library ID');
    const imageFile = field(row, 'Thumbnail file');
    const ad = adsById.get(libraryId);
    const rowNumber = number(row, 'Row');
    const slot = number(row, 'Slot');
    if (!ad || !rowNumber || !slot || !/^[a-z0-9_-]+\.png$/i.test(imageFile) || !existsSync(path.resolve(assetDirectory, imageFile))) {
      throw new Error(`EDIT Capture 2 Gallery references missing ad or image: ${libraryId} / ${imageFile}`);
    }
    return {
      row: rowNumber, title: field(row, 'Row title'), slot, libraryId, caption: field(row, 'Caption'),
      metaLine: field(row, 'Meta line'), chip: field(row, 'Chip'), thumbnailFile: imageFile,
      assetUrl: `/competition/assets/${config.id}/${CAPTURE_DATE}/${imageFile}`,
      startDate: ad.startDate, daysRunning: ad.suppliedDaysRunning ?? ad.calculatedDaysRunning,
    };
  }).sort((a, b) => a.row - b.row || a.slot - b.slot);
  if (gallery.length !== 15 || [1,2,3,4].some((row, idx) => gallery.filter((entry) => entry.row === row).length !== [4,4,4,3][idx])) {
    throw new Error('EDIT Capture 2 must have 15 gallery entries in four rows (4/4/4/3)');
  }
  const deltaRows = readRows(book, 'Delta vs Capture 1');
  const delta = new Map(deltaRows.map((row) => [field(row, 'Card').toLowerCase(), row]));
  const newLaunches = number(delta.get('new launches in window') ?? {}, 'Capture #2 (3 Nov)');
  const flaggedLaunches = observations.filter((ad) => ad.newSincePreviousCapture).length;
  if (newLaunches !== null && newLaunches !== flaggedLaunches) throw new Error(`EDIT Capture 2 launch count mismatch: ${newLaunches} vs ${flaggedLaunches}`);
  const importedThemeRows = readRows(book, 'Theme Mix');
  const importedThemeMix: MixRow[] = importedThemeRows.flatMap((row) => {
    const label = field(row, 'Theme (analyst)');
    const count = number(row, 'Ads');
    if (!label || count == null || /total|all themes/i.test(label)) return [];
    return [{ label, count, percentage: observations.length ? count / observations.length : 0 }];
  });
  const screenshots = gallery.map((item) => ({
    ref: item.thumbnailFile, assetFile: item.thumbnailFile, assetUrl: item.assetUrl,
    libraryIds: [item.libraryId], multiAd: false, associationVerified: true,
  }));
  return {
    competitorId: config.id, competitor: config.label, clientId: config.clientId, clientLabel: config.clientLabel,
    metaPage: config.metaPage, captureDate: CAPTURE_DATE, sourceFile: path.basename(file), observations, screenshots,
    gallery, importedThemeMix, launchesSincePreviousCapture: flaggedLaunches,
    audit: {
      sourceRows: rows.length, acceptedRows: observations.length, malformedRows, duplicateRows: 0, conflictingDuplicateRows: 0,
      daysRunningDiscrepancies, verifiedScreenshotAssociations: gallery.length, unverifiedScreenshotAssociations: 0,
    },
  };
}

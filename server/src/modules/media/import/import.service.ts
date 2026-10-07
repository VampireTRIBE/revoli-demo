import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, extname, join } from 'node:path';
import AdmZip from 'adm-zip';
import mongoose from 'mongoose';
import { databaseReady } from '../../../config/database.js';
import { ApiError } from '../../../utils/api-error.js';
import { findDuplicatePeriods, persistDataset, removePeriods } from '../repositories/media.repository.js';
import { parseMediaSources } from './source-parser.js';
import { reconcileImport } from './reconciliation.js';

export async function importMediaPackage(file: Express.Multer.File, replaceExisting: boolean) {
  if (!databaseReady()) throw new ApiError(503, 'DATABASE_UNAVAILABLE', 'MongoDB is required to complete an import. The dashboard remains available in source-backed read mode.');
  const directory = mkdtempSync(join(tmpdir(), 'bizcom-media-import-'));
  console.info('[media-import] upload started', { name: file.originalname, size: file.size });
  try {
    const paths = materializeFiles(file, directory);
    console.info('[media-import] files detected', paths.map((path) => basename(path)));
    if (paths.length === 0) throw new ApiError(400, 'MISSING_WORKBOOK', 'No .xlsx workbooks were found in the upload.');
    const dataset = parseMediaSources(paths);
    const errors = validateDataset(dataset);
    if (errors.length) throw new ApiError(422, 'MISSING_SHEET', 'The package does not match the agreed Media workbook structure.', errors);
    const checks = reconcileImport(paths, dataset);
    const failedChecks = checks.filter((check) => !check.passed && check.severity === 'ERROR');
    const warningChecks = checks.filter((check) => !check.passed && check.severity === 'WARNING');
    const warnings = [...new Set(dataset.warnings)];
    console.info('[media-import] reconciliation result', {
      passed: checks.filter((check) => check.passed).length,
      failed: failedChecks.length,
      warnings: warningChecks.length,
    });
    if (failedChecks.length) throw new ApiError(422, 'RECONCILIATION_FAILED', 'Critical source totals did not reconcile.', failedChecks);

    const periodKeys = dataset.periods.map((period) => period.periodKey);
    const duplicates = await findDuplicatePeriods(periodKeys);
    if (duplicates.length && !replaceExisting) {
      throw new ApiError(409, 'DUPLICATE_IMPORT', `Imported data already exists for: ${duplicates.join(', ')}. Enable deliberate replacement to continue.`, { periodKeys: duplicates });
    }

    const session = await mongoose.startSession();
    const batchId = dataset.platforms[0]?.batchId ?? `batch-${randomUUID()}`;
    const status = warnings.length ? 'COMPLETED_WITH_WARNINGS' : 'COMPLETED';
    try {
      await session.withTransaction(async () => {
        if (duplicates.length) {
          console.info('[media-import] period replacement started', { periodKeys: duplicates });
          await removePeriods(duplicates, session);
        }
        await persistDataset(dataset, {
          batchId,
          year: dataset.periods[0]?.year ?? new Date().getUTCFullYear(),
          month: dataset.periods.length === 1 ? dataset.periods[0]?.month : undefined,
          periodKeys,
          sourcePeriodLabel: dataset.periods.length === 1 ? dataset.periods[0]?.sourcePeriodLabel : `${dataset.periods[0]?.sourcePeriodLabel} to ${dataset.periods.at(-1)?.sourcePeriodLabel}`,
          importedAt: new Date(),
          status,
          files: paths.map((path) => ({ originalName: basename(path), detectedType: detectType(path), status: 'VALID', rowCount: rowCountFor(path) })),
          validationErrors: [],
          warnings,
          reconciliationSummary: {
            passed: checks.filter((check) => check.passed).length,
            failed: 0,
            warnings: warnings.length,
          },
        }, session);
      });
    } finally {
      await session.endSession();
    }
    console.info('[media-import] records inserted', { batchId, periods: periodKeys.length, records: dataset.platforms.length + dataset.site.length + dataset.campaigns.length + dataset.organic.length });
    return {
      batchId,
      status,
      detectedPeriods: dataset.periods,
      files: paths.map((path) => ({ originalName: basename(path), detectedType: detectType(path), status: 'VALID', rowCount: rowCountFor(path) })),
      warnings,
      reconciliationChecks: checks,
      replacedPeriods: duplicates,
    };
  } catch (error) {
    console.error('[media-import] import failed', error instanceof Error ? error.message : error);
    throw error;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function materializeFiles(file: Express.Multer.File, directory: string): string[] {
  const extension = extname(file.originalname).toLowerCase();
  if (extension === '.xlsx') {
    const target = join(directory, basename(file.originalname));
    writeFileSync(target, file.buffer);
    return [target];
  }
  if (extension !== '.zip') throw new ApiError(415, 'UNSUPPORTED_FILE', 'Upload a .xlsx workbook or .zip package.');
  const archive = new AdmZip(file.buffer);
  const paths: string[] = [];
  archive.getEntries().forEach((entry) => {
    if (entry.isDirectory || basename(entry.entryName).startsWith('~$') || extname(entry.entryName).toLowerCase() !== '.xlsx') return;
    const target = join(directory, basename(entry.entryName));
    writeFileSync(target, entry.getData());
    paths.push(target);
  });
  return paths;
}

function validateDataset(dataset: ReturnType<typeof parseMediaSources>): string[] {
  const errors: string[] = [];
  if (!dataset.periods.length) errors.push('No valid reporting periods were detected.');
  if (!dataset.platforms.some((row) => row.platform === 'Google Ads')) errors.push('Google Brand x Month data is missing.');
  if (!dataset.platforms.some((row) => row.platform === 'Meta Ads')) errors.push('Meta Brand x Month (spend) data is missing.');
  if (!dataset.site.length) errors.push('Reconciled monthly site funnel data is missing.');
  if (!dataset.organic.length) errors.push('Organic Brand x Month data is missing.');
  if (dataset.platforms.some((row) => row.spend < 0)) errors.push('Negative advertising spend was detected.');
  return errors;
}

function detectType(path: string): string {
  const name = basename(path).toLowerCase();
  if (name.includes('google')) return 'GOOGLE_MEDIA';
  if (name.includes('meta')) return 'META_MEDIA';
  if (name.includes('organic')) return 'ORGANIC_DEMAND';
  if (name.includes('segmentation with reconciled')) return 'SITE_RECONCILIATION';
  if (name.includes('brand-plot')) return 'BRAND_PLOT';
  if (name.includes('brand segmentation')) return 'BRAND_TAXONOMY';
  return 'MEDIA_WORKBOOK';
}

function rowCountFor(path: string): number {
  const workbook = parseMediaSources([path]);
  return workbook.platforms.length + workbook.site.length + workbook.campaigns.length + workbook.organic.length;
}

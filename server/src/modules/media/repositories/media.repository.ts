import type { ClientSession, FilterQuery } from 'mongoose';
import { databaseReady } from '../../../config/database.js';
import type { CampaignRecord, MediaDataset, MediaFilter, OrganicRecord, PlatformRecord, SiteRecord } from '../types/media.types.js';
import { MediaImportBatchModel } from '../models/media-import-batch.model.js';
import { MediaCampaignModel, MediaOrganicModel, MediaPlatformModel, MediaSiteModel } from '../models/media-record.models.js';

function periodQuery(filter: MediaFilter): FilterQuery<unknown> {
  return {
    ...(filter.year ? { year: filter.year } : {}),
    ...(filter.month ? { month: filter.month } : {}),
  };
}

export async function readDataset(filter: MediaFilter): Promise<MediaDataset | null> {
  if (!databaseReady()) return null;
  const query = periodQuery(filter);
  const [platforms, site, organic, campaigns, batches] = await Promise.all([
    MediaPlatformModel.find(query).lean<PlatformRecord[]>(),
    MediaSiteModel.find(query).lean<SiteRecord[]>(),
    MediaOrganicModel.find(query).lean<OrganicRecord[]>(),
    MediaCampaignModel.find(query).lean<CampaignRecord[]>(),
    MediaImportBatchModel.find({ status: { $in: ['COMPLETED', 'COMPLETED_WITH_WARNINGS'] } }).lean(),
  ]);
  if (platforms.length + site.length + organic.length === 0) return null;
  const periodMap = new Map(site.map((record) => [record.periodKey, {
    year: record.year,
    month: record.month,
    monthLabel: record.monthLabel,
    periodKey: record.periodKey,
    periodStart: record.periodStart,
    periodEnd: record.periodEnd,
    isPartialPeriod: record.isPartialPeriod,
    sourcePeriodLabel: record.sourcePeriodLabel,
  }]));
  return {
    periods: [...periodMap.values()].sort((a, b) => a.periodKey.localeCompare(b.periodKey)),
    platforms,
    site,
    campaigns,
    organic,
    sourceFiles: batches.flatMap((batch) => batch.files.map((file) => file.originalName)),
    warnings: batches.flatMap((batch) => batch.warnings),
  };
}

export async function persistDataset(dataset: MediaDataset, batch: Record<string, unknown>, session: ClientSession) {
  await MediaImportBatchModel.create([batch], { session });
  if (dataset.platforms.length) await MediaPlatformModel.insertMany(dataset.platforms, { session });
  if (dataset.site.length) await MediaSiteModel.insertMany(dataset.site, { session });
  if (dataset.campaigns.length) await MediaCampaignModel.insertMany(dataset.campaigns, { session });
  if (dataset.organic.length) await MediaOrganicModel.insertMany(dataset.organic, { session });
}

export async function removePeriods(periodKeys: string[], session: ClientSession) {
  const query = { periodKey: { $in: periodKeys } };
  await Promise.all([
    MediaPlatformModel.deleteMany(query, { session }),
    MediaSiteModel.deleteMany(query, { session }),
    MediaOrganicModel.deleteMany(query, { session }),
    MediaCampaignModel.deleteMany(query, { session }),
    MediaImportBatchModel.deleteMany({ periodKeys: { $in: periodKeys } }, { session }),
  ]);
}

export async function findDuplicatePeriods(periodKeys: string[]): Promise<string[]> {
  if (!databaseReady()) return [];
  const found = await MediaImportBatchModel.distinct('periodKeys', {
    periodKeys: { $in: periodKeys },
    status: { $in: ['COMPLETED', 'COMPLETED_WITH_WARNINGS'] },
  });
  return found.filter((key): key is string => typeof key === 'string' && periodKeys.includes(key));
}

export async function listImports() {
  return MediaImportBatchModel.find().sort({ importedAt: -1 }).lean();
}

export async function getImport(batchId: string) {
  return MediaImportBatchModel.findOne({ batchId }).lean();
}

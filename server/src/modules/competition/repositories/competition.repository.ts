import { databaseReady } from '../../../config/database.js';
import { CompetitionAdIdentityModel, CompetitionCaptureModel, CompetitionObservationModel } from '../models/competition.models.js';
import type { CompetitionSourceDataset } from '../types/competition.types.js';

export async function persistCompetitionDataset(dataset: CompetitionSourceDataset): Promise<void> {
  if (!databaseReady()) return;
  for (const capture of dataset.captures) {
    await CompetitionCaptureModel.updateOne(
      { competitorId: capture.competitorId, captureDate: capture.captureDate },
      { $setOnInsert: {
        competitorId: capture.competitorId,
        captureDate: capture.captureDate,
        sourceFile: capture.sourceFile,
        screenshotAssets: capture.screenshots,
        audit: capture.audit,
      } },
      { upsert: true },
    );
    for (const observation of capture.observations) {
      await CompetitionAdIdentityModel.updateOne(
        { competitorId: observation.competitorId, libraryId: observation.libraryId },
        { $setOnInsert: {
          competitorId: observation.competitorId,
          competitor: observation.competitor,
          clientId: observation.clientId,
          metaPage: observation.metaPage,
          libraryId: observation.libraryId,
        } },
        { upsert: true },
      );
      await CompetitionObservationModel.updateOne(
        { competitorId: observation.competitorId, captureDate: observation.captureDate, libraryId: observation.libraryId },
        { $setOnInsert: {
          competitorId: observation.competitorId,
          captureDate: observation.captureDate,
          libraryId: observation.libraryId,
          payload: observation,
        } },
        { upsert: true },
      );
    }
  }
}

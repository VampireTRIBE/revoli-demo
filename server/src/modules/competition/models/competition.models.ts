import mongoose, { Schema } from 'mongoose';

const adIdentitySchema = new Schema({
  competitorId: { type: String, required: true },
  competitor: { type: String, required: true },
  clientId: { type: String, required: true },
  metaPage: { type: String, required: true },
  libraryId: { type: String, required: true },
}, { timestamps: true });
adIdentitySchema.index({ competitorId: 1, libraryId: 1 }, { unique: true });

const observationSchema = new Schema({
  competitorId: { type: String, required: true },
  libraryId: { type: String, required: true },
  captureDate: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });
observationSchema.index({ competitorId: 1, captureDate: 1, libraryId: 1 }, { unique: true });

const captureSchema = new Schema({
  competitorId: { type: String, required: true },
  captureDate: { type: String, required: true },
  sourceFile: { type: String, required: true },
  screenshotAssets: { type: [Schema.Types.Mixed], default: [] },
  audit: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });
captureSchema.index({ competitorId: 1, captureDate: 1 }, { unique: true });

type CompetitionDocument = Record<string, unknown>;

export const CompetitionAdIdentityModel = (mongoose.models.CompetitionAdIdentity as mongoose.Model<CompetitionDocument> | undefined)
  ?? mongoose.model<CompetitionDocument>('CompetitionAdIdentity', adIdentitySchema);
export const CompetitionObservationModel = (mongoose.models.CompetitionObservation as mongoose.Model<CompetitionDocument> | undefined)
  ?? mongoose.model<CompetitionDocument>('CompetitionObservation', observationSchema);
export const CompetitionCaptureModel = (mongoose.models.CompetitionCapture as mongoose.Model<CompetitionDocument> | undefined)
  ?? mongoose.model<CompetitionDocument>('CompetitionCapture', captureSchema);

import { Schema, model } from 'mongoose';

const fileSchema = new Schema(
  {
    originalName: { type: String, required: true },
    detectedType: { type: String, required: true },
    status: { type: String, enum: ['VALID', 'INVALID', 'WARNING'], required: true },
    rowCount: { type: Number, required: true },
  },
  { _id: false },
);

const schema = new Schema(
  {
    batchId: { type: String, required: true, unique: true, index: true },
    year: { type: Number, required: true },
    month: Number,
    periodKeys: [{ type: String, required: true }],
    sourcePeriodLabel: { type: String, required: true },
    importedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['PROCESSING', 'COMPLETED', 'COMPLETED_WITH_WARNINGS', 'FAILED'],
      required: true,
    },
    files: [fileSchema],
    validationErrors: [String],
    warnings: [String],
    reconciliationSummary: {
      passed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      warnings: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

schema.index({ year: 1, month: 1 });
schema.index({ periodKeys: 1 });

export const MediaImportBatchModel = model('MediaImportBatch', schema);

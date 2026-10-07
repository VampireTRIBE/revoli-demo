import { Schema, model } from 'mongoose';

const lineage = {
  batchId: { type: String, required: true, index: true },
  sourceFile: { type: String, required: true },
  sourceSheet: { type: String, required: true },
  sourceRow: { type: Number, required: true },
};

const period = {
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  monthLabel: { type: String, required: true },
  periodKey: { type: String, required: true, index: true },
  periodStart: { type: String, required: true },
  periodEnd: { type: String, required: true },
  isPartialPeriod: { type: Boolean, required: true },
  sourcePeriodLabel: { type: String, required: true },
};

const platformSchema = new Schema(
  {
    ...lineage,
    ...period,
    platform: { type: String, enum: ['Google Ads', 'Meta Ads'], required: true },
    brand: { type: String, required: true },
    segment: { type: String, required: true },
    spend: { type: Number, required: true },
    claims: { type: Number, required: true },
    impressions: Number,
    interactions: Number,
    clicks: Number,
  },
  { timestamps: true },
);
platformSchema.index({ year: 1, month: 1, platform: 1 });
platformSchema.index({ year: 1, month: 1, brand: 1 });
platformSchema.index({ year: 1, month: 1, segment: 1 });

const siteSchema = new Schema(
  {
    ...lineage,
    ...period,
    brand: { type: String, required: true },
    segment: { type: String, required: true },
    mappingStatus: String,
    itemsViewed: Number,
    itemsAddedToCart: Number,
    itemsPurchased: Number,
    revenue: Number,
  },
  { timestamps: true },
);
siteSchema.index({ year: 1, month: 1, brand: 1 });
siteSchema.index({ year: 1, month: 1, segment: 1 });

const campaignSchema = new Schema(
  {
    ...lineage,
    year: Number,
    month: Number,
    periodKey: String,
    platform: { type: String, enum: ['Google Ads', 'Meta Ads'], required: true },
    campaign: { type: String, required: true },
    brand: String,
    brandScope: String,
    segment: String,
    stage: String,
    campaignType: String,
    mappingSource: String,
    confidence: String,
    spend: Number,
    claims: Number,
    impressions: Number,
    interactions: Number,
    clicks: Number,
    calculationBasis: String,
  },
  { timestamps: true },
);
campaignSchema.index({ year: 1, month: 1, platform: 1 });
campaignSchema.index({ campaign: 1, batchId: 1 });

const organicSchema = new Schema(
  {
    ...lineage,
    ...period,
    brand: String,
    segment: String,
    market: String,
    organicClicks: Number,
    organicImpressions: Number,
    averagePosition: Number,
  },
  { timestamps: true },
);
organicSchema.index({ year: 1, month: 1, brand: 1 });
organicSchema.index({ year: 1, month: 1, market: 1 });

export const MediaPlatformModel = model('MediaPlatform', platformSchema);
export const MediaSiteModel = model('MediaSite', siteSchema);
export const MediaCampaignModel = model('MediaCampaign', campaignSchema);
export const MediaOrganicModel = model('MediaOrganic', organicSchema);

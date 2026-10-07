# Media Database Structure and Fields

Media uploads are stored in MongoDB through Mongoose.

## Collections

### 1. Media import batches

Model: `MediaImportBatch`

Purpose: stores one import operation and its validation result.

| Field | Type | Meaning |
| --- | --- | --- |
| `batchId` | String | Unique import identifier |
| `year` | Number | Main import year |
| `month` | Number, optional | Main import month |
| `periodKeys` | String array | All imported periods such as `2026-08` |
| `sourcePeriodLabel` | String | Human-readable source period |
| `importedAt` | Date | Import time |
| `status` | String | `PROCESSING`, `COMPLETED`, `COMPLETED_WITH_WARNINGS`, or `FAILED` |
| `files` | Array | File name, detected type, status, and row count |
| `validationErrors` | String array | Blocking validation errors |
| `warnings` | String array | Non-blocking source warnings |
| `reconciliationSummary` | Object | Passed, failed, and warning counts |

### 2. Media platforms

Model: `MediaPlatform`

Purpose: stores monthly Google and Meta Brand/Segment delivery.

Important fields:

- Source: `batchId`, `sourceFile`, `sourceSheet`, `sourceRow`.
- Period: `year`, `month`, `monthLabel`, `periodKey`, `periodStart`, `periodEnd`, `isPartialPeriod`, `sourcePeriodLabel`.
- Business: `platform`, `brand`, `segment`.
- Metrics: `spend`, `claims`, `impressions`, `interactions`, `clicks`.

### 3. Media site data

Model: `MediaSite`

Purpose: stores monthly site funnel and revenue by Brand and Segment.

Important fields:

- Shared source and period fields.
- `brand`, `segment`, `mappingStatus`.
- `itemsViewed`, `itemsAddedToCart`, `itemsPurchased`, `revenue`.

### 4. Media campaigns

Model: `MediaCampaign`

Purpose: stores campaign mapping and available delivery metrics.

Important fields:

- Source: `batchId`, `sourceFile`, `sourceSheet`, `sourceRow`.
- Period: `year`, `month`, `periodKey`.
- Identity: `platform`, `campaign`.
- Mapping: `brand`, `brandScope`, `segment`, `stage`, `campaignType`, `mappingSource`, `confidence`.
- Metrics: `spend`, `claims`, `impressions`, `interactions`, `clicks`.
- `calculationBasis`: explanation of how the row can be used.

### 5. Media organic demand

Model: `MediaOrganic`

Purpose: stores organic search demand by Brand, Segment, and market.

Important fields:

- Shared source and period fields.
- `brand`, `segment`, `market`.
- `organicClicks`, `organicImpressions`, `averagePosition`.

## Main indexes

Indexes support:

- Year and month queries.
- Platform queries.
- Brand and Segment filters.
- Campaign identity inside an import batch.
- Organic market filters.
- Import batch and period lookup.

## Data relationship

```text
MediaImportBatch.batchId
       |
       +-- MediaPlatform.batchId
       +-- MediaSite.batchId
       +-- MediaCampaign.batchId
       `-- MediaOrganic.batchId
```

The source lineage fields make every normalised record traceable to the workbook row that created it.

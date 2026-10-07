# Competition Database Structure and Fields

Competition uses three MongoDB collections. This separates stable ad identity from monthly capture observations.

## 1. Competition ad identity

Model: `CompetitionAdIdentity`

Purpose: one stable record for a competitor's Library ID.

| Field | Type | Meaning |
| --- | --- | --- |
| `competitorId` | String | Stable configured competitor ID |
| `competitor` | String | Competitor display name |
| `clientId` | String | Client association |
| `metaPage` | String | Exact Meta page |
| `libraryId` | String | Meta Ad Library ID |
| `createdAt`, `updatedAt` | Date | Mongoose timestamps |

Unique index:

```text
competitorId + libraryId
```

## 2. Competition observation

Model: `CompetitionObservation`

Purpose: one ad observation on one capture date.

| Field | Type | Meaning |
| --- | --- | --- |
| `competitorId` | String | Configured competitor ID |
| `libraryId` | String | Stable ad identity |
| `captureDate` | String | Date in `YYYY-MM-DD` format |
| `payload` | Object | Full normalised observation |
| `createdAt`, `updatedAt` | Date | Mongoose timestamps |

Unique index:

```text
competitorId + captureDate + libraryId
```

### Observation payload fields

- Client and competitor labels.
- Meta page and Library ID.
- Capture date and start date.
- Supplied and calculated days running.
- Day-count discrepancy flag.
- Status and platforms.
- Original and grouped format.
- Original and grouped analyst theme.
- Featured brand/product.
- Ad text and safe click destination.
- Language.
- Screenshot reference and association details.
- Source file, source sheet, and source row.

## 3. Competition capture

Model: `CompetitionCapture`

Purpose: one stored competitor capture and its import audit.

| Field | Type | Meaning |
| --- | --- | --- |
| `competitorId` | String | Configured competitor ID |
| `captureDate` | String | Exact capture date |
| `sourceFile` | String | Workbook name |
| `screenshotAssets` | Object array | Extracted asset names and Library ID associations |
| `audit` | Object | Source and validation counts |
| `createdAt`, `updatedAt` | Date | Mongoose timestamps |

Unique index:

```text
competitorId + captureDate
```

### Audit fields

- `sourceRows`
- `acceptedRows`
- `malformedRows`
- `duplicateRows`
- `conflictingDuplicateRows`
- `daysRunningDiscrepancies`
- `verifiedScreenshotAssociations`
- `unverifiedScreenshotAssociations`

## Relationships

```text
CompetitionAdIdentity
  competitorId + libraryId
              |
              +-- CompetitionObservation on capture date 1
              +-- CompetitionObservation on capture date 2
              `-- CompetitionObservation on later dates

CompetitionCapture
  competitorId + captureDate
              |
              +-- observations for that capture
              `-- screenshot assets and import audit
```

## Asset storage

Extracted image files are stored outside MongoDB at:

`server/data/competition-assets/<competitor-id>/<capture-date>/`

MongoDB stores the asset metadata and associations. The file route validates the capture before serving an image.

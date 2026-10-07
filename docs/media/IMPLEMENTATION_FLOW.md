# Media Implementation Flow

## Simple flow

```text
Excel workbook or ZIP package
        |
        v
Detect supported workbooks and sheets
        |
        v
Parse periods, platform rows, site rows, campaigns, and organic demand
        |
        v
Normalise numbers, dates, Brand, Segment, and source lineage
        |
        v
Validate required data and reconcile source totals
        |
        v
Store the import batch and normalised rows in MongoDB
        |
        v
Apply Year, Month, Segment, and Brand filters
        |
        v
Calculate metrics on the Express server
        |
        v
Return versioned REST responses
        |
        v
Render the React Media tab
```

## 1. Source discovery

In source-backed mode, the server loads `.xlsx` files from `spreadsheets data/media-tab`.

For an upload, the server accepts one workbook or extracts every workbook from the uploaded ZIP into a temporary directory.

## 2. Parsing

`server/src/modules/media/import/source-parser.ts` reads known sheets and creates four normalised row types:

- Platform rows.
- Site rows.
- Campaign rows.
- Organic-demand rows.

The parser also creates period records containing start date, end date, month label, and partial-period status.

## 3. Validation and reconciliation

The server checks:

- Required periods exist.
- Platform and site data exist.
- Site views, carts, purchases, and revenue match source controls.
- Google campaign spend, impressions, interactions, and conversions match platform controls.
- Paid and stage totals stay within documented tolerances.

Critical failures stop an import. Warnings are stored with the import batch.

## 4. Persistence

Valid uploads are written inside a MongoDB transaction. The batch and all normalised rows share a `batchId`.

Existing periods are rejected unless `replaceExisting=true` is explicitly supplied. Replacement is validated before the old period is removed.

## 5. Server calculations

`media-analytics.service.ts` filters the data and calculates all authoritative metrics. The client does formatting and interaction only; it does not own business formulas.

The service also returns calculation labels, source warnings, and whether a value is verified, derived, directional, or platform-claimed.

## 6. Client rendering

The React page reads the APIs through TanStack Query. URL parameters preserve the current period, Segment, and Brand.

Changing a Segment updates the Brand dropdown and refreshes every supported section consistently.

## 7. Source-backed fallback

When MongoDB is offline, dashboard reads still work from the supplied local workbooks. Uploading and replacing data require MongoDB.

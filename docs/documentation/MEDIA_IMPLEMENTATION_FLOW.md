# Media Analytics Implementation and Flow

## 1. Purpose

The Media module turns the client’s monthly Excel files into the Media dashboard.

It does five main jobs:

1. reads the supplied spreadsheets;
2. checks that the required data is present;
3. compares important totals for accuracy;
4. calculates the Media values on the server;
5. sends the calculated results to the React dashboard.

The application covers the Media tab only. The page design follows `docs/documentation/GP-BizCom-Dashboard.html`.

## 2. Main application parts

| Part | Location | What it does |
| --- | --- | --- |
| React application | `client/src` | Displays the Media page, dropdowns, cards, tables, charts, loading states, and import page |
| API server | `server/src` | Reads data, validates requests, calculates values, and returns JSON |
| Spreadsheet parser | `server/src/modules/media/import/source-parser.ts` | Reads workbook sheets and converts rows into a common structure |
| Reconciliation | `server/src/modules/media/import/reconciliation.ts` | Compares imported totals with source control totals |
| Calculation functions | `server/src/modules/media/calculations/media-calculations.ts` | Contains shared formulas and safe division |
| Analytics service | `server/src/modules/media/services/media-analytics.service.ts` | Aggregates rows for each API and calculates dashboard results |
| MongoDB repository | `server/src/modules/media/repositories/media.repository.ts` | Reads and writes normalized Media records |
| Import service | `server/src/modules/media/import/import.service.ts` | Handles ZIP/XLSX uploads, validation, duplicates, replacement, and transactions |
| Bundled source data | `spreadsheets data/media-tab` | Provides read-only data when MongoDB has no imported records |

## 3. End-to-end data flow

```text
Client spreadsheets or ZIP
          |
          v
POST /api/v1/media/import
          |
          v
File type and size checks
          |
          v
Workbook and sheet detection
          |
          v
Period, row, and value parsing
          |
          v
Normalized Media records
          |
          v
Blocking checks and warning checks
          |
          v
Duplicate-period check
          |
          v
MongoDB transaction
          |
          v
Media REST APIs
          |
          v
React Query hooks
          |
          v
Media dashboard
```

## 4. Spreadsheet reading flow

The parser opens every `.xlsx` file in the uploaded package. It identifies workbooks by their sheets and structure.

### Site data

The reconciled shop workbook provides:

- reporting periods;
- brand and segment labels;
- items viewed;
- items added to cart;
- items purchased;
- site revenue.

Monthly sheet names such as `Jan 2026` or `Sep 2026` create the available year and month options.

### Google Ads data

The Google workbook provides monthly brand totals from `Brand x Month`:

- spend in AED;
- impressions;
- interactions;
- claimed conversions.

Google campaign rows come from `Campaign Brand Map`.

### Meta Ads data

The Meta workbook provides monthly brand totals from `Brand x Month (spend)`:

- spend in AED;
- impressions;
- link clicks;
- platform-claimed purchases.

The source does not provide complete monthly campaign-level values. The application therefore allocates each brand’s monthly Meta totals across that brand’s mapped campaigns using the campaign’s share of nine-month spend.

### Organic data

The organic workbook provides:

- organic clicks;
- organic impressions;
- weighted average position;
- brand, segment, and market groupings.

Organic values stay separate from paid-media calculations.

## 5. Normalized records

Spreadsheet rows are converted into four record types:

| Record | MongoDB collection | Main use |
| --- | --- | --- |
| Platform | `mediaplatforms` | Google and Meta monthly totals |
| Site | `mediasites` | Funnel activity, purchases, and revenue |
| Campaign | `mediacampaigns` | Campaign table and Campaign ROAS chart |
| Organic | `mediaorganics` | Organic trend and grouping tables |

Every record keeps its source lineage:

- import batch ID;
- source filename;
- source sheet;
- source row;
- year and month;
- normalized period key such as `2026-08`;
- original period label;
- partial-period status.

This makes a dashboard value traceable to the source data.

## 6. Read mode and database mode

The server supports two data modes.

### MongoDB mode

If MongoDB contains completed imported records, the API reads those records.

### Source-backed mode

If MongoDB is unavailable or has no Media records, the server reads the Excel files in `spreadsheets data/media-tab`.

Source-backed mode keeps the dashboard viewable. It does not allow a new import to be completed. MongoDB is required for uploads.

## 7. Import validation flow

The import service performs these checks in order:

1. The file is `.xlsx` or `.zip`.
2. The upload is within `MAX_UPLOAD_SIZE_MB`.
3. The package contains usable Excel files.
4. Reporting periods are found.
5. Google, Meta, site, and organic source data are present.
6. Advertising spend is not negative.
7. Site totals match the site reconciliation sheet.
8. Google and Meta detailed spend matches the stage summary.
9. Google campaign totals match Google monthly totals.
10. Brand Plot controls are compared with detailed data.
11. Duplicate months are rejected unless replacement was requested.

Blocking checks use severity `ERROR`. A failed error stops the import.

Review checks use severity `WARNING`. A warning is saved with the batch, shown in API metadata, and does not replace detailed monthly data.

## 8. Database write flow

A valid import is written in one MongoDB transaction.

The transaction writes:

- one import batch;
- platform rows;
- site rows;
- campaign rows;
- organic rows.

If any write fails, MongoDB rolls back the transaction.

For a corrected month, the server first validates the new package. Inside the transaction it removes the old period and inserts the corrected records. This prevents a half-updated month.

## 9. API calculation flow

When the dashboard requests data:

1. The API validates `year`, `month`, `segment`, `brand`, and any endpoint-specific filters.
2. The data service reads MongoDB or the bundled spreadsheets.
3. Rows are filtered to the selected period, Segment, and Brand.
4. Additive values are summed first.
5. Brand and Segment directional ROAS selects the first usable basis: exact Brand, mapped Segment, then overall period. Segment selections use exact Segment, then overall period.
6. Ratios are calculated from the selected summed numerator and denominator. Negative reconciled revenue remains negative.
7. Results are rounded only for the API response.
8. Metadata includes period dates, partial status, source files, and warnings.

The server owns the formulas. The browser only formats and displays the returned values.

## 10. Dashboard flow

The dashboard starts at `/media`.

1. `GET /media/periods` loads the year and month options.
2. The latest complete month is selected by default.
3. `GET /media/segments` loads every spreadsheet-backed Segment for that period.
4. Segment defaults to `All Segments`.
5. `GET /media/brands` loads all Brands or only Brands inside the selected Segment. Segment and Brand options show their calculated ROAS and label Segment/Overall fallback bases.
6. Brand defaults to `All Brands`.
7. Selecting All omits that dimension from the URL and includes all matching rows.
8. Changing Segment resets Brand to `All Brands` and loads the valid Brand list.
9. React Query requests overview, platform, and campaign data with the selected filters.
10. The Campaign ROAS chart keeps bars at a fixed 20-pixel thickness, including when only a few campaigns match.
11. Loading, empty, and error states are displayed when needed.

The import screen is available at `/media/import`.

## 11. Data meaning

The API labels values by confidence:

| Status | Meaning |
| --- | --- |
| `VERIFIED` | Calculated from reconciled site data |
| `DERIVED` | Calculated from available source fields |
| `DIRECTIONAL` | Useful comparison, but not verified paid attribution |
| `PLATFORM_CLAIMED` | Reported by Google or Meta, not verified as a site order |
| `PARTIAL` | The period does not cover a full month |
| `UNAVAILABLE` | Required source data is missing |

## 12. Important limits

- The displayed Blended ROAS is reconciled site revenue divided by paid spend. For Brand and Segment filters it uses exact Brand, mapped Segment, then overall period as needed, and shows the selected basis. It is a directional return, not verified paid ROAS.
- Negative site revenue from returns can produce negative ROAS. The server preserves it instead of changing it to zero.
- Platform conversions are Google and Meta claims. Both platforms can claim the same order.
- The displayed CAC is spend divided by platform claims. It is not new-customer CAC.
- Google CTR uses interactions. Meta CTR uses link clicks.
- Meta monthly campaign values are allocated estimates because the source does not contain full monthly campaign results.
- Campaign ROAS uses mapped brand or segment revenue coverage. It is not campaign-attributed revenue.
- The reference score follows the supplied HTML design. It is not the approved full Media score.

See [Media formulas and spreadsheet sources](MEDIA_FORMULAS_AND_SOURCES.md) for exact formulas and source columns.

## 13. Main files to change

| Change | Main files |
| --- | --- |
| New spreadsheet column or sheet | `source-parser.ts`, Media types, MongoDB models, parser tests |
| New calculation | `media-calculations.ts`, `media-analytics.service.ts`, tests, API types |
| New API route | routes, controller, analytics service, client API service |
| New dashboard section | React component, page, CSS, client types |
| Changed monthly import rules | import service, reconciliation, tests, monthly runbook |

After a code change, run:

```cmd
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

## 14. Related documents

- [Media formulas and spreadsheet sources](MEDIA_FORMULAS_AND_SOURCES.md)
- [Monthly Media data import](MEDIA_MONTHLY_IMPORT.md)
- [Media API and request flow](MEDIA_API.md)
- [Detailed technical reference](MEDIA_IMPLEMENTATION.md)
- [Project README](../../README.md)

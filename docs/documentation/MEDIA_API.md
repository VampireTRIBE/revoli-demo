# Media API and Request Flow

## Quick API flow

```text
React page
   |
   v
Client API service
   |
   v
Express route
   |
   v
Request validation
   |
   v
Controller
   |
   v
Analytics or import service
   |
   v
MongoDB data, or bundled spreadsheets when the database has no data
   |
   v
Server calculation
   |
   v
JSON response
```

The browser does not calculate the business metrics. It sends filters and displays the values returned by the server.

## Endpoint list

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/health` | Check that the API is running |
| GET | `/api/v1/media/periods` | Get year and month dropdown options |
| GET | `/api/v1/media/overview` | Get KPI cards and reference score |
| GET | `/api/v1/media/platforms` | Get Google and Meta comparison rows |
| GET | `/api/v1/media/campaigns` | Get campaign table, filters, top campaigns, and ROAS chart rows |
| GET | `/api/v1/media/brands` | Get brand-level spend and site results |
| GET | `/api/v1/media/segments` | Get segment-level spend and site results |
| GET | `/api/v1/media/reconciliation` | Compare platform claims and site purchases |
| GET | `/api/v1/media/funnel` | Get site funnel totals and rates |
| GET | `/api/v1/media/organic-demand` | Get organic trends and groupings |
| GET | `/api/v1/media/audit/calculations/platform-cac` | Show the exact platform CAC calculation inputs |
| GET | `/api/v1/media/imports` | List import batches |
| GET | `/api/v1/media/imports/:batchId` | Get one import batch |
| POST | `/api/v1/media/import` | Validate and import an XLSX or ZIP package |

## Base URL and response format

Local base URL:

```text
http://localhost:5000/api/v1
```

Successful requests use this envelope:

```json
{
  "success": true,
  "message": "Media overview fetched successfully",
  "data": {}
}
```

Errors use a stable `code` and human-readable `message`. Invalid query parameters return `VALIDATION_ERROR`.

Error response:

```json
{
  "success": false,
  "message": "Request validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  }
}
```

## Reporting filters

Most analytics routes accept:

| Parameter | Type | Rules |
| --- | --- | --- |
| `year` | integer | 2000-2100 |
| `month` | integer | 1-12; requires `year` |
| `segment` | string | Exact Segment label from the spreadsheet-backed `/segments` response |
| `brand` | string | Exact Brand label from the spreadsheet-backed `/brands` response |

Examples:

```http
GET /api/v1/media/overview?year=2026&month=8
GET /api/v1/media/overview?year=2026&month=8&segment=Fashion&brand=Rivoli
GET /api/v1/media/overview?year=2026
GET /api/v1/media/overview
```

No filter means all available imported periods. A year without a month means all available months in that year. Leaving `segment` empty means All Segments. Leaving `brand` empty means All Brands inside the current period or selected Segment. The server aggregates additive inputs first and then recalculates ratios.

## Periods and dropdowns

```http
GET /api/v1/media/periods
```

Returns the available years and months used by the dashboard dropdowns. Each month contains:

- `month`, `label`, and `sourcePeriodLabel`
- `available`
- `partial`
- `startDate` and `endDate`

The client chooses the latest complete month by default. Segment starts at `All Segments`, and Brand starts at `All Brands`. `/segments` supplies every spreadsheet-backed Segment for the period. `/brands` supplies every spreadsheet-backed Brand for the period or only Brands inside a selected Segment. Selecting All leaves that query parameter out of the URL. Changing Segment resets Brand to `All Brands` before loading the valid Brand list.

## Overview cards

```http
GET /api/v1/media/overview?year=2026&month=8
```

The response contains `metrics` and `metadata`.

Important `metrics` fields:

| Field | Formula or source | Meaning |
| --- | --- | --- |
| `directionalReturn` | site revenue / total paid spend | Requested Blended ROAS card; directional, not attributed paid ROAS |
| `referenceMediaScore` | weighted average of the three displayed benchmark scores at 40/30/30 | HTML-reference score displayed in the Media navigation pill; not the official six-component Media score |
| `platformClaimedCac` | total paid spend / Google plus Meta claims | Requested Blended CAC card; not new-customer CAC |
| `cacAovRatio` | platform-claimed CAC / site AOV | CAC card supporting line and score input |
| `blendedCtr` | (Google interactions + Meta link clicks) / paid impressions | Requested Blended CTR card with mixed-action caveat |
| `platformClaims` | Google claimed conversions + Meta claimed purchases | Requested Platform conversions card |
| `paidImpressions` | Google impressions + Meta impressions | CTR supporting line |
| `paidTrafficActions` | Google interactions + Meta link clicks | CTR numerator |
| `totalSpend` | Google spend + Meta spend | Spend supporting line |
| `siteRevenue` | reconciled site revenue | Directional-return numerator |
| `sitePurchases` | reconciled site purchases | Platform-conversion comparison |

Reference Media score:

```text
Reference Media Score = (Blended ROAS Score x 40 + CAC/AOV Score x 30 + Blended CTR Score x 30) / sum of available weights
```

Metric objects include `value`, `status`, `formula`, and `definition`. The three reference-card metrics also include `benchmarkScore` when calculable.

Reference-card benchmark formula:

```text
score = clamp(round((value - bad) / (good - bad) * 100), 2, 100)
```

| Card | Bad | Good |
| --- | ---: | ---: |
| Blended ROAS / Directional Return | 1.00x | 4.00x |
| CAC as a share of AOV | 100% | 30% |
| Blended CTR | 0.50% | 2.00% |

These card scores reproduce the HTML reference method. They are not the official Media score, which remains unavailable because the full approved score inputs are absent.

## Platform table

```http
GET /api/v1/media/platforms?year=2026&month=8
```

Each platform row returns:

- `platform`
- `spend` and `spendShare`
- `impressions`
- `interactions` and `clicks`
- `ctr` and `ctrLabel`
- `platformClaims` and `claimShare`
- `claimedCac`
- `directionalRevenue`
- `roas`
- `roasStatus`
- `roasBasis`

For Google Ads, `ctr` is the interaction rate. For Meta Ads, it is link CTR. Platform `directionalRevenue` allocates each segment's reconciled site revenue between Google and Meta by their paid-spend share within that segment. Platform `roas` divides this non-overlapping allocation by platform spend. It is not verified platform-attributed revenue.

When detailed platform rows are absent but the supplied stage summary explicitly reports zero spend, spend, impressions, and claims are returned as `0`; denominator-based rates remain `null`. If neither detailed rows nor an explicit zero-activity control exists, the platform values are `null`. Missing data is never converted to zero.

## Campaign detail

```http
GET /api/v1/media/campaigns?year=2026&month=8&platform=Google%20Ads&page=1&limit=20&sort=spend&order=desc
```

Optional filters:

- `platform`: `Google Ads` or `Meta Ads`
- `brand`
- `segment`
- `stage`
- `campaignType`
- `page`: positive integer, default `1`
- `limit`: 1-100, default `20`
- `sort`: `spend` or `campaign`
- `order`: `asc` or `desc`

The response contains `campaigns`, `topCampaigns`, `roasCampaigns`, `pagination`, available filter values, and period metadata. Campaign impressions/actions/response rate are returned where the source campaign sheet provides them.

Meta monthly campaign rows are derived within each brand: that brand's monthly Meta spend, impressions, link clicks, and platform claims are allocated according to each campaign's share of the brand's supplied nine-month campaign spend. These fields reconcile at both brand and monthly platform level and include `calculationBasis` explaining the derivation.

Campaign ROAS uses the mapped brand directional return, with segment and overall fallbacks:

```text
Mapped group site revenue / mapped group Google + Meta spend
```

`roasCampaigns` includes eligible rows where spend is greater than AED 300, sorted by ROAS. The API also returns `directionalRevenue`, `roasStatus`, and `roasBasis`. These values are directional revenue coverage, not verified campaign attribution. The dashboard shows up to 12 chart rows and uses a fixed 20-pixel horizontal-bar thickness so small result sets do not create oversized bars.

## Other analytics routes

```http
GET /api/v1/media/brands?year=2026&month=8
GET /api/v1/media/segments?year=2026&month=8
GET /api/v1/media/reconciliation?year=2026
GET /api/v1/media/funnel?year=2026&month=8
GET /api/v1/media/organic-demand?year=2026&market=Qatar
GET /api/v1/media/audit/calculations/platform-cac?year=2026&month=8
```

Brand and segment return values are directional. Each `/brands` and `/segments` row includes `directionalReturn`, `directionalReturnLevel`, `directionalReturnBasis`, `directionalReturnRevenue`, and `directionalReturnSpend`. The calculation order is exact Brand, mapped Segment, then overall period; Segment rows use exact Segment then overall period. The current nine-period source audit confirms that every returned Brand and Segment has a finite value. Negative values are preserved when reconciled revenue is negative because of returns. A future period with no paid spend at any level returns `null`.

The overview `directionalReturn` metric returns the same `calculationLevel`, `revenue`, `spend`, and formula text, so the card can show the exact basis used. Funnel data is site-wide. Organic metrics remain separate from paid-media calculations. The calculation-audit endpoint exposes the exact CAC inputs, formula, raw result, display result, source periods, and source batches.

## Import API

```http
POST /api/v1/media/import
Content-Type: multipart/form-data
```

Form fields:

| Field | Required | Description |
| --- | --- | --- |
| `package` | yes | One `.xlsx` workbook or a `.zip` package |
| `replaceExisting` | no | Set to string `true` only for a deliberate corrected-period replacement |

Example with curl:

```cmd
curl.exe -X POST http://localhost:5000/api/v1/media/import -F "package=@C:\data\rivoli-media-2026-10.zip"
```

Corrected-period replacement:

```cmd
curl.exe -X POST http://localhost:5000/api/v1/media/import -F "package=@C:\data\rivoli-media-2026-10-corrected.zip" -F "replaceExisting=true"
```

Import history:
Import reconciliation has two severities:

- `ERROR` checks cover site controls, platform stage-spend totals, and Google campaign-to-month totals. A failed error check blocks persistence.
- `WARNING` checks compare Brand Plot paid-spend and claims controls with the detailed monthly platform sheets. Warnings are stored on the batch and returned in metadata, while displayed calculations remain based on the detailed monthly rows.


```http
GET /api/v1/media/imports
GET /api/v1/media/imports/:batchId
```

## Error codes

| Code | Meaning |
| --- | --- |
| `UNSUPPORTED_FILE` | Package is not `.xlsx` or `.zip` |
| `MISSING_WORKBOOK` | No usable workbook was supplied |
| `MISSING_SHEET` | Required workbook structure was not found |
| `DUPLICATE_IMPORT` | The package includes an already imported period |
| `RECONCILIATION_FAILED` | A blocking site-control, stage-spend, or Google campaign-total check failed |
| `DATABASE_UNAVAILABLE` | MongoDB is not available for persistence |
| `VALIDATION_ERROR` | Query or input validation failed |
| `IMPORT_NOT_FOUND` | The requested batch does not exist |

## Data-status rules

- `VERIFIED`: reconciled source outcome.
- `DERIVED`: calculated from supported source fields.
- `DIRECTIONAL`: useful ratio without verified paid attribution.
- `PLATFORM_CLAIMED`: advertising-platform claim, not a verified site order.
- `UNAVAILABLE`: required source inputs are absent.

Zero or invalid denominators return `null`; the client renders `N/A`.

`metadata.warnings` contains cross-workbook control differences detected for the supplied package. These warnings do not feed calculations and do not replace detailed monthly values.

## Related documents

- [Implementation and data flow](MEDIA_IMPLEMENTATION_FLOW.md)
- [Formulas and spreadsheet sources](MEDIA_FORMULAS_AND_SOURCES.md)
- [Monthly data import](MEDIA_MONTHLY_IMPORT.md)
- [Project README](../../README.md)

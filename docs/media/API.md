# Media API List

Base URL:

`http://localhost:5000/api/v1/media`

Successful responses use this structure:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": {}
}
```

## Common filter parameters

| Parameter | Meaning |
| --- | --- |
| `year` | Reporting year, for example `2026` |
| `month` | Month number from `1` to `12`; requires `year` |
| `segment` | Selected business Segment |
| `brand` | Selected Brand |

Example:

`GET /overview?year=2026&month=8&segment=Swiss&brand=Certina`

## Read APIs

| Method and route | Purpose |
| --- | --- |
| `GET /periods` | Returns available years, months, date coverage, and partial-period status |
| `GET /overview` | Returns headline metrics, formulas, status labels, warnings, and reference score |
| `GET /platforms` | Returns Google Ads and Meta Ads spend, impressions, claims, CAC, CTR, and directional return |
| `GET /campaigns` | Returns campaign details and campaigns eligible for the ROAS chart |
| `GET /brands` | Returns calculated Brand performance and directional-return basis |
| `GET /segments` | Returns calculated Segment performance and directional-return basis |
| `GET /reconciliation` | Compares platform-claimed conversions with site purchases and source controls |
| `GET /funnel` | Returns item views, add-to-cart, purchases, revenue, and funnel rates |
| `GET /organic-demand` | Returns organic clicks, impressions, CTR, brands, segments, markets, and trends |
| `GET /audit/calculations/platform-cac` | Returns inspectable CAC inputs and calculation results |
| `GET /imports` | Lists stored import batches |
| `GET /imports/:batchId` | Returns one import batch and its validation result |

## Campaign-only parameters

`GET /campaigns` also supports:

| Parameter | Accepted values |
| --- | --- |
| `platform` | `Google Ads` or `Meta Ads` |
| `stage` | Source campaign stage |
| `campaignType` | Source campaign type |
| `page` | Positive page number; default `1` |
| `limit` | `1` to `100`; default `20` |
| `sort` | `spend` or `campaign` |
| `order` | `asc` or `desc` |

`GET /organic-demand` also supports `market`.

## Import API

### `POST /import`

Uploads one `.xlsx` workbook or one `.zip` package containing `.xlsx` workbooks.

Request type: `multipart/form-data`

| Field | Meaning |
| --- | --- |
| `package` | Required workbook or ZIP file |
| `replaceExisting` | Optional string `true` when a validated period must be deliberately replaced |

MongoDB must be connected for uploads. Source-backed read mode remains available when MongoDB is offline, but an upload returns `DATABASE_UNAVAILABLE`.

## Common errors

| Error | Meaning |
| --- | --- |
| `400 VALIDATION_ERROR` | Query values are invalid, such as a month without a year |
| `400 MISSING_WORKBOOK` | No file or no workbook was supplied |
| `415 UNSUPPORTED_FILE` | File is not `.xlsx` or `.zip` |
| `422 RECONCILIATION_FAILED` | Critical workbook totals do not match normalised totals |
| `503 DATABASE_UNAVAILABLE` | MongoDB is required for the requested import operation |

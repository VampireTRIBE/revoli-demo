# BizCom Media Server

The server validates monthly Media packages, normalizes source rows, reconciles important totals, persists import history in MongoDB, calculates supported analytics, and exposes the versioned REST API consumed by the React client.

## Technology

- Node.js and Express
- TypeScript
- MongoDB and Mongoose
- Zod validation
- Multer uploads
- SheetJS workbook parsing
- ADM-ZIP extraction
- Vitest and Supertest

## Setup

From the repository root:

```cmd
npm.cmd install
copy server\.env.example server\.env
npm.cmd run dev --workspace server
```

Default environment:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bizcom-engine
CLIENT_ORIGIN=http://localhost:5173
MAX_UPLOAD_SIZE_MB=50
```

The API runs at `http://localhost:5000/api/v1`.

## Source-backed read mode

At startup the server attempts to connect to MongoDB. If MongoDB is unavailable, analytics endpoints continue in read-only mode using the supplied files under `spreadsheets data/creative-tab`, `spreadsheets data/compititaion-tab`, and `spreadsheets data/media-tab`. This makes the included datasets inspectable without weakening the import contract.

Uploads and corrected-period replacement require MongoDB. The import endpoint returns `DATABASE_UNAVAILABLE` when persistence is not available.

## API routes

| Method | Route | Query or request | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | None | Service health |
| GET | `/media/periods` | None | Available imported years and months |
| GET | `/media/overview` | `year`, `month` | KPI inputs and calculated metrics |
| GET | `/media/platforms` | `year`, `month` | Spend, claims, shares, and claimed CAC |
| GET | `/media/campaigns` | Period, platform, brand, segment, stage, type, pagination, sort | Campaign spend analytics |
| GET | `/media/brands` | `year`, `month` | Brand economics |
| GET | `/media/segments` | `year`, `month` | Segment economics |
| GET | `/media/reconciliation` | `year`, `month` | Claims-versus-site diagnostic and checks |
| GET | `/media/funnel` | `year`, `month` | Site funnel totals and rates |
| GET | `/media/organic-demand` | `year`, `month`, `market` | Organic brand, segment, market, and trend data |
| GET | `/media/audit/calculations/platform-cac` | `year`, `month` | Inspectable formula, inputs, raw result, and display result |
| GET | `/media/imports` | None | Import history |
| GET | `/media/imports/:batchId` | Batch ID | One import batch |
| POST | `/media/import` | Multipart `package`; optional `replaceExisting=true` | Validate and persist a package |

All routes use the `/api/v1` prefix.

## Standard response

Successful analytics responses follow:

```json
{
  "success": true,
  "message": "Media overview fetched successfully",
  "data": {}
}
```

Errors include a stable code:

```json
{
  "success": false,
  "message": "Critical source totals did not reconcile.",
  "error": {
    "code": "RECONCILIATION_FAILED",
    "details": []
  }
}
```

Import-related error codes include `UNSUPPORTED_FILE`, `MISSING_WORKBOOK`, `MISSING_SHEET`, `DUPLICATE_IMPORT`, `RECONCILIATION_FAILED`, and `DATABASE_UNAVAILABLE`.

## Import processing

```text
Upload
  -> ZIP extraction when required
  -> workbook and sheet detection
  -> required structure validation
  -> normalized period detection
  -> row parsing and label preservation
  -> data-quality checks
  -> source reconciliation
  -> duplicate-period check
  -> transactional insert or replacement
```

The imported package is handled in a temporary directory and removed after processing. A duplicate period is rejected unless the request explicitly enables replacement.

## Collections

- `mediaimportbatches`: batch status, files, periods, warnings, errors, and reconciliation summary
- `mediaplatforms`: normalized monthly Google and Meta brand-level spend and claims
- `mediasites`: normalized monthly brand-level site funnel and revenue
- `mediacampaigns`: campaign mapping and spend detail
- `mediaorganics`: organic brand and market demand records

Common indexes cover batch ID, period key, year/month/platform, year/month/brand, year/month/segment, campaign, and market.

## Calculation rules

Business formulas live under `src/modules/media/calculations` and `src/modules/media/services`, not in routes or controllers.

- Divisions return `null` for zero or invalid denominators.
- Intermediate results are not rounded.
- Display rounding is applied after the calculation.
- Yearly ratios use yearly numerator and denominator totals.
- Monthly ratios are never averaged to produce annual ratios.
- Platform claims remain platform-claimed; they are not treated as verified orders.
- Site revenue remains directional relative to media spend.

## Commands

```cmd
npm.cmd run dev --workspace server
npm.cmd run build --workspace server
npm.cmd test --workspace server
npm.cmd run lint --workspace server
```

## Main source locations

```text
src/config/                    Environment and database connection
src/middleware/                Error and not-found middleware
src/modules/media/calculations Server-owned formulas
src/modules/media/controllers  HTTP request handling
src/modules/media/import       Parsing, validation and reconciliation
src/modules/media/models       MongoDB schemas and indexes
src/modules/media/repositories Persistence access
src/modules/media/routes       Versioned Media routes
src/modules/media/services     Filtering, aggregation and API payloads
src/modules/media/types        Domain contracts
src/modules/media/validators   Query validation
tests/                         Calculation, parser and API tests
```

# BizCom Engine Analytics

BizCom Engine Media Analytics is a source-backed monthly media reporting application for Rivoli. It imports the agreed Excel or ZIP package, validates and normalizes the data, reconciles important totals, stores imported history in MongoDB, calculates supported analytics on the server, and presents them through a responsive React dashboard.

This repository implements the **Creative, Competition, and Media tabs**. The supplied `GP-BizCom-Dashboard.html` controls the Creative and Media visual direction, while the supplied workbooks, CSV exports, and business briefs control the data definitions and analytical limits.

The application calculates paid impressions, Blended CTR, and directional platform, campaign, Segment, and Brand ROAS from the available sheet data. Brand ROAS uses exact Brand data, then mapped Segment, then overall-period fallback; Segment ROAS uses exact Segment then overall-period fallback. ROAS is not presented as verified paid attribution. The application does not fabricate new-customer CAC, traffic quality, plan adherence, or an official Media score when the required inputs are absent.

## Documentation

- [Creative, Competition, and Media implementation guide](BIZCOM_TABS_IMPLEMENTATION.md)
- [Implementation and data flow](docs/documentation/MEDIA_IMPLEMENTATION_FLOW.md)
- [Formulas, spreadsheet sources, and accuracy](docs/documentation/MEDIA_FORMULAS_AND_SOURCES.md)
- [Media UI labels, data sources, and formulas](docs/documentation/MEDIA_UI_LABELS_DATA_SOURCES.md)
- [Creative UI labels, data sources, and formulas](docs/documentation/CREATIVE_UI_LABELS_DATA_AND_FORMULAS.md)
- [Creative tab implementation and monthly workflow](docs/documentation/CREATIVE_TAB_IMPLEMENTATION.md)
- [Monthly data update and import](docs/documentation/MEDIA_MONTHLY_IMPORT.md)
- [API list and request flow](docs/documentation/MEDIA_API.md)
- [Detailed technical reference](docs/documentation/MEDIA_IMPLEMENTATION.md)
- [Client application guide](client/README.md)
- [Server and API guide](server/README.md)
- [Original implementation specification](docs/prompt.md)

## What the Media page shows

The selected year, month, Segment, and Brand control every section on the page. `All Segments` and `All Brands` are the defaults. Selecting a Segment limits the Brand list to values available inside that Segment. Each Segment and Brand option shows its calculated ROAS and labels Segment or Overall fallback when exact paid-spend coverage is unavailable.

- Overview cards show Blended ROAS, Blended CAC, Blended CTR, and platform conversions.
- The platform table compares Google Ads and Meta Ads.
- Campaign ROAS shows campaigns with spend above AED 300.
- Campaign Detail provides separate Meta and Google tabs.
- The score table explains the three reference benchmark scores.
- Attribution notes explain why platform claims and site purchases can be different.
- Additional APIs provide brand, segment, funnel, reconciliation, and organic results.

Every displayed number comes from a spreadsheet field or a server formula documented in [Formulas, spreadsheet sources, and accuracy](docs/documentation/MEDIA_FORMULAS_AND_SOURCES.md).

## What the Creative page shows

The selected Year, Month, and Brand control the Creative page. Union Coop has post-level Instagram data; Souq Al Bahar and Souq Al Jubair currently show an informative unavailable state because their exports contain account totals rather than individual posts.

- Organic and Paid subtabs preserve the reference layout.
- Eligible Posts and Reels are ranked by active engagement rate.
- Organic metrics use reach, views, shares, saves, comments, and available watch time from the selected canonical CSV export.
- Pocari Sweat has five paid Meta detail records for the whole 1 January to 1 October 2026 export. Paid CTR, reach, impressions, spend rankings, and partial detail are available under `All months`; missing earned-action, ThruPlay, and Google Shopping inputs remain `N/A`.
- September is labelled as a partial source period.
- Reference scoring uses the unchanged HTML formulas by default and can be hidden with `CREATIVE_SCORING_MODE=disabled`.

The full source mapping, duplicate rule, formulas, APIs, and monthly update process are documented in [Creative tab implementation and monthly workflow](docs/documentation/CREATIVE_TAB_IMPLEMENTATION.md).

## Architecture

```text
Monthly Excel or ZIP package
            |
            v
Express upload API and Multer
            |
            v
Workbook detection and SheetJS parsing
            |
            v
Schema validation and period normalization
            |
            v
Source reconciliation and duplicate checks
            |
            v
MongoDB normalized records and import batches
            |
            v
Server calculation and aggregation services
            |
            v
Versioned REST APIs
            |
            v
React, TanStack Query, Recharts dashboard
```

The client and server are separate applications managed from one npm workspace.

## Technology stack

### Client

- React and TypeScript
- Vite
- Tailwind CSS plus application CSS
- React Router
- TanStack Query
- Axios
- Recharts

### Server

- Node.js, Express, and TypeScript
- MongoDB and Mongoose
- Zod
- Multer
- SheetJS
- ADM-ZIP
- Vitest and Supertest

## Project structure

```text
.
|-- client/
|   |-- src/
|   |   |-- api/
|   |   |-- features/media/
|   |   |-- layouts/
|   |   |-- pages/
|   |   |-- styles/
|   |   `-- types/
|   |-- .env.example
|   |-- package.json
|   `-- README.md
|-- server/
|   |-- src/
|   |   |-- config/
|   |   |-- data/
|   |   |-- middleware/
|   |   |-- modules/media/
|   |   `-- utils/
|   |-- tests/
|   |-- .env.example
|   |-- package.json
|   `-- README.md
|-- docs/
|   |-- documentation/
|   |   |-- CREATIVE_UI_LABELS_DATA_AND_FORMULAS.md
|   |   |-- MEDIA_API.md
|   |   |-- MEDIA_FORMULAS_AND_SOURCES.md
|   |   |-- MEDIA_IMPLEMENTATION.md
|   |   |-- MEDIA_IMPLEMENTATION_FLOW.md
|   |   `-- MEDIA_MONTHLY_IMPORT.md
|   `-- prompt.md
|-- package.json
`-- README.md
```

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- MongoDB 7 or later for persisted imports

MongoDB is required to complete uploads. The API can still start in source-backed read mode when MongoDB is unavailable; in that mode it reads the supplied files in `spreadsheets data/creative-tab`, `spreadsheets data/compititaion-tab`, and `spreadsheets data/media-tab` so the dashboards remain inspectable.

## Installation

From the repository root:

```cmd
npm.cmd install
```

Create environment files:

```cmd
copy server\.env.example server\.env
copy client\.env.example client\.env
```

Default server configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bizcom-engine
CLIENT_ORIGIN=http://localhost:5173
MAX_UPLOAD_SIZE_MB=50
```

Default client configuration:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## MongoDB setup

Start a local MongoDB instance and keep the default connection string, or set `MONGODB_URI` in `server/.env` to the intended database.

Do not commit real credentials. For a hosted database, restrict network access and use a database user with only the permissions required by this application.

## Development

Start client and server together:

```cmd
npm.cmd run dev
```

Or start them independently:

```cmd
npm.cmd run dev --workspace server
npm.cmd run dev --workspace client
```

Local URLs:

- Dashboard: `http://localhost:5173/media`
- Import screen: `http://localhost:5173/media/import`
- API health: `http://localhost:5000/api/v1/health`

## Build

```cmd
npm.cmd run build
```

This compiles the TypeScript server and creates the client production bundle.

## Testing and linting

```cmd
npm.cmd test
npm.cmd run lint
```

Run one workspace only when diagnosing a specific layer:

```cmd
npm.cmd test --workspace server
npm.cmd run build --workspace client
```

## Main API routes

All Media routes use the base path `http://localhost:5000/api/v1/media`.

| Route | Use |
| --- | --- |
| `GET /periods` | Dropdown years and months |
| `GET /overview` | Main cards and reference score |
| `GET /platforms` | Google and Meta comparison |
| `GET /campaigns` | Campaign table and ROAS chart |
| `GET /brands` | Brand performance |
| `GET /segments` | Segment performance |
| `GET /reconciliation` | Platform claims compared with site purchases |
| `GET /funnel` | Site funnel |
| `GET /organic-demand` | Organic demand |
| `POST /import` | Monthly XLSX or ZIP import |

See [API list and request flow](docs/documentation/MEDIA_API.md) for parameters, response fields, import history, and errors.

## Monthly import workflow

1. Receive the agreed monthly Excel workbooks or ZIP package.
2. Open `http://localhost:5173/media/import`.
3. Choose the `.xlsx` workbook or `.zip` package.
4. The server detects the contained workbooks and sheets.
5. Required columns, periods, numeric fields, and supported structures are validated.
6. Rows are normalized while retaining source business labels and lineage.
7. Site totals are compared with the workbook reconciliation controls.
8. Existing periods are rejected unless deliberate replacement is enabled.
9. Valid data is written in a MongoDB transaction.
10. The new period appears automatically in the dashboard filters.

## Correcting an imported month

Use **Replace existing period** only after the corrected package has been prepared. The server validates and reconciles the new data before opening the replacement transaction. It then removes the old period and inserts the replacement atomically. A failure rolls the transaction back so the database is not left half-replaced.

## Reporting behavior

- Year and month options are derived from successfully available data.
- Segment options come from the selected period. Brand options come from the selected period or selected Segment. Each option includes its directional ROAS and fallback basis.
- `All Segments` and `All Brands` are selected by default.
- Specific Segment and Brand selections are stored in the URL, for example `/media?year=2026&month=8&segment=Fashion&brand=Rivoli`. Selecting an All choice omits that dimension parameter.
- September 1-10, 2026 is stored and displayed as a partial period.
- Full-year ratios are recalculated from aggregated numerators and denominators. Monthly ratios are never averaged.
- Server code owns all authoritative business calculations.
- Zero denominators produce `null`; the client displays `N/A` instead of `NaN` or infinity.

## Important limitations

The current files support advertising spend, platform claims, reconciled site funnel and revenue, campaign classification and spend, brand and segment reporting, and organic demand.

They do not support verified paid attribution or the full approved six-component Media score. See [Unsupported metrics](docs/documentation/MEDIA_IMPLEMENTATION.md#unsupported-metrics) for the complete list and required future inputs.

## Data handling

- Source business labels are retained.
- Every normalized analytical row records its batch, source file, source sheet, source row, and normalized period where practical.
- Raw workbooks are not sent to the browser.
- The server returns aggregated dashboard data.
- Import logs contain operational events, not complete source datasets or credentials.

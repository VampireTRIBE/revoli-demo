# BizCom Media Client

The client is the responsive Media dashboard and monthly import interface for BizCom Engine. It renders only server-provided analytics and does not reproduce business formulas in React components.

## Technology

- React with strict TypeScript
- Vite
- React Router
- TanStack Query
- Axios
- Recharts
- Tailwind CSS and shared application CSS

## Setup

From the repository root:

```cmd
npm.cmd install
copy client\.env.example client\.env
npm.cmd run dev --workspace client
```

The client runs at `http://localhost:5173`.

Environment variable:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Routes

| Route | Purpose |
| --- | --- |
| `/media` | Media analytics dashboard |
| `/media?year=2026&month=8` | A specific imported month |
| `/media?year=2026` | All imported months in a selected year |
| `/media/import` | Validated workbook or ZIP import workflow |

## Dashboard modules

- Period status and year/month filters
- Directional Return
- Platform-Claimed CAC
- Claims vs Site
- Platform Claims
- Platform comparison
- Top Campaigns by Spend
- Meta and Google campaign details
- Attribution reconciliation and monthly trend
- Brand performance
- Segment performance
- Site funnel
- Organic demand by period, brand, segment, and market
- Media Score Not Available notice

## State management

TanStack Query owns server state. Query keys include the selected reporting period, for example:

```ts
['media', 'overview', { year: 2026, month: 8 }]
```

The URL is the shared Media filter state. Changing a filter updates the URL and all dependent queries, preventing different dashboard modules from reporting different periods.

## Loading and failure states

Each server-backed module provides loading, error, empty, and success behavior. Empty periods show an explicit no-data message rather than manufactured zero analytics.

## Metric presentation

Status badges distinguish:

- `VERIFIED`
- `DERIVED`
- `DIRECTIONAL`
- `PLATFORM CLAIMED`
- `PARTIAL`
- `UNAVAILABLE`

Calculated metric cards expose the server formula and interpretation through accessible tooltips. Unsupported paid-media measures are omitted rather than inferred from organic data.

## Responsive behavior

- Four KPI cards on wide desktops
- Two KPI cards on tablet-sized layouts
- One KPI card on narrow mobile layouts
- Stacked filters on mobile
- Scroll containers around wide tables
- No intentional page-level horizontal scrolling

## Accessibility

The client uses semantic headings, native selects, table headers, focus-visible styling, labelled tabs, readable status text, and text values alongside charts. Color is not the sole carrier of meaning.

## Commands

```cmd
npm.cmd run dev --workspace client
npm.cmd run build --workspace client
npm.cmd test --workspace client
npm.cmd run lint --workspace client
```

## Main source locations

```text
src/api/                         HTTP client
src/features/media/components/  Dashboard and import components
src/features/media/hooks/       TanStack Query hooks
src/features/media/services/    REST API calls
src/features/media/utils/       AED, number, percent and ratio formatting
src/layouts/                     Application shell
src/pages/                       Route-level pages
src/styles/                      Shared responsive styling
src/types/                       API contracts
```


# GEO Dashboard Implementation | 5 November 2026

## What changed

Added a standalone **GEO** navigation tab at `/geo`. The screen uses the same graphite, paper-grey and white visual system as the Creative tab. The existing **What the market is asking** section is retained at the bottom of Union Coop Creative.

New code:
- `client/src/pages/GeoDashboardPage.tsx`: interactive, workbook-backed GEO dashboard.
- `client/src/styles/geo.css`: desktop and mobile styles, isolated to GEO so Media and Consumer are unchanged.

Updated routing and startup:
- `client/src/App.tsx`: `/geo` page route.
- `client/src/layouts/AppLayout.tsx`: GEO navigation and source-aware heading.
- `client/src/main.tsx`: GEO styles imported after the common theme.

The server's previously added `/api/v1/creative/cleo?brand=union-coop[&captureDate=YYYY-MM-DD]` API is reused without a second data parser or a new unverified data source.

## Data provenance and populated panels

Source workbook: `spreadsheets data/creative-tab/UnionCoop-CLEO-Market-Import.xlsx`.

| GEO UI | API field / source sheet | Reporting window |
| --- | --- | --- |
| Share of AI voice, brand comparison, category filter/table | `allTopics`, `topics`: Share of Voice by Topic | 28 days |
| Recommendation rate | `funnel`: Visibility Funnel | Latest week |
| Union Coop citation rank, domain count, share/trend | `domains`: Citation Domains | 90 days |
| Tracked questions with search, cited/not cited filter | `questions`, `questionSummary`: Market Questions | 30 days |
| Visibility funnel stage bars | `funnel`: Visibility Funnel | Latest week |
| Brand citation positions across four AI engines | `positions`, `engineSupport`: Position by Engine | 30 days |
| Citation domain table | `domains`: Citation Domains | 90 days |
| Market language phrase-frequency bars | `language`: Language of the Market | 7 days |

The current approved import (capture `2026-11-02`) contains 815 all-topic answers: Union Coop 3%, Carrefour 47%, LuLu 38%; 12 tracked Market Questions; a latest-week visibility funnel with 48 answers and 1 recommendation (2.1%). The result is populated at **runtime by the Express API reading the approved XLSX workbook**, not by hardcoded example values.

Every panel prints `Source: CLEO - single-source, not independently verifiable.` and its own reporting window. The page does not display any GEO Score, Sentiment column or threat labels, does not invent uplift/analytical bullets, and does not blend dissimilar periods. The tracked question card indicates **3 cited questions out of 12 listed**, not three wins; the import summary records that the separate 844-comparison sample has zero wins. It is not interpreted as a 3/844 win rate.

Only Union Coop is currently supported; the brand dropdown is intentionally disabled. Additional brands require approved new import files and a backend mapping. The capture selector automatically enables if multiple approved historical captures appear in the existing import API.

## Running

From repository root:

```bash
npm ci
npm run dev
```

Frontend: http://localhost:5173/geo

Backend API: http://localhost:5000/api/v1/creative/cleo?brand=union-coop

If the backend is not started or the workbook cannot be parsed, the page displays an explicit import error with a retry action, not fabricated fallback data.

## Validation and limitations

- TypeScript/TSX files were parsed with the globally available TypeScript compiler API: no syntax diagnostics.
- CSS was parsed using PostCSS: no syntax errors.
- The existing seven-sheet CLEO source structure and key values were already independently recorded in `docs/CLEO_SOURCE_VALIDATION.json`.
- `npm ci --offline --ignore-scripts --no-audit --no-fund` was attempted and failed with `ENOTCACHED` because packages (including zod) were not available in the npm cache.
- An application TypeScript type-check, Vite build, Vitest suite, live browser test, and responsive screenshot validation could **not** be completed in this restricted environment. They are **not** marked as passing.
- The approved competitor capture and Souq v2 source gaps documented in `CREATIVE_IMPLEMENTATION_2026-11-05.md` are unchanged.

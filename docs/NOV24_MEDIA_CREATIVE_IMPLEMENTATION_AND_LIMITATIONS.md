# Bizcom Engine: Media + Creative November 18 requirements

Baseline: **Bizcom-Engine-V2-Nov23-Full-Updated(2).zip** (the ZIP newly supplied by the user). Updated November 24, 2026.

## Architecture preserved

- Existing `client/`, `server/`, npm workspaces, Express routes, React pages, `spreadsheets data/`, and optional existing repository behavior have been retained.
- **No Docker, Docker Compose, MongoDB migration, database requirement, new framework, or workspace restructuring was introduced.**
- Data sourced from existing workbooks continues to be parsed by the existing Express import layer. Optional future imports are discovered in the existing `spreadsheets data` folders.
- Existing Creative, Competition, Consumer, GEO/Search and Media modules remain in the archive.

## Sequence-wise requirement audit (source-level status)

| Document item | Implementation | Current status | Exact limitation |
|---|---|---|---|
| Media 1. GA4 v4 September/October and remove pending | Added optional GA4 v4 file adapter, `GET /api/v1/media/ga4-v4`, channel table, session/revenue monthly charts, net revenue and FTP summary display, month-selector support | **Blocked by input** | `Rivoli-Consumer-GA4-Import-v4.xlsx` not in supplied project; cannot verify its exact sheet schema or display real Sep/Oct data |
| Media 2. TBL signed Highlights | Existing `Reads` service is retained, with explicit Signed approval required; optional `TBL-Reads-Signed-Import.xlsx` supported without editing prior workbook | **Partial** | Existing Reads workbook contains authored sentences but **no Signed/Approved column**. Publishing those as signed would violate the spec |
| Media 3. Six-part section anatomy, KPI movement and spark bars | Existing five section headers retain exact label/question/definition; verified monthly history endpoint supports spend, site item revenue, coverage, cost/claimed conversion and site AOV with delta and eight-period bars; section highlight remains sign-off-gated | **Partial** | Not all KPI definitions have valid adjacent comparable periods; no arbitrary trend is generated; GA4 and signed hero content missing |
| Media 4. Objective from import and within-objective ranking | Existing explicit Objective handling retained; optional `Campaign Metadata` import can assign objective by exact platform/full campaign name; objective-specific ranking remains | **Partial** | Source workbooks in the ZIP lack complete approved Objective labels, so those campaigns remain unranked |
| Media 5. Campaign thumbnails, short names, hover originals | Optional `Campaign Metadata` short name and image mapping, safely served only from `server/data/media-campaign-assets`; original full campaign visible on hover | **Partial** | Approved campaign thumbnail images / mapping workbook absent; no fake images are displayed |
| Media 6. Union Coop reference Media view | Existing four-section Union Coop page retained; optional Burst and Daily Reach sheet adapter, spend/views/burst table and paid-confirmed daily reach bars | **Partial** | Verified Union Coop burst/spend and daily page reach sources absent. Reference PDF numerical examples are **not** data imports |
| Creative 1. Why It Worked import | Existing workbook parsing retained; Top 3 source-ranked cards now show real imported factors and short source captions rather than a repeated orange invented prose placeholder; real trend values added | **Partial** | Delivered workbook contains no **signed analyst why-it-worked sentences**. Facts display; no editorial prose is fabricated |
| Creative 2. Neutral Engagement heading | Existing neutral labels Output / Attention / Engagement / Top content retained | **Complete in source** | Still requires final browser visual QA |
| Creative 3. One signed highlight per section | Existing `SectionAnatomy` conditional bulb and date retained; pending shown once at tab level | **Partial** | Signed source records and section-linked approved sentences are missing |
| Creative 4. Change lines and eight-period spark bars | New monthly KPIs aggregated from the 278 prepared post metric rows. Eligible Posts/Reels (reach ≥500), reach, views, frequency, typical/best engagement, actions and giveaway/non-giveaway rates show source-backed histories. No delta on partial/non-adjacent periods | **Partial** | Metrics without comparable monthly observations cannot show a truthful delta. Output stories/watch-time lacks complete comparable source history |
| Creative 5. Union Coop verified October five-channel workbook | October remains unavailable; existing Jan-Sep source continues to display | **Blocked by input** | No verified five-channel October workbook was supplied; its authoritative sheet schema cannot be guessed |

**Totals:** 1 complete in source, 8 partial, 2 blocked by missing approved inputs. This does not certify production runtime behavior.

## Supplied workbooks inspected

`spreadsheets data/creative-tab/UnionCoop-Creative-WhyItWorked-Import.xlsx` includes:
- `Post Metrics (import)`: 278 content records.
- `Why It Worked - Monthly Top 3`: ranked cards covering Jan-Sep 2026, plus full-period rows.
- `Monthly Benchmarks`: month-level medians/frequency through September 2026.
- `Creative Cuts (import)`: source-classified factors and action breakdowns.
- **Not present:** a field containing approved signed editorial explanations.

`spreadsheets data/TBL-Reads-Import.xlsx` contains a `Reads` sheet with `Client`, `Section`, `Period`, `Order`, `Bullet`, `Linked card`, `Author`, `Date written`, but **no Signed or Approved field**. Unsigned editorial sentences remain unpublished.

Existing Meta/Google competition imports and captured thumbnails are preserved without alteration.

## Optional import contracts (only use approved source files)

1. **GA4 v4:** Put `Rivoli-Consumer-GA4-Import-v4.xlsx` in `spreadsheets data/media-tab/` (or existing `consumer-tab/`). The provisional adapter expects month in `Month`/`Period` (`YYYY-MM` or `Jan YYYY`) and channel rows with `Channel`/`Default channel group`, `Sessions` and `Revenue (AED)` or `Net revenue (AED)`. Summary rows can include `Net revenue (AED)`, `First-time purchasers`, and `Refunds (AED)`. The adapter has **not** been verified against the missing v4 file; update mapping to its actual provided schema before claiming complete.
2. **Highlights:** Add an explicit `Signed`/`Approved` column to an approved Reads workbook, or supply a full `TBL-Reads-Signed-Import.xlsx` with a `Reads` sheet and the existing columns plus signed state. The app never auto-approves legacy sentences. `Period` and `Linked card` must match the selected month and section.
3. **Campaign metadata:** Put an approved `.xlsx` workbook inside `spreadsheets data/media-tab/` with a sheet exactly named `Campaign Metadata`, containing `Platform` (`Meta Ads`/`Google Ads`), exact `Campaign` full name, `Objective` (`Conversion`/`Traffic`/`Awareness`), `Short name`, and `Thumbnail file`. Actual PNG/JPG/WebP images must exist under `server/data/media-campaign-assets/`. Only safe existing filenames are served; no stock thumbnails are substituted.
4. **Union Coop Media:** Put `UnionCoop-Media-Burst-Import.xlsx` in `spreadsheets data/media-tab/`, containing an approved `Bursts` sheet (`Month`, `Campaign`, `Platform`, `Objective`, `Spend (AED)`, `Public views`, `Known views`, `Boosted posts`, `Start date`, `End date`), and optionally `Daily Reach` (`Date` ISO, `Page reach`, `Paid confirmed`). These sheet names are a provisional contract, **not a claim** about the absent TBL workbook schema.
5. **Union Coop October Creative:** Provide the verified five-channel October workbook and its field specification. No October series or comparison should appear until the actual source is inspected and mapped. Do not substitute design mockup numbers.

## Code changes

- `server/src/modules/creative/services/creative.service.ts` and `types/creative.types.ts`: prepared month-level KPI aggregation and source provenance.
- `client/src/pages/CreativeDashboardPage.tsx`, `types/creative.ts`: consistent KPI/delta/spark presentation and source-only Top 3 captions and factors.
- `server/src/modules/media/services/media-supplements.service.ts`: optional GA4 v4 and Union Coop import adapters.
- `server/src/modules/media/services/media-analytics.service.ts`: per-month KPI histories, optional GA4 month discovery.
- `server/src/modules/media/routes/media.routes.ts`, `controllers/media.controller.ts`: supplemental source and history endpoints, protected approved-image static path.
- `server/src/modules/media/import/source-parser.ts`, `types/media.types.ts`, `models/media-record.models.ts`, `services/media-data.service.ts`: approved exact-match campaign fields across existing optional repository paths.
- `client/src/features/media/components/Ga4Channels.tsx`, `UnionCoopMediaSections.tsx`, `MediaHistory.tsx`: GA4 and Union Coop evidence panels, missing-source states, real-period comparisons.
- `client/src/features/media/components/CampaignSection.tsx`, `MediaConsumerAlignment.tsx`, `OverviewCards.tsx`: objectives, approved thumbnails, history, truthful first-time CAC when GA4 source exists.
- `client/src/pages/MediaDashboardPage.tsx`, `features/media/{hooks,services}`, `types/media.ts`, `styles/bizcom-v2.css`: wiring and responsive styling.
- `server/src/modules/reads/services/reads.service.ts`: optional signed import preference.
- `scripts/verify_media_creative_nov24.cjs`: dependency-free source contract check.

## Testing and remaining limits

- `npm run verify:media-creative`: passed 14 **static source-contract checks**.
- `npm run verify:creative`: passed the isolated Creative slot and error-state contract.
- TypeScript/TSX syntax: 123 files parsed successfully.
- CSS: 16 stylesheet files parsed without syntax errors.
- `npm ci --offline`: **failed** (`zod` package uncached).
- Online installation: did not complete; full `npm run build`, Vitest, integration and real Chromium React screenshots were **not** executed. Do not claim semantic TS compilation or browser regression passed.

## Local use, unchanged architecture

```bash
npm ci
npm run verify:creative
npm run verify:media-creative
npm run build
npm run dev
```

Existing local API and Vite ports and startup scripts remain unchanged. No Docker or new database setup is required by these changes. Existing optional Mongoose code from the uploaded baseline is preserved as-is.

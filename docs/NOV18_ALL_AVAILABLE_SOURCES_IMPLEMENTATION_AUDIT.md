# Bizcom Engine: November 18 Implementation and Source Audit

**Baseline:** `Bizcom-Engine-Nov24-Creative-API-Campaigns-Fixed-Full.zip`.

**Specification:** `Bizcom-Engine-Changes-Simple-18-Nov-2026.pdf` (three pages). Supporting reference: `Bizcom Engine Visual Refresh.pdf`, Competition Capture Import Spec V2 and Competition rendering reference, retained from baseline.

**Architecture:** Existing React/Vite + Express/TypeScript npm workspaces, spreadsheet-backed live reads, original file directory layout. No Docker, new database requirement, or new infrastructure. Optional historical Mongo media import still exists; the server does not require a Mongo connection to start.

## Changes made in this delivery

1. Hardened backend bootstrap. Failure to warm up Media spreadsheets no longer crashes the process and takes Creative/Consumer APIs offline. Mongo connection is attempted only when a URI has been explicitly configured.
2. Converted the `TblReadsStrip` into a **single, large serif, source-backed tab hero** only when an explicitly signed sentence exists. With no approved text, the user sees one compact pending line, not a fabricated statement or repeated cards.
3. Made the global section highlight band neutral, keeping positive/negative colors for changes and amber for awaiting states. Unsigned Highlights remain hidden.
4. Removed a generic editorial-style Creative hero and corrected its Output section's legacy title. Retained source-backed Monthly Benchmarks, Top 3, Creative Cuts, Stories, and histories.
5. Made the Media Spend/Return section independent of the old Consumer API when GA4 v4 is available. Missing legacy cohort data no longer hides the verified GA4/Media output. A missing GA4 month remains blank, not silently replaced by a different Consumer definition.
6. Removed repeated Union Coop burst tables from Media 01. Media 01 now displays only the approved burst summary; Media 03 holds the burst-level register. Awaiting state remains until the burst workbook is supplied.
7. Implemented a ready-to-use optional Union Coop monthly comment-type import for `.xlsx` or `.csv`, exposed as `GET /api/v1/consumer/union-comments?year=2026&month=10`. Four categories must have valid nonnegative counts; missing categories do not become zeros. The Consumer tab reads this endpoint without hard-coded figures.
8. Added separated Compare-against controls and dark, source-labelled competitor views to Consumer and Search, reusing the existing Competition UI. Media and Creative controls were retained.
9. Added 300ms source-backed GA4 and Media line/bar chart draw-once animations where supported, respecting reduced-motion preference. The existing CountUpValue already animates source-backed card values.
10. Added three proposed Vitest cases for the monthly comment import, a dependency-free November 18 source-contract verification script, and this audit.

## PDF requirements, original sequence

Definitions: **Implemented in source** means the source implementation exists and source-level checks pass, not a browser/production certification. **Partial** means incomplete coverage, missing approved data, or visual parity unverified. **Blocked** means the key approved source is absent.

| # | Requirement | Status | Evidence / limitation |
|---|---|---|---|
| M1 | Rivoli GA4 v4, September/October channels and charts | Implemented in source | Workbook exists with 10 monthly summaries and 17 channels each for Sep/Oct; `/media/ga4-v4` and GA4 cards/charts; no substituted Consumer values |
| M2 | Replace pending Highlights with imported sentences | Partial | Signed-only importer and hero work; available workbook has no explicit approval flags, so its text cannot be published as signed |
| M3 | Six-element section anatomy, comparative deltas and eight-period sparks | Partial | Headings, definitions, signed slot, and multiple KPI histories exist; not all KPIs have comparable source rows |
| M4 | Imported campaign Objective; separate rankings | Partial | Conversion/Traffic/Awareness separated when explicitly imported; existing platform rows often have no approved Objective |
| M5 | Campaign thumbnails, short names, hover full name | Partial | UI and optional asset mapping work, but approved campaign image package/metadata not provided |
| M6 | Union Coop Media reference build | Partial | Four-section structure, burst summary, daily page reach and detailed burst register; approved burst/daily paid reach input absent |
| C1 | Union Coop Why It Worked prepared import | Partial | Available Post Metrics, Monthly Top 3, Monthly Benchmarks and Creative Cuts; no explicitly signed analyst prose in supplied workbook |
| C2 | Neutral Creative section names, "Engagement" | Implemented in source | Output/Attention/Engagement/Top content labels and question/definition text |
| C3 | One signed Highlight per section; pending once per tab | Partial | Signed-only section and tab UI; no sign-off values available |
| C4 | Change line and eight-period sparks on eligible big KPIs | Partial | Monthly KPI histories for eligible Union Coop metrics and null gaps; source comparability limits remaining cards |
| C5 | Verified Union Coop October five-channel workbook | Blocked | Not supplied; October must not be fabricated from other sources |
| U1 | Consumer theme matches other tabs | Partial | Neutral colors and card styles, some legacy styles still need browser-level review |
| U2 | Union Coop "What customers are saying" | Partial | Validated optional CSV/XLSX import reader and UI; monthly approved source absent |
| U3 | Rivoli Consumer remains intact; order export awaiting | Implemented in source | Previous cohort logic retained, missing Thirty31North order source explicitly labelled |
| S1 | SEO head becomes Search, panels Classic/AI | Implemented in source | `/search` with Classic awaiting and existing GEO as AI |
| S2 | No separate GEO head; no GEO content lost | Implemented in source | `/geo` redirects into Search AI |
| K1 | Carrefour/LuLu Oct 1 and Nov 18 captured registers | Implemented in source | Both XLSX files present, 57 Carrefour and 54 LuLu rows in Nov capture; delta and theme readers preserved |
| K2 | Draft highlights only signed | Implemented in source | Explicit sign-off gate, no draft text published |
| K3 | Union Coop approved thumbnail wall | Partial | Approved image mapping and thin awaiting line; gallery archive absent |
| K4 | EDIT Meta capture 2, 68 ads, 15 thumbnails | Implemented in source | Preserved and source-checked |
| K5 | EDIT Google channel, Meta/Google chips | Implemented in source | Google workbook and channel controls preserved |
| K6 | Google approx 200 reported versus 30 sampled | Implemented in source | Separate census and sample labels/format breakdown, no performance inference |
| K7 | Compare-against separate on every head | Partial | Available on Media, Creative, Consumer and Search; other unpopulated placeholder heads not given a fabricated competitor view |
| K8 | Persistent dark competitor source strip | Implemented in source | Compare mode dark header states activity, not spend |
| V1 | One oversized signed serif hero per tab | Partial | Source-gated hero implemented for Media, Creative, Consumer; unavailable until signed Highlights supplied |
| V2 | Only approved client/competitor imagery | Implemented in source | Approved-only gallery/campaign image mapping; no stock imagery added |
| V3 | Thin amber awaiting states with reason/owner | Partial | Implemented for new source gaps, but some legacy empty-state components remain |
| V4 | Meaning-only green/red, Google navy and Meta gold | Partial | New neutral chrome and conditional delta states; full legacy chart/color sweep not browser-verified |
| V5 | Warnings as small on-card chips | Partial | Existing paid-confirmed and delivery chips preserved; not every legacy panel converted |
| V6 | One-time number/chart animation and raw rate counts | Partial | Existing 300ms CountUpValue, GA4 chart animation and many numerator/denominator labels; not comprehensive |

**Totals: 12 implemented in source, 17 partial, 1 blocked.** There are still unverified runtime and browser behaviors.

## Available approved input files retained

- `spreadsheets data/media/rivoli/Rivoli-Consumer-GA4-Import-v4.xlsx`
- `spreadsheets data/creative/union-coop/UnionCoop-Creative-WhyItWorked-Import.xlsx`
- `spreadsheets data/highlights/tbl/TBL-Reads-Import-Template-and-First-Fill.xlsx` (not signed)
- `spreadsheets data/competition/union-coop/Competition-Capture-UnionCoop-Carrefour-LuLu-01-Oct-2026.xlsx`
- `spreadsheets data/competition/union-coop/Competition-Capture-UnionCoop-Carrefour-LuLu-18-Nov-2026.xlsx`
- `spreadsheets data/competition/rivoli/EDIT-AdLibrary-Capture2-03Nov2026.xlsx`
- `spreadsheets data/competition/rivoli/EDIT-Google-Capture1-18Nov2026.xlsx`
- `spreadsheets data/competition/rivoli/EDIT-Capture2-Thumbnails.zip`
- Existing Consumer/CLEO/Pocari/Souq source data retained.

## Still missing or unapproved inputs

- Union Coop October verified five-channel Creative workbook.
- Union Coop burst spending and daily paid/organic page-reach import.
- Approved Carrefour/LuLu gallery thumbnail archive.
- Union Coop monthly comment-type export.
- Explicit sign-off on the available Highlights workbook and any future per-section Highlights v2 file.
- Approved campaign Objective, short-name and image asset mappings where the existing exports do not supply them.
- Brand-identity verification for Souq Al Haraj/Al Jubail if these differ from source-labelled Bahar/Jubair.
- Thirty31North order-level export for true Rivoli repeat-customer reporting.

## Runtime and test scope

- **Passed**: JavaScript source/data verification scripts, source-structure tests, 128 TS/TSX files parsed with zero syntax diagnostics, workbook inventories and prior EDIT gallery integrity tests.
- **Not passed/verified**: Full npm dependency installation (`zod` package unavailable offline), semantic TypeScript production build, Vitest suite, live API and browser rendering/responsiveness. No claim of production readiness is made.
- **Important**: The source-contract checker asserts source code/data availability, not functional correctness under a running browser.

### Run

```sh
npm ci
npm run verify:nov18
npm run verify:creative-v2
npm run verify:media-creative
npm run verify:competition-visual
npm run build
npm run test
npm run dev
```

If the API is unavailable, visit `http://localhost:5000/api/v1/health` and `http://localhost:5000/api/v1/creative/options` to distinguish a server-start problem from a UI problem. Do not run Vite by itself if the backend is expected at port 5000.

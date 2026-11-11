# Bizcom Engine Creative Implementation, 5 November 2026

## Delivery scope and honesty statement

This package contains **real edited source code** and the supplied CLEO workbook in the Creative tab directory. It does **not** claim every requirement is complete: verified imports for the Souqs, competitor captures and post thumbnails were not supplied, and dependency installation could not finish in the sandbox. Treat the package as an implementation candidate requiring ordinary `npm ci`, build, tests and browser QA before deployment.

The official November 2 change document is copied to `docs/Bizcom-Creative-Section-All-Changes-02-Nov.docx` for traceability.

## Exact changes

| File | Change |
|---|---|
| `server/src/modules/creative/cleo/cleo.types.ts` | Strongly typed imported CLEO context data. |
| `server/src/modules/creative/cleo/cleo-import.ts` | Workbook discovery, required sheets, strict numeric/date/window validation, data normalization, historical capture selection, conflict guards. |
| `server/src/modules/creative/routes/creative.routes.ts` | New GET `/api/v1/creative/cleo`. |
| `server/src/modules/creative/controllers/creative.controller.ts` | Request validation, 404 for unavailable capture, API envelope. |
| `server/tests/cleo-import.test.ts` | Snapshot, value, missing position, window and history tests. |
| `client/src/features/creative/cleo/cleo-types.ts` | Frontend contracts matching the JSON endpoint. |
| `client/src/features/creative/cleo/CleoMarketPanel.tsx` | Seven imported panels and a capture selector, rendered only for Union Coop. |
| `client/src/features/creative/cleo/cleo-market.css` | Unscored grey context visual treatment, responsive cards/tables. |
| `client/src/pages/CreativeDashboardPage.tsx` | Four-slot Creative layout, source-backed Union Coop cuts, Top 3 default, explicit unavailable fields, platform-scoped legacy daily data, competition placement, neutral styling. |
| `client/src/styles/reference-creative.css` | Neutral Creative-only sprint-two styling without altering Media/Consumer styling. |
| `client/src/features/reads/TblReadsStrip.tsx` | Highlights labels and pending copy. |
| `client/src/features/competition/components/ContextualCompetition.tsx` | Competition Highlights use capture month, four creative-lens slots with explicit source-data limitations. |
| `server/src/modules/creative/services/creative.service.ts` | Approved Souq brand options only, preserved legacy audit mapping, and disabled score exposure. |
| `server/src/modules/creative/config/creative-source.config.ts` | New approved Souq identity placeholders and disabled scoring. |
| `server/src/modules/creative/calculations/creative-calculations.ts` | No Creative component or composite score generated in app calculations. |
| `tools/validate_cleo_source.py` | Dependency-free raw XLSX structural acceptance check. |
| `spreadsheets data/creative-tab/UnionCoop-CLEO-Market-Import.xlsx` | Exact supplied source workbook, 2 November 2026 capture. |

Other source files, existing spreadsheet files, package workspaces, existing EDIT screenshots, and root lockfile are retained.

## Marker-by-marker acceptance record

**Complete** means code for the requirement has been implemented against the supplied source. This is not a claim of verified deployment. **Partial** means user-visible structure works but a specified input or approval is missing. **Blocked** means verified data is absent.

| Marker | Requirement | Status | Reason |
|---|---|---|---|
| 1 | Highlights rename everywhere | Complete | Shared strip changed; no old display heading in client source. |
| 2 | Union Coop Level 3 depth | Complete | Badge in shared Creative header. |
| 3 | Output & Effort, including published Stories and 79% finding | Partial | Existing prepared workbook lacks an all-published Stories/output table. Eligible Posts/Reels displayed with explicit qualifiers; Stories unavailable. |
| 4 | Reorder to four slots | Complete | All brands render four numbered slots. |
| 5 | Earned vs rented headline | Complete | Reads giveaway/non-giveaway values from period-scoped approved cuts. |
| 6 | Monthly trend begins Jan 2026 | Complete | Trend rows strictly filter year/month and begin at Jan. |
| 7 | Two single-axis trend panels | Complete | Frequency in Attention, engagement in Engagement; straight lines. |
| 8 | Real monthly Top 3 thumbnails | Partial | Verified export URLs used where present; top-three thumbnail asset package not supplied. |
| 9 | Top 3 default, full grid behind See all | Complete | Top 3 displayed, full Top/Core/Low grid in details. Analyst why-it-worked prose absent and explicitly pending. |
| 10 | Giveaway remains in cuts and feeds headline | Complete | Same `preparedInsights.cuts` source. |
| 11 | Follows demoted | Complete | Single support line in Attention from the same period cuts. |
| 12 | Competition selector switches brand capture | Partial | Wired existing selection/state; Union Coop Carrefour/LuLu capture files absent. |
| 13 | Competition Highlights keyed by capture month | Complete | Highlights now rendered only after a verified capture, with capture date year/month. |
| 14 | Four new competition creative lenses | Partial | Analyst theme mix present; text/artwork language, prize mechanics and like-period publishing data unavailable and shown as n/a. |
| 15 | Pocari depth badge and named export owner | Partial | Level 2 badge shown; TBL must supply the actual named owner. |
| 16 | Pocari Highlights pending | Complete | Shared Highlights component handles missing bullets. |
| 17 | Pocari four slots including AWAITING | Partial | Four slots exist and no paid/organic action mixing; full signed export and detail owner missing. |
| 18 | Verified Souq brand labels | Partial | Approved Haraj/Jubail appear as separate options; historical Bahar/Jubair data is intentionally not relabeled without mapping approval. |
| 19 | Souq four-slot post-level pages from v2 | Blocked | v2 52-record import absent; empty scaffold only. |
| 20 | Facebook/Instagram platform toggle | Partial | Verified legacy account data separated by platform. No approved post-level Souq v2 to populate new brand views. |
| 21 | Souq Top 3/bands and why-it-worked | Blocked | Approved v2 source and editorial sign-off absent. |
| 22 | Jubail September no-posts finding | Blocked | Approved imported per-brand/per-platform month records absent; no manufactured zero. |
| 23 | Cross-posting 4x context and organic-only assertion | Blocked | Requires approved v2 README figures. |
| 24 | Souq Level 2 depth | Partial | New brands remain honest Level 1/awaiting until approved per-post import exists. |

**Separate CLEO block:** Seven panels are coded and fed by the six actual data sheets (with one README sheet), with source/time-window notices and first-capture selector. Runtime UI confirmation requires installed npm dependencies and a browser. The application never requests CLEO's external API.

**Part 7:** Source-backed values, no fallback zero for missing sources, source labels, two platform lenses and no scoring applied in the changed Creative module. Other existing tabs have not been refactored.

**Part 8:** Partial neutral CSS refresh scoped to Creative. The clickable reference prototype mentioned in the document is not attached, so pixel-perfect prototype matching remains unverified.

## CLEO import mappings

| View | Source sheet | Fields | Time window |
|---|---|---|---|
| AI voice headline and topic comparison | Share of Voice by Topic | ALL TOPICS and category rows, answer count, brand shares, leader | 28 days |
| Visibility funnel | Visibility Funnel | All four stages, counts, shares | Latest week |
| Cited vs recommended | Citation Domains + Visibility Funnel | Domain rank, citations, share, trend; separate funnel recommendation | 90 days + latest week (separate labels) |
| Market questions | Market Questions | All 12 question records, positions, counts, results, supplied summary text | 30 days |
| Position by engine | Position by Engine | Six brands, four AI engines, optional support text | 30 days |
| Language of the market | Language of the Market | Eleven phrases, search counts, distinct question counts | 7 days |

The parser validates all required sheet names, dates, exactly one window per sheet and the documented windows, nonnegative numeric counts, percentage syntax, the ALL TOPICS row, and all four funnel stages. The import key is `captureDate`. Future approved monthly captures may be kept as `UnionCoop-CLEO-Market-Import-YYYY-MM-DD.xlsx` in the same folder; no duplicate date is allowed. The UI defaults to the latest capture and can select older ones. No cross-capture delta is calculated until like-for-like comparable captures are present.

**Mandatory source notice** on the seven blocks: `Source: CLEO - single-source, not independently verifiable.`

## Data conflict explicitly retained

The **Market Questions** worksheet's summary says Union Coop **appeared 3 times out of 844 comparisons** and had **0% wins**. The briefing's "3 wins / 844" is not the same statement. The UI prints the workbook summary as supplied, without converting the three appearances into wins.

**Raw input validation:** `python tools/validate_cleo_source.py` passed (see `docs/CLEO_SOURCE_VALIDATION.json`). Validated 12 questions, 6 share-of-voice topic rows, 6 engine-position rows, 4 funnel stages, 6 citation domains, 11 market phrases. ALL TOPICS includes 815 answers, Union Coop 3%, Carrefour 47%, LuLu 38%. Funnel includes 48 analyzed answers, 1 recommendation, 2.1% recommended.

## Endpoint

GET `http://localhost:5000/api/v1/creative/cleo?brand=union-coop&captureDate=2026-11-02`

Example response shape (partial):

```json
{
  "success": true,
  "message": "CLEO import loaded",
  "data": {
    "source": "Source: CLEO - single-source, not independently verifiable.",
    "captureDate": "2026-11-02",
    "availableCaptures": ["2026-11-02"],
    "unscored": true,
    "allTopics": { "topic": "ALL TOPICS", "answers": 815, "shares": { "unionCoop": 3, "carrefour": 47, "lulu": 38, "spinneys": 5, "waitrose": 4, "other": 3 }, "otherDisplay": "3%", "leader": "Carrefour leads by 44 pts", "window": "28 days" },
    "topics": [], "questions": [], "positions": [], "funnel": [], "domains": [], "language": []
  }
}
```

The six empty arrays above abbreviate the schema **for documentation only**. A real success response contains the imported arrays.

## Local use

From the project root with Node.js installed and normal npm registry access:

```sh
npm ci
npm run dev
```

Backend: `http://localhost:5000` with defaults from `server/.env.example`. Frontend: `http://localhost:5173/creative?year=2026&month=8&brand=union-coop`. Select **Union Coop**, then scroll below the competition strip to **What the market is asking**. CLEO capture is independent of the Creative page month, and its date and individual time windows are printed in every card. To keep older CLEO captures, use dated filenames in the same folder as above.

Recommended verification after installing dependencies:

```sh
npm test
npm run lint
npm run build
```

## Verification actually performed

| Test | Result | Detail |
|---|---|---|
| Raw XLSX source validator | PASS | Executed `python tools/validate_cleo_source.py`; documented seven sheets and expected source counts. |
| Source TS/TSX syntax parser | PASS | Global TypeScript AST parser scanned source; zero parse diagnostics. |
| `npm install` | UNVERIFIED | Registry install timed out. Offline retry failed (`ENOTCACHED` on Vitest utils). |
| `npm test` | NOT RUN | Command failed: `vitest: not found` because dependencies unavailable. |
| `npm run lint` | NOT RUN | Command failed: `eslint: not found`. |
| `npm run build` | NOT PASSED | Cannot find module typings after unsuccessful dependency install; compilation was not completed. |
| React browser rendering / mobile QA | NOT RUN | Dependencies and live browser runtime unavailable in this sandbox. |
| Media/Consumer functional regression | NOT RUN | Requires running app and working dependencies. Unrelated source modules are retained. |

Do not deploy until `npm ci`, `npm test`, `npm run lint`, `npm run build` and browser QA all succeed in a normal development environment.

## Required outside inputs to complete remaining markers

1. `Souqs-Creative-Import.xlsx` v2 from November 2, including 52 post records, Facebook and Instagram definitions, validated brand identity mapping, Top/Core/Low bands, Top 3 and approved why-it-worked statements.
2. Union Coop Carrefour and LuLu competition captures, plus Nesto/Spinneys only when captured.
3. Top 3 thumbnail bundle matched to approved monthly Post IDs.
4. Full published Posts/Reels/Stories totals and Output/Effort story finding. The current prepared workbook only has eligible per-post counts and cannot substantiate a Stories output share.
5. Updated Highlights imports and capture-specific competition editorial bullets where missing.
6. Named owner for Pocari missing complete ad-level export.
7. Approval of historical "Bahar/Jubair" account identity mapping relative to the new "Haraj/Jubail" verified brands, rather than guessing.
8. Clickable visual reference prototype and editorial approvals for the full visual refresh.

## Package notes

Root scripts and workspaces remain unchanged. The existing lockfile is retained verbatim. All original required existing spreadsheet data, uploaded CLEO workbook and existing extracted competition assets remain included. Runtime caches, browser profiles and `node_modules` are excluded.

## Creative palette harmonization, 5 November 2026 (follow-up)

The Creative-only palette now uses consistent GP graphite, paper-grey and white styling, following Part 8 of the November 2 brief. The previous build mixed grey cards with inherited blue/teal filter states, competition controls, post badges, gallery surfaces and source table styles. These are now consistently neutral within the Creative route. Green/red still signify positive/negative states; amber is used for pending/awaiting/unavailable notices. The CLEO panel keeps its dashed unscored border and attribution.

Files updated by this follow-up:
- `client/src/styles/creative-palette.css` (new): shared scoped Creative palette for navigation, filters, slots, cards, badges, competition inset, CLEO, tables, focus and responsive states.
- `client/src/styles/reference-creative.css`: removed its previous trailing ad-hoc neutral overrides; original functional layout rules remain unchanged.
- `client/src/main.tsx`: imports the scoped palette *after* the global light theme, ensuring proper override order.

No server files, data files, metrics, calculations or source identifiers were altered by this colour-only follow-up. The source-data dependency and test limitations noted above remain in effect.

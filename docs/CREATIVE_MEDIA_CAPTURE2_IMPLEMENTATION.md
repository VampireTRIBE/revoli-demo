# Bizcom Engine: Creative, Media and EDIT Capture 2 Implementation

**Build input:** `Bizcom-Engine-GEO-Updated(1).zip`  
**Specification:** Creative (2 November 2026), Media (3 November 2026)  
**New data:** `EDIT-AdLibrary-Capture2-03Nov2026.xlsx` and its 15 analyst-selected PNGs  
**Status:** Source edited and workbook assets validated. A full build and runtime browser verification are NOT established because npm dependencies could not be installed in the restricted environment. Do not treat the package as deployment-certified.

## 1. Implementation summary

- Preserved the original React + Express npm workspace, root lockfile, existing source folders, October 1 EDIT capture, existing GEO page and CLEO importer.
- Added a strict version-aware November EDIT importer while leaving the original October parser in place. A Library ID is counted at most once in each capture.
- Added November capture analytics: 68 active ads, 36 analyst-marked new launches, 37 to 68 history (+31 net), 39.9 average days running, longest running 168, age profile 36/20/12, and campaign platform tags for 15 ads.
- Extracted and validated the exact 15 PNGs, mapped by workbook Gallery Library ID, thumbnail filename, row, slot, caption and chip. No screenshot filename is guessed.
- Built the four-row **The competitor's wall** and full searchable/filterable register with 68 records, included in Media competition and the dedicated Competition page. The dashboard does not infer performance or spend from the Ad Library.
- Reordered the Media page into five CEO slots. Removed its blended CTR headline and Biggest mover headline; kept Google interaction rate and Meta link CTR separate. Moved Platform Conversions into a brief attribution note and highlighted Blended CAC/AOV as customer-cost metrics.
- Replaced the old spend/purchaser month tiles with two separate, unsmoothed line charts, preserving gaps for missing source months. Existing Consumer alignment data is used as overall context with a filter-scope note; the required GA4 v4 channel import is still absent.
- Shows six ranked campaigns (three lowest reported cost per conversion, three worst / unavailable conversion) per platform. The underlying ranking is a mechanical descriptive comparison, **not** causal effectiveness, ROAS, or an approved performance score. Detailed campaigns are behind See all.
- No changes to CLEO workbook content. The supplied duplicate CLEO workbook has exactly the same SHA-256 hash as the original file, so no duplicate was added.

## 2. File mapping

| Destination | Content |
|---|---|
| `spreadsheets data/compititaion-tab/Competition-Capture-EDIT-Byedit-01-Oct-2026.xlsx` | Original October capture, preserved |
| `spreadsheets data/compititaion-tab/EDIT-AdLibrary-Capture2-03Nov2026.xlsx` | New November workbook |
| `server/data/competition-assets/edit-by-ahmed-seddiqi/2026-10-01/` | Existing screenshot assets, preserved |
| `server/data/competition-assets/edit-by-ahmed-seddiqi/2026-11-03/` | 15 original PNGs from Capture 2 thumbnail pack |
| `spreadsheets data/creative-tab/UnionCoop-CLEO-Market-Import.xlsx` | Original CLEO workbook retained, no duplicate |
| `docs/requirements/` | Both official change documents |

**Do not rename** `compititaion-tab`; existing code resolves that exact spelling.

## 3. Primary source changes

| Path | Implementation |
|---|---|
| `server/src/modules/competition/import/edit-capture-two-parser.ts` | New typed November register, delta, theme and Gallery parser; strict Library ID, date, image and age validation; draft Highlights deliberately excluded |
| `server/src/modules/competition/import/competition-source-parser.ts` | Version-aware capture loading alongside October parser |
| `server/src/modules/competition/types/competition.types.ts` | Gallery and analyst-tagged metadata types |
| `server/src/modules/competition/services/competition.service.ts` | Historical net change, flagged launches, gallery, theme/platform data, capture fallback to latest with explicit alternative-month label, safe validated thumbnail route |
| `client/src/types/competition.ts` | Response types updated |
| `client/src/features/competition/components/MediaCompetitionPanel.tsx` | Capture 2 source-backed KPI panel, three launch waves, age, four-row wall, theme/platform and full 68-ad register |
| `client/src/features/competition/components/media-competition-wall.css` | Responsive neutral CEO visual design |
| `client/src/features/competition/components/ContextualCompetition.tsx` | Media competition now displays the new source-backed panel |
| `client/src/pages/CompetitionDashboardPage.tsx` | Reuses new wall on dedicated Competition capture page; preserves legacy display for old captures |
| `client/src/features/media/components/MediaConsumerAlignment.tsx` | Two distinct line charts with missing-data gaps and source/filter caveats |
| `client/src/features/media/components/OverviewCards.tsx` | Blended CAC/AOV cards only, no blended CTR headline |
| `client/src/features/media/components/CampaignSection.tsx` | Six-row initial view with clear metric definitions and See all campaigns |
| `client/src/pages/MediaDashboardPage.tsx` | Five slots, competition last, concise attribution and explicit GA4 v4 awaiting panel |
| `client/src/styles/media-ceo.css` | Neutral Media UI with minimal decoration and responsive layouts |
| `server/src/modules/media/validators/media-query.validator.ts` | Supports complete campaign download up to 1,000 records (client requests max 1,000) |
| `server/tests/competition-capture-two.test.ts` | API and gallery tests for November and October backward compatibility |
| `tools/validate_edit_capture2.py` | Executed dependency-free source and image mapping validator |

## 4. Creative markers (2 November)

These statuses are carried forward from the supplied GEO-updated baseline. **Complete means implemented in source, not runtime/browser verified in this environment.**

| # | Feature | Status | Reason |
|---|---|---|---|
| 1 | Rename Highlights everywhere | Complete | Shared component already displays Highlights this month |
| 2 | Union Coop Level 3 depth | Complete | Baseline Creative heading |
| 3 | Posts, Reels, Stories output line | Partial | Prepared workbook cannot substantiate complete Stories share |
| 4 | Four-slot Creative layout | Complete | Baseline four-slot UI retained |
| 5 | Earned vs rented headline | Complete | Existing prepared cuts imported |
| 6 | Monthly trend begins January | Complete | Existing year-filtered trend retained |
| 7 | Separate single-axis charts | Complete | Existing layout retained |
| 8 | Real Top 3 thumbnails | Partial | Approved ranked-post monthly thumbnail pack absent |
| 9 | Default Top 3 and See all | Complete | Baseline implementation retained |
| 10 | Giveaway in headline and cuts | Complete | Single prepared data source |
| 11 | Follows demoted | Complete | Supporting line in Attention |
| 12 | Brand-specific competitor selector | Partial | EDIT works; Carrefour/LuLu captures absent |
| 13 | Competition Highlights by capture date | Complete | Reads current selected capture month, pending if no approved import |
| 14 | Analyst creative lenses | Partial | Theme available, other required fields not approved |
| 15 | Pocari depth and named owner | Partial | Level 2 implemented, owner not supplied |
| 16 | Pocari Highlights pending | Complete | Shared Highlights |
| 17 | Pocari all four slots | Partial | Export details still missing |
| 18 | Souq approved identities | Partial | New identities separated from historical unverified mappings |
| 19 | Souq post-level import | Blocked | Approved Souqs v2 missing |
| 20 | Platform toggle | Partial | Available older data separated, v2 missing |
| 21 | Bands, rankings, signed explanations | Blocked | v2 and sign-off missing |
| 22 | Jubail September dark month | Blocked | Per-platform v2 not supplied |
| 23 | Cross-posting/organic context | Blocked | v2 README unavailable |
| 24 | Souq Level 2 depth | Partial | Cannot verify post-level coverage |

**GEO regression:** Dedicated `/geo` and Union Coop CLEO panel and unchanged workbook were preserved in source. Functional browser regression remains unverified.

## 5. Media markers (3 November)

| # | Feature | Status | Reason |
|---|---|---|---|
| 1 | Media Highlights and depth badge | Complete | Shared Highlights strip and Partial data-depth indicator |
| 2 | Remove Biggest mover Blended CTR | Complete | Biggest mover heading removed |
| 3 | Remove blended CTR headline | Complete | Card removed; platform-specific CTR retained |
| 4 | Demote platform conversions | Complete | One-line attribution under Slot 1 |
| 5 | Coverage support; CAC headline | Complete | Slot 1 coverage text; Slot 2 CAC/AOV cards |
| 6 | Jan-Oct stacked spend/FTP lines | Partial | UI complete; missing full Sep-Oct approved data shown as gaps |
| 7 | 17-channel GA4 section | Blocked | GA4 v4 import not supplied; explicit AWAITING state |
| 8 | One-line attribution caveat | Complete | Dynamic scope-specific values, not hardcoded example |
| 9 | Sept-Oct per-platform table | Partial | Table retains CTR definitions; both-account exports remain missing |
| 10 | Top 3 + bottom 3 campaigns | Partial | Six-campaign view implemented; some periods incomplete, human verdict pending |
| 11 | Capture Highlights (Nov) | Partial | Keyed to selected capture month, but draft bullets not approved |
| 12 | 37 to 68 history | Complete | Two captures supported |
| 13 | 36 new starts and age profile | Complete | Imported flagged count, calculated age groups |
| 14 | Longest running: 168 days | Complete | 3 Nov import used |
| 15 | Four-row, 15-thumbnail wall | Complete | Gallery sheet joins, real images, full register behind See all |
| 16 | Three Oct-Nov launch waves | Complete | 27-28 Oct, 30 Oct, 2 Nov with source-derived counts |
| 17 | Theme mix + campaign platform | Complete | Imported theme rows and analyst-tagged 15 of 68 |

## 6. Capture 2 audit

**Executed:** `python tools/validate_edit_capture2.py`  
**Result: PASS**

- 68 unique registered active Library IDs.
- 36 records marked **Yes** in New since 1 Oct capture.
- 15 tagged `Own Your Moment / moments` in Campaign platform.
- Average days running 39.9; maximum 168.
- All day-count arithmetic agrees with November 3 capture date.
- Gallery rows contain 4 / 4 / 4 / 3 cards.
- All 15 Gallery Library IDs join Ad Register IDs.
- All 15 PNG filenames exist in the correct server asset folder.
- Captures should show 37 -> 68, net +31. **36 launches is not the same as +31 net active ads.**
- `Draft Highlights (sign-off)` is not used as an approved Highlights source.

## 7. API and operating workflow

No new incompatible endpoints are required. Existing routes are extended:

- `GET /api/v1/competition/options?clientId=rivoli-shop`
- `GET /api/v1/competition/dashboard?year=2026&month=11&competitor=edit-by-ahmed-seddiqi&captureDate=2026-11-03`
- `GET /api/v1/competition/dashboard?year=2026&month=10&competitor=edit-by-ahmed-seddiqi&captureDate=2026-10-01`
- `GET /api/v1/competition/assets/edit-by-ahmed-seddiqi/2026-11-03/r1_oym_sax.png`

Asset routes accept only filenames validated against the selected capture's imported Gallery and are restricted to the configured image folder. Arbitrary traversal and non-gallery files are denied.

From project root with normal npm registry access:

```bash
npm ci
npm run dev
npm test
npm run lint
npm run build
```

Frontend: `http://localhost:5173/media`, select EDIT competition (default), then November 3 in the capture selector if required. The Media competition appears last, below campaign rankings. The dedicated Competition page at `/competition` also supports November/October capture selection and shows the new wall for November.

Monthly capture updates: keep historical XLSX files; place new analyst-approved captures in `spreadsheets data/compititaion-tab/`, integrate versioned parsing as required by the workbook schema, and store only approved thumbnails under `server/data/competition-assets/<competitor>/<capture-date>/`. A new workbook schema is **not automatically accepted without validation**.

## 8. Validation and limitations

| Check | Status | Detail |
|---|---|---|
| ZIP source extraction | PASS | 250-file GEO baseline extracted |
| Original and new CLEO workbook comparison | PASS | Identical SHA-256, no duplicate |
| Capture 2 raw workbook and image audit | PASS | Independent dependency-free validation as above |
| TypeScript TS/TSX AST parsing | PASS | Source syntax scanned with global TypeScript compiler |
| `npm ci --offline` | FAILED | Missing cached Zod package, `ENOTCACHED` |
| `npm ci` online | FAILED | npm registry requests failed `EAI_AGAIN`, npm exited incorrectly |
| `npm run build` | FAILED / BLOCKED | Module/type definitions unavailable after incomplete install |
| `npm test` | NOT RUN | `vitest: not found` due unavailable dependencies |
| `npm run lint` | NOT RUN | `eslint: not found` due unavailable dependencies |
| Browser/viewport rendering | NOT VERIFIED | Required development dependencies unavailable |
| Live API, Media, GEO, Creative regression | NOT VERIFIED | Build/runtime cannot run in current environment |

The updated project is an implementation candidate, **not** a fully validated production build. Re-run all commands and inspect the UI in a normal environment with registry access before deployment.

## 9. Remaining approved inputs

1. `Rivoli-Consumer-GA4-Import-v4.xlsx` for the 17 channel and October GA4 data; a similar older consumer file is not a substitute.
2. Google Ads September/October reports and BOTH Meta ad accounts (Rivoli Group and Hour Choice), plus reconciliation of approximately AED 431K vs AED 2.02M.
3. Monthly Total purchasers export for Sept/Oct before calculating repeat-purchaser percentages.
4. `Souqs-Creative-Import.xlsx` v2 with verified identities, per-post platform data, Top 3 and signed analyses.
5. Union Coop Top 3 thumbnail pack, complete Stories counts, and Carrefour/LuLu captures.
6. Approved monthly TBL Highlights, including EDIT November capture (the workbook only provides a draft pending sign-off).
7. Pocari missing detailed export owner and additional depth records.
8. Celebrity film stills for the next EDIT capture, not required for current 15-image gallery.
9. Official clickable prototype, if exact pixel-level visual matching is needed.

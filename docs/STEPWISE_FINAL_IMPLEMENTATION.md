# November 18 step-by-step implementation: final delivery

Baseline: `Bizcom-Engine-Nov24-All-Imports-Integrated-Full (3).zip`.
Newly supplied import archive: `Bizcom-Engine-Imports-All-24Nov2026(1).zip`.
All eight supplied files match existing active categorized sources by SHA-256; no workbook replacement was necessary. The four specification PDFs are preserved in `docs/requirements/`.

## Requirements in PDF order

| Requirement | Source / implementation | Status and limitation |
|---|---|---|
| 1.1 GA4 v4 | Media GA4 channels, monthly summary and site revenue, September/October; negative refund adjustments allowed | Implemented in source. Runtime build not verified. Missing spend is not zero. |
| 1.2 Highlights | TBL Reads parser and shared Highlights strip | Signed-only display implemented. Available Reads sheet lacks explicit sign-off; publication blocked. |
| 1.3 Section anatomy | Shared Reporting component and exact Media/Creative labels | Delta chip, comparison pair and eight-period bars implemented for eligible histories; full coverage and visual verification remain partial. |
| 1.4 Campaign Objective | Imported objective mapping and objective buckets | Unclassified rows remain visible and unranked. Approved objective/result metadata incomplete. |
| 1.5 Campaign names/images | Imported short name and verified asset lookup, full name on hover | Approved assets and short names incomplete. No invented images. |
| 1.6 Union Coop Media | Retained optional importer and components | Not exposed: user's later instruction requires Rivoli-only Media. Burst register not supplied. |
| 2.1 Creative workbook | Corrected prepared workbook parser, posts, benchmarks, cuts and Top 3 | Source implementation retained; signed analyst prose missing. |
| 2.2 Neutral labels | Output, Attention, Engagement, Top content | Source checks passed. |
| 2.3 Section Highlights | Signed section notes, one top-level pending strip | Sign-off missing. |
| 2.4 Creative comparisons | Source-backed history and explicit partial flags | Available comparable metrics supported; browser and full coverage unverified. |
| 2.5 October five-channel | Optional import support | Approved October workbook absent. |
| 3.1 Consumer theme | Shared V2 CSS | Partial, actual browser visual parity not checked. |
| 3.2 Comment types | Optional Union Coop comments import and API | Source absent; awaiting state. |
| 3.3 Rivoli Consumer | Original data and missing order-export treatment preserved | Source preserved, runtime not verified. |
| 4.1 Search | Classic/AI panels and GEO redirect | Source implemented; Classic data absent. |
| 4.2 GEO content | Existing CLEO data preserved | Raw workbook validation passed; browser not verified. |
| 5.1 Union Coop captures | October 1 and November 18 workbook import | Both sources present. November contains 57 Carrefour and 54 LuLu rows; missing IDs excluded from identity matching. |
| 5.2 Competition Highlights | Explicit sign-off required | Unsigned drafts remain hidden. |
| 5.3 Union Coop gallery | Approved asset joins and compact awaiting line | Gallery ZIP not supplied. |
| 5.4 EDIT Meta | November 3 capture, 68 records, 36 newly started, 15 matched gallery images | Raw workbook and assets validated. |
| 5.5 EDIT Google | November 18 sample and channel selector | Source present; separate Meta/Google views. |
| 5.6 Sample/census | Approximately 200 reported, 30 logged | Kept distinct; runtime not verified. |
| 5.7 Compare against | Separate control in Creative and Media | Latest user-approved mapping supersedes PDF's every-head instruction. |
| 5.8 Dark competitor strip | Channel, capture and activity-not-spend context | Source checks pass; browser unverified. |
| 6.1 Hero | One signed imported headline | No editorial fabrication; approval still missing. |
| 6.2 Imagery | Only supplied approved assets | Missing assets remain unavailable. |
| 6.3 Awaiting | Compact amber state | Implemented in affected panels; full visual parity unverified. |
| 6.4 Colors | Shared neutral tokens and platform colors | Source checks pass; complete chart-by-chart parity unverified. |
| 6.5 Warning chips | Supported for imported flags | Partial; additional data and browser checks needed. |
| 6.6 Motion and rate details | CountUpValue, chart animation, rate evidence | Supported in selected components; full visual/runtime validation not executed. |
| 7 Inventory | All eight newly uploaded imports identical to active categorized sources | Source checksums verified; 23 Excel and 61 CSV files retained. |

## User-approved scope

Media is Rivoli-only with EDIT by Ahmed Seddiqi (Meta and Google). Union Coop Creative compares against Carrefour UAE or LuLu Hypermarket. Other Creative brands do not inherit Union Coop competitors. Consumer and Search have no Compare against control. No Docker or new database migration. Existing optional MongoDB code remains from the baseline, not required for spreadsheet-backed operation when MONGODB_URI is unset.

## Additional source fixes

- Guard competition against unapproved competitor selection and support all-month reports.
- Exclude unknown start dates from longevity averages; do not identify missing IDs across captures.
- Label GA4 all-month channel rows by period; separate site-wide acquisition from filtered spend.
- Reload signed Highlights when the workbook changes; commit the cache key only after a successful parse. Clear cache on missing source.
- Update the outdated verification assertion for explicit hero selection with fallback to an approved sentence.

## Verification results

All 12 dependency-light `verify:*` commands listed in `STEPWISE_FINAL_TEST_RESULTS.txt` passed, including isolated Creative fixture execution, mapping, and source contracts. Raw EDIT validation and CLEO workbook validation passed. TypeScript syntax parse: 129 files, zero diagnostics. CSS stylesheet parse: 16 files, zero top-level syntax errors. These are not a semantic TypeScript build or live browser tests.

`npm ci --offline --no-audit --no-fund` failed with ENOTCACHED for `zod-4.6.5.tgz`. Full npm build, Vitest suites, live REST API testing and browser/responsive visual checks are NOT verified. No claim of full PDF or production compliance is made.

## Missing or incomplete inputs

- Explicit TBL Highlights and analyst-note sign-off, per-section Highlights v2.
- Verified Union Coop October five-channel Creative workbook.
- Union Coop Burst Register and reconciled paid/organic data (retained optional reader, Media hidden by latest scope).
- Carrefour/LuLu approved gallery ZIP.
- Union Coop monthly comment-type export.
- Rivoli approved campaign Objective, short names and thumbnail mappings/assets where absent.
- Exact-brand Creative records or approved identity mappings for Souq Al Haraj and Souq Al Jubail.

## Run locally

From the root: `npm ci`, `npm run verify:nov18`, `npm run verify:tab-scope`, `npm run verify:pdf-parity`, `npm run build`, `npm run dev`. Frontend: http://localhost:5173; backend: http://localhost:5000. Leave MONGODB_URI unset for spreadsheet-only usage. No new architecture or Docker setup is required.

See `STEPWISE_FINAL_IMPORT_MANIFEST.json` for the exact matching paths, checksums and changed file inventory.

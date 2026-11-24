# Bizcom Engine, November 24: Creative render repair and November 18 requirements audit

## Baseline and non-goals

Baseline: `Bizcom-Engine-Nov24-All-Imports-Integrated-Full.zip`. Existing React + TypeScript frontend, Express + XLSX backend, npm workspaces, spreadsheet file layout and all historical capture/image assets are retained. **No Docker or MongoDB migration**. This is a targeted repair and source-level verification, **not a certified production release**.

## Repaired defects in this revision

1. **TypeScript compilation blocker**: Removed duplicate `brandYears` declaration from `client/src/types/creative.ts` (`TS2300: Duplicate identifier`). The TypeScript check confirms this specific diagnostic is gone. Full project compilation remains unverified due to unavailable dependencies.
2. **Incorrect missing-data UI**: The approved `UnionCoop-Creative-WhyItWorked-Import.xlsx` contains `Posts published (output, incl Stories)`, `Stories`, and `Partial flag` in `Monthly Benchmarks`. The existing Creative screen incorrectly displayed `Stories published: n/a` and stated the source did not contain it. The parser, interfaces and card display now consume these source fields.
3. **Incorrect month-completeness inference**: A month with no post on the final calendar day was incorrectly classified as partial. For Union Coop, the selector now respects the workbook's explicit `Partial flag`. August is complete and September is marked `PARTIAL` in the supplied workbook.
4. **Comparison integrity**: A Creative KPI comparison does not show a delta if the current or preceding reporting month is flagged partial. Percent-rate SparkBars are consistently converted to percentage units, rather than mixing proportions with percentage-point delta labels.
5. **Source resilience**: When the legacy selected/comparison Instagram CSV file is absent, Creative parser no longer throws before loading the prepared workbook. Prepared workbook data still remains subject to available source definitions.
6. **UI awaiting treatment**: Missing Top 3 thumbnail images now use thin amber awaiting labels instead of large image placeholder boxes. An unsupported analyst interpretation is not displayed as signed.
7. **Regression coverage**: Added `scripts/verify_creative_runtime_v2.cjs` that executes the real Creative service logic against source-shaped fixtures and checks full/partial periods and monthly story totals; extended `server/tests/creative-calculations.test.ts` with verified August/September workbook expectations. Added `npm run verify:creative-v2`.
8. **TypeScript strict test fix**: Made the two GA4 source-test tuples const to prevent `expectedNet` being inferred as possibly undefined.

### Workbook facts verified

In the supplied Creative workbook `Monthly Benchmarks`, August 2026 contains 271 total output items, 219 Stories, with no partial flag. September 2026 contains 175 total output items, 147 Stories and explicit `PARTIAL`. The workbook reports real monthly statistics only through September; an October verified five-channel Creative workbook was **not** supplied.

## November 18 specification, by section

| Section | Outcome based on current source | Outstanding requirement(s) |
| --- | --- | --- |
| 1. Media | GA4 v4 September/October, source-backed reporting and section definitions are included. Campaign Objective and image mappings have import paths, without name-based guesses. | Approved campaign objective/thumbnail data, Union Coop Burst Register, complete Media reference visual parity and full browser test |
| 2. Creative | Fixed the Creative TS blocker; repaired Stories/output reporting; correct `Engagement` label; imported Top 3 data; date-aware KPI histories and signed-only highlights | Signed analyst explanations and per-section Highlights; October verified five-channel workbook; missing approved content thumbnails |
| 3. Consumer | Unified neutral styles and one awaiting path for Union Coop comment types are present | Comment-type export and Rivoli order-level export |
| 4. Search | Standalone GEO is relocated into Search as AI search; Classic search awaits data; `/geo` redirects | No verified Classic search export yet |
| 5. Competition | Meta EDIT captures, 68-ad register, 15 supplied thumbnails; Google 30-sample/approximately 200 population separately labeled; Union Coop Carrefour/LuLu October/November registers included | Carrefour/LuLu approved gallery images, signed editorial Highlights |
| 6. Visual refresh | Neutral design tokens, six-part section headers, one-shot count-up support, source badges, smaller awaiting lines | Full page-by-page pixel comparison, interaction regression and universal approved hero content have **not** been verified |
| 7. Imports | The 8-file November 24 import pack from prior project is retained, along with original CSV/XLSX assets | Missing approved imports listed below |

## Still missing or not verified

- Verified Union Coop October five-channel Creative workbook.
- Union Coop Media Burst Register and spend/paid-organic verification source.
- Union Coop Consumer monthly comment-type export.
- Explicitly signed per-section Highlights, editorial sign-off and why-it-worked prose. Existing TBL Reads workbook contains sentences but has no explicit `Signed` column, so they must not be published as signed.
- Carrefour/LuLu approved gallery thumbnail ZIP.
- Approved campaign Objective + thumbnail mapping assets.
- Rivoli order-level export for Consumer.
- Source-confirmed branding for Souq Al Haraj and Souq Al Jubail. Existing CSVs name Souq Al Bahar and Souq Al Jubair; data must not be reassigned without permission.

## Executed validations

- `npm run verify:creative-v2`: PASS, including actual Creative service execution with source-shaped fixtures.
- `npm run verify:media-creative`: PASS (14 source-contract checks).
- `npm run verify:competition-visual`: PASS (13 source-contract checks).
- `npm run verify:spreadsheets`: PASS (original source path and checksum checks).
- `npm run verify:nov24-imports`: PASS (all 8 required imported paths).
- TypeScript parser: 125 TS/TSX files, **zero syntax diagnostics**.
- `TS2300` duplicate Creative property diagnostic: **resolved**.
- `npm ci --offline`: FAILED, npm cache has no `zod-4.6.5.tgz` (`ENOTCACHED`). The standard registry is not reachable in this environment (`EAI_AGAIN`). Therefore **full `tsc`, full React build, Vitest, API/browser runtime, visual screenshots are not verified**. These source tests are not substitutes for running the app.

## Local verification

```bash
npm ci
npm run verify:creative-v2
npm run verify:media-creative
npm run verify:competition-visual
npm run verify:nov24-imports
npm run test
npm run build
npm run dev
```

Open `/creative?year=2026&month=8&brand=union-coop` to verify August output and Stories, then September (partial), Pocari paid All months, and source-labeled Souq Bahar/Jubair. Confirm Creative console and network responses; source-based checks do not establish browser success.

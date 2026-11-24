# Bizcom Engine: Creative API and Media Campaigns repair

**Baseline:** `Bizcom-Engine-Nov24-Creative-Repaired-Full.zip`. Existing React/Vite and Express/TypeScript npm workspaces and categorized spreadsheet locations remain intact. No Docker, new database, or architecture change.

## Confirmed Creative failure

`server/src/modules/creative/import/creative-source-parser.ts` tried to parse the workbook's Monthly Benchmarks field `Eligible posts`, which is **not** a column in the supplied `UnionCoop-Creative-WhyItWorked-Import.xlsx`. The actual column is `Eligible posts (Post/Reel)`. Reading the missing value as a mandatory number throws from `parsePreparedCreativeImport`, propagating through `getCreativeOptions` to `/api/v1/creative/options` as HTTP 500. The Creative page then displays the error seen in the screenshot.

**Fix:** Use the exact workbook header first, with `Eligible posts` kept as a backwards-compatible alias. The actual source workbook now validates through the parser. The Creative UI distinguishes connection failures from HTTP 500 import failures and offers a Retry control.

**Actual workbook check:** 278 post metrics; 30 monthly Top 3 records; 10 benchmark rows (includes all-year); 138 Creative Cuts. August 2026: 52 eligible posts, 219 Stories, 271 published output, full month. September 2026 retains its explicit partial flag. The parser and `getCreativeOptions` were executed with actual spreadsheet row data exported to a local test fixture for validation. This check stubs the XLSX reader and does not constitute an HTTP integration test.

## Media Campaigns fix

The supplied Rivoli Google `Campaign Brand Map` has 145 monthly campaign rows, including 21 for August 2026. In contrast, `Meta Campaign Brand Map` reports campaign spend aggregated across Jan–Sep, **without a monthly breakdown**. Showing an empty August Meta table without explaining the scope was misleading. Also, the initial Objective selector could display `Traffic (no import)` despite no approved Objective records.

**Fixes:**

- The campaign panel starts on the monthly Google source when a month is selected; both platforms remain selectable.
- Only objectives actually present in imported rows are offered as options.
- Records lacking approved objectives are shown in an **unranked** table, not hidden behind an empty ranked display.
- The full searchable campaign dialog remains available for unclassified rows.
- A separate action can open the source's available all-year campaign register when the selected month has no rows, with an explicit warning that full-year Meta totals are not monthly values.
- If a source supplies an approved Objective, its cost ranking remains restricted to that objective. The application **does not infer Objective from campaign names**.
- Approved campaign creative thumbnails still require both a verified mapping sheet and an image asset; no placeholder thumbnails or invented campaign rankings were added.

## Source checks completed

- All 126 application/test TypeScript or TSX files parse without syntax errors.
- All 16 CSS files parse without syntax errors.
- Existing `verify:creative`, `verify:creative-v2`, `verify:media-creative`, `verify:competition-visual`, `verify:creative-brands`, `verify:spreadsheets`, and `verify:nov24-imports` checks passed.
- Real-workbook parser check passed with 278 post metrics / 30 Top 3 / 10 benchmarks / 138 cuts, and source-backed August values.
- Build, full Vitest HTTP tests, and Chrome runtime rendering were **not** executed: `npm ci --offline` fails because `zod-4.6.5.tgz` is unavailable in the local npm cache, and the normal installation did not complete.

## Run and verify locally

From the project root:

```bash
npm ci
npm run dev
```

The root dev command starts both workspaces. Verify both services: 

- API health: `http://localhost:5000/api/v1/health`
- Creative options: `http://localhost:5000/api/v1/creative/options` (must return `success: true`)
- Creative, Union Coop August: `http://localhost:5173/creative?year=2026&month=8&brand=union-coop`
- Media Campaigns, August: `http://localhost:5173/media?year=2026&month=8` (open Campaigns and inspect the Google tab)

After installing dependencies:

```bash
npm run verify:creative-media-runtime
npm run build
```

If the Creative screen shows a network error, confirm that Express is listening on port 5000; Vite on 5173 alone cannot serve `/api/v1/creative/options`. If it shows HTTP 500, review the backend terminal for another workbook parser error.

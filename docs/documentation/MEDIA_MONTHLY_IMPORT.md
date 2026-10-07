# Monthly Media Data Import Runbook

Use this runbook whenever a new month of Rivoli Media data arrives.

## Quick monthly checklist

1. Copy the last accepted workbook set.
2. Add the new month without changing existing sheet names or column names.
3. Add the new monthly site sheet. This sheet creates the new dropdown period.
4. Add Google, Meta, organic, campaign-map, stage-summary, and control values for the same month.
5. Check that detailed totals match the control totals.
6. Put the complete workbook set into one ZIP file.
7. Upload it from `/media/import`.
8. Review warnings and confirm that the new month appears in the dashboard.
9. Run the API and UI checks in this document.
10. Save the batch ID and original package.

Use `Replace existing period` only for a corrected month that is already in the database.

## 1. Prepare the monthly package

Keep the existing workbook structures and source business labels. The import recognizes these data domains:

| Domain | Expected workbook/sheet pattern | Required analytical fields |
| --- | --- | --- |
| Google paid media | Google workbook, `Brand x Month` and campaign map sheets | Month, brand, segment, AED spend, impressions, interactions, claimed conversions |
| Meta paid media | Meta workbook, `Brand x Month (spend)` and `Meta Campaign Brand Map` | Monthly totals plus campaign taxonomy and nine-month spend used for monthly campaign allocation |
| Site outcomes | Reconciled campaigns workbook, monthly sheet and `Reconciliation` | Period, brand/segment mapping, views, cart additions, purchases, revenue, control totals |
| Organic demand | Organic workbook, `Brand x Month` and grouping sheets | Month, brand/segment/market, clicks, impressions, position |
| Taxonomy | Approved segmentation and campaign maps | Approved brand, segment, scope, stage, confidence, mapping status |
| Cross-workbook controls | Brand Plot, `Claims vs Verified (monthly)` and `Segment Plot (9 mo)` | Paid spend and platform-claim control totals used for validation only |

The recurring upload should be a ZIP containing the complete monthly workbook set. A single `.xlsx` is accepted only when it contains every required data domain. Do not rename or repurpose source columns just to make values fit.

### Source precedence and calculation ownership

The dashboard uses one source for each kind of value:

1. Google and Meta monthly detail sheets own paid spend, impressions, actions, and platform claims.
2. The reconciled shop month sheet owns views, cart additions, purchases, and revenue.
3. Campaign maps own campaign names, brands, segments, stages, and allocation inputs.
4. Brand Plot and summary sheets are validation controls only. They can raise warnings but never overwrite or manufacture monthly results.
5. If detailed rows are absent and the matching stage summary explicitly totals zero, the platform displays zero activity while ratios with a zero denominator display `N/A`. Without either detail or an explicit zero control, values display `N/A`; absence is not treated as zero.


## 2. Add the new reporting period

For a new month, for example October 2026:

1. Add October rows to the Google and Meta brand-month sheets.
2. Add the October site detail sheet and its October control row to `Reconciliation`.
3. Add October organic rows when that workbook is supplied.
4. Add or update campaign-map rows for new campaign names.
5. Preserve exact period text and real coverage dates.
6. Mark the month partial when it does not cover the complete calendar month.

Do not copy September's partial status or dates into a full October period.

## 3. Validate before upload

Check the source files before importing:

- Spend, impressions, interactions/clicks, claims, funnel counts, and revenue are numeric.
- Spend and count fields are not negative.
- Google values are in AED or have already been converted into the AED field expected by the workbook.
- Brand, segment, platform, campaign, and stage labels follow the existing mappings.
- New brands and campaigns have explicit mapping rows.
- Site totals equal the matching `Reconciliation` controls.
- Google campaign totals match Google brand-month totals within the workbook rounding tolerances.
- Google and Meta detailed spend totals equal their matching stage-summary month totals.
- Brand Plot spend and claim controls are compared with the detailed platform sheets; explain and approve any warning before publishing.
- The month and coverage dates agree across the supplied workbooks.
- Partial months are clearly identifiable from their real period end date.

Do not enter estimated platform or campaign revenue into the raw workbooks. The application derives directional ROAS from mapped brand/segment revenue coverage while preserving the raw source values.

## 4. Start the application

From the repository root:

```cmd
npm.cmd run dev
```

Confirm:

- Dashboard: `http://localhost:5173/media`
- Import screen: `http://localhost:5173/media/import`
- API health: `http://localhost:5000/api/v1/health`

MongoDB must be available for imports. Source-backed read mode is only for viewing the bundled workbooks.

## 5. Upload the package

Open the import screen, select the `.xlsx` or `.zip` package, and submit it.

The server will:

1. enforce file type and size limits;
2. detect supported workbooks and sheets;
3. parse and normalize periods and rows;
4. retain source file, sheet, row, labels, and batch lineage;
5. validate required domains and numeric values;
6. reconcile site totals to the monthly `Reconciliation` controls;
7. reconcile Google and Meta detailed spend to the stage-summary monthly totals;
8. reconcile Google campaign spend, impressions, interactions, and conversions to Google monthly totals;
9. compare Brand Plot spend and monthly claims with the detailed platform sheets and retain differences as review warnings;
10. reject duplicate periods by default;
11. write valid records and the batch atomically in MongoDB.

Treat warnings as review items. A critical reconciliation failure blocks persistence.

## 6. Handle a duplicate or corrected month

Never enable replacement for a normal new-month upload.

If a corrected file is received for an already imported month:

1. Confirm the intended database and period.
2. Keep a copy of the previously accepted package and record its batch ID.
3. Validate the corrected package independently.
4. Enable **Replace existing period** on the import screen, or submit `replaceExisting=true` through the API.
5. Confirm the new import batch completed.

The server validates and reconciles before replacement. Deleting the old period and inserting the corrected period occur within one MongoDB transaction; a failure rolls back the transaction.

## 7. Verify the new month

After a successful import, verify these endpoints:

```text
http://localhost:5000/api/v1/media/periods
http://localhost:5000/api/v1/media/overview?year=2026&month=10
http://localhost:5000/api/v1/media/platforms?year=2026&month=10
http://localhost:5000/api/v1/media/campaigns?year=2026&month=10
http://localhost:5000/api/v1/media/reconciliation?year=2026&month=10
```

Then verify the UI:

1. The new year/month appears in the dropdowns.
2. A full month is selected as the latest complete default; a partial month remains visibly marked.
3. Segment contains `All Segments` plus every Segment label supplied by the accepted spreadsheets.
4. Brand contains `All Brands` plus every Brand in the selected period or Segment.
5. Every Segment and Brand option shows a finite directional ROAS when the imported period has paid spend. Fallback labels identify Segment or Overall basis.
6. Choosing a Segment resets Brand to `All Brands` and reloads valid Brands for that Segment.
7. The All values equal the aggregate of their matching detailed rows before ratios are recalculated.
8. Blended ROAS, CAC, CTR, conversions, platform values, Campaign ROAS, and Campaign Detail change with the selected scope.
9. Campaign ROAS bars remain 20 pixels thick when only a few campaigns qualify.
10. Google and Meta totals match the source workbooks.
11. Platform claims remain separate from verified orders, and directional ROAS tooltips show the mapped calculation basis.
12. Negative reconciled revenue remains negative and may produce negative ROAS.
13. The URL contains specific Segment and Brand values only when they are selected; All values are represented by missing dimension parameters.

## 8. Verify calculations

Use unrounded workbook totals:

```text
Blended ROAS card = reconciled site revenue / Google plus Meta spend
Blended CAC = Google plus Meta spend / Google plus Meta platform claims
Blended CTR = Google interactions plus Meta link clicks / Google plus Meta impressions
Platform conversions = Google claimed conversions plus Meta claimed purchases
Google table CTR = Google interactions / Google impressions
Meta table CTR = Meta link clicks / Meta impressions
Platform ROAS = segment site revenue allocated by each platform's segment-spend share / platform spend
Brand ROAS = exact Brand return; fallback to mapped Segment; fallback to overall period
Segment ROAS = exact Segment return; fallback to overall period
Campaign ROAS = mapped brand/segment directional return, charted only when spend > AED 300
```

The ROAS card is directional because the site revenue is not verified as paid-media-attributed revenue. Annual values must be calculated from annual summed numerators and denominators, not by averaging monthly ratios.

## 9. Record the import

Capture:

- import batch ID;
- source package filename and received date;
- included period keys;
- full or partial period status;
- warnings and reconciliation result;
- whether replacement was used;
- reviewer and approval date.

Import history is available from:

```http
GET /api/v1/media/imports
GET /api/v1/media/imports/:batchId
```

## Troubleshooting

| Problem | Action |
| --- | --- |
| Month missing from dropdown | Check `/media/periods`, import status, period parsing, and whether MongoDB contains the completed batch |
| `DUPLICATE_IMPORT` | Confirm this is a corrected month before retrying with replacement enabled |
| `RECONCILIATION_FAILED` | Compare site controls, stage-spend totals, and Google campaign totals with their detailed monthly rows; warning-only Brand Plot differences do not block persistence |
| `MISSING_SHEET` | Restore the expected workbook/sheet structure; do not hide the problem by renaming unrelated data |
| `DATABASE_UNAVAILABLE` | Start MongoDB and confirm `MONGODB_URI` in `server/.env` |
| Card shows `N/A` | Inspect the API metric definition and verify its denominator/source column is present and non-zero |
| ROAS column shows `N/A` | Check that the campaign/platform row has spend and a usable mapped brand, segment, or overall revenue-coverage return |

## When the workbook schema changes

A schema change is a code change, not a routine import. Update and verify, in this order:

1. source parser and header aliases;
2. normalized TypeScript and MongoDB models;
3. calculation service;
4. API contract and client types;
5. UI labels/tooltips;
6. parser, calculation, API, and regression tests;
7. `MEDIA_IMPLEMENTATION.md` and `MEDIA_API.md`.

Run before release:

```cmd
npm.cmd test
npm.cmd run lint
npm.cmd run build


## Related documents

- [Implementation and data flow](MEDIA_IMPLEMENTATION_FLOW.md)
- [Formulas and spreadsheet sources](MEDIA_FORMULAS_AND_SOURCES.md)
- [Media API and request flow](MEDIA_API.md)
- [Project README](../../README.md)
```

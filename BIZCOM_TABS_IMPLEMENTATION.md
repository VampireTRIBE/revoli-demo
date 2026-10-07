# BizCom Creative, Competition, and Media Tabs

This document explains the working implementation in simple language. The dashboard uses the supplied files as data, not the cached demo numbers in `GP-BizCom-Dashboard.html`.

## 1. Source folders

The server reads only these repository folders for the three tabs:

| Tab | Source folder |
|---|---|
| Creative | `spreadsheets data/creative-tab` |
| Competition | `spreadsheets data/compititaion-tab` |
| Media | `spreadsheets data/media-tab` |

The Competition folder spelling is intentionally preserved.

The HTML reference is `docs/documentation/GP-BizCom-Dashboard.html`. It controls the Creative and Media appearance and labels. Spreadsheet and CSV files control the actual values.

## 2. Shared implementation flow

1. The server finds the configured source folder.
2. It reads CSV or Excel content and checks headers before accepting rows.
3. It converts accepted rows into typed records with source filename, sheet, row, account, period, units, and missing-value information.
4. It removes or avoids duplicates using stable identifiers and configured source precedence.
5. It calculates only metrics supported by matching source fields.
6. REST APIs return filters, summaries, detail rows, coverage notes, and unavailable states.
7. React uses those APIs to render the reference-style cards, tables, galleries, charts, filters, and methodology panels.

Missing numeric data is returned as `null` and shown as `N/A`. Missing sections show `Data not available`. A missing monthly Competition capture shows `Data not received`.

## 3. Creative tab

### Source mapping

| Data | Source | Use |
|---|---|---|
| Union Coop Instagram post detail | `Buffer insights Union Coop/UC buffer Instagram/posts.csv` | Canonical Organic post source |
| Duplicate comparison export | `Buffer insights Union Coop/UC Instagram Buffer/posts.csv` | Conflict audit only; never added to totals |
| Souq Al Bahar/Jubair files | `SOUQ Al Jubair and Bahar/*.csv` | Coverage only; no post cards because these are account totals |
| Pocari Sweat paid detail | `buffer-posts-analytics-csv/posts-20260101-to-20261001.csv` | Five paid post records |
| Pocari Sweat paid summary | `buffer-posts-analytics-csv/posts-summary-20260101-to-20261001.csv` | Confirms 12 paid posts at account level |

The unrelated Consumer workbooks in this directory are ignored by the Creative parser.

### Duplicate rule

The two Union Coop Instagram exports contain the same 1,324 Post IDs. The configured `UC buffer Instagram/posts.csv` file is selected. The other complete export is comparison-only. Conflicts are reported, but records are not joined, values are not mixed, and the largest value is not selected.

The stable Organic key is:

```text
brand + account + platform + Post ID
```

### Organic formulas

Only Instagram Posts and Reels with positive reach are eligible for reach-based calculations.

```text
Active actions = Shares + Saves + Comments
Post active engagement rate = Active actions / Reach
Overall active engagement rate = Sum of matching active actions / Sum of matching reach
Frequency = Sum of views / Sum of matching reach
```

The overall rate is not an average of post percentages. Missing shares, saves, or comments exclude that post from the engagement numerator and denominator. Zero is kept when the source measured zero.

Organic attention follows the HTML reference:

- Reels with measured average watch time use watch time.
- Other eligible records use `Views / Reach` as the frequency fallback.
- Each post score is weighted by reach.
- Only 3 of 179 eligible Reels have average watch time, so missing watch time is never estimated.

Reference benchmarks:

| Metric | Low anchor | High anchor |
|---|---:|---:|
| Frequency | 1.00x | 2.00x |
| Reel average watch time | 2 seconds | 8 seconds |
| Active engagement rate | 0.50% | 5.00% |

```text
Component score = round((value - low) / (high - low) × 100)
Organic score = round(Attention × 50% + Active engagement × 50%)
```

Component scores are clamped to the HTML reference range and labelled `Reference benchmark score`. The source does not prove a clean organic/boosted split, so the UI says `Organic + boosted combined`.

### Paid formulas and limits

The Pocari Sweat file contains five detailed paid records. They are kept separate from Union Coop Organic data.

```text
Paid CTR = Sum of paid clicks / Sum of paid impressions
Paid record CTR = Paid clicks / Paid impressions
Paid spend = parsed AED value, for example AED_4805.92 → 4805.92
```

Verified five-row totals:

| Value | Total |
|---|---:|
| Paid clicks | 4,487 |
| Paid impressions | 4,586,510 |
| Spend | AED 10,497.17 |
| Paid CTR | about 0.098% |

The account summary reports 12 paid posts, so the five rows are clearly labelled as a subset. Video and static rankings sort the available rows by spend.

Paid shares, paid saves, ThruPlays, and usable image URLs are missing. A CTR-only reference attention indicator is available, but Paid Active Engagement, full Paid Creative score, and combined Organic + Paid score remain `N/A`.

The paid export covers 1 January to 1 October 2026 as one reporting period. It is shown for `All months`; it is not allocated to individual publication months.

### Creative APIs

Base path: `/api/v1/creative`

| Method and route | Purpose |
|---|---|
| `GET /options` | Available years, months, Brands, partial-period flags, and defaults |
| `GET /dashboard?year=2026&month=0&brand=pocari-sweat` | Filtered Organic and Paid summary, post rows, scores, coverage, and conflict audit. Month `0` means `All months`. |

### Creative record fields

Organic records keep Brand, account, platform, Post ID, publication timestamp, post type, caption, safe post URL, reach, views, shares, saves, comments, reactions, average watch time, source file, source kind, and reporting period.

Paid records keep Brand, account, platform, Post ID, publication timestamp, post type, caption, safe post URL, paid clicks, paid impressions, paid reach, paid comments, AED spend, source file, and reporting period.

Creative source records are currently parsed into a typed in-memory cache. There is no Creative upload API or Creative MongoDB collection in this version.

## 4. Competition tab

### Source mapping

The parser reads `Competition-Capture-EDIT-Byedit-01-Oct-2026.xlsx`. Competitor configuration holds the client, competitor, Meta page, website, workbook pattern, format groups, and theme groups.

The current source supports EDIT by Ahmed Seddiqi / Meta page `Byedit`. Carrefour UAE and LuLu Hypermarket are configured, but their capture workbook is missing, so they show `Data not received`.

### Competition formulas

```text
Days running = Capture date - Start date
Active ads = Count of unique active Library IDs in the selected capture
Average days running = Sum of calculated days / eligible active ads
Mix percentage = Group count / active ads
```

Dates use date-only arithmetic. Supplied and calculated days-running values are compared and discrepancies are recorded.

For later captures:

```text
First observed = Current IDs absent from every earlier capture
No longer observed = Previous-capture IDs absent from current capture
```

`No longer observed` does not mean confirmed inactive. The first capture is not described as 37 new launches.

Verified capture results:

- 37 unique active ads.
- Average days running: about 28.6.
- 19 captured ads started on 28–29 September.
- Three longest-running ads started on 19 May and ran for 135 days.
- Themes: 15 catalog, 9 offer code, 7 product spotlight, 6 gifting.
- Languages: 37 English.
- Formats: 22 image records and 15 catalog/carousel records.
- 13 embedded screenshots and 37 verified Library ID associations.

All Competition cards and creatives display:

> Source: Meta Ad Library. Activity, not spend.

Spend, impressions, reach, CTR, conversions, ROAS, targeting, and performance scores are not returned or displayed.

### Competition APIs

Base path: `/api/v1/competition`

| Method and route | Purpose |
|---|---|
| `GET /options` | Capture years, months, dates, competitors, and received/missing status |
| `GET /dashboard?year=2026&month=10&competitor=edit-by-ahmed-seddiqi` | Selected capture summaries, mixes, detail rows, history, screenshots, and validation audit |
| `GET /assets/:competitorId/:captureDate/:assetFile` | Serves an extracted, verified workbook screenshot |

### Competition database

MongoDB separates identity from monthly observation:

| Collection/model | Important fields | Unique key |
|---|---|---|
| Competition ad identity | competitorId, competitor, clientId, metaPage, libraryId | competitorId + libraryId |
| Competition observation | competitorId, libraryId, captureDate, payload | competitorId + captureDate + libraryId |
| Competition capture | competitorId, captureDate, sourceFile, screenshotAssets, audit | competitorId + captureDate |

Upserts use `$setOnInsert`, so reading the same capture again is idempotent and does not duplicate observations. Extracted assets are stored under `server/data/competition-assets/<competitor>/<capture-date>`.

## 5. Media tab

### Source mapping

The parser reads the six `.xlsx` files in `spreadsheets data/media-tab`. Important sheets include:

- `Reconciliation` and monthly sheets for GA4 item funnel and item revenue.
- `Google Campaign Map` and `Brand x Month` for Google spend, impressions, interactions, and platform-reported conversions.
- `Meta Campaign Brand Map` and `Brand x Month (spend)` for Meta spend, impressions, link clicks, and platform-reported purchases.
- Campaign Brand maps for Brand, Segment, scope, stage, confidence, and mapping provenance.
- Organic demand sheets for Search Console clicks, impressions, and average position. These are never treated as paid clicks.

January through August are full months. September covers 1–10 September 2026 and is marked partial.

### Existing Media formulas preserved

The Media calculation and aggregation modules were not changed during the source-folder integration. Existing labels, benchmarks, weights, clamping, rounding, currency handling, Brand/Segment fallbacks, and campaign rules remain in force.

```text
Total paid spend = Google spend + Meta spend
Platform-claimed CAC = Total paid spend / (Google conversions + Meta purchases)
Site AOV = Site item revenue / Site items purchased
CAC divided by AOV = Platform-claimed CAC / Site AOV
Blended CTR = (Google interactions + Meta link clicks) / (Google impressions + Meta impressions)
Directional return = Site item revenue / matching paid spend
```

Google Interactions are not renamed to Clicks. Meta link CTR keeps its click definition. Platform-reported conversions and purchases remain claims and are not treated as a deduplicated customer count.

Platform directional ROAS uses the existing Segment allocation rule: each Segment's site revenue is allocated to Google and Meta by that platform's share of paid spend within the Segment. Campaign ROAS inherits the existing Brand, Segment, or overall directional-return ratio and keeps the existing `spend > AED 300` rule.

The Brand/Segment return fallback remains:

1. Brand site revenue divided by Brand paid spend.
2. If Brand spend is unavailable, Segment site revenue divided by Segment paid spend.
3. If Segment spend is unavailable, overall site revenue divided by overall paid spend.

The UI preserves the established `Blended ROAS`, `Blended CAC`, `Blended CTR`, `Platform conversions`, platform ROAS, Campaign ROAS, and Media score labels. The methodology continues to describe site-revenue return as directional because paid attribution is not proven.

Supplied spreadsheet calculation columns remain source controls. The importer reports reconciliation differences; it does not edit source workbooks or silently change the established output formulas to force a match.

Generic, multi-brand, and Segment-level spend remains in its source scope. It is not proportionally assigned to an individual Brand unless the workbook provides an explicit allocation rule.

### Media APIs

Base path: `/api/v1/media`

| Method and route | Purpose |
|---|---|
| `GET /periods` | Available years/months and partial-period dates |
| `GET /overview` | Supported headline metrics and N/A metric definitions |
| `GET /platforms` | Meta/Google spend, impressions, source-defined rates, claims, and cost proxy |
| `GET /campaigns` | Campaign detail, filters, pagination, and source calculation notes |
| `GET /brands` | Brand-level spend and GA4 item context |
| `GET /segments` | Segment-level spend and GA4 item context |
| `GET /reconciliation` | Platform-claim and GA4 item checks by period |
| `GET /funnel` | GA4 item-view, add-to-cart, and item-purchase funnel |
| `GET /organic-demand` | Organic Search Console demand; separate from paid traffic |
| `GET /audit/calculations/platform-cac` | Inputs and formula for the platform conversion-cost proxy |
| `GET /imports` | Import history |
| `GET /imports/:batchId` | One import audit |
| `POST /import` | Validates and stores an `.xlsx` or `.zip` Media package |

Analytics endpoints accept `year`, `month`, `segment`, and `brand` as supported by each route. Campaign detail also supports platform, stage, campaign type, paging, and sorting.

### Media database

| Collection/model | Main fields |
|---|---|
| Media import batch | batchId, period keys, file inventory, status, validation errors, warnings, reconciliation summary |
| Media platform | source lineage, period, platform, Brand, Segment, spend, claims, impressions, interactions, clicks |
| Media site | source lineage, period, Brand, Segment, mapping status, items viewed, added to cart, purchased, item revenue |
| Media campaign | source lineage, period, platform, campaign, Brand scope, Segment, stage, mapping source/confidence, spend and available traffic fields |
| Media organic | source lineage, period, Brand, Segment, market, organic clicks/impressions, weighted position input |

Every stored row keeps `batchId`, `sourceFile`, `sourceSheet`, and `sourceRow`. Period fields include year, month, key, start, end, partial flag, and source label.

## 6. Filters and period meaning

- Creative Month filters posts by publication month. It does not claim engagements occurred only in that month.
- Paid Creative whole-period exports are not split using post publication dates.
- Media Month uses the paid/GA4 reporting month from workbook sheets.
- Competition Month uses capture month, not ad start month.
- A Competition capture-date selector appears only when several captures exist in one month.
- Changing a filter does not reset the selected Organic/Paid or Meta/Google subtab.

## 7. Monthly update procedure

### Creative

1. Add the new exports under `spreadsheets data/creative-tab` using the configured account folder.
2. Keep old exports; do not overwrite history without recording a corrected version.
3. Add or update the configured canonical path and precedence rule when filenames change.
4. Confirm headers, encoding, Post IDs, reporting period, account identity, and missing fields.
5. Run tests and confirm duplicate/conflict counts before publishing.

### Competition

1. Add the new capture workbook under `spreadsheets data/compititaion-tab`.
2. Keep its capture date, Library IDs, screenshots, and analyst tags unchanged.
3. Add a configuration row for a new competitor; calculation code should not change.
4. Start the server or run tests to extract screenshots, validate associations, and upsert the capture.
5. Verify active count, date differences, duplicates, history comparisons, and missing-capture states.

### Media

1. Add a complete, internally consistent monthly workbook set to `spreadsheets data/media-tab`, or submit the supported package to `POST /api/v1/media/import`.
2. Keep the prior months and source currency fields. Do not convert an already-AED value again.
3. Add the new monthly reconciliation sheet and exact start/end dates.
4. Validate Brand/Segment mappings, generic/multi-brand scope, campaign totals, and partial-period notes.
5. Reject duplicate imported periods unless the correction workflow explicitly replaces them with retained provenance.
6. Run reconciliation and API tests before publishing.

## 8. Validation completed

The automated suite verifies:

- Creative canonical-source selection, 1,324-record deduplication, conflict reporting, 278 eligible Organic posts, matching-total formulas, 3/179 Reel watch-time coverage, and score rounding.
- Paid Creative totals of 4,487 clicks, 4,586,510 impressions, AED 10,497.17 spend, four video rows, one static row, and a 5-of-12 subset label.
- Paid account-summary totals of 12 posts, 4,896,521 impressions, 3,006,430 reach, 18,815 likes, 50 comments, 1.63x calculated frequency, and the supplied 4.28% engagement-rate column. Account totals remain separate from the five-row detail subset.
- The Creative API also reports the separate 4,157,561 paid-reach control from performance-statistics as a conflict instead of silently replacing the configured 3,006,430 posts-summary value. Source-supplied averages of 1,568 paid likes and 4 paid comments per post are displayed without being used to manufacture the missing earned-action score.
- Competition 37 active ads, average 28.6 days, start-date burst, longest runners, format/theme/language totals, date checks, 13 screenshots, and 37 verified associations.
- Media six-workbook parsing, nine periods, 1–10 September partial coverage, source controls, existing ROAS/CAC/CTR/score outputs, filters, and division-by-zero handling. All pre-integration Media tests pass unchanged.

Run the checks from the repository root:

```cmd
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

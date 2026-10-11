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

### Media formulas after the October fix list

Unrelated Media calculations, rounding, currency handling, Brand/Segment filters, and source provenance remain unchanged. The fix list explicitly removes unsigned Media scoring, corrects the paid CTR aggregation, and renames the site-revenue return card.

```text
Total paid spend = Google spend + Meta spend
Platform-claimed CAC = Total paid spend / (Google conversions + Meta purchases)
Site AOV = Site item revenue / Site items purchased
CAC divided by AOV = Platform-claimed CAC / Site AOV
Blended CTR = Sum of raw paid Clicks / Sum of matching impressions for those click rows
Revenue coverage = Site item revenue / matching paid spend
```

Google Interactions are not renamed to Clicks and are excluded from Blended CTR. Meta Link clicks retain their source definition. Platform-reported conversions and purchases remain claims and are not treated as a deduplicated customer count.

The supplied files do not provide platform-attributed conversion value. Following the later UI request to restore the existing ROAS views, platform and campaign rows use the established directional revenue-coverage fallback. This allocates reconciled site revenue using matching segment/brand spend and is always labelled directional in API provenance and tooltips. It must not be read as platform-attributed ROAS.

The Brand/Segment return fallback remains:

1. Brand site revenue divided by Brand paid spend.
2. If Brand spend is unavailable, Segment site revenue divided by Segment paid spend.
3. If Segment spend is unavailable, overall site revenue divided by overall paid spend.

The UI keeps `Blended CAC`, `Blended CTR`, `Platform conversions`, platform ROAS, and Campaign ROAS. The former site-revenue `Blended ROAS` label is now `Revenue coverage`. Media score areas show `Unscored — baselines pending` with no numeric score, benchmark bar, or performance colour.

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

Analytics endpoints accept `year`, `month`, `segment`, and `brand` as supported by each route. `segment` and `brand` accept one value or a comma-separated list. Multiple values are OR-matched within their dimension and Segment/Brand dimensions are AND-matched; the normal aggregate formulas then calculate combined totals from each matching source row once. Campaign detail also supports platform, stage, campaign type, paging, and sorting.

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
- Media Segment and Brand controls are multi-select. Selected values remain visible below the controls as comma-separated labels, and the URL preserves the selection for refresh/share.
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
- Media six-workbook parsing, nine periods, 1–10 September partial coverage, source controls, revenue coverage/CAC/CTR outputs, filters, unavailable ROAS handling, and division-by-zero behaviour.

Run the checks from the repository root:

```cmd
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

# October 2026 fix-list implementation

This section records the changes requested in `Bizcom-Fix-List-By-Section.docx`. The Consumer tab was deliberately excluded.

## Completion status

| Fix-list item | Status | Implementation |
| --- | --- | --- |
| Remove unsigned Media scoring | Complete | Every Media score value and navigation badge was removed. Media methodology now displays exactly **Unscored — baselines pending**. Valid metrics remain visible but do not feed a score. |
| Correct blended CTR | Complete | Blended CTR sums only raw rows with a compatible Clicks field and their matching Impressions. Google `Interactions` are excluded. For August 2026 the displayed result is **36,409 ÷ 3,557,299 = 1.02%**, traced to Meta `Brand x Month (spend)` raw rows. |
| Rename site-revenue return | Complete | The existing site-revenue/spend card is labelled **Revenue coverage**. Its arithmetic is preserved. It is not described as platform ROAS. |
| Correct campaign joins | Complete | Google campaigns keep their own monthly campaign fields. Meta's nine-month campaign map is retained only at its supplied aggregate grain; monthly spend, impressions, clicks, claims, and revenue are no longer proportionally copied into campaign rows. |
| Correct campaign month filtering | Complete | Campaign filters use source reporting fields. Undated/nine-month Meta campaign totals do not appear as monthly campaign data. Campaign-name dates are not used as activity dates. |
| Include both Meta accounts | Blocked by missing source | The supplied files contain the configured Rivoli Group Meta source but no combined Rivoli Group + Hour Choice export. The API adds an explicit coverage warning and does not fabricate Hour Choice spend. |
| Google ROAS provenance | Complete | Google platform and campaign delivery comes from `Rivoli-Google-Brand-Spend-Jan-Sep-2026.xlsx` and the monthly campaign mapping sheet. The source has no matching Conversion value, so no Google ROAS value is displayed or inferred from site revenue. |
| Remove composite Organic Creative score | Complete | The single Organic score number is removed. The existing Organic card and provisional wording remain, while the Attention and Active engagement components stay visible as provisional references. Navigation has no Creative score badge. |
| Typical post and Best | Complete | For a selected Union Coop month, **Typical post** uses the supplied monthly median active engagement and median frequency. **Best** uses the matching prepared rank-1 post. All-month does not average monthly medians and shows the existing unavailable state. |
| Ranking floor | Complete | Rankings include only rows where `Eligible for ranking (reach>=500)` is `YES`, and the UI states **Ranking floor: reach ≥ 500**. Other post displays and benchmark populations are not changed. |
| Why it worked | Complete | The selected month's prepared Top 3 is displayed with supplied Rank, Format/type, Language, Day, Time slot, Giveaway flag, Reach, Active engagement, Frequency, and verified post link when matched. No causal text is inferred. |
| Giveaway flags | Complete | Prepared flags are displayed in the ranked gallery and Why it worked table. Blank flags remain unflagged; captions are not classified. Monthly giveaway count and supplied share of actions are displayed. |
| Monthly trends | Complete | A chronological dual-axis chart displays the prepared monthly median active engagement (%) and median frequency (x). Missing months are not interpolated. |
| Light theme | Complete | Shared semantic tokens implement the pale-blue background, white/light-blue surfaces, soft borders, navy text, blue-grey secondary text, blue-to-teal selected controls, and subtle shadows across Media, Creative, and contextual Competition views. |
| Competition behavior | Preserved | Competition calculations, contextual access, source labels, filters, and screenshot associations were not changed. A standalone Competition navigation entry was not restored. |

### October UI follow-up

- The Creative Paid view now exposes only the supported **Meta ads** platform control. The unsupported **Google Shopping** button and its unavailable-only panel were removed; no Meta data or calculation changed.
- Media **Segment** and **Brand** custom dropdowns now use white/light-blue surfaces, navy text, teal indicators, and a clearly highlighted selected option.
- Media **Segment** and **Brand** dropdowns support multiple checked values and display the selected Segment and Brand lists immediately below the controls. Combined results sum matching source records once and recompute ratios from the combined numerators and denominators.
- The expanded **Media Competition** panel now uses the same light card, table, action, capture, and empty-state palette as the rest of Media. Competition data rules and calculations remain unchanged.

## Creative workbook mapping

Source: `spreadsheets data/creative-tab/UnionCoop-Creative-WhyItWorked-Import.xlsx`.

- `Post Metrics (import)` provides Post ID, Dubai publication timestamp, month, day, time slot, type, language, Giveaway flag, prepared Reach, Views, Active actions, Active engagement, Frequency, explicit ranking eligibility, Theme, and caption excerpt.
- `Why It Worked - Monthly Top 3` provides the prepared month, rank, Post ID, factors, Giveaway flag, metrics, theme, and caption used in the **Why it worked** section.
- `Monthly Benchmarks` provides the monthly eligible counts, ranking-eligible counts, median and mean active engagement, median frequency, Giveaway post count, and supplied Giveaway action share.
- Prepared values are imported directly. The engine does not recreate classifications, medians, Top 3 ranks, or Giveaway rules.
- Post IDs remain strings. Verified Buffer records are joined by Union Coop account plus Post ID only to add the existing post URL/image. Unmatched IDs are reported by the API and rendered without an invented link or image.
- The prepared workbook affects Union Coop only. Souq and Pocari behavior is unchanged.

## Media source and calculation notes

- **Revenue coverage** keeps the established calculation: compatible mapped site revenue divided by compatible advertising spend.
- **Blended CTR** is `sum(raw paid clicks) / sum(matching raw paid impressions)` across rows that actually provide a compatible Clicks field. Google `Interactions`, organic clicks, and invented clicks are excluded instead of making the supported Meta click rate unavailable. August 2026 uses 36,409 Link clicks and 3,557,299 impressions, producing 1.02%.
- Platform and campaign ROAS are not displayed because the supplied sources do not contain matching platform/campaign conversion value. Site revenue is not allocated to those rows. The separate Revenue coverage card retains its established site-revenue/spend calculation.
- Google campaign rows come from the supplied campaign reporting sheet and retain their campaign-specific spend, impressions, Interactions, and conversions. The UI labels the response rate as **Interaction rate**, not CTR based on Clicks.
- Meta's `Meta Campaign Brand Map` contains nine-month campaign spend. It is retained with that provenance and excluded from monthly campaign views. Monthly brand totals are not distributed across campaigns.
- Media scoring has no fallback, zero, reweighting, score bar, score color, or navigation badge. The only score output is **Unscored — baselines pending**.

## Exact UI label changes and additions

- Changed `Blended ROAS` to `Revenue coverage` only for the site-revenue/spend metric.
- Added `Unscored — baselines pending` to the Media methodology/score area.
- Added `Typical post`, `Best`, `Why it worked`, `Giveaway`, and `Ranking floor: reach ≥ 500`.
- Existing unrelated card, tab, filter, column, metric-definition, Organic + boosted honesty, N/A, and watch-time coverage labels were preserved.

## Theme implementation

`client/src/styles/theme-light.css` is loaded after the existing component styles. It defines shared semantic tokens (`--bg`, `--card`, `--card-2`, `--line`, `--ink`, `--muted`, `--blue`, `--teal`, and status colors) and overrides hardcoded dark surfaces without changing page structure or component dimensions. Tables retain container scrolling on narrow screens, while toolbars and cards wrap responsively.

## Validation performed

- Server TypeScript build passed.
- Client TypeScript/Vite production build passed. Vite reports only the existing large-chunk advisory.
- Server Vitest suite passed: 5 files and 25 tests.
- Server and client ESLint passed with zero warnings.
- Workbook checks verified 278 prepared post rows, 27 monthly Top 3 rows, and 9 monthly benchmark rows.
- August checks verified 52 eligible posts, 51 ranking-eligible posts, 7 Giveaway posts, three prepared Top 3 rows, the expected rank-1 Post ID, and no composite Organic score.
- Paid Creative control totals remain 4,487 paid clicks, 4,586,510 paid impressions, and AED 10,497.17 spend for the five-row subset.
- Media API checks verify the exact unscored label, August Blended CTR of 36,409 raw clicks divided by 3,557,299 matching impressions, exclusion of Google Interactions, unavailable platform/campaign ROAS without conversion value, and no monthly Meta campaign allocation.
- Existing Competition acceptance tests passed unchanged.
- Light-theme contrast checks passed for primary text (15.66:1), secondary text (6.16:1), Organic accent text (5.06:1), Paid accent text (6.17:1), and green status-badge text (5.14:1) against their card backgrounds.
- Headless desktop and mobile screenshots confirmed the light palette and responsive shell. This check exposed a runtime XLSX module-import mismatch; it was corrected to the package's ESM-compatible default import. A post-fix live runtime smoke check then loaded 278 prepared rows and produced the August dashboard with 51 ranking-eligible posts and 3 prepared Top 3 rows.

## Render deployment considerations

- Keep all three spreadsheet source directories in the deployed repository using their current spelling.
- `UnionCoop-Creative-WhyItWorked-Import.xlsx` must remain under `spreadsheets data/creative-tab`; the server resolves it from either the repository root or the server working directory.
- Do not exclude the workbook or Competition assets in `.gitignore`/Render build filters.
- Rebuild the server after source changes so stale compiled files cannot restore prior score logic.
- Use the existing `VITE_API_BASE_URL` and `CLIENT_ORIGIN` environment variables for the deployed client/API origins.
- A future corrected workbook can replace the source file using the same headers. Imports remain source-driven and cached Creative data is cleared through the existing process restart/cache lifecycle.

## Remaining blockers

- The combined Rivoli Group + Hour Choice Meta export is missing, so the second account cannot be reconciled.
- Matching platform Conversion value/revenue is absent for Google and Meta. Platform and campaign ROAS therefore remain N/A; site revenue/spend is shown only as Revenue coverage.
- Paid shares, paid saves, and ThruPlays remain unavailable, so a complete Paid Creative score cannot be produced.

## 9 October 2026 consolidated change document

This section supersedes earlier notes where the new consolidated fix document changed the requested behavior.

### Completion status

| Change | Status | Implementation |
|---|---|---|
| TBL Reads at the top of each supported section | Complete | `TBL-Reads-Import.xlsx`, sheet `Reads`, is exposed by `GET /api/v1/reads`. At most three authored bullets are returned for the exact client, section, and period. Missing periods show `TBL read pending`; the engine never writes or generates these sentences. |
| Consumer tab | Complete for supplied fields | Added `GET /api/v1/consumer/options`, `GET /api/v1/consumer/dashboard`, a responsive Consumer route, six required cards, monthly trends, cohort evidence, partial-period handling, and aligned Media-spend versus first-time-purchaser intake. |
| Creative v3 prepared workbook | Complete | The server reads `Post Metrics (import)`, `Why It Worked - Monthly Top 3`, `Monthly Benchmarks`, and `Creative Cuts (import)` directly. `ALL 2026` is supported. |
| Creative scoring removal | Complete | No Organic or Paid 0-100 component, 50% weight, or composite score is rendered. Raw frequency, active engagement, and Paid CTR remain. |
| Creative ranking bands | Complete | Gallery records use the workbook `Band (vs monthly median)` value and appear in collapsible Top, Core, and Low groups. Top is open initially. Rankings enforce the workbook `Eligible (reach>=500)` flag. |
| Creative Cuts and trends | Complete for supplied columns | Language, Format, Time slot, Giveaway, Action mix, and Follows are imported. Median active engagement and median frequency are plotted. Output and reach-per-post are shown as N/A because the workbook does not supply those benchmark columns. |
| Creative images | Honest unavailable state | Post links remain clickable. No unrelated or generated image is used. Cards show `Image not available`; the supplied v3 workbook has no verified Top-3 screenshot assets. |
| Media score removal | Complete | Every Media score location remains `Unscored — baselines pending`; no numeric score or score-derived colour is produced. |
| Blended CTR | Complete | Uses matching raw paid clicks divided by matching paid impressions. Google Interactions are excluded from the click numerator and visibly labelled `Interaction rate` in the platform table. |
| Revenue coverage | Complete | Site revenue divided by compatible spend remains labelled `Revenue coverage`, never platform ROAS. |
| Platform and campaign ROAS provenance | Complete | Platform and campaign ROAS are now N/A because matching platform-reported conversion value is absent. Site/brand revenue is not copied or allocated into these rows. |
| Campaign joins and month filtering | Complete | Rows keep their campaign-specific source grain and period evidence. Unsupported monthly Meta campaign detail remains unavailable rather than being inferred from names or whole-period totals. |
| Media trends and deltas | Complete | Headline cards receive compact monthly trends. Full-month comparisons use month versus previous full month; All Months uses the last full month versus the prior-three-full-month average. September partial data is excluded. |
| Media multi-select toolbar | Complete | Segment and Brand remain independent multi-select controls. Selected values appear immediately below the dropdown row, and desktop/tablet/mobile toolbar layouts avoid the earlier oversized Brand row. |
| Competition contextual views | Complete for supplied EDIT capture | Competition stays inside Creative and Media. Media now includes launch timeline, age profile, grouped activity detail, and small grey Library IDs. Existing capture rules, screenshots, source labels, and no-spend/no-performance limits are preserved. |

### New source mappings

- `spreadsheets data/creative-tab/UnionCoop-Creative-WhyItWorked-Import.xlsx`
  - `Post Metrics (import)`: post identity, URL, month, format, language, giveaway, band, reach, views, actions, engagement, frequency, ranking eligibility, theme, and caption.
  - `Why It Worked - Monthly Top 3`: prepared rank and explanatory factors. No causal text is generated.
  - `Monthly Benchmarks`: eligible counts, monthly medians, giveaway count, and giveaway action share.
  - `Creative Cuts (import)`: display-ready cross-cuts and follows.
- `spreadsheets data/consumer-tab/Rivoli-Consumer-Import.xlsx`
  - `Monthly Series (import)`: customer base, first-time purchaser intake, supplied delta, repeat observations, and partial flag.
  - `Cohort Matrix (import)`: approximate repeat evidence with GA4 privacy rounding.
  - `Fixed Card Values (import)`: card state and label notes.
- `spreadsheets data/TBL-Reads-Import.xlsx`
  - `Reads`: authored client/section/period bullets, order, linked-card tag, author, and date.

### Exact label changes

- Media: `Blended ROAS` was replaced by `Revenue coverage` where site revenue is divided by spend.
- Media score areas: `Unscored — baselines pending`.
- Creative raw components: `Frequency` and `Active engagement`; the prior 0-100 component labels and 50% labels were removed.
- Creative additions: `Typical post`, `Best`, `Why it worked`, `Creative Cuts`, `Giveaway`, and `Ranking floor: reach ≥ 500`.
- Consumer additions: `Customer base`, `New customer intake`, `Repeat buying share`, `Consideration window`, `Visitor retention`, and `True repeat & value`; the final card displays `Awaiting order export — Thirty31North`.

### Validation performed

- Server TypeScript build passed.
- Client production TypeScript/Vite build passed.
- Server test suite passed: 28 tests across six files.
- Server and client ESLint passed with zero warnings.
- Creative checks confirm 278 prepared posts, 276 all-period ranking-eligible posts, 51 August ranking-eligible posts, 30 prepared Top-3 rows including the all-period rows, 10 benchmark rows, and 138 Creative Cuts rows.
- Consumer checks confirm nine monthly rows, September partial, Jan-Aug first-time purchaser total 9,610, Jan-Aug customer-base total 9,786, and eight full-month aligned observations.
- Media checks confirm August Blended CTR uses 36,409 compatible clicks / 3,557,299 impressions and remains below 3%; Google Interactions do not enter this numerator.
- Media platform and campaign checks confirm ROAS and directional revenue are null without compatible conversion value.
- Competition acceptance tests remain unchanged and passing.
- Automated browser screenshot capture could not be completed in this run because the Windows browser-control helper reset twice while opening the local page. Responsive behavior was still checked through the production build, CSS breakpoints, and existing component tests; no screenshot comparison is claimed for this run.

### Remaining source blockers

- The combined Rivoli Group + Hour Choice Meta export is not present. All-period Meta coverage cannot be reconciled to the document's approximately AED 2.02M reference, and the UI must continue to disclose incomplete account coverage.
- Matching Google/Meta platform-reported conversion value is absent, so platform and campaign ROAS remain N/A.
- Carrefour and LuLu capture workbooks are not present. Union Coop Competition remains `Data not received`; no results are created from the brief or TBL Reads sentences.
- Consumer Day-1, Day-7, and Day-30 visitor-retention values are not present, so `Visitor retention` remains N/A.
- Consumer purchases by first-touch channel are not present, so the channel-alignment pair remains `Data not available`.
- The Thirty31North order export is not present, so true 6/12-month repeat and customer-value fields remain pending.
- Creative Monthly Benchmarks does not supply output or reach-per-post columns, and the Creative workbook does not supply verified thumbnails/screenshots. These remain N/A rather than being derived or fabricated.

## 11 October 2026 UI correction and consolidated-document audit

### Media UI corrections

- Rebuilt the Media heading as a two-column grid with a shrink-safe controls column. Year, Month, Segment, Brand, and Competition now share one aligned toolbar at desktop width and stack at the existing tablet/mobile breakpoints.
- Segment and Brand keep their independent multi-select menus. Their selected-value summaries stay below the toolbar and no control overlays another control.
- Removed the ROAS column from both **By platform** and **Campaign detail** tables.
- Removed the unsupported **Campaign ROAS (spend > AED 300)** graph. The source workbooks do not provide matching campaign conversion value, so an honest graph cannot be drawn. Campaign Detail now occupies the full available width.
- Kept **Revenue coverage**, because it is the approved site-revenue/spend calculation and is not labelled platform or campaign ROAS.
- Added the two requested Consumer **Aligned** panels to the bottom of Media. Media-spend versus first-time-purchaser intake is populated; purchase by first-touch channel remains `Data not available` because that source field is missing.

### `Bizcom-All-Changes-One-Document-09-Oct.docx` verification

| Document area | Status | Verification |
| --- | --- | --- |
| TBL Reads | Complete | Exact imported reads are served for Media, Creative, Consumer, and an opened Competition context. A maximum of three rows is shown; missing periods use the pending state. |
| Trend rules | Partial: supplied fields complete | Media headline cards have monthly trends and comparison deltas, and partial September is excluded. Creative plots supplied median engagement/frequency. Consumer has its monthly trend and biggest mover. Creative output and reach-per-post trends cannot be created because those benchmark columns are absent. |
| Media scoring, CTR, revenue coverage | Complete | No numeric Media score is rendered. August CTR is 36,409 / 3,557,299 = 1.02%; Google Interactions are excluded. Site revenue/spend is labelled Revenue coverage. |
| Media account coverage | Blocked by missing source | The combined Rivoli Group + Hour Choice Meta export is absent, so the approximate AED 2.02M reconciliation cannot be verified or displayed. |
| Media campaigns | Complete for supplied monthly rows | Campaign-specific source rows and period evidence are used. Whole-period Meta rows are not allocated into a month. ROAS columns/chart are removed because matching conversion value is absent. |
| Creative scoring and bands | Complete | 0-100 components/weights are removed. Top/Core/Low bands come from the prepared workbook; Top starts open and reach >= 500 eligibility is enforced. |
| Creative Cuts and prepared trends | Complete for supplied fields | Language, format, time slot, giveaway, action mix, follows, median engagement, and median frequency are imported. No missing benchmark is fabricated. |
| Creative imagery | Blocked by missing source | Post links work and neutral placeholders are shown, but the supplied workbook has no verified monthly Top-3 images. |
| Competition inline Rivoli view | Complete | Contextual Creative/Media panels remain in-page. Media Competition includes start-month timeline, age profile, Theme mix, theme counts, grouped details, and grey Library IDs. EDIT capture images and associations remain source-driven. |
| Union Coop Competition | Blocked by missing source | Carrefour and LuLu capture workbooks are absent. The selector reports `Data not received`; Tempo/prize-promotion pairs and own-vs-competitor comparisons are not fabricated. |
| Consumer tab | Complete for supplied fields | Six cards, three visual states, imported monthly/cohort data, partial-period handling, trends, and aligned Media panels are present. Visitor retention, first-touch channel purchases, and true repeat/value remain unavailable pending their named sources. |
| Acceptance safeguards | Complete | No unsigned 0-100 score is rendered; no site revenue is presented as platform/campaign ROAS; missing values stay N/A/Data not available/Data not received; partial September remains excluded from comparisons. |

### Verification run

- `npm.cmd run lint`: passed for server and client.
- `npm.cmd test`: passed, 28 server tests and 3 client tests.
- `npm.cmd run build`: passed for server TypeScript and client production build; Vite reports only its existing bundle-size advisory.
- Static UI audit confirms no `ROAS` table header or `Campaign ROAS` chart remains in Media components.

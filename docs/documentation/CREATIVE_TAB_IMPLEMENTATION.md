# Creative Tab Implementation

## 1. Scope

The application implements the Creative tab only alongside the existing Media tab. The Creative page follows the layout and labels in `GP-BizCom-Dashboard.html`, but it never uses the HTML's Pocari Sweat or Marah Kids cached values as client data.

The Creative page reads the CSV exports under:

```text
spreadsheets data/creative-tab
```

The page is available at:

```text
/creative
```

## 2. Implementation flow

```text
Client CSV files
  -> encoding detection
  -> CSV table parsing
  -> brand and platform mapping
  -> duplicate-source selection
  -> typed post normalization
  -> Year, Month, and Brand filtering
  -> server calculations
  -> Creative API
  -> React Creative tab
```

The server owns source selection, filtering, missing-value handling, and calculations. The React page formats and displays the API result.

## 3. Source formats

### Buffer CSV files

Buffer exports are normally UTF-8. The parser supports quoted fields, commas, and captions that span several lines.

The selected Union Coop Instagram file is:

```text
Buffer insights Union Coop/UC buffer Instagram/posts.csv
```

### Meta CSV files

The Souq exports are UTF-16 little-endian. They start with `sep=,` and can contain a metric title, a data table, blank lines, and another summary table.

The parser detects the byte-order mark, removes the `sep=,` line, and identifies the table from its contents. It does not depend only on the filename.

## 4. Brand and account mapping

The configurable mapping is in:

```text
server/src/modules/creative/config/creative-source.config.ts
```

| Brand | Account or aliases | Available source level |
| --- | --- | --- |
| Union Coop | `union.coop`, `Union Coop` | Complete Instagram post export |
| Souq Al Bahar | `SAB`, `Souq Al Bahar` | Daily account totals and summaries |
| Souq Al Jubair | `Souq Al Jubair`, filename spelling aliases | Daily account totals and summaries |

Souq Al Bahar and Souq Al Jubair do not currently have individual post rows. Their Brand option remains visible, but the Organic post gallery shows an informative unavailable state.

## 5. Duplicate prevention

The two Union Coop Instagram exports contain the same 1,324 Post IDs. They must not be concatenated.

The configured rule is:

1. Use `UC buffer Instagram/posts.csv` as the canonical complete post export.
2. Read `UC Instagram Buffer/posts.csv` only for conflict comparison.
3. Match records by Brand, account, platform, and Post ID.
4. Keep the canonical row when values conflict.
5. Never choose the largest value to resolve a conflict.
6. Report conflict counts through the Creative API and methodology section.

The current comparison found 44 Post IDs with at least one conflict. The main conflict counts are:

| Field | Conflicting Post IDs |
| --- | ---: |
| Views | 44 |
| Reach | 41 |
| Reactions | 9 |
| Saves | 3 |
| Comments | 2 |
| Shares | 1 |
| Average watch time | 1 |

Account summaries, selected-post extracts, and complete post exports are classified separately. They are not combined into one total.

## 6. Normalized post record

Each normalized post stores:

- Brand and account.
- Platform.
- Post ID.
- Publication timestamp, year, and month.
- Post type.
- Caption.
- Post URL.
- Reach and views.
- Shares, saves, comments, and reactions.
- Average watch time in seconds.
- Story exits, taps back, and taps forward when present.
- Source filename and source kind.
- Reporting-period start and end.

A blank source cell becomes `null`. A measured `0` remains `0`. Missing and unsupported values are never silently converted to zero.

Some captions in the source contain recoverable UTF-8 mojibake. The normalizer repairs that encoding for display while retaining the source file unchanged.

## 7. Filters

### Year

Year values come only from dated source records. The current files contain 2026 data. The application does not create options for other years.

### Month

Month filters use the post publication timestamp. The page describes results as performance of posts published during the selected period. It does not claim that every displayed action happened during that month.

September is marked partial because source coverage ends before the end of September.

### Brand

The Brand filter includes Union Coop, Souq Al Bahar, and Souq Al Jubair. Every supported section updates from the selected Brand. Brands without post-level data show a clear unavailable message.

No segmentation filter is included.

### Timezone

The exports do not provide an account reporting timezone. The implementation consistently uses UTC, which also matches the `Z` timestamps in the Buffer post export.

## 8. Organic post eligibility

Only Union Coop Instagram records meeting all these rules enter the Organic post calculations:

- Post Type is `Post` or `Reel`.
- Reach is present and greater than zero.
- The record comes from the selected canonical complete export.
- The record matches the selected Year and Month.

Stories are excluded from the Post/Reel gallery and these calculations. They remain available in the normalized source model for future story-specific reporting.

The complete canonical export currently contains:

| Record type | Rows |
| --- | ---: |
| Posts | 99 |
| Reels | 179 |
| Stories | 1,046 |
| Total | 1,324 |

## 9. Organic formulas

### Active actions

```text
Active actions = Shares + Saves + Comments
```

Likes and reactions are not included.

### Post active engagement rate

```text
Post active engagement rate = Post active actions / Post reach
```

Posts are ranked from the highest to the lowest active engagement rate.

### Overall active engagement rate

```text
Overall active engagement rate =
  Sum of active actions for eligible posts
  / Sum of reach for the same eligible posts
```

The application does not average row percentages.

### Frequency

```text
Frequency = Sum of views / Sum of reach
```

The numerator and denominator use the same eligible post set. Summed post reach is labelled as summed post reach. It is not described as unique monthly audience reach.

### Watch time

The Buffer column `Avg. Watch Time (sec)` is already in seconds. It is not divided by 1,000.

Only 3 of the 179 Reels in the complete export have populated average watch time. Missing values are not estimated.

## 10. Organic scoring configuration

Reference scoring uses the unchanged HTML formulas by default. To hide score values while retaining source metrics, set:

```text
CREATIVE_SCORING_MODE=disabled
```

Supported values are:

```text
disabled
html-reference
```

The default is `disabled`. The score-card layout remains visible and says `Score not available`.

When `html-reference` is enabled, every metric score uses:

```text
Raw score = round((value - bad anchor) / (good anchor - bad anchor) * 100)
Displayed score = clamp(Raw score, 2, 100)
```

The implementation intentionally preserves the HTML's minimum of 2, even though the UI table says 0 to 100.

### Attention score

For an image or Post:

```text
Frequency = Views / Reach
Frequency benchmark = 1.00x to 2.00x
```

For a Reel with watch time:

```text
Watch-time benchmark = 2.0 seconds to 8.0 seconds
```

For a Reel without watch time, the HTML reference frequency fallback is used when Views and Reach are available.

The summary Attention score is reach-weighted:

```text
Attention score = round(
  Sum of post attention score * post reach
  / Sum of reach for posts with an eligible attention input
)
```

### Active engagement score

```text
Active engagement benchmark = 0.50% to 5.00%
```

### Organic creative score

```text
Organic creative score = round(
  50% * Attention score
  + 50% * Active engagement score
)
```

When enabled, all these scores are labelled provisional because they use reference HTML benchmarks.

The exports do not establish a clean organic and paid split. The UI therefore labels supported post results `Organic + boosted combined`.

The overall Creative navigation score remains unavailable because a single Organic score is not a complete Organic plus Paid score.

## 11. Unavailable sections

The supplied CSV files do not include paid ad-level or Google product-level creative inputs. The following reference sections remain in the UI and show `Data not available`:

- Paid creative score.
- Paid Attention · 50%.
- Paid Active engagement · 50%.
- Earned actions.
- Video creatives ranked by budget.
- Static creatives ranked by budget.
- Full ad-level detail.
- Paid-score methodology values.
- Product-image CTR.
- Top product.
- Products (>50 clicks).
- Product creatives ranked by click-through.
- Google product-score methodology values.

Organic post metrics do not replace paid-ad metrics. Daily account totals do not replace product or ad rows.

## 12. Gallery images

The CSV files do not contain structured image or thumbnail URLs.

The gallery uses deterministic reference-style gradient placeholders. The placeholder is generated from the Post ID and caption, so it remains stable between page loads. Post links remain clickable.

The typed model can be extended with image mappings by Post ID, Ad ID, or Product ID when a future source supplies them. A social post URL is never treated as a direct image URL.

## 13. APIs

### Get Creative options

```http
GET /api/v1/creative/options
```

Returns available years, months, partial-period status, Brand options, timezone, and the default selection.

### Get Creative dashboard

```http
GET /api/v1/creative/dashboard?year=2026&month=8&brand=union-coop
```

Returns the selected period, source status, normalized and ranked post cards, calculated Organic metrics, scoring state, unavailable Paid states, and duplicate-source audit.

## 14. Current verification totals

The independent audit of the canonical complete Union Coop Instagram export produced:

| Check | Result |
| --- | ---: |
| Selected export rows | 1,324 |
| Unique selected Post IDs | 1,324 |
| Duplicate export rows excluded | 1,324 |
| Conflicting Post IDs reported | 44 |
| Eligible Posts and Reels | 278 |
| Summed post reach | 543,645 |
| Views | 885,458 |
| Shares | 8,781 |
| Saves | 1,259 |
| Comments | 11,869 |
| Active actions | 21,909 |
| Overall active engagement rate | 4.03% |
| Frequency | 1.63x |
| Reels with watch time | 3 of 179 |

## 15. Monthly update workflow

When the client sends the next monthly files in the same format:

1. Place the files under `spreadsheets data/creative-tab` in the matching Brand folder.
2. Keep the original encoding and headers.
3. Update the configured selected source path only if the complete export filename changes.
4. Do not combine two complete exports covering the same Post IDs.
5. Restart the server so its in-memory source cache reloads.
6. Open `/creative` and select the new Year, Month, and Brand.
7. Confirm the new Month label and partial-period status.
8. Compare row counts, unique Post IDs, date limits, and metric totals with the source export.
9. Review reported conflicts before accepting a replacement source.
10. Confirm that missing values remain unavailable and measured zeros remain zero.

Paid Meta rows are now normalised separately for the five-record Pocari Sweat subset. The whole-export paid CTR, reach, impressions, spend rankings, and partial detail are available under `All months`. Paid shares, saves, ThruPlays, complete account detail, and Google products remain unavailable. Organic records are never reused for those sections.

## 16. Main implementation files

```text
server/src/modules/creative/config/creative-source.config.ts
server/src/modules/creative/import/csv-parser.ts
server/src/modules/creative/import/creative-source-parser.ts
server/src/modules/creative/calculations/creative-calculations.ts
server/src/modules/creative/services/creative.service.ts
server/src/modules/creative/controllers/creative.controller.ts
server/src/modules/creative/routes/creative.routes.ts
client/src/pages/CreativeDashboardPage.tsx
client/src/features/creative
client/src/styles/reference-creative.css
server/tests/creative-calculations.test.ts
```

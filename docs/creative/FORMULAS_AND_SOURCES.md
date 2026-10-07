# Creative Formulas and Data Sources

## Current source files

The canonical Union Coop Instagram file is configured as:

`Buffer insights Union Coop/UC buffer Instagram/posts.csv`

The comparison-only duplicate export is:

`Buffer insights Union Coop/UC Instagram Buffer/posts.csv`

Both exports contain the same Post IDs. They are never concatenated.

The Souq Al Bahar and Souq Al Jubair files provide account-level coverage only. They cannot support individual post cards or post-level engagement formulas.

## Source-precedence rule

The configured canonical complete export is used. The alternate complete export is used only to report conflicts.

The importer does not:

- Double-count matching Post IDs.
- Choose the largest metric value.
- Mix summary files into post totals.

## Supported CSV formats

- UTF-8 Buffer CSV files.
- UTF-16 little-endian Meta exports.
- Meta files beginning with `sep=,`.
- Multiple table blocks separated by blank lines.

Missing values remain `null`. They are not silently converted to measured zero.

## Normalised field mapping

| CSV field | Normalised field |
| --- | --- |
| `Channel Name` | Account |
| `Network` | Platform |
| `Post Id` | Post ID |
| `Published At` | Publication timestamp, year, and month |
| `Post Type` | Format badge |
| `Post Text (Excerpt)` | Caption |
| `Post URL` | Safe external post link |
| `Reach` | Reach |
| `Views` | Views |
| `Shares` | Shares |
| `Saves` | Saves |
| `Comments` | Comments |
| `Reactions` | Reactions |
| `Avg. Watch Time (sec)` | Average watch time in seconds |
| `Thumbnail URL`, `Image URL`, or `Media URL` | Image URL only when it is valid HTTP/HTTPS |

A post URL is never treated as an image URL.

## Eligible Organic records

A record is eligible when:

- Post type is `Post` or `Reel`.
- Reach is present and greater than zero.

## Active actions

```text
Active actions = Shares + Saves + Comments
```

If any required action field is missing, active actions and active engagement are `null` for that post.

## Post active engagement rate

```text
Post active engagement rate = Active actions / Post reach
```

Posts are ranked from highest to lowest active engagement rate.

## Overall active engagement rate

```text
Overall active engagement rate = Sum of eligible active actions / Sum of matching eligible reach
```

Individual post percentages are not averaged.

## Frequency

```text
Post frequency = Views / Reach

Overall frequency = Sum of views / Sum of matching reach
```

## Summed post reach

```text
Summed post reach = Sum of eligible post reach
```

This is not unique monthly audience reach. The same person may be reached by several posts.

## Attention basis

- A Reel with positive average watch time uses watch time.
- Other eligible posts, including Reels without watch time, use frequency as the HTML-reference fallback.
- Missing watch time is never estimated.

## Reference scoring

Metric score:

```text
Score = ((value - bad anchor) / (good anchor - bad anchor)) × 100
```

Scores are rounded and clamped from `2` to `100`.

| Component | Bad anchor | Good anchor |
| --- | ---: | ---: |
| Frequency attention | 1.00x | 2.00x |
| Reel watch-time attention | 2.0 sec | 8.0 sec |
| Active engagement rate | 0.50% | 5.00% |

Attention is reach-weighted:

```text
Attention score = Sum(post attention score × post reach) / Sum(eligible attention reach)
```

Overall Organic score:

```text
Organic score = 50% attention score + 50% active engagement score
```

If either component is unavailable, the overall score is `N/A`; the remaining component is not silently reweighted.

The result is labelled `Reference benchmark score` because client-specific benchmark approval is not established.

## Scoring configuration

Reference scoring uses the unchanged HTML formulas by default. Disable score display without changing the underlying source metrics with:

```env
CREATIVE_SCORING_MODE=disabled
```

When disabled, the layout remains but score values display `Score not available` or `N/A`.

## Paid Meta subset

The paid source is `buffer-posts-analytics-csv/posts-20260101-to-20261001.csv`. All five rows are configured as Pocari Sweat because every caption identifies Pocari Sweat and the file does not provide a channel account ID. The separate summary reports 12 paid posts, so the detail is labelled as a subset.

```text
Paid CTR = Sum of paid clicks / Sum of paid impressions
Paid record CTR = Paid clicks / Paid impressions
Paid spend = supplied AED value after parsing the AED_ prefix
```

Verified detail totals are 4,487 paid clicks, 4,586,510 paid impressions, AED 10,497.17 spend, and about 0.098% CTR. The four video rows and one static row are ranked by supplied spend.

The account summary `buffer-posts-analytics-csv/posts-summary-20260101-to-20261001.csv` supplies these wider account totals:

- 12 paid posts.
- 4,896,521 paid impressions.
- 3,006,430 paid reach.
- 18,815 paid likes.
- 50 paid comments.
- 4.28% in the supplied `Engagement Rate` column.

The UI keeps the account summary separate from the five-row detail subset. It additionally shows:

```text
Paid frequency = Account paid impressions / Account paid reach
Measured comment rate = Account paid comments / Account paid reach
Passive like rate = Account paid likes / Account paid reach
```

Paid frequency is about 1.63x and measured comment rate is about 0.0017%. Likes are shown as passive actions and are not inserted into the earned-actions score. The supplied 4.28% engagement rate is displayed as a source value, but it is not used for reference scoring because the source does not define its denominator or included actions.

`average-performance-statistics-20260101-to-20261001.csv` also supplies averages of 1,568 paid likes and 4 paid comments per paid post. They are displayed as source-supplied averages rather than recalculated replacements.

There is a source conflict for account paid reach: `posts-summary` reports 3,006,430, while `performance-statistics` reports 4,157,561. The configured rule uses `posts-summary` for the displayed account summary because its reach, comments, and engagement-rate value are provided together. The other value is retained and shown as a control discrepancy. The importer does not add the two values or choose the larger one.

The source covers 1 January to 1 October 2026 as one export period. These cumulative metrics appear only under `All months`; they are not allocated to March because the five posts were published in March.

The HTML reference supports CTR as the paid-attention fallback when ThruPlay is unavailable. That component can be shown as a provisional reference benchmark when reference scoring is enabled. Paid earned engagement and the complete Paid score remain unavailable because paid shares and saves are missing.

## Unsupported formulas

The supplied data cannot calculate:

- Paid creative score.
- Paid video-through rate.
- Paid earned-action rate.
- Product-image CTR.
- Top Google product.
- Complete account-level paid detail beyond the five supplied rows.

These sections do not use Organic values as substitutes.

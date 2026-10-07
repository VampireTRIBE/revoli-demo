# Creative Tab UI Labels, Data Sources, and Formulas

## 1. Purpose

This document explains every data label that is visible in the Creative tab of `GP-BizCom-Dashboard.html`.

For each label, it explains:

- what the user sees;
- what the value means;
- the formula used;
- the input columns;
- the workbook, sheet, CSV, or live dataset that supplies the input;
- whether the available client files can reproduce the value accurately.

Only values visible in the Creative UI are covered here.
### Current application scope

The React/Express application in this repository currently implements the **Media tab**. The Creative tab documented here is the reference UI inside `docs/documentation/GP-BizCom-Dashboard.html`; it is not currently rendered by the Media page or calculated by the Media API.

This guide records the exact Creative labels, formulas, and source requirements so a future Creative API can reproduce the reference UI without incorrectly treating Media workbook totals as creative-level data.

## 2. Important source status

The current Creative reference UI is implemented only in:

```text
docs/documentation/GP-BizCom-Dashboard.html
```

Its displayed Creative values are not read from the six Media `.xlsx` workbooks. The reference HTML uses these datasets:

| UI area | Current source | Workbook | Sheet | Period |
| --- | --- | --- | --- | --- |
| Organic | Instagram data from Windsor.ai, with a cached `ig_pocari` copy inside the HTML | None | None | Last 90 days |
| Paid / Meta ads | Meta Ads data from Windsor.ai, with cached `meta_ads` and `meta_thumbs` copies inside the HTML | None | None | Last 30 days |
| Paid / Google Shopping | Google Merchant data from Windsor.ai, with a cached `merchant` copy inside the HTML | None | None | Last 30 days |

The repository also contains client-supplied CSV exports in `creative tab/`. A CSV is one table and therefore has no workbook sheet name. Those files are useful inputs, but they are not currently connected to the application API or to the reference HTML.

The Creative tab should not claim that a number came from an `.xlsx` sheet when it actually came from a live connector, cached HTML data, or a CSV export.

## 3. Main visual labels

| Visual label | Meaning | Data shown |
| --- | --- | --- |
| `Creative` | Creative-performance section | Contains Organic and Paid views |
| `ORGANIC · LIVE` | Organic data status | Instagram organic-post data |
| `PAID · LIVE` | Paid data status | Meta Ads and Google Merchant data |
| `Two buckets, one lens.` | Method summary | Organic and Paid Meta use attention and active engagement |
| `Organic · Pocari Sweat` | Organic score summary | Pocari Sweat Instagram demo score, 0–100 |
| `Paid · Marah Kids` | Paid score summary | Marah Kids Meta creative score, 0–100 |
| `Organic (Pocari IG)` | Opens the Organic panel | Instagram post metrics and gallery |
| `Paid (Meta + Google)` | Opens the Paid panel | Meta Ads plus a separate Google Shopping view |
| `Meta ads` | Opens paid Meta results | Meta creative cards and ad-level detail |
| `Google Shopping` | Opens product-creative results | Google Merchant product image CTR |

The names `Pocari Sweat` and `Marah Kids` are part of the reference HTML. They are not derived from the local `creative tab` CSV filenames.

## 4. Shared score formula

Every metric score uses a bad anchor and a good anchor.

```text
Raw Score = round((Metric Value - Bad Anchor) / (Good Anchor - Bad Anchor) × 100)

Displayed Score = clamp(Raw Score, minimum 2, maximum 100)
```

If the value is missing or invalid, the score is unavailable. The current code uses a minimum score of `2`, even though the method table says `0 → 100`.

## 5. Creative navigation score

The number shown in the top `Creative` navigation pill is:

```text
Creative Score = round((Organic Creative Score + Paid Meta Creative Score) / 2)
```

Rules:

- if both scores exist, average both;
- if only one score exists, show that score;
- if neither score exists, show no score;
- the Google Shopping score is shown separately and is not included in the Creative navigation score.

## 6. Organic panel labels and formulas

### 6.1 Organic creative score

Visible label:

```text
Organic creative score
```

Formula:

```text
Organic Creative Score = round(
  50% × Organic Attention Score
  + 50% × Organic Active Engagement Score
)
```

Current source:

- live/cached dataset: `ig_pocari`;
- current account: `pocarisweatme`;
- current period: last 90 days;
- only posts where `media_reach > 0` are included.

### 6.2 Attention · 50%

Visible label:

```text
Attention · 50%
```

The calculation is different for image posts and Reels.

For an image post:

```text
View Frequency = media_views / media_reach
Image Attention Score = score(View Frequency, 1.00x, 2.00x)
```

For a Reel with watch-time data:

```text
Average Watch Time in Seconds = media_reel_avg_watch_time / 1000
Reel Attention Score = score(Average Watch Time in Seconds, 2.0s, 8.0s)
```

The Windsor field is in milliseconds, so the HTML divides it by `1000`. The Buffer CSV column `Avg. Watch Time (sec)` is already in seconds and must not be divided again.

The overall Organic Attention score is reach-weighted:

```text
Organic Attention Score = round(
  sum(Post Attention Score × Post Reach)
  / sum(Post Reach for posts with an attention score)
)
```

Source fields:

| Purpose | Current live/cached field | Available Buffer Instagram CSV column |
| --- | --- | --- |
| Post type | `media_type`, `media_product_type` | `Post Type` |
| Views | `media_views` | `Views` |
| Reach | `media_reach` | `Reach` |
| Reel average watch time | `media_reel_avg_watch_time` | `Avg. Watch Time (sec)` |

### 6.3 Active engagement · 50%

Visible label:

```text
Active engagement · 50%
```

Likes are treated as passive and are not included.

For each post:

```text
Active Actions = Shares + Saves + Comments
Post Active Engagement Rate = Active Actions / Reach
```

For all included posts:

```text
Organic Active Engagement Rate =
  sum(Shares + Saves + Comments)
  / sum(Reach)

Organic Active Engagement Score =
  score(Organic Active Engagement Rate, 0.50%, 5.00%)
```

Source fields:

| Purpose | Current live/cached field | Available Buffer Instagram CSV column |
| --- | --- | --- |
| Shares | `media_shares` | `Shares` |
| Saves | `media_saved` | `Saves` |
| Comments | `media_comments_count` | `Comments` |
| Reach | `media_reach` | `Reach` |

### 6.4 Posts, ranked by active engagement rate

Visible section:

```text
Posts, ranked by active engagement rate
```

Cards are sorted from the highest to the lowest `Post Active Engagement Rate`.

Each card shows:

| Card label or value | Calculation or source |
| --- | --- |
| `IMAGE` or `REEL` | Post type |
| Caption | First 40 characters of the post caption after extra spaces are removed |
| `Active eng` | `(Shares + Saves + Comments) / Reach` |
| `reach` | Post reach |
| `watch` | Reel average watch time in seconds |
| `freq` | Image views divided by reach |
| Image | `media_url` for an image or `media_thumbnail_url` for a Reel |
| Click target | `media_permalink` |

Color rules for `Active eng` are:

- green: at least `3%`;
- yellow: at least `1%` and below `3%`;
- red: below `1%`.

## 7. Paid Meta labels and formulas

The live request keeps only ads with more than `1,000` impressions.

### 7.1 Paid creative score

Visible label:

```text
Paid creative score
```

Formula:

```text
Paid Creative Score = round(
  50% × Paid Attention Score
  + 50% × Paid Active Engagement Score
)
```

Current source:

- live/cached dataset: `meta_ads`;
- thumbnail dataset: `meta_thumbs`;
- current period: last 30 days.

### 7.2 Attention · 50%

Visible supporting text shows aggregated CTR and, when available, video VTR.

```text
Paid CTR = sum(Clicks) / sum(Impressions)
CTR Score = score(Paid CTR, 0.50%, 2.50%)
```

For video rows that have at least one ThruPlay:

```text
Video VTR = sum(ThruPlays) / sum(Video Impressions)
VTR Score = score(Video VTR, 1.00%, 10.00%)
Video Impression Share = Video Impressions / All Ad Impressions
```

The final attention score blends CTR toward VTR according to the share of video impressions:

```text
Paid Attention Score = round(
  CTR Score
  - 0.5 × Video Impression Share × (CTR Score - VTR Score)
)
```

If no VTR is available:

```text
Paid Attention Score = CTR Score
```

Source fields:

| Purpose | Meta field |
| --- | --- |
| Clicks | `clicks` |
| Impressions | `impressions` |
| ThruPlays | `video_thruplay_watched_actions_video_view` |

The row-level `ctr` field is displayed on cards and tables, but the summary CTR is recalculated from total clicks and total impressions.

### 7.3 Active engagement · 50%

Visible labels:

```text
Active engagement · 50%
Earned actions
```

Formula used by the current HTML:

```text
Earned Actions =
  actions_post
  + actions_onsite_conversion_post_save
  + actions_comment

Paid Active Engagement Rate = Earned Actions / sum(Reach)

Paid Active Engagement Score =
  score(Paid Active Engagement Rate, 0.02%, 0.20%)
```

Accuracy note: the UI describes this as `shares + saves + comments`, but the code uses `actions_post` for the first part. `actions_post` may be broader than shares. The label should only say “shares” after the Meta export definition is confirmed or a dedicated share field is supplied.

### 7.4 Video creatives — biggest budgets first

An ad is classified as video in the gallery when:

```text
video_play_actions_video_view > 100
```

Gallery rules:

- keep ads where `spend > AED 80`;
- sort by spend, highest first;
- show at most six cards.

### 7.5 Static creatives — biggest budgets first

An ad is classified as static when it does not meet the video rule above.

It uses the same gallery rules: spend above AED 80, descending spend, maximum six cards.

Each Meta gallery card shows:

| Card value | Source or formula |
| --- | --- |
| Ad name | `ad_name` |
| `VIDEO` or `STATIC` | Video-play classification above |
| Spend | `spend` |
| CTR | row-level `ctr` |
| Earned actions | `actions_post + actions_onsite_conversion_post_save + actions_comment` |
| Reach | `reach` |
| Thumbnail | `thumbnail_url`, matched by `ad_name` |

If the thumbnail dataset contains the same ad name more than once, the HTML keeps the thumbnail row with the largest spend.

CTR card colors are:

- green: at least `2%`;
- yellow: at least `1%` and below `2%`;
- red: below `1%`.

### 7.6 Full ad-level detail

The expandable table shows ads with:

```text
spend > AED 50
```

Rows are sorted by spend, highest first.

| Visible column | Source or formula |
| --- | --- |
| `Ad` | `ad_name` |
| `Type` | `Video` when video plays are above 100; otherwise `Static` |
| `Spend` | `spend` |
| `CTR` | row-level `ctr` |
| `Earned` | `actions_post + actions_onsite_conversion_post_save + actions_comment` |
| `ThruPlay/impr` | `video_thruplay_watched_actions_video_view / impressions`; dash for static ads |

## 8. Google Shopping labels and formulas

Google Shopping is shown inside Paid, but it is scored separately from Meta.

The live source request keeps only products with more than `50` clicks. The UI then keeps rows with `product_impressions > 0`.

### 8.1 Product-image CTR

Visible label:

```text
Product-image CTR
```

Formula:

```text
Product-image CTR =
  sum(Product Clicks) / sum(Product Impressions)

Google Product Creative Score =
  score(Product-image CTR, 1.00%, 6.00%)
```

This is a weighted/blended CTR for the returned products. It is not the simple average of the row-level CTR values, and it is not full-account CTR because the source request already excludes products with 50 or fewer clicks.

### 8.2 Top product

Visible label:

```text
Top product
```

Rules:

- sort products by `product_ctr`, highest first;
- use the first product;
- display the title before ` - ` and limit the visible name to 26 characters;
- show that product's row-level CTR.

### 8.3 Products (>50 clicks)

Visible label:

```text
Products (>50 clicks)
```

Value:

```text
Number of returned product rows with:
  product_clicks > 50
  and product_impressions > 0
```

### 8.4 Product creatives ranked by click-through

The gallery:

- sorts by `product_ctr`, highest first;
- shows the first eight products;
- shows the product image, shortened title, CTR, clicks, and impressions.

Source fields:

| UI value | Google Merchant field |
| --- | --- |
| Product name | `product_title` |
| Product image | `product_thumbnail_link` |
| Clicks | `product_clicks` |
| Impressions | `product_impressions` |
| Row CTR | `product_ctr` |

CTR card colors are:

- green: at least `5%`;
- yellow: at least `2%` and below `5%`;
- red: below `2%`.

## 9. Benchmark table

| Visible score component | Bad anchor | Good anchor | Weight |
| --- | ---: | ---: | ---: |
| Organic image views ÷ reach | 1.00x | 2.00x | Part of Organic Attention |
| Organic Reel average watch time | 2.0 seconds | 8.0 seconds | Part of Organic Attention |
| Organic active engagement ÷ reach | 0.50% | 5.00% | 50% of Organic score |
| Paid Meta CTR | 0.50% | 2.50% | Part of Paid Attention |
| Paid Meta ThruPlay VTR | 1.00% | 10.00% | Part of Paid Attention |
| Paid earned engagement ÷ reach | 0.02% | 0.20% | 50% of Paid score |
| Google product-image CTR | 1.00% | 6.00% | 100% of separate Google score |

## 10. Exact current source fields

### Instagram Organic live/cached dataset

```text
account_name
media_id
media_type
media_product_type
media_caption
media_reach
media_views
media_shares
media_saved
media_comments_count
media_like_count
media_reel_avg_watch_time
media_permalink
media_url
media_thumbnail_url
timestamp
```

### Meta Ads live/cached dataset

```text
ad_name
spend
impressions
reach
clicks
ctr
actions_omni_purchase
actions_post
actions_onsite_conversion_post_save
actions_comment
video_play_actions_video_view
video_thruplay_watched_actions_video_view
video_p100_watched_actions_video_view
video_p75_watched_actions_video_view
```

Thumbnail dataset:

```text
ad_name
thumbnail_url
spend
```

### Google Merchant live/cached dataset

```text
product_title
product_thumbnail_link
product_clicks
product_impressions
product_ctr
```

## 11. Mapping to the available client CSV files

### 11.1 Union Coop Buffer Instagram exports

Files:

```text
creative tab/Buffer insights Union Coop/UC buffer Instagram/posts.csv
creative tab/Buffer insights Union Coop/UC Instagram Buffer/posts.csv
```

Both exports contain the fields needed to calculate the Organic score for Union Coop:

```text
Post Type
Post Text (Excerpt)
Post URL
Comments
Views
Shares
Saves
Reach
Avg. Watch Time (sec)
```

Suggested normalization:

| CSV column | Normalized field |
| --- | --- |
| `Post Type` | `media_type` |
| `Post Text (Excerpt)` | `media_caption` |
| `Post URL` | `media_permalink` |
| `Comments` | `media_comments_count` |
| `Views` | `media_views` |
| `Shares` | `media_shares` |
| `Saves` | `media_saved` |
| `Reach` | `media_reach` |
| `Avg. Watch Time (sec)` | average watch time in seconds |

These CSVs do not provide the same `media_url` or `media_thumbnail_url` fields used by the visual gallery. The post URL can be opened, but an image or thumbnail needs a separate exported URL or connector response.

### 11.2 Union Coop combined and Facebook exports

Useful files include:

```text
creative tab/Buffer insights Union Coop/posts.csv
creative tab/Buffer insights Union Coop/buffer-overview-analytics-csv/posts-20260101-to-20260923.csv
creative tab/Buffer insights Union Coop/Union Coop Facebook/posts-20260101-to-20260923.csv
```

They provide combinations of reach, views or impressions, comments, shares, engagement, and post type. The Facebook export does not provide the full saves and Reel average-watch-time inputs needed to reproduce the current Instagram Organic score exactly.

The combined `posts.csv` must be filtered by `Network` or `Channel Name` before calculating a platform score. Different platform rows must not be mixed silently.

### 11.3 Souq Al Jubair and Souq Al Bahar exports

The Souq files contain daily totals or demographic summaries, for example:

```text
Views
Viewers
Reach
Content interactions
Facebook follows
Instagram follows
Facebook visits
Instagram profile visits
Facebook link clicks
Published content
Age and gender
Top countries
```

These exports can support visible totals or trend cards, but they cannot reproduce the reference per-post Organic score because they do not include all of the following together at post level:

- reach;
- views;
- shares;
- saves;
- comments;
- Reel average watch time;
- caption;
- post thumbnail.

### 11.4 TikTok Buffer export

File:

```text
creative tab/Buffer insights Union Coop/Union Coop Tik Tok Buffer/posts.csv
```

It contains video views, reach, shares, comments, average watch time, and full-video-watched rate. It can support a separate TikTok creative method, but it should not be inserted into the Instagram label or score without an approved TikTok benchmark.

## 12. What the existing `.xlsx` workbooks can and cannot supply

The current Media workbooks contain monthly brand/campaign aggregates. They do not contain the complete creative-level input required by this UI.

| Required Creative data | Available in current Media workbooks? | Result |
| --- | --- | --- |
| Instagram post shares, saves, comments, reach, views, watch time | No | Use Buffer/Windsor source |
| Meta ad name and thumbnail | No | Paid gallery cannot be built from Media workbooks |
| Meta ad reach, comments, saves, post actions, video plays, ThruPlays | No | Paid creative score cannot be reproduced from Media workbooks |
| Google Merchant product title and image | No | Google product gallery cannot be built |
| Product-level clicks and impressions | No | Google product-image CTR cannot be reproduced |

The Google and Meta Media workbooks do provide spend, impressions, clicks/interactions, and conversions at brand or campaign level. Those values are suitable for the Media tab, not the Creative visual cards and scores.
### Exact workbook and sheet check

| Existing workbook | Relevant sheet(s) checked | What it contains | Creative UI result |
| --- | --- | --- | --- |
| `Rivoli-Meta-Brand-Spend-Jan-Sep-2026.xlsx` | `Brand x Month (spend)`, `Meta Campaign Brand Map` | Monthly brand/campaign spend, impressions, link clicks, claimed purchases, and mappings | Can audit a summary link CTR, but cannot calculate ad-level Creative scores or galleries because ad name, thumbnail, reach, saves, comments, video plays, and ThruPlays are missing |
| `Rivoli-Google-Brand-Spend-Jan-Sep-2026.xlsx` | `Brand x Month`, `Google Campaign Map` | Monthly brand/campaign spend, impressions, interactions, conversions, and mappings | Cannot calculate Google product-image CTR or build the product gallery because product title, product image, product clicks, and product impressions are missing |
| `Rivoli Shop Segmentation with reconciled campaigns .xlsx` | `Jan 2026` through `Sep 2026`, `Master Brand Map`, `Campaign Brand Map` | Site funnel, revenue, brand taxonomy, and campaign reconciliation | Supports Media/Business analysis only; it has no organic post, paid-ad creative, or Merchant product rows |
| `Rivoli-Organic-Brand-Demand-Jan-Sep-2026.xlsx` | `Brand x Month`, `Segment x Month (clicks)`, `Market x Month (clicks)` | GA4 organic-search demand grouped by brand, segment, and market | Does not represent Instagram organic posts and cannot supply post reach, views, watch time, shares, saves, or comments |
| `Rivoli-Brand-Plot-MODULE2-Jan-Sep-2026.xlsx` | `Brand Plot (9 mo)`, `Segment Plot (9 mo)`, `Claims vs Verified (monthly)` | Brand/segment spend and revenue controls | Useful for Media validation, not Creative calculations |
| `Rivoli Shop. Brand Segmentation 16.09.xlsx` | `Approved Segmentation`, `Unclassified Review` | Approved brand and segment taxonomy | Can label a brand or segment, but provides no Creative performance measure |

Therefore, there is currently **no workbook sheet** that can independently reproduce all values visible in the Creative tab. The exact current sources are the Windsor/Google Merchant datasets cached in the reference HTML. The files under `creative tab/` provide some replacement inputs, as described in the CSV mapping section above.

## 13. Recommended monthly workbook format

If the client will provide one workbook each month, use these three sheets so every visible Creative value can be calculated from files instead of cached HTML.

### Sheet: `Organic Instagram`

Required columns:

```text
Month
Account
Post ID
Published At
Post Type
Caption
Post URL
Media URL
Thumbnail URL
Reach
Views
Shares
Saves
Comments
Average Watch Time Seconds
```

### Sheet: `Meta Ad Creative`

Required columns:

```text
Month
Account
Ad ID
Ad Name
Thumbnail URL
Spend AED
Impressions
Reach
Clicks
Post Actions
Saves
Comments
Video Plays
ThruPlays
```

### Sheet: `Google Merchant Products`

Required columns:

```text
Month
Merchant Account
Product ID
Product Title
Product Thumbnail URL
Product Clicks
Product Impressions
```

The application should calculate CTR from clicks and impressions. A supplied CTR column may be used only as an audit check.

## 14. Accuracy rules

Use these rules when the Creative calculation is moved to the server:

1. Filter the selected account and period before summing data.
2. Sum additive fields first, then calculate rates. Do not average row CTR or engagement-rate columns.
3. Keep milliseconds and seconds separate. Convert Windsor watch time once; do not convert Buffer seconds again.
4. Exclude rows with zero reach from reach-based calculations.
5. Treat zero as real data and missing as unavailable.
6. Keep Organic, Meta Ads, Google Merchant, Facebook, Instagram, and TikTok separate unless a written business rule approves a blend.
7. Deduplicate records using platform plus account plus post/ad/product ID plus reporting period.
8. Check that total spend, impressions, clicks, reach, and actions reconcile to the source export.
9. Recalculate aggregate CTR as total clicks divided by total impressions.
10. Show `N/A` when a required denominator or field is missing; do not replace missing values with zero.

## 15. Current availability summary

| Visible Creative UI area | Can current local files calculate it? | Accuracy status |
| --- | --- | --- |
| Organic score for the cached Pocari account | Only from the HTML cache/live connector | Reproducible from reference fields |
| Organic score for Union Coop Instagram | Yes, from Buffer Instagram `posts.csv` | Formula inputs available; gallery images need media URLs |
| Organic score for Souq | No, not with the current daily summary exports | Missing post-level inputs |
| Paid Meta creative score | Only from the HTML cache/live connector | Current Media workbooks are insufficient |
| Meta video/static galleries | Only from the HTML cache/live connector | Requires ad names, thumbnails, spend, and video-play fields |
| Google product creative score and gallery | Only from the HTML cache/live connector | Requires Google Merchant product rows |
| Overall Creative pill | Yes only when at least Organic or Paid Meta score exists | Google is intentionally excluded |

## 16. Source-of-truth rule

Until the Creative API is implemented, the exact source of the visible reference values is the cached/live data in `docs/documentation/GP-BizCom-Dashboard.html`.

When the server implementation is added, the API response and its imported monthly source rows must become the source of truth. The UI should only format and display those server-calculated results; it should not independently calculate a different score in the browser.

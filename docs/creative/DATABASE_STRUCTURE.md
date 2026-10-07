# Creative Data Structure and Fields

## Current storage design

Creative does **not currently have dedicated MongoDB collections**.

The server reads CSV files from `spreadsheets data/creative-tab`, normalises them into typed in-memory records, and caches the parsed dataset for API reads. Restarting the server rebuilds this cache from the source files.

This is the current implementation and should not be confused with persisted Media or Competition data.

## Normalised post record

| Field | Type | Meaning |
| --- | --- | --- |
| `brandId` | String | Stable Brand ID |
| `brand` | String | Display Brand name |
| `account` | String | Source social account |
| `platform` | String | Instagram, Facebook, TikTok, or unknown |
| `postId` | String | Source Post ID |
| `publishedAt` | String | Publication timestamp |
| `year`, `month` | Number | Publication period |
| `postType` | String | Source format such as Post or Reel |
| `caption` | String or null | Post excerpt |
| `postUrl` | String or null | Safe post link |
| `imageUrl` | String or null | Safe image URL only |
| `reach`, `views` | Number or null | Source delivery metrics |
| `shares`, `saves`, `comments`, `reactions` | Number or null | Source action metrics |
| `averageWatchTimeSeconds` | Number or null | Source average watch time |
| `storyExits`, `storyTapsBack`, `storyTapsForward` | Number or null | Available story behaviour fields |
| `sourceFile` | String | Source CSV path |
| `sourceKind` | String | Complete post export, selected extract, or account summary |
| `reportingPeriodStart`, `reportingPeriodEnd` | String or null | Source coverage |

## Paid Creative record

Paid rows keep `brandId`, `brand`, `account`, `platform`, `postId`, `publishedAt`, `postType`, `caption`, `postUrl`, `paidReach`, `paidImpressions`, `paidClicks`, `paidComments`, `spendAed`, `currency`, source lineage, and the whole-export reporting period. Missing values stay `null`.

## Paid account summary

The separate summary record keeps `paidPostCount`, `paidImpressions`, `paidReach`, `paidLikes`, `paidComments`, the supplied `suppliedEngagementRatePercent`, and source-supplied per-post averages. The API also derives `frequency`, `measuredCommentRate`, and `passiveLikeRate` from matching account-summary totals. `performancePaidReachControl` and `paidReachConflict` preserve the separate reach control and its discrepancy. These values are not merged into the five post-detail rows.

## Calculated post view

The API adds these fields without changing the source record:

| Field | Meaning |
| --- | --- |
| `activeActions` | Shares + saves + comments |
| `activeEngagementRate` | Active actions divided by reach |
| `frequency` | Views divided by reach |
| `attentionBasis` | `watch-time`, `frequency`, or null |
| `attentionValue` | Watch seconds or frequency used for scoring |

## Source coverage record

| Field | Meaning |
| --- | --- |
| `brandId` | Covered Brand |
| `platform` | Covered platform |
| `metric` | Source metric or coverage description |
| `sourceFile` | Source file path |
| `startDate`, `endDate` | Available source dates |
| `rowCount` | Number of source rows |
| `grain` | `post`, `daily-account`, or `summary` |

## Source audit record

The source audit stores:

- Selected canonical source.
- Ignored comparison source.
- Source-selection rule.
- Selected and duplicate record counts.
- Malformed and duplicate counts.
- Conflicting Post ID count.
- Conflict counts by metric field.
- Individual conflict records.

## If MongoDB persistence is added later

Use separate collections for:

1. Import batches and file validation.
2. Post identity by Brand/account/platform/Post ID.
3. Reporting observations by source period and post identity.
4. Source conflicts and coverage.

Do not overwrite older observations, and do not store missing metrics as zero. This is a future recommendation, not a description of the current database.

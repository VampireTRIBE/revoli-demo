# Creative API List

Base URL:

`http://localhost:5000/api/v1/creative`

## Standard response

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": {}
}
```

## `GET /options`

Returns filter choices calculated from available dated files.

Important response fields:

| Field | Meaning |
| --- | --- |
| `years` | Available years and months |
| `months[].partial` | Whether source coverage ends before the month ends |
| `months[].coverageEnd` | Last available source date |
| `brands` | Configured Brands present in source coverage |
| `brands[].postLevelAvailable` | Whether the Brand can support Organic post-level calculations |
| `brands[].paidPostLevelAvailable` | Whether the Brand has paid post-detail records |
| `defaultSelection` | Initial year, month, and Brand |
| `timezone` | Reporting timezone; currently `UTC` |

Example:

`GET /options`

## `GET /dashboard`

Returns the supported Creative dashboard data.

### Parameters

| Parameter | Meaning |
| --- | --- |
| `year` | Year from `2000` to `2100` |
| `month` | Month `1` to `12`, or `all` |
| `brand` | Configured Brand ID such as `union-coop` |

Example:

`GET /dashboard?year=2026&month=8&brand=union-coop`

Important response sections:

- `filter`: selected filters.
- `periodLabel` and `partial`: selected coverage explanation.
- `brand`: selected Brand and post-level availability.
- `organic`: totals, rates, watch-time coverage, scores, and ranked posts.
- `paid`: paid Meta totals, account summary, subset coverage, spend-ranked records, and unavailable Google Shopping state.
- `sourceAudit`: source precedence, duplicate counts, and metric conflicts.

`paid.meta.accountSummary` contains the source-supplied 12-post totals for paid impressions, reach, likes, comments, engagement rate, and average paid likes/comments per post. It also contains calculated frequency and measured comment rate. `performancePaidReachControl` and `paidReachConflict` expose the conflicting reach in the separate performance-statistics file. The five-row detail totals remain separate under `paid.meta.totalPaidClicks`, `totalPaidImpressions`, `totalPaidReach`, `totalPaidComments`, and `totalSpendAed`.

## Missing data behaviour

If a Brand has no post-level records, the API returns an unavailable Organic state and an explanation. It does not create post cards from daily account totals.

Pocari Sweat paid detail is available only with `month=0` (`All months`) because its metrics cover one whole export period. A specific publication month returns an unavailable paid state rather than reallocating cumulative metrics. Missing paid actions, ThruPlays, images, and Google product fields remain `null`.

## No upload API yet

Creative currently reads files directly from `spreadsheets data/creative-tab`. It does not yet expose a multipart upload route. Follow [Future monthly import](FUTURE_IMPORT.md) when adding files.

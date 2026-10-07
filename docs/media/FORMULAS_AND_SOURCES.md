# Media Formulas and Data Sources

## Source workbooks and sheets

The parser identifies data by workbook content and sheet names.

| Data | Main sheet | Important fields |
| --- | --- | --- |
| Site funnel and revenue | `Reconciliation`, then monthly sheets such as `Aug 2026` | Items viewed, items added to cart, items purchased, item revenue in AED, Brand, Segment |
| Google Brand and Segment data | `Brand x Month` | Spend, conversions/claims, impressions, interactions, Brand, Segment |
| Meta Brand and Segment data | `Brand x Month (spend)` | Spend, conversions/claims, impressions, link clicks, Brand, Segment |
| Google campaign mapping | `Campaign Brand Map` | Campaign, Brand, Segment, stage, campaign type, spend and available delivery metrics |
| Meta campaign mapping | `Meta Campaign Brand Map` | Campaign classification and mapping; period values are joined to Meta source rows |
| Organic demand | `Brand x Month`, `Market x Month (clicks)` | Organic clicks, organic impressions, average position, Brand, Segment, market |

Every normalised row retains its source file, sheet, row number, batch, and period.

## General calculation rule

Ratios use totals from matching filtered rows. Monthly percentages are not averaged together.

If a denominator is zero, missing, or invalid, the result is `null` and the UI shows `N/A`.

## Headline formulas

### Total paid spend

```text
Total spend = Google spend + Meta spend
```

### Platform conversions

```text
Platform conversions = Google platform claims + Meta platform claims
```

These are platform-reported claims, not verified site orders.

### Platform-claimed CAC

```text
Platform-claimed CAC = Total paid spend / Platform-claimed conversions
```

This is not confirmed new-customer CAC.

### Site average order value

```text
Site AOV = Site revenue / Site purchases
```

### CAC divided by AOV

```text
CAC ÷ AOV = Platform-claimed CAC / Site AOV
```

### Blended CTR

```text
Paid traffic actions = Google interactions + Meta link clicks
Paid impressions = Google impressions + Meta impressions
Blended CTR = Paid traffic actions / Paid impressions
```

Google interactions and Meta link clicks are not identical actions. The UI identifies this as a blended derived rate.

### Directional return

```text
Directional return = Site revenue / Paid spend
```

The UI may display this as ROAS for design consistency, but it remains directional because paid attribution is not proven.

## Platform directional return

Site revenue is allocated to Google and Meta inside each Segment using the platform's share of that Segment's paid spend.

```text
Platform share in Segment = Platform Segment spend / Total Segment spend
Allocated platform revenue = Segment site revenue × Platform share in Segment
Platform directional ROAS = Sum of allocated platform revenue / Platform spend
```

This prevents the same Segment revenue from being counted fully for both platforms.

## Brand and Segment return fallback

The server chooses the most specific supported calculation:

1. Brand revenue divided by Brand paid spend.
2. If the Brand has no paid spend, its mapped Segment revenue divided by Segment paid spend.
3. If the Segment also has no paid spend, overall revenue divided by overall paid spend.

The API returns the selected level as `BRAND`, `SEGMENT`, or `OVERALL`.

## Campaign directional ROAS

Each campaign inherits the supported Brand, Segment, or overall directional-return ratio.

```text
Campaign directional revenue = Campaign spend × selected directional-return ratio
Campaign ROAS = selected directional-return ratio
```

The Campaign ROAS chart includes only rows where:

```text
Campaign spend > AED 300
```

This is not campaign-level attributed revenue.

## Funnel formulas

```text
View-to-cart rate = Items added to cart / Items viewed
Cart-to-purchase rate = Items purchased / Items added to cart
View-to-purchase rate = Items purchased / Items viewed
```

## Organic demand formula

```text
Organic CTR = Organic clicks / Organic impressions
```

## Reference score

The current reference score uses linear benchmark scores clamped from `2` to `100`:

```text
Metric score = ((value - bad anchor) / (good anchor - bad anchor)) × 100
```

| Component | Bad anchor | Good anchor | Weight |
| --- | ---: | ---: | ---: |
| Directional return | 1.00x | 4.00x | 40% |
| CAC ÷ AOV | 100% | 30% | 30% |
| Blended CTR | 0.50% | 2.00% | 30% |

The combined score is the weighted average of available component scores. It is a reference score, not an approved business-performance score.

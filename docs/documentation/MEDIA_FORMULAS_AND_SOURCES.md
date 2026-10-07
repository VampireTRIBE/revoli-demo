# Media Formulas, Spreadsheet Sources, and Accuracy

## 1. How to read this document

This document explains:

- what each Media value means;
- which spreadsheet supplies the inputs;
- the formula used by the server;
- whether the result is verified, derived, directional, or platform-claimed;
- how the application checks accuracy.

All formulas use the selected year and month. If only a year is selected, the server sums the matching monthly inputs first and then calculates the ratio.

## 2. Spreadsheet source map

| Workbook | Main sheets used | Data read by the application |
| --- | --- | --- |
| `Rivoli Shop Segmentation with reconciled campaigns .xlsx` | Monthly sheets such as `Jan 2026`, `Reconciliation`, `Campaign Brand Map` | Site funnel, site purchases, site revenue, Google campaign detail, periods, partial-month status |
| `Rivoli-Google-Brand-Spend-Jan-Sep-2026.xlsx` | `Brand x Month`, `Stage x Month (AED)` | Google spend, impressions, interactions, claimed conversions, stage-spend control |
| `Rivoli-Meta-Brand-Spend-Jan-Sep-2026.xlsx` | `Brand x Month (spend)`, `Meta Campaign Brand Map`, `Stage x Month (spend AED)` | Meta spend, impressions, link clicks, claimed purchases, campaign allocation weights, stage-spend control |
| `Rivoli-Organic-Brand-Demand-Jan-Sep-2026.xlsx` | `Brand x Month`, `Market x Month (clicks)` | Organic clicks, impressions, weighted position, market clicks |
| `Rivoli-Brand-Plot-MODULE2-Jan-Sep-2026.xlsx` | `Claims vs Verified (monthly)`, `Segment Plot (9 mo)` | Warning-only claim and paid-spend controls |
| `Rivoli Shop. Brand Segmentation 16.09.xlsx` | Approved mapping sheets | Brand and segment reference information |

The detailed monthly sheets own the dashboard values. Brand Plot and summary sheets are checks only.

## 3. Direct spreadsheet fields

### Google Ads

Source sheet: `Brand x Month`

| Application field | Spreadsheet column |
| --- | --- |
| Month | `Month` |
| Brand | `Brand / rollup` |
| Segment | `Segment` |
| Spend | `Spend (AED)` |
| Claimed conversions | `Conversions` |
| Impressions | `Impressions` |
| Traffic actions | `Interactions` |

### Meta Ads

Source sheet: `Brand x Month (spend)`

| Application field | Spreadsheet column |
| --- | --- |
| Month | `Month` |
| Brand | `Brand` |
| Segment | `Segment` |
| Spend | `Spend (AED)` |
| Claimed purchases | `Platform-claimed purchases` |
| Impressions | `Impressions` |
| Traffic actions | `Link clicks` |

### Site results

Source sheets: monthly sheets such as `Jan 2026`

| Application field | Spreadsheet column |
| --- | --- |
| Brand | `Final canonical brand` |
| Segment | `Final segment` |
| Mapping state | `Mapping status` |
| Product views | `Items viewed` |
| Cart additions | `Items added to cart` |
| Purchases | `Items purchased` |
| Revenue | `Item revenue (AED)` |

### Organic results

Source sheet: `Brand x Month`

| Application field | Spreadsheet column |
| --- | --- |
| Month | `Month` |
| Brand | `Brand` |
| Segment | `Segment` |
| Clicks | `Organic clicks` |
| Impressions | `Impressions` |
| Average position | `Avg position (impr-weighted)` |

## 4. Overview card formulas

### Total paid spend

```text
Total Paid Spend = Google Spend + Meta Spend
```

Source:

- Google `Brand x Month[Spend (AED)]`
- Meta `Brand x Month (spend)[Spend (AED)]`

### Platform conversions

```text
Platform Conversions = Google Claimed Conversions + Meta Claimed Purchases
```

Status: `PLATFORM_CLAIMED`

These are advertising-platform claims. They are not verified site orders.

### Blended CAC

```text
Blended CAC = Total Paid Spend / Platform Conversions
```

Status: `PLATFORM_CLAIMED`

This is not new-customer CAC because the source does not identify new customers.

### Site AOV

```text
Site AOV = Reconciled Site Revenue / Site Purchases
```

Status: `VERIFIED`

### CAC as a share of AOV

```text
CAC / AOV = Blended CAC / Site AOV
```

Status: `DIRECTIONAL`

### Paid impressions

```text
Paid Impressions = Google Impressions + Meta Impressions
```

### Paid traffic actions

```text
Paid Traffic Actions = Google Interactions + Meta Link Clicks
```

Google and Meta do not use the same action definition.

### Blended CTR

```text
Blended CTR = Paid Traffic Actions / Paid Impressions
```

Expanded:

```text
Blended CTR =
  (Google Interactions + Meta Link Clicks)
  / (Google Impressions + Meta Impressions)
```

Status: `DERIVED`

The UI uses the label “Blended CTR” to match the reference HTML. Technically it is a blended response rate because Google contributes interactions while Meta contributes link clicks.

### Blended ROAS

```text
Blended ROAS = Reconciled Site Revenue / Total Paid Spend
```

Status: `DIRECTIONAL`

The UI label matches the reference HTML. The value is directional because site revenue includes all known site revenue, not only revenue proven to come from paid ads.

## 5. Platform table formulas

For each platform:

```text
Spend Share = Platform Spend / Total Paid Spend
Claim Share = Platform Claims / Total Platform Claims
Claimed CAC = Platform Spend / Platform Claims
```

Google response rate:

```text
Google Interaction Rate = Google Interactions / Google Impressions
```

Meta response rate:

```text
Meta Link CTR = Meta Link Clicks / Meta Impressions
```

### Directional platform revenue

The application allocates site revenue inside each segment.

```text
Platform Spend Share in Segment =
  Platform Spend in Segment / Total Paid Spend in Segment

Platform Directional Revenue =
  sum(Segment Site Revenue x Platform Spend Share in Segment)
```

No segment revenue is counted twice between Google and Meta.

### Platform ROAS

```text
Platform ROAS = Platform Directional Revenue / Platform Spend
```

Status: `DIRECTIONAL`

This is not verified platform-attributed revenue.

## 6. Campaign formulas

### Google campaigns

Google campaign fields are read from `Campaign Brand Map`:

| Application field | Spreadsheet column |
| --- | --- |
| Campaign | `Campaign` |
| Brand | `Canonical brand(s) for tech` |
| Brand scope | `Brand scope` |
| Segment | `Final segment(s)` |
| Stage and campaign type | `Campaign type` |
| Mapping source | `Validation` |
| Confidence | `Mapping confidence` |
| Spend | `Cost (AED)` |
| Claims | `Conversions` |
| Impressions | `Impressions` |
| Actions | `Interactions` |

### Meta monthly campaign allocation

The Meta campaign map contains nine-month campaign spend, but not full monthly campaign results.

For each brand:

```text
Campaign Allocation Share =
  Campaign Nine-Month Spend
  / Sum of Nine-Month Spend for the Brand's Mapped Campaigns
```

Then:

```text
Monthly Campaign Spend = Monthly Brand Spend x Allocation Share
Monthly Campaign Claims = Monthly Brand Claims x Allocation Share
Monthly Campaign Impressions = Monthly Brand Impressions x Allocation Share
Monthly Campaign Clicks = Monthly Brand Link Clicks x Allocation Share
```

These are derived estimates. They reconcile to the monthly brand totals.

If a monthly Meta brand has no matching campaign map, the application keeps one “Unallocated Meta campaign detail” row so the brand total is not lost.

### Campaign response rate

```text
Google Campaign Rate = Campaign Interactions / Campaign Impressions
Meta Campaign Rate = Campaign Link Clicks / Campaign Impressions
```

### Campaign directional ROAS

The server chooses the first usable mapping level:

1. matching brand;
2. matching segment;
3. overall selected-period totals.

```text
Campaign ROAS =
  Mapped Group Site Revenue / Mapped Group Google and Meta Spend
```

```text
Campaign Directional Revenue = Campaign Spend x Campaign ROAS
```

Campaigns in the same mapped group can have the same ROAS.

The “Campaign ROAS (spend > AED 300)” chart includes only campaigns where:

```text
Campaign Spend > AED 300
```

## 7. Brand and segment formulas

The raw totals for each dropdown row remain exact:

```text
Google Spend = sum of matching Google rows
Meta Spend = sum of matching Meta rows
Total Spend = Google Spend + Meta Spend
Site Purchases = sum of matching site purchases
Site Revenue = sum of matching site revenue
Site AOV = Site Revenue / Site Purchases
```

Directional ROAS uses the first level with both mapped site revenue and paid spend:

1. Brand: exact Brand site revenue / exact Brand paid spend.
2. Segment: mapped Segment site revenue / mapped Segment paid spend.
3. Overall: selected-period site revenue / selected-period paid spend.

A Segment uses its exact Segment result first, then the overall result. A Brand uses its exact Brand result first, then its mapped Segment, then the overall result. The server returns the chosen level, numerator, denominator, and text basis. The dropdown and Blended ROAS card show the basis when a fallback is used.

If monthly platform rows do not provide paid spend for an otherwise mapped group, the server may use its reconciled monthly campaign spend. It does not average campaign or monthly ROAS values.

Negative reconciled revenue is valid. Returns can make Directional ROAS negative, as seen in the February source data. The application keeps that value and does not clamp it to zero.

## 8. Funnel formulas

```text
View-to-Cart Rate = Items Added to Cart / Items Viewed
Cart-to-Purchase Rate = Items Purchased / Items Added to Cart
View-to-Purchase Rate = Items Purchased / Items Viewed
```

The inputs come from the reconciled monthly site sheets.

## 9. Organic formulas

```text
Organic CTR = Organic Clicks / Organic Impressions
```

```text
Weighted Average Position =
  sum(Average Position x Organic Impressions)
  / sum(Organic Impressions for rows with a position)
```

Market rows contain clicks only. The application does not create market impressions or market CTR when the source does not provide them.

## 10. Attribution comparison formulas

```text
Claims Difference = Platform Conversions - Site Purchases
Claims vs Site = Platform Conversions / Site Purchases
```

These values show the difference between platform claims and verified site purchases. They do not merge the two measures.

## 11. Reference score formulas

The page displays the score method from the reference HTML.

```text
Metric Score =
  round((Value - Bad Anchor) / (Good Anchor - Bad Anchor) x 100)
```

The current server code limits each metric score to a minimum of `2` and a maximum of `100`.

| Metric | Bad anchor | Good anchor | Weight |
| --- | ---: | ---: | ---: |
| Blended ROAS | 1.00x | 4.00x | 40% |
| CAC / AOV | 100% | 30% | 30% |
| Blended CTR | 0.50% | 2.00% | 30% |

```text
Reference Media Score =
  sum(Metric Score x Metric Weight)
  / sum(Weights for Available Metric Scores)
```

This reference score is not the approved full Media score.

## 12. Safe division and missing data

The server returns `null` when:

- the denominator is zero;
- the numerator or denominator is not a valid number;
- a required result cannot be calculated.

The client displays `null` as `N/A`.

An explicit zero is different from missing data:

- If the stage summary explicitly reports zero spend for a month, spend, impressions, and claims are kept as zero.
- Rates such as CAC, CTR, and ROAS remain `N/A` when their denominator is zero.
- If neither detailed rows nor an explicit zero control exists, the platform values remain unavailable.

## 13. Filter scope and aggregation

The Segment and Brand dropdowns use the normalized spreadsheet labels. They do not use a hardcoded list.

- `All Segments` applies no Segment condition.
- A specific Segment keeps only rows with that exact spreadsheet Segment label.
- `All Brands` applies no Brand condition inside the current period and Segment scope.
- A specific Brand keeps only rows with that exact spreadsheet Brand label.
- Changing Segment clears a previously selected Brand because that Brand may not exist in the new Segment.
- Every option displays its calculated ROAS and the calculation level when Segment or Overall fallback is used.
- With the current nine imported periods, every Segment and Brand option has a finite directional ROAS. A future period with no paid spend at any level correctly shows `N/A`.

The server filters additive rows first, sums the matching spend, actions, impressions, claims, purchases, and revenue, and then recalculates ratios. It never averages the ratios shown for individual Brands or Segments.

## 14. Accuracy checks

### Blocking checks

A failed blocking check stops the import.

| Check | Comparison | Tolerance |
| --- | --- | ---: |
| Site views | Monthly detail vs `Reconciliation` | 0.0001 |
| Site cart additions | Monthly detail vs `Reconciliation` | 0.0001 |
| Site purchases | Monthly detail vs `Reconciliation` | 0.0001 |
| Site revenue | Monthly detail vs `Reconciliation` | AED 0.01 |
| Google stage spend | Google detail vs `Stage x Month (AED)` | AED 3 |
| Meta stage spend | Meta detail vs `Stage x Month (spend AED)` | AED 3 |
| Google campaign spend | Campaign rows vs Google monthly rows | AED 3 |
| Google campaign impressions | Campaign rows vs Google monthly rows | 0.0001 |
| Google campaign interactions | Campaign rows vs Google monthly rows | 0.0001 |
| Google campaign conversions | Campaign rows vs Google monthly rows | 0.31 |

### Warning checks

A warning does not overwrite detailed data.

| Check | Comparison | Tolerance |
| --- | --- | ---: |
| Monthly Google claims | Brand Plot control vs Google detail | 0.51 |
| Monthly Meta claims | Brand Plot control vs Meta detail | 0.51 |
| Total paid spend | Brand Plot segment control vs detailed platform rows | AED 5 |

Warnings are stored on the import batch and returned in `metadata.warnings`.

### Current bundled workbook result

The current six workbooks contain nine reporting periods. The automated source audit confirms:

- all blocking site checks pass;
- Google and Meta stage-spend checks pass;
- Google campaign totals pass within the defined tolerances;
- the explicit September Meta zero-spend period is kept as zero activity;
- the Brand Plot paid-spend control and at least one monthly Meta claims control differ from the detailed sheets and are reported as warnings.

The warning controls do not change the dashboard calculations. The detailed monthly rows remain the source of the displayed values.

## 15. Accuracy rules for yearly data

The server does not average monthly percentages.

Correct:

```text
Yearly CTR = Total Yearly Actions / Total Yearly Impressions
Yearly CAC = Total Yearly Spend / Total Yearly Claims
Yearly ROAS = Total Yearly Revenue / Total Yearly Spend
```

Incorrect:

```text
Average of Monthly CTRs
Average of Monthly CACs
Average of Monthly ROAS values
```

## 16. What the current spreadsheets cannot prove

The available files do not prove:

- which site order came from which platform or campaign;
- whether a purchaser is a new customer;
- incremental CAC;
- paid-session engagement quality;
- plan-versus-actual performance;
- the approved full Media score.

These values must stay unavailable until the client supplies the required source fields and an approved calculation method.

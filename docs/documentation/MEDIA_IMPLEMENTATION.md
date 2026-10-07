# Media Analytics Implementation

For a simpler end-to-end explanation, start with [Media Analytics Implementation and Flow](MEDIA_IMPLEMENTATION_FLOW.md). Exact formulas and workbook columns are documented in [Media Formulas, Spreadsheet Sources, and Accuracy](MEDIA_FORMULAS_AND_SOURCES.md).


## Overview

The BizCom Engine Media module converts Rivoli's recurring monthly media and commerce workbooks into a traceable analytics product. It combines paid investment, platform-reported claims, reconciled site outcomes, campaign classification, brand and segment economics, and organic demand without merging measures that have different analytical meanings.

The supplied HTML is the visual reference. Its compact dark presentation, four-card KPI row, platform table, campaign chart, campaign tabs, and dense information hierarchy are retained. Its embedded pitch data and unsupported live metrics are not used.

The supplied workbooks are the factual source. January through August 2026 are complete reporting months. September covers 1-10 September 2026 and is stored and labelled as a partial period.

### What the module solves

- Replaces manual monthly dashboard rebuilding with a repeatable import workflow.
- Prevents the same month from silently doubling reported analytics.
- Reconciles normalized site totals to source controls before persistence.
- Calculates monthly, annual, and all-history measures consistently.
- Preserves business labels while providing normalized fields for queries.
- Keeps every important number traceable to source file, sheet, row, period, and import batch.
- Makes limitations visible instead of filling unsupported dashboard positions with invented values.

### What is available

- Google Ads spend, impressions, interactions, and claimed conversions
- Meta Ads spend, impressions, link clicks, and claimed purchases
- Platform response rates using each platform's supplied action field
- Blended response/CTR using Google interactions plus Meta link clicks over paid impressions
- Reconciled site item views, additions to cart, purchases, and revenue
- Google campaign mappings and monthly campaign costs
- Meta campaign taxonomy and nine-month campaign spend, used to derive reconciled monthly campaign detail
- Approved brands, mappings, segments, scopes, stages, confidence, and source notes
- Organic clicks, impressions, CTR, weighted position, brands, segments, and markets

### What is directional

`Site Revenue / Advertising Spend` is a useful coverage ratio, but current site revenue includes organic and direct outcomes. It is therefore displayed as **Directional Return**, not verified paid ROAS.

Brand and segment return use the same directional interpretation. Platform-Claimed CAC is explicitly marked `PLATFORM CLAIMED` because its denominator comes from advertising platform claims rather than verified new customers.

### What is unavailable

The current source package does not support verified paid-media revenue attribution, platform-reported conversion value, verified platform or campaign ROAS, new-customer classification, paid-session traffic quality, a signed monthly media plan, measurement-hygiene inputs, or the approved six-component Media score. The requested ROAS fields are calculated as directional revenue-coverage estimates from mapped brand/segment data.

## Source review

The implementation reviewed:

- `docs/documentation/GP-BizCom-Dashboard.html`
- `docs/documentation/Rivoli Media Buold Brief tech team 15.09.docx`
- `docs/documentation/Bizcom Engine brief and scope.docx`
- all six runtime workbooks in `spreadsheets data/media-tab`

The source inspection found 34 worksheets across six workbooks. Reconciled site totals cover nine reporting periods and show zero variance for views, cart additions, purchases, and revenue in the supplied reconciliation sheet.

## Workbook mapping

| File | Primary sheets | Fields used | Destination | Analytics enabled |
| --- | --- | --- | --- | --- |
| `Rivoli Shop Segmentation with reconciled campaigns .xlsx` | `Reconciliation`, monthly sheets, `Master Brand Map`, `Campaign Brand Map` | Period status, source controls, final segment, canonical brand, mapping status, funnel counts, revenue, campaign, scope, confidence, type, cost, conversions | Import checks, `MediaSite`, `MediaCampaign` | Periods, site funnel, site revenue, brand/segment outcomes, Google campaign detail, reconciliation |
| `Rivoli Shop. Brand Segmentation 16.09.xlsx` | `Approved Segmentation`, `Unclassified Review` | Classification, brand, website category, verification, recommended handling | Taxonomy reference | Preserved brand and segment interpretation |
| `Rivoli-Brand-Plot-MODULE2-Jan-Sep-2026.xlsx` | `Brand Plot (9 mo)`, `Segment Plot (9 mo)`, `Claims vs Verified (monthly)`, `Method & caveats` | Brand/segment spend, claimed conversions or purchases, verified purchases, verified revenue, claims reconciliation, caveats | Validation and analytical reference | Availability and source-lineage confirmation |
| `Rivoli-Google-Brand-Spend-Jan-Sep-2026.xlsx` | `Google Campaign Map`, `Brand x Month`, `Brand Summary (9 mo)`, `Stage x Month (AED)`, `Rules & flags` | Month, brand or rollup, segment, AED spend, impressions, interactions, conversions, campaign type, mapping source | `MediaPlatform`, `MediaCampaign` | Google spend, claims, claimed CAC, shares, brand/segment spend, campaign spend |
| `Rivoli-Meta-Brand-Spend-Jan-Sep-2026.xlsx` | `Meta Campaign Brand Map`, `Brand x Month (spend)`, `Brand Summary (9 mo)`, `Stage x Month (spend AED)`, `Rules & flags (loader spec)` | Month, brand, segment, AED and USD spend, impressions, link clicks, platform purchases, stage, confidence, note | `MediaPlatform`, `MediaCampaign` | Meta spend, claims, claimed CAC, shares, brand/segment spend, campaign taxonomy |
| `Rivoli-Organic-Brand-Demand-Jan-Sep-2026.xlsx` | `Brand x Month`, `Brand Summary (9 mo)`, `Segment x Month (clicks)`, `Market x Month (clicks)`, `Top non-brand pages`, `Rules (loader spec)` | Month, brand, segment, organic clicks, impressions, CTR, weighted average position, market | `MediaOrganic` | Organic trend, demand by brand, segment, and market |

## Availability matrix

| Dashboard metric or module | Source | Required inputs | Calculation or use | Status |
| --- | --- | --- | --- | --- |
| Total Advertising Spend | Google and Meta brand-month sheets | AED spend | Google spend + Meta spend | AVAILABLE |
| Directional Return | Reconciled site data plus paid workbooks | Site revenue, total spend | Site revenue / total spend | DIRECTIONAL |
| Platform-Claimed CAC | Google and Meta workbooks | Spend and platform claims | Total spend / total claims | PLATFORM_CLAIMED |
| Claims vs Site | Platform workbooks and reconciled site data | Google claims, Meta claims, site purchases | Platform claims / site purchases | DERIVED |
| Platform Claims | Google and Meta workbooks | Claimed conversions and purchases | Sum of platform claims | PLATFORM_CLAIMED |
| Site AOV | Reconciled site data | Site revenue and purchases | Revenue / purchases | VERIFIED |
| CAC / AOV | Calculated inputs | Platform-claimed CAC, site AOV | CAC / AOV | DIRECTIONAL |
| Platform comparison | Google and Meta workbooks | Spend and claims | Shares and per-platform CAC | DERIVED and PLATFORM_CLAIMED |
| Top Campaigns by Spend | Campaign maps | Campaign and spend | Sort descending by spend | AVAILABLE |
| Google campaign detail | Reconciled campaign map | Campaign, brand, scope, segment, type, mapping, cost | Source display and filtering | AVAILABLE |
| Meta campaign detail | Meta campaign map plus Meta brand-month totals | Nine-month campaign spend share within each brand; monthly spend, impressions, link clicks and claims | Allocate each monthly brand total among that brand's campaigns; brand and platform totals reconcile monthly | DERIVED |
| Attribution reconciliation | Claims and site data | Claims and purchases | Difference and claims/site ratio | DERIVED |
| Brand performance | Paid brand-month plus site brand-month data | Brand, spend, purchases, revenue | Aggregated totals and directional ratios | DIRECTIONAL |
| Segment performance | Paid and site segment data | Segment, spend, purchases, revenue | Aggregated totals and directional ratios | DIRECTIONAL |
| Site funnel | Reconciled monthly site sheets | Views, cart additions, purchases | Funnel rates | VERIFIED and DERIVED |
| Organic demand | Organic workbook | Clicks, impressions, position, dimensions | Trends and weighted aggregation | AVAILABLE and DERIVED |
| Paid impressions | Google and Meta brand-month sheets | Platform impressions | Google impressions + Meta impressions | AVAILABLE |
| Platform response rate | Google interactions or Meta link clicks plus impressions | Platform traffic action / platform impressions | Google interaction rate; Meta link CTR | DERIVED |
| Blended CTR | Google and Meta brand-month sheets | Google interactions, Meta link clicks, paid impressions | (Google interactions + Meta link clicks) / paid impressions | DERIVED with definition caveat |
| Platform ROAS | Paid brand-month sheets plus reconciled segment revenue | Allocate segment revenue by each platform's share of segment spend | Directional allocated revenue / platform spend, without double-counting site revenue | DIRECTIONAL |
| Campaign ROAS | Campaign mapping plus paid and reconciled brand/segment data | Mapped brand or segment site revenue and total paid spend | Mapped brand/segment directional return; spend must exceed AED 300 for chart | DIRECTIONAL |
| New Customer CAC | Missing new/returning classification | New customers and paid spend | Not calculated | UNAVAILABLE |
| HTML-reference Media score | Three displayed benchmark scores | ROAS 40%, CAC/AOV 30%, CTR 30% | Navigation pill and method panel only; distinct from the unavailable official six-component Media score | DERIVED |
| Official Media Score | Missing approved component inputs and baselines | All six approved score components and config version | Not calculated | UNAVAILABLE |

## Architecture

```text
Monthly Client Files
        |
        v
Upload API
        |
        v
ZIP and Workbook Parser
        |
        v
Schema Validator
        |
        v
Period and Row Normalizer
        |
        v
Source Reconciliation
        |
        v
MongoDB Transaction
        |
        v
Calculation Services
        |
        v
REST APIs
        |
        v
React Media Dashboard
```

### Client responsibilities

- Route and URL filter synchronization
- TanStack Query request lifecycle
- Responsive presentation
- Accessible charts, tables, tabs, tooltips, and form controls
- AED, number, percentage, ratio, date, and period formatting
- Loading, error, empty, and success states

The client does not own authoritative formulas.

### Server responsibilities

- Upload limits and file-type checks
- ZIP extraction
- Workbook and sheet detection
- Column and row validation
- Period normalization and partial-period detection
- Source label preservation
- Reconciliation and import status
- Duplicate detection and atomic replacement
- MongoDB persistence and indexes
- Monthly and annual aggregation
- Server-owned formulas and safe division
- Standard API envelopes and error codes

### Source-backed read mode

When MongoDB is unavailable, analytics endpoints can read the supplied `spreadsheets data/media-tab` workbooks through the same normalization and calculation path. This is a development and review convenience. A completed import always requires MongoDB because an import without persistence and lineage would not satisfy the business workflow.

## Normalized domain model

### Period

```ts
type MediaPeriod = {
  year: number;
  month: number;
  monthLabel: string;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  isPartialPeriod: boolean;
  sourcePeriodLabel: string;
};
```

The canonical key is `YYYY-MM`. The original source period label remains available for display and audit.

### Lineage

Normalized records retain:

```ts
type Lineage = {
  batchId: string;
  sourceFile: string;
  sourceSheet: string;
  sourceRow: number;
  year: number;
  month: number;
  periodKey: string;
};
```

### Import batch

Each persisted import records:

- stable batch ID
- year, optional month, and all included period keys
- original period label
- import timestamp and status
- detected files, types, states, and row counts
- validation errors and warnings
- passed, failed, and warning reconciliation counts

Supported states are `PROCESSING`, `COMPLETED`, `COMPLETED_WITH_WARNINGS`, and `FAILED`.

## Database collections and indexes

### `mediaimportbatches`

Tracks the lifecycle and audit result of each upload.

Important indexes:

- unique `batchId`
- `year + month`
- `periodKeys`

### `mediaplatforms`

Stores monthly brand-level Google and Meta spend and claims.

Important indexes:

- `periodKey`
- `batchId`
- `year + month + platform`
- `year + month + brand`
- `year + month + segment`

### `mediasites`

Stores reconciled brand-level site views, cart additions, purchases, and revenue.

Important indexes:

- `periodKey`
- `batchId`
- `year + month + brand`
- `year + month + segment`

### `mediacampaigns`

Stores campaign mappings, source business labels, spend, and supported claims.

Important indexes:

- `year + month + platform`
- `campaign + batchId`

### `mediaorganics`

Stores organic brand or market demand records.

Important indexes:

- `year + month + brand`
- `year + month + market`

### Example normalized platform document

```json
{
  "batchId": "src-example",
  "sourceFile": "Rivoli-Google-Brand-Spend-Jan-Sep-2026.xlsx",
  "sourceSheet": "Brand x Month",
  "sourceRow": 2,
  "year": 2026,
  "month": 1,
  "periodKey": "2026-01",
  "sourcePeriodLabel": "Jan 2026",
  "isPartialPeriod": false,
  "platform": "Google Ads",
  "brand": "RivoliShop",
  "segment": "Corporate / multi-category",
  "spend": 73085,
  "claims": 947
}
```

## Calculation documentation

All calculations use unrounded source totals. Rounding is applied only when building the display response.

### Total spend

```text
Total Advertising Spend = Google Spend + Meta Spend
```

### Platform claims

```text
Platform Claims = Google Claimed Conversions + Meta Claimed Purchases
```

Google conversions may contain non-purchase actions according to the workbook caveat. The result remains labelled platform-claimed.

### Paid impressions and traffic actions

```text
Paid Impressions = Google Impressions + Meta Impressions
Paid Traffic Actions = Google Interactions + Meta Link Clicks
```

The action definition differs by platform. Google supplies `Interactions`; Meta supplies `Link clicks`.

### Platform response rate and blended CTR

```text
Google Response Rate = Google Interactions / Google Impressions
Meta Link CTR = Meta Link Clicks / Meta Impressions
Blended CTR = (Google Interactions + Meta Link Clicks) / Paid Impressions
```

The UI keeps the requested `CTR` label, while its tooltip and API definition state that the blended numerator is not a uniform click definition.

### Reference benchmark scores

```text
Score = clamp(round((value - bad) / (good - bad) x 100), 2, 100)
```

Directional Return uses bad `1.00x` and good `4.00x`; CAC/AOV uses bad `100%` and good `30%` with lower values scoring higher; Blended CTR uses bad `0.50%` and good `2.00%`. These are reference-card benchmark scores, not the unavailable official Media score.

### Platform-Claimed CAC

```text
Platform-Claimed CAC = Total Advertising Spend / Platform Claims
```

This is not new-customer CAC.

### Site AOV

```text
Site AOV = Site Revenue / Site Purchases
```

The inputs come from the reconciled site workbook.

### CAC / AOV

```text
CAC / AOV = Platform-Claimed CAC / Site AOV
```

The result is directional because its CAC input is platform-claimed.

### Claims difference

```text
Claims Difference = Platform Claims - Site Purchases
```

### Claims vs Site

```text
Claims vs Site % = Platform Claims / Site Purchases x 100
```

This is an attribution diagnostic, not a verification of the advertising platforms.

### Directional Return

```text
Exact Brand Return = Brand Site Revenue / Brand Paid Spend
fallback = Mapped Segment Site Revenue / Mapped Segment Paid Spend
fallback = Overall Period Site Revenue / Overall Period Paid Spend

Exact Segment Return = Segment Site Revenue / Segment Paid Spend
fallback = Overall Period Site Revenue / Overall Period Paid Spend
```

The API returns the selected calculation level, numerator, denominator, and basis text. The dashboard card and dropdown labels expose a fallback instead of presenting it as exact Brand attribution. Negative reconciled revenue produces a negative directional return and is kept unchanged.

### Directional platform ROAS

For each segment, the server allocates reconciled site revenue between Google and Meta according to each platform's share of paid spend in that segment. Each segment is processed once, so combining the platform allocations cannot count the same site revenue twice.

```text
Platform Segment Share = Platform Segment Spend / Google + Meta Segment Spend
Platform Directional Revenue = SUM(Segment Site Revenue x Platform Segment Share)
Platform ROAS = Platform Directional Revenue / Platform Spend
```

This is a non-overlapping directional allocation, not platform-reported or incrementally attributed revenue. Site revenue in a segment with no paid spend remains unallocated.

### Directional campaign ROAS

```text
Campaign ROAS = Mapped Brand Return
fallback: Mapped Segment Return
fallback: Overall Directional Return
```
### Meta monthly campaign detail

The Meta campaign map supplies campaign-level spend for the complete nine-month source window, while the Meta brand-month sheet supplies monthly totals by brand. For each brand in each reporting month:

```text
Campaign Share Within Brand = Campaign 9-month Spend / Brand Campaign-map 9-month Spend
Monthly Campaign Spend = Monthly Meta Brand Spend x Campaign Share Within Brand
Monthly Campaign Impressions = Monthly Meta Brand Impressions x Campaign Share Within Brand
Monthly Campaign Link Clicks = Monthly Meta Brand Link Clicks x Campaign Share Within Brand
Monthly Campaign Claims = Monthly Meta Brand Platform Claims x Campaign Share Within Brand
```

The derived campaign rows reconcile to each monthly brand total and therefore to the overall monthly Meta totals. Their values are estimates based on the supplied nine-month campaign mix within each brand and are labelled through `calculationBasis` in the API. A future brand without a campaign-map match is retained as an explicit unallocated row instead of being silently dropped.

The chart includes only campaigns with `spend > AED 300` and sorts them by directional ROAS. Campaigns mapped to the same brand/segment can share the same ROAS because the sheets do not contain campaign-level conversion value. The calculation does not claim that the campaign generated the mapped site's revenue.

### Spend share

```text
Platform Spend Share = Platform Spend / Total Advertising Spend x 100
```

### Claim share

```text
Platform Claim Share = Platform Claims / Total Platform Claims x 100
```

### Brand and segment totals

```text
Exact Total Spend = matching Google Spend + matching Meta Spend
Site AOV = matching Site Revenue / matching Site Purchases
Directional Return = first usable exact Brand, mapped Segment, or Overall numerator / denominator
```

Brand and Segment labels are taken from source values. They are not hardcoded into calculation logic. The raw spend and site totals remain exact for the row. Separate directional-return fields identify the numerator and denominator used by a fallback. The current workbook audit covers all nine periods and confirms a finite directional return for every dropdown value.

### Funnel calculations

```text
View to Cart Rate = Items Added to Cart / Items Viewed
Cart to Purchase Rate = Items Purchased / Items Added to Cart
View to Purchase Rate = Items Purchased / Items Viewed
```

The module is called Site Funnel because the source is site-wide, not paid-session-only.

### Organic calculations

```text
Organic CTR = Organic Clicks / Organic Impressions
Weighted Average Position = SUM(Position x Impressions) / SUM(Impressions)
```

Organic metrics never feed paid calculations.

### HTML-reference navigation score

The Media navigation pill follows the supplied HTML's visible three-metric method:

```text
Reference Media Score = (ROAS Score x 40 + CAC/AOV Score x 30 + CTR Score x 30) / sum of available weights
```

This reference score is calculated from the spreadsheet rows matching the selected Year, Month, Segment, and Brand dropdowns. It does not replace the official six-component Media score described in the business brief.

### Safe division

If a denominator is zero, null, undefined, or invalid, the server returns `null`. The client displays `N/A`. An explicit zero-spend month from a supplied stage summary is retained as zero activity, while its denominator-based ratios remain `null`. The system does not emit `NaN`, `Infinity`, or `-Infinity`.

## Monthly and yearly filtering

### Detection

Available years and months come from normalized periods. They are not hardcoded. Only periods backed by usable Media data are returned by `GET /api/v1/media/periods`.

### Default selection

The dashboard selects the latest imported year and prefers the latest complete month. Segment defaults to `All Segments`, and Brand defaults to `All Brands`. A partial month remains available and is visibly labelled.

### URL state

```text
/media?year=2026&month=8&segment=Fashion&brand=Rivoli  -> one Brand inside one Segment for August 2026
/media?year=2026&month=8                                -> all Segment and Brand rows for August 2026 at API level
/media?year=2026                                        -> all imported periods in 2026
/media                                                  -> all years
```

When all years are selected, the month control is disabled. An absent `segment` query parameter means All Segments. An absent `brand` query parameter means All Brands in the current period or selected Segment. Changing Segment removes the previous Brand selection.

### Partial months

September 2026 is represented as:

```text
periodKey: 2026-09
periodStart: 2026-09-01
periodEnd: 2026-09-10
isPartialPeriod: true
sourcePeriodLabel: Sep 2026
```

The UI displays the explicit date range and a `PARTIAL` or `PROVISIONAL` status. It does not imply that September is complete.

### Year aggregation

Additive values are summed across included periods. Ratios are then calculated from those annual totals.

Correct:

```text
Yearly CAC = SUM(monthly spend) / SUM(monthly claims)
```

Incorrect:

```text
Yearly CAC = AVERAGE(monthly CAC)
```

The same aggregate-first rule applies to AOV, Directional Return, Claims vs Site, shares, and funnel rates.

## Import workflow

1. The user uploads one workbook or a ZIP package.
2. Multer enforces the configured upload size.
3. ZIP entries are inspected and `.xlsx` files are extracted to a temporary directory.
4. Workbooks are opened with SheetJS.
5. Expected sheets are detected by structure.
6. Periods are parsed and normalized.
7. Source fields are mapped to normalized types without rewriting business labels.
8. Required data domains and invalid negative spend are checked.
9. Monthly site totals are reconciled against the `Reconciliation` sheet.
10. Google campaign spend, impressions, interactions, and conversions are reconciled against Google brand-month totals.
11. Brand Plot paid-spend and claim controls are compared with the detailed monthly platform rows and recorded as warnings when they differ.
12. Existing period keys are queried.
13. New records and the batch document are inserted in a MongoDB transaction.
14. Temporary extracted files are removed.
15. The client invalidates Media queries so new filters and analytics load.

Malformed packages do not silently succeed.

## Corrected month replacement

An upload containing an existing period receives `DUPLICATE_IMPORT` unless `replaceExisting=true` is explicitly submitted.

Replacement order:

```text
Parse corrected package
        |
Validate all supported structures
        |
Reconcile source controls
        |
Detect existing period
        |
Open MongoDB transaction
        |
Remove old period records and batch references
        |
Insert corrected records and new batch
        |
Commit, or roll back the entire operation
```

Validation and reconciliation happen before destructive replacement begins.

## Reconciliation and accuracy

The current site workbook supplies control totals for every reporting month:

- items viewed
- items added to cart
- items purchased
- site revenue in AED

Normalized totals are compared to these controls with these tolerances:

- counts: `0.0001`
- currency: `0.01 AED`

Blocking `ERROR` checks cover:

- monthly site funnel and revenue controls;
- Google campaign spend, impressions, interactions, and conversions versus the matching Google month totals.
- Google and Meta detailed spend versus the matching stage-summary month totals;

Non-blocking `WARNING` checks compare Brand Plot paid-spend and platform-claim controls with the detailed monthly platform rows. These terminal checks never feed calculations or replace source detail. Their differences are stored on the import batch and exposed through response metadata.

A failed `ERROR` check returns `RECONCILIATION_FAILED` and blocks persistence. A failed `WARNING` check completes the import as `COMPLETED_WITH_WARNINGS`.


Other accuracy protections include:

- normalized `YYYY-MM` period keys
- explicit partial-period metadata
- no row-position-only workbook assumptions for analytical headers
- no ratio averaging
- no intermediate rounding
- server-owned formulas
- duplicate-period prevention
- transactional replacement
- calculation audit endpoint

## REST API documentation

All routes are prefixed with `/api/v1` and return a consistent success envelope.

### Periods

```http
GET /api/v1/media/periods
```

Returns dynamically available years, months, partial flags, and date ranges.

### Overview

```http
GET /api/v1/media/overview?year=2026&month=8
```

Returns KPI metrics, paid impressions, paid traffic actions, benchmark-card scores, definitions, statuses, period metadata, source files, and warnings.

### Platforms

```http
GET /api/v1/media/platforms?year=2026
```

Returns Google and Meta spend, impressions, traffic actions, platform response rate, claims, claim share, claimed CAC, directional revenue coverage, ROAS, ROAS status, and calculation basis.

### Campaigns

```http
GET /api/v1/media/campaigns?year=2026&month=8&platform=Google%20Ads&page=1&limit=20&sort=spend&order=desc
```

Supported filters include `platform`, `brand`, `segment`, `stage`, and `campaignType`. Pagination is bounded to 100 rows per page. Source-backed impressions, actions, and response rates are returned where the campaign workbook supplies them. Each row includes directional ROAS and its mapped calculation basis; `roasCampaigns` contains all eligible spend-over-AED-300 chart rows.

### Brands and segments

```http
GET /api/v1/media/brands?year=2026&month=8
GET /api/v1/media/segments?year=2026&month=8
```

Return exact aggregated economics plus the directional return value, calculation level (`BRAND`, `SEGMENT`, or `OVERALL`), basis text, numerator, and denominator. This lets the client show ROAS for every current spreadsheet-backed dropdown value without hiding fallback logic.

### Reconciliation

```http
GET /api/v1/media/reconciliation?year=2026
```

Returns the selected-period summary, monthly trend, and source reconciliation checks.

### Funnel

```http
GET /api/v1/media/funnel?year=2026&month=8
```

Returns site totals and aggregate-first funnel rates.

### Organic demand

```http
GET /api/v1/media/organic-demand?year=2026&market=Qatar
```

Returns monthly organic trends and brand, segment, and market groupings.

### Calculation audit

```http
GET /api/v1/media/audit/calculations/platform-cac?year=2026&month=8
```

Returns input values, formula text, raw result, display result, source periods, and source batches.

### Imports

```http
POST /api/v1/media/import
Content-Type: multipart/form-data
```

Fields:

- `package`: `.xlsx` or `.zip`
- `replaceExisting`: optional `true` for deliberate replacement

Import history:

```http
GET /api/v1/media/imports
GET /api/v1/media/imports/:batchId
```

## Error handling

Known import and request errors use stable codes:

| Code | Meaning |
| --- | --- |
| `UNSUPPORTED_FILE` | Upload is not `.xlsx` or `.zip` |
| `MISSING_WORKBOOK` | No workbook was uploaded or found |
| `MISSING_SHEET` | Required source domains could not be detected |
| `DUPLICATE_IMPORT` | One or more periods already exist |
| `RECONCILIATION_FAILED` | A blocking site-control, stage-spend, or Google campaign-total check failed |
| `DATABASE_UNAVAILABLE` | Import persistence cannot be completed |
| `VALIDATION_ERROR` | Query parameter validation failed |
| `IMPORT_NOT_FOUND` | Requested batch does not exist |

## UI implementation

The Media page preserves the reference hierarchy:

1. Media Performance header and reporting period
2. Four KPI cards
3. By Platform table
4. Campaign chart and platform tabs
5. Attribution reconciliation
6. Brand and segment tables
7. Site funnel
8. Organic demand
9. Explicit unavailable Media score

The reference dashboard's `LIVE` label is replaced by `IMPORTED · META + GOOGLE ADS` because this product uses uploaded monthly files. Year and Month dropdowns are populated from `GET /api/v1/media/periods` and default to the latest complete period. Segment options come from `GET /api/v1/media/segments`; Brand options come from `GET /api/v1/media/brands` filtered by the selected Segment. `All Segments` and `All Brands` are the default dimension choices. Selecting a specific Segment narrows the Brand list, while selecting All keeps every matching spreadsheet row. Specific Segment and Brand selections synchronize with URL query parameters, and every Media calculation uses the resulting scope. Campaign ROAS bars use a fixed 20-pixel thickness so the chart remains readable when only a few campaigns match.

## Unsupported metrics

### Uniform paid-click CTR

The files do supply Google interactions, Meta link clicks, and impressions. The requested `Blended CTR` is therefore calculated and clearly defined. It must not be interpreted as a uniform click-through rate because the Google numerator is interactions. Organic CTR remains isolated in the Organic Demand module.

### Platform and blended ROAS

Google conversion value is absent from the supplied export, and site revenue is not verified as paid-media-attributed revenue. The platform table therefore allocates each segment's reconciled site revenue by Google and Meta spend share within that segment and labels the result directional. It does not use platform conversion share, and it does not count any segment's site revenue more than once.

### Campaign ROAS and campaign revenue

There is no verified campaign revenue input. Campaign ROAS is the mapped brand/segment directional return, not allocated campaign revenue. Campaigns sharing the same mapped economic group can therefore share the same ROAS.

### New Customer CAC

The order data does not supply approved new-versus-returning customer classification.

### Paid Traffic Quality

The current funnel is site-wide and not explicitly limited to paid sessions.

### Plan Adherence

The signed monthly plan with budget, brand, stage, market, and launch dates is not supplied.

### Final Media score

The approved brief requires verified return, new customer acquisition, traffic quality, demand built, plan adherence and pacing, measurement hygiene, signed baselines, weights, gates, and rule versions. The present dataset does not support all of these inputs. The UI therefore says `MEDIA SCORE NOT AVAILABLE`.

## Forbidden calculations

The implementation does not:

- allocate site revenue to Google or Meta using claim share
- allocate brand revenue to campaigns using spend share
- allocate purchases to campaigns using spend share
- treat platform claims as verified orders
- treat a partial month as complete
- average monthly ratios into annual ratios
- invent a Media score from the available fields

## Future expansion

The module can add supported measures without replacing its architecture. New data should extend the parser, normalized model, calculation service, API contract, tests, and UI module in that order.

Future inputs can unlock:

- verified return and platform ROAS through order-level attribution or an approved reconciliation method
- campaign ROAS through verified campaign revenue linkage
- new-customer acquisition through order-level customer status
- traffic quality through paid-session GA4 engagement and product-depth fields
- demand scoring through approved query-level brand search volume and a signed baseline
- plan adherence through versioned signed plan artifacts
- measurement hygiene through naming, UTM, CAPI, and reconciliation-timing checks
- the final approved Media score through versioned weights, baselines, gates, and rule configuration

## Operational logging

The server logs upload start, detected files, reconciliation outcome, period replacement, inserted record count, and failure. It does not log source workbooks in full, credentials, or secrets.

## Completion and verification checklist

- Source HTML and business documents inspected
- Six workbooks and 34 sheets inventoried
- Monthly and partial periods normalized
- Source labels preserved
- MongoDB models and indexes defined
- Upload, validation, reconciliation, duplicate, and replacement flow implemented
- Calculation engine isolated from routes and UI
- REST routes and calculation audit implemented
- React dashboard and import screen implemented
- URL filter synchronization implemented
- Unsupported measures excluded or labelled unavailable
- Root, client, server, and implementation documentation created

Production acceptance should also include a running MongoDB import rehearsal, automated test pass, final build pass, and browser comparison at the requested responsive widths before deployment.

# Build BizCom Engine Media Analytics Application

Act as a senior full-stack TypeScript engineer, data engineer, analytics engineer, and dashboard developer.

Build a production-quality **Media Analytics application** for the BizCom Engine project.

The immediate project scope is:

```text
MEDIA TAB ONLY
```

The Media tab must be recreated using the supplied source files:

```text
GP-BizCom-Dashboard.html
data.zip
documentation.zip
```

The implementation must use the existing HTML Media tab as the primary visual reference and the Excel/data files as the factual source of truth.

Do not invent data, business logic, Excel fields, metrics, dimensions, formulas, or scoring values.

The client will provide new data **every month using the same workbook/data-sheet format**, so this must be built as a reusable monthly data-import and analytics application rather than a one-time static dashboard.

---

# 1. Main Objective

Build a complete Media Analytics system that:

1. Uses `GP-BizCom-Dashboard.html` as the Media-tab UI reference.
2. Reads actual Media data from `data.zip`.
3. Uses `documentation.zip` to understand the business definitions and limitations.
4. Supports monthly Excel/data imports from the client.
5. Validates every imported workbook.
6. Preserves business-facing Excel labels.
7. Normalizes imported records internally.
8. Stores normalized data in MongoDB.
9. Calculates supported metrics on the server.
10. Exposes analytics through Express REST APIs.
11. Displays those analytics in a responsive React dashboard.
12. Supports monthly and yearly filtering.
13. Supports partial-month datasets.
14. Verifies imported totals against the original spreadsheets.
15. Verifies calculation accuracy automatically.
16. Clearly identifies directional, claimed, partial, derived, and unavailable metrics.
17. Never fabricates unsupported analytics.
18. Includes full technical and business documentation.

The resulting application should look and behave like a real production analytics product.

---

# 2. Required Technology Stack

Create two completely separate applications:

```text
client/
server/
```

## Client

Use:

```text
React
TypeScript
Vite
Tailwind CSS
CSS where required
React Router
TanStack Query
Axios
Recharts or another lightweight React chart library
```

Do not use Next.js.

Suggested structure:

```text
client/
├── src/
│   ├── api/
│   ├── components/
│   │   ├── common/
│   │   └── charts/
│   ├── features/
│   │   └── media/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── services/
│   │       ├── types/
│   │       ├── utils/
│   │       └── constants/
│   ├── layouts/
│   ├── pages/
│   ├── routes/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
└── README.md
```

---

## Server

Use:

```text
Node.js
Express.js
TypeScript
MongoDB
Mongoose
Zod or Joi
Multer
SheetJS / xlsx
ZIP extraction library when required
```

Suggested structure:

```text
server/
├── src/
│   ├── config/
│   ├── modules/
│   │   └── media/
│   │       ├── calculations/
│   │       ├── controllers/
│   │       ├── import/
│   │       ├── models/
│   │       ├── repositories/
│   │       ├── routes/
│   │       ├── services/
│   │       ├── types/
│   │       ├── utils/
│   │       └── validators/
│   ├── middleware/
│   ├── types/
│   ├── utils/
│   ├── app.ts
│   └── server.ts
├── tests/
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

Keep the architecture modular.

Do not put business calculations directly inside:

```text
routes
controllers
React components
```

---

# 3. Source Files Are the Source of Truth

Before writing implementation code, inspect:

```text
GP-BizCom-Dashboard.html
data.zip
documentation.zip
```

Use them for different purposes:

```text
GP-BizCom-Dashboard.html
→ UI layout and visual direction

data.zip
→ actual available data

documentation.zip
→ business definitions, rules, limitations and intended meaning
```

Do not assume that every metric displayed in the HTML is available in the current data.

Build an internal availability matrix before implementation.

Example:

| HTML Metric        | Source File     | Sheet          | Required Columns     | Calculation          | Status      |
| ------------------ | --------------- | -------------- | -------------------- | -------------------- | ----------- |
| Total Spend        | Google + Meta   | Media sheets   | Spend                | Google + Meta        | AVAILABLE   |
| Blended CTR        | Missing         | N/A            | Clicks + Impressions | Clicks / Impressions | UNAVAILABLE |
| Directional Return | Reconciled data | Brand/segment  | Revenue + Spend      | Revenue / Spend      | DIRECTIONAL |
| Platform Claims    | Google + Meta   | Reconciliation | Conversion/Purchase  | Sum                  | AVAILABLE   |

Allowed status values:

```text
AVAILABLE
DERIVED
DIRECTIONAL
PLATFORM_CLAIMED
PARTIAL
UNAVAILABLE
```

---

# 4. Preserve Excel Labels

Business-facing values and labels from the source Excel files must be preserved.

Examples:

```text
Brand
Segment
Stage
Campaign
Campaign Type
Brand Scope
Canonical Brand
Mapping Source
Confidence
Month
Market
```

If Excel contains values like:

```text
Swiss
Fashion
House of Evaco
Build
Drive to Site
High
```

display those exact business values.

Internal fields may be normalized:

```ts
canonicalBrand
brandScope
campaignType
mappingSource
```

but do not arbitrarily rewrite source business values.

Also preserve the original source period label.

Example:

```ts
sourcePeriodLabel: string;
```

---

# 5. Monthly Client Data Workflow

The client will provide Media data monthly using the same agreed workbook format.

Implement this workflow:

```text
Client provides monthly Excel/ZIP package
                ↓
User uploads package
                ↓
Express receives upload
                ↓
ZIP extraction if required
                ↓
Workbook detection
                ↓
Sheet detection
                ↓
Required-column validation
                ↓
Row parsing
                ↓
Data normalization
                ↓
Data-quality validation
                ↓
Source total reconciliation
                ↓
MongoDB persistence
                ↓
Analytics become available
                ↓
React dashboard refreshes
```

Do not assume that a monthly file is correct simply because its filename matches.

Validate every import.

---

# 6. Media Import Feature

Create a Media data-import screen.

It should allow:

```text
Upload monthly data package
View detected files
View detected period
View validation status
View warnings
View reconciliation checks
Complete import
Replace existing period if appropriate
```

Import status examples:

```text
PROCESSING
COMPLETED
COMPLETED_WITH_WARNINGS
FAILED
```

Do not silently accept malformed workbooks.

---

# 7. Import Batch Model

Create a MongoDB model for every imported batch.

Example:

```ts
type MediaImportBatch = {
  batchId: string;

  year: number;
  month?: number;

  sourcePeriodLabel: string;

  importedAt: Date;

  status:
    | "PROCESSING"
    | "COMPLETED"
    | "COMPLETED_WITH_WARNINGS"
    | "FAILED";

  files: {
    originalName: string;
    detectedType: string;
    status: "VALID" | "INVALID" | "WARNING";
    rowCount: number;
  }[];

  validationErrors: string[];
  warnings: string[];

  reconciliationSummary: {
    passed: number;
    failed: number;
    warnings: number;
  };
};
```

All normalized records should reference:

```text
batchId
```

for traceability.

---

# 8. Idempotent Monthly Imports

Prevent duplicate data.

Never allow uploading the same month twice and silently doubling the analytics.

Implement controlled behaviour such as:

```text
REJECT_DUPLICATE
```

or:

```text
REPLACE_EXISTING_PERIOD
```

Prefer a deliberate replacement process for corrected monthly files.

Example unique import identity:

```text
year
month
sourceType
platform
campaign
brand
segment
```

Use transactions where appropriate when replacing imported data.

If a corrected month is uploaded:

```text
validate new package
        ↓
prepare replacement
        ↓
remove/replace old period atomically
        ↓
insert corrected normalized data
        ↓
recalculate period analytics
```

Do not leave half-replaced data.

---

# 9. Period Normalization

Do not rely only on text such as:

```text
Jan-26
Sep-26
September 2026
```

Normalize periods.

Recommended fields:

```ts
type MediaPeriod = {
  year: number;
  month: number;

  monthLabel: string;

  periodKey: string;
  // "2026-08"

  periodStart: Date;
  periodEnd: Date;

  isPartialPeriod: boolean;

  sourcePeriodLabel: string;
};
```

Use:

```text
YYYY-MM
```

for `periodKey`.

Example:

```text
2026-08
2026-09
```

---

# 10. Partial Period Support

The current data may contain partial months.

For example:

```text
September 1-10, 2026
```

This must not be represented as a complete September month.

Store:

```ts
isPartialPeriod: true
```

and where possible:

```ts
periodStart
periodEnd
```

Display:

```text
SEP 1-10 2026
PARTIAL PERIOD
```

Never compare a 10-day partial period against a complete previous month without clearly stating the difference.

---

# 11. Media Tab UI

Recreate the Media section from:

```text
GP-BizCom-Dashboard.html
```

as closely as practical.

Preserve:

```text
overall hierarchy
dashboard structure
visual density
KPI placement
table structure
chart placement
Meta / Google tabs
typography hierarchy
spacing direction
card appearance
information hierarchy
```

Do not redesign it into a generic SaaS template.

The HTML is a visual reference.

The Excel data is the analytical truth.

Where an HTML metric cannot be calculated, replace it with a defensible supported metric while keeping the visual structure.

---

# 12. Media Header

Use a header such as:

```text
MEDIA PERFORMANCE
```

Do not show:

```text
LIVE
```

because the data comes from monthly imports.

Use:

```text
IMPORTED DATA
```

and display selected period.

Example:

```text
MEDIA PERFORMANCE

Year: 2026
Month: August

AUGUST 2026 · IMPORTED DATA
```

For a partial period:

```text
SEPTEMBER 1-10 2026 · PARTIAL PERIOD
```

Also show data status:

```text
COMPLETE
PARTIAL
PROVISIONAL
```

---

# 13. Global Year Dropdown

Add a **Year dropdown** to the Media tab.

Example:

```text
Year
[ 2026 ▼ ]
```

Options must come dynamically from imported MongoDB data.

Example:

```text
All Years
2026
2025
2024
```

Do not hardcode available years.

Only display years with successfully imported Media data.

Selecting a year must affect the complete Media dashboard.

It must update:

```text
KPI cards
By Platform
Campaign charts
Campaign details
Attribution reconciliation
Brand performance
Segment performance
Funnel diagnostics
Organic demand
```

---

# 14. Global Month Dropdown

Add a **Month dropdown**.

Example:

```text
Month
[ August ▼ ]
```

Options:

```text
All Months
January
February
March
April
May
June
July
August
September
October
November
December
```

Only enable/display months for which data exists in the selected year.

Example:

```text
Year: 2026
Month:
  January
  February
  March
  April
  May
  June
  July
  August
  September
```

If October has not been imported, do not show it as an available reporting period.

---

# 15. Year and Month Filter Behaviour

Support:

## Specific month

```text
Year = 2026
Month = August
```

Meaning:

```text
August 2026 only
```

---

## Full year

```text
Year = 2026
Month = All Months
```

Meaning:

```text
All imported periods in 2026
```

---

## All data

```text
Year = All Years
Month = disabled
```

Meaning:

```text
All imported Media data
```

Prefer disabling the Month dropdown when:

```text
Year = All Years
```

because selecting "August across every year" could be analytically confusing.

---

# 16. Default Filter Selection

On initial load:

```text
Year = latest imported year
```

For Month:

prefer:

```text
latest complete imported month
```

If only the latest partial month should be highlighted, still clearly identify it as partial.

Example:

```text
Year: 2026
Month: September

PARTIAL PERIOD
SEP 1-10
```

Do not silently treat it as a completed month.

---

# 17. URL Filter Synchronization

Store the filter in the URL.

Examples:

```text
/media?year=2026&month=8
```

Year view:

```text
/media?year=2026
```

All years:

```text
/media
```

Benefits:

```text
browser refresh preserves selection
URLs can be shared
browser back/forward works
dashboard state is reproducible
```

---

# 18. Responsive Filter Layout

Desktop:

```text
MEDIA PERFORMANCE              Year [2026 ▼] Month [August ▼]
```

Tablet:

```text
MEDIA PERFORMANCE

Year [2026 ▼]     Month [August ▼]
```

Mobile:

```text
MEDIA PERFORMANCE

Year
[ 2026 ▼ ]

Month
[ August ▼ ]
```

No horizontal overflow.

---

# 19. Period API

Create:

```http
GET /api/v1/media/periods
```

Example response:

```json
{
  "success": true,
  "message": "Media periods fetched successfully",
  "data": {
    "years": [
      {
        "year": 2026,
        "months": [
          {
            "month": 1,
            "label": "January",
            "available": true,
            "partial": false
          },
          {
            "month": 8,
            "label": "August",
            "available": true,
            "partial": false
          },
          {
            "month": 9,
            "label": "September",
            "available": true,
            "partial": true,
            "startDate": "2026-09-01",
            "endDate": "2026-09-10"
          }
        ]
      }
    ]
  }
}
```

---

# 20. Monthly and Yearly API Filters

All analytics APIs must support:

```text
year
month
```

Examples:

```http
GET /api/v1/media/overview?year=2026&month=8
```

```http
GET /api/v1/media/platforms?year=2026&month=8
```

```http
GET /api/v1/media/campaigns?year=2026&month=8
```

```http
GET /api/v1/media/brands?year=2026&month=8
```

```http
GET /api/v1/media/segments?year=2026&month=8
```

```http
GET /api/v1/media/reconciliation?year=2026&month=8
```

If only year exists:

```http
GET /api/v1/media/overview?year=2026
```

aggregate the selected year.

---

# 21. Critical Yearly Aggregation Rule

Do not average monthly ratios.

For yearly calculations, first aggregate the raw numerator and denominator and then calculate the yearly ratio.

## Wrong

```text
January CAC = 100
February CAC = 200

Yearly CAC = (100 + 200) / 2
```

## Correct

```text
Yearly CAC
=
(January Spend + February Spend)
/
(January Claims + February Claims)
```

This rule is mandatory for:

```text
CAC
AOV
CAC / AOV
Directional Return
Claims vs Site %
Spend Share
Claim Share
Funnel rates
Any derived ratio
```

---

# 22. Yearly Additive Metrics

For additive values:

```text
Yearly Google Spend
=
SUM(Google Spend for all imported months)
```

```text
Yearly Meta Spend
=
SUM(Meta Spend for all imported months)
```

```text
Yearly Revenue
=
SUM(monthly Revenue)
```

```text
Yearly Site Purchases
=
SUM(monthly Site Purchases)
```

```text
Yearly Platform Claims
=
SUM(monthly Platform Claims)
```

---

# 23. Yearly Calculated Metrics

Calculate:

```text
Yearly Platform-Claimed CAC
=
Total Year Spend
/
Total Year Platform Claims
```

```text
Yearly Site AOV
=
Total Year Site Revenue
/
Total Year Site Purchases
```

```text
Yearly Directional Return
=
Total Year Site Revenue
/
Total Year Advertising Spend
```

```text
Yearly Claims vs Site %
=
Total Year Platform Claims
/
Total Year Site Purchases
× 100
```

Never calculate those metrics by averaging monthly results.

---

# 24. Top KPI Cards

Preserve approximately the four-card HTML structure.

Use these four metrics.

---

## KPI 1: Directional Return

Calculate:

```text
Directional Return
=
Site Revenue
/
Total Advertising Spend
```

Where:

```text
Total Advertising Spend
=
Google Spend
+
Meta Spend
```

Label:

```text
DIRECTIONAL RETURN
```

Do not call it verified ROAS.

Tooltip:

```text
Directional only. Site revenue is not proven to be exclusively generated by paid advertising.
```

---

## KPI 2: Platform-Claimed CAC

Calculate:

```text
Platform Claims
=
Google Claimed Conversions
+
Meta Claimed Purchases
```

Then:

```text
Platform-Claimed CAC
=
Total Advertising Spend
/
Platform Claims
```

Do not label it:

```text
New Customer CAC
```

because new/returning customer classification is not available.

---

## KPI 3: Claims vs Site

Replace unsupported Blended CTR.

Calculate:

```text
Claims vs Site %
=
Platform Claims
/
Site Purchases
× 100
```

Also:

```text
Claims Difference
=
Platform Claims - Site Purchases
```

Example:

```text
CLAIMS VS SITE

105.4%

+652 platform claims
vs site purchases
```

---

## KPI 4: Platform Claims

Calculate:

```text
Google Claims
+
Meta Claims
```

Display breakdown:

```text
Google
Meta
Total
```

---

# 25. Site AOV

Calculate:

```text
Site AOV
=
Site Revenue
/
Site Purchases
```

Show this as a secondary metric where appropriate.

---

# 26. CAC vs AOV

Calculate:

```text
CAC / AOV %
=
Platform-Claimed CAC
/
Site AOV
× 100
```

Example:

```text
Claimed CAC: AED 185
Site AOV: AED 2,450
CAC / AOV: 7.6%
```

---

# 27. Safe Division

Every division must be protected.

If denominator equals:

```text
0
null
undefined
```

return:

```ts
null
```

Never return:

```text
NaN
Infinity
-Infinity
```

Frontend must display:

```text
N/A
```

---

# 28. By Platform Section

Keep the visual style of the HTML platform comparison.

Use supported fields:

| Platform   | Spend | Spend Share | Platform Claims | Claim Share | Claimed CAC |
| ---------- | ----: | ----------: | --------------: | ----------: | ----------: |
| Google Ads |       |             |                 |             |             |
| Meta Ads   |       |             |                 |             |             |

Calculations:

```text
Spend Share
=
Platform Spend
/
Total Spend
× 100
```

```text
Claim Share
=
Platform Claims
/
Total Claims
× 100
```

```text
Claimed CAC
=
Platform Spend
/
Platform Claims
```

Do not show unsupported:

```text
Paid Impressions
Paid CTR
Platform ROAS
```

---

# 29. Campaign Spend Chart

The original HTML uses:

```text
Campaign ROAS
```

Current data does not support campaign ROAS reliably.

Replace it with:

```text
TOP CAMPAIGNS BY SPEND
```

Retain approximately the same horizontal bar-chart structure.

Show:

```text
Campaign
Platform
Spend
```

Support filters where data exists:

```text
Year
Month
Platform
Brand
Segment
Stage
Campaign Type
```

---

# 30. Campaign Detail Section

Keep:

```text
[ META ] [ GOOGLE ]
```

tabs.

## Meta

Display only available workbook columns such as:

```text
Campaign
Brand
Brand Scope
Segment
Stage
Confidence
Spend
```

## Google

Display available fields such as:

```text
Campaign
Canonical Brand
Scope
Segment
Campaign Type
Mapping Source
Spend
```

Use actual source labels wherever possible.

Do not create fake fields for:

```text
CTR
Impressions
Campaign Revenue
Campaign ROAS
```

---

# 31. Attribution Reconciliation

Build a dedicated reconciliation module.

Use:

```text
Google Claimed Conversions
Meta Claimed Purchases
Total Platform Claims
Site Purchases
Claims Difference
Claims vs Site %
```

Example:

```text
ATTRIBUTION RECONCILIATION

Platform Claimed       12,720
Site Purchases         12,068
Difference               +652
Claims vs Site          105.4%
```

Include monthly trends.

Example:

| Month | Google Claims | Meta Claims | Platform Claims | Site Purchases | Claims vs Site |
| ----- | ------------: | ----------: | --------------: | -------------: | -------------: |
| Jan   |               |             |                 |                |                |
| Feb   |               |             |                 |                |                |
| Mar   |               |             |                 |                |                |

This is a diagnostic.

Do not present platform claims as verified orders.

---

# 32. Brand Performance

Create a Brand Performance section.

Possible fields:

```text
Brand
Google Spend
Meta Spend
Total Spend
Site Purchases
Site Revenue
Site AOV
Directional Return
```

Calculations:

```text
Total Brand Spend
=
Google Brand Spend
+
Meta Brand Spend
```

```text
Brand Site AOV
=
Brand Site Revenue
/
Brand Site Purchases
```

```text
Brand Directional Return
=
Brand Site Revenue
/
Brand Advertising Spend
```

Mark return:

```text
DIRECTIONAL
```

Do not imply causal paid-media attribution.

---

# 33. Segment Performance

Create a Segment Performance section.

Use actual Excel segment labels dynamically.

Fields:

```text
Segment
Google Spend
Meta Spend
Total Spend
Purchases
Revenue
AOV
Directional Return
```

Do not hardcode segments into application logic.

---

# 34. Site Funnel Diagnostics

If the provided data contains:

```text
Items Viewed
Items Added to Cart
Items Purchased
```

build a site funnel.

Calculate:

```text
View → Cart Rate
=
Added to Cart
/
Items Viewed
× 100
```

```text
Cart → Purchase Rate
=
Items Purchased
/
Added to Cart
× 100
```

```text
View → Purchase Rate
=
Items Purchased
/
Items Viewed
× 100
```

Label:

```text
SITE FUNNEL
```

Do not call it:

```text
Paid Traffic Quality
```

unless the source is explicitly paid-session data.

---

# 35. Organic Demand

If available in the source workbooks, build a clearly separated Organic Demand module.

Fields may include:

```text
Organic Clicks
Organic Impressions
Organic CTR
Average Position
Brand
Segment
Market
Month
```

Possible views:

```text
Demand by Brand
Demand by Segment
Demand by Market
Monthly Organic Trend
```

Never use these values for paid-ad calculations.

Specifically:

```text
Organic CTR != Google Ads CTR
Organic Impressions != Paid Impressions
Organic Clicks != Paid Clicks
```

---

# 36. Market Demand

If market data exists, support source values such as:

```text
UAE
Qatar
Oman
Bahrain
```

Keep exact source values.

Do not invent geographic mappings.

---

# 37. Metrics That Must Remain Unavailable

Do not manufacture these from unrelated data:

```text
Paid CTR
Google Ads CTR
Meta Ads CTR

Paid Clicks
Paid Impressions

Verified Google ROAS
Verified Meta ROAS
Verified Blended ROAS

Campaign ROAS
Campaign Revenue
Campaign Attributed Conversions where unavailable

New Customer CAC
New Customer %
Returning Customer %

Paid Engagement Rate
Paid Product Page Depth

Exact Search Query Brand Volume
Branded vs Generic Query Share

Plan Adherence
```

Display:

```text
N/A
```

or omit them.

Where useful explain:

```text
Required source data not provided.
```

---

# 38. Forbidden Calculations

Never calculate platform revenue as:

```text
Total Site Revenue
×
Platform Conversion Share
```

Never calculate campaign revenue as:

```text
Brand Revenue
×
Campaign Spend Share
```

Never calculate campaign conversions as:

```text
Brand Purchases
×
Campaign Spend Share
```

Never infer:

```text
Clicks
Impressions
CTR
ROAS
```

from unrelated values.

Do not create mathematically neat but analytically false numbers.

---

# 39. Server Calculation Engine

Create dedicated modules.

Example:

```text
media/
└── calculations/
    ├── calculate-total-spend.ts
    ├── calculate-platform-claims.ts
    ├── calculate-platform-cac.ts
    ├── calculate-site-aov.ts
    ├── calculate-cac-aov-ratio.ts
    ├── calculate-claims-vs-site.ts
    ├── calculate-directional-return.ts
    ├── calculate-platform-share.ts
    ├── calculate-brand-performance.ts
    ├── calculate-segment-performance.ts
    └── calculate-funnel-rates.ts
```

The server owns analytical formulas.

Frontend should not independently reproduce business formulas.

---

# 40. Numeric Precision

Recommended internal behaviour:

```text
Store source currency values using sufficient precision.

Do not round intermediate calculations.
```

Display:

```text
Currency:
0 or 2 decimals as appropriate

Percent:
1 or 2 decimals

Return ratios:
2 decimals

Counts:
integer
```

Correct:

```text
round(totalSpend / totalClaims)
```

Wrong:

```text
round(totalSpend)
/
round(totalClaims)
```

Only round the final result for display.

---

# 41. Currency Formatting

Use:

```text
AED
```

where applicable.

Create a reusable currency formatter.

Example:

```ts
formatAED(123456.78)
```

Possible output:

```text
AED 123,456.78
```

or compact charts:

```text
AED 123.5K
AED 1.7M
```

Keep raw value available for tooltips.

---

# 42. Data Validation

Validate every workbook.

Check:

```text
required file types
required sheets
required columns
valid numbers
valid dates
valid period labels
campaign names
platform
brand values
segment values
negative spend
duplicate records
blank required fields
malformed percentages
unexpected workbook structure
```

Do not silently discard invalid rows.

---

# 43. Source Reconciliation

Every import must reconcile important totals.

Examples:

```text
SUM(normalized Google Spend)
=
Google source workbook total
```

```text
SUM(normalized Meta Spend)
=
Meta source workbook total
```

```text
SUM(monthly platform claims)
=
source reconciliation workbook total
```

```text
SUM(site purchases)
=
source site purchase total
```

```text
SUM(site revenue)
=
source revenue total
```

Use an appropriate tolerance for floating-point/currency comparisons.

---

# 44. Reconciliation Result Model

Example:

```ts
type ReconciliationCheck = {
  name: string;

  sourceValue: number;
  importedValue: number;

  difference: number;

  tolerance: number;

  passed: boolean;
};
```

Example response:

```json
{
  "name": "Google spend reconciliation",
  "sourceValue": 123456.78,
  "importedValue": 123456.78,
  "difference": 0,
  "tolerance": 0.01,
  "passed": true
}
```

Do not mark the import as fully successful if critical checks fail.

---

# 45. Data Accuracy Tests

Data accuracy is a critical requirement.

Implement automated tests for:

```text
Total Spend
Platform Claims
Platform CAC
Site AOV
CAC / AOV
Claims Difference
Claims vs Site %
Spend Share
Claim Share
Directional Return
Brand Total Spend
Brand AOV
Brand Directional Return
Segment Aggregations
Funnel Conversion Rates
Monthly Aggregations
Yearly Aggregations
```

Use actual source-derived fixtures where practical.

---

# 46. Yearly Calculation Tests

Explicitly test that yearly ratios are not simple averages.

Example test fixture:

```text
January:
Spend = 1,000
Claims = 10
CAC = 100

February:
Spend = 10,000
Claims = 50
CAC = 200
```

Wrong result:

```text
(100 + 200) / 2
= 150
```

Correct yearly CAC:

```text
11,000 / 60
= 183.333...
```

The test should fail if the application returns:

```text
150
```

Apply equivalent tests to:

```text
AOV
Directional Return
Claims vs Site
Spend Share
Claim Share
Funnel ratios
```

---

# 47. REST API Design

Create APIs such as:

```http
POST /api/v1/media/import

GET /api/v1/media/imports
GET /api/v1/media/imports/:batchId

GET /api/v1/media/periods

GET /api/v1/media/overview
GET /api/v1/media/platforms
GET /api/v1/media/campaigns
GET /api/v1/media/brands
GET /api/v1/media/segments
GET /api/v1/media/reconciliation
GET /api/v1/media/funnel
GET /api/v1/media/organic-demand
```

Supported query parameters where relevant:

```text
year
month
platform
brand
segment
stage
campaignType
market
```

Validate all query parameters.

---

# 48. Standard API Response

Use:

```ts
type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};
```

Analytics should also include metadata.

Example:

```json
{
  "success": true,
  "message": "Media overview fetched successfully",
  "data": {
    "metrics": {},
    "metadata": {
      "year": 2026,
      "month": 9,
      "partialPeriod": true,
      "periodStart": "2026-09-01",
      "periodEnd": "2026-09-10",
      "status": "PARTIAL"
    }
  }
}
```

---

# 49. Calculation Audit API

Create an admin/development audit endpoint or service that makes important calculations inspectable.

Example:

```http
GET /api/v1/media/audit/calculations/platform-cac?year=2026&month=8
```

Response:

```json
{
  "metric": "platformClaimedCAC",
  "inputs": {
    "googleSpend": 100000,
    "metaSpend": 50000,
    "googleClaims": 600,
    "metaClaims": 250
  },
  "formula": "(googleSpend + metaSpend) / (googleClaims + metaClaims)",
  "rawResult": 176.4705882353,
  "displayResult": 176.47
}
```

Include:

```text
source period
source batch
formula
inputs
raw result
display result
```

This makes Excel vs application verification straightforward.

---

# 50. React Data Management

Use TanStack Query for server state.

Do not duplicate server data into unnecessary global state.

Query keys must include selected period.

Example:

```ts
[
  "media",
  "overview",
  {
    year,
    month
  }
]
```

Campaign example:

```ts
[
  "media",
  "campaigns",
  {
    year,
    month,
    platform,
    brand,
    segment
  }
]
```

Changing period must refresh all relevant queries.

---

# 51. Global Media Filter State

Use one shared filter state for the Media page.

Do not allow inconsistent situations such as:

```text
KPI = August
Campaign chart = September
Brands = full year
```

unless a module explicitly supports independent comparison mode.

Primary Media filters must be synchronized.

---

# 52. Loading, Error and Empty States

Every module needs:

```text
Loading
Error
Empty
Success
```

Use dashboard-shaped skeletons instead of blank spaces.

If selected month has no data:

```text
No Media data is available for this period.
```

Do not render misleading zero-filled analytics unless zero is genuinely present in the source data.

---

# 53. Metric Status System

Use status badges consistently.

Supported status labels:

```text
VERIFIED
DERIVED
DIRECTIONAL
PLATFORM CLAIMED
PARTIAL
UNAVAILABLE
```

Only use:

```text
VERIFIED
```

where the source genuinely supports verified status.

Example:

```text
DIRECTIONAL RETURN
[DIRECTIONAL]
```

---

# 54. Metric Tooltips

Important calculated metrics should include definitions.

Example:

```text
Directional Return

Formula:
Site Revenue / Advertising Spend

Status:
Directional

Reason:
Site revenue is not proven to be exclusively attributable to paid advertising.
```

For Platform CAC:

```text
Platform-Claimed CAC

Formula:
Advertising Spend / Platform-Claimed Conversions

This should not be interpreted as verified new-customer CAC.
```

---

# 55. Reusable React Components

Create reusable components such as:

```text
MediaMetricCard
MetricStatusBadge
MetricTooltip
MediaPeriodFilters
YearSelect
MonthSelect
PlatformComparisonTable
CampaignSpendChart
CampaignTable
AttributionReconciliation
BrandPerformanceTable
SegmentPerformanceTable
SiteFunnel
OrganicDemandChart
DataQualityNotice
ImportStatusCard
LoadingSkeleton
ErrorState
EmptyState
ResponsiveTable
```

Do not create enormous one-file pages.

---

# 56. Responsive Design

Support:

```text
320px
360px
375px
390px
430px
768px
834px
1024px
1280px
1440px
1920px
```

Desktop:

```text
4 KPI cards where space allows
full-width data tables
multi-column analytics sections
large charts
```

Tablet:

```text
2 KPI cards per row
responsive charts
scrollable wide tables
```

Mobile:

```text
1 KPI card per row
stacked filters
full-width charts
horizontal table scroll where unavoidable
```

No page-level horizontal scrolling.

---

# 57. Accessibility

Implement:

```text
semantic HTML
proper headings
table headers
keyboard navigation
accessible tabs
focus states
ARIA labels where needed
sufficient contrast
accessible select elements
```

Charts should also expose numbers through text/tables/tooltips.

Do not make information available only through color.

---

# 58. MongoDB Models

Create normalized domain models based on the actual workbook structures.

Potential models include:

```text
MediaImportBatch
MediaCampaignSpend
MediaPlatformClaim
MediaBrandPerformance
MediaSitePerformance
MediaOrganicDemand
```

Do not create unnecessary collections if a simpler normalized schema is sufficient.

Every analytical record should include useful lineage fields such as:

```ts
batchId
sourceFile
sourceSheet
sourceRow
year
month
periodKey
```

where practical.

---

# 59. Indexing

Create indexes that support common queries.

Examples:

```text
year + month
periodKey
platform
brand
segment
campaign
batchId
```

Compound indexes where appropriate:

```text
{ year: 1, month: 1, platform: 1 }
```

```text
{ year: 1, month: 1, brand: 1 }
```

Do not create dozens of unnecessary indexes.

---

# 60. Documentation File

Create:

```text
MEDIA_IMPLEMENTATION.md
```

This file is mandatory.

It must explain the complete solution.

---

# 61. MEDIA_IMPLEMENTATION.md: Overview

Explain:

```text
What the Media tab is
What problem it solves
What data is available
What is calculated
What is directional
What is unavailable
```

---

# 62. Architecture Documentation

Include:

```text
React
Express
MongoDB
Excel import
Normalization
Validation
Calculation engine
REST APIs
Dashboard
```

Add diagram:

```text
Monthly Client Files
        ↓
Upload API
        ↓
Workbook Parser
        ↓
Schema Validator
        ↓
Normalizer
        ↓
Reconciliation
        ↓
MongoDB
        ↓
Calculation Services
        ↓
REST APIs
        ↓
React Media Dashboard
```

---

# 63. Workbook Mapping Documentation

For every source file document:

```text
File name / type
Purpose
Sheet names
Fields used
Expected format
MongoDB destination
Analytics enabled
```

---

# 64. Data Lineage Documentation

Create a table:

| Dashboard Metric | Workbook | Sheet | Fields | Formula | Status |
| ---------------- | -------- | ----- | ------ | ------- | ------ |

Example:

```text
Platform-Claimed CAC

Inputs:
Google Spend
Meta Spend
Google Claims
Meta Claims

Formula:
(Google Spend + Meta Spend)
/
(Google Claims + Meta Claims)

Status:
PLATFORM CLAIMED
```

---

# 65. Calculation Documentation

Document all formulas.

Include:

```text
Total Spend
Platform Claims
Platform CAC
Site AOV
CAC / AOV
Claims Difference
Claims vs Site %
Directional Return
Spend Share
Claim Share
Brand calculations
Segment calculations
Funnel calculations
```

---

# 66. Monthly and Yearly Filtering Documentation

Create a dedicated section:

```text
Monthly and Yearly Filtering
```

Explain:

```text
how years are detected
how months are detected
default selection
partial-month handling
URL state
API query parameters
year aggregation
month aggregation
why ratios are recalculated from totals
```

Provide examples:

```text
August 2026
2026 Full Year
Sep 1-10 2026 Partial Period
```

---

# 67. Monthly Import Documentation

Explain:

```text
1. Receive monthly source files.
2. Open Media Import.
3. Upload package.
4. Server validates files.
5. Server validates sheets.
6. Server validates columns.
7. Data is normalized.
8. Totals are reconciled.
9. Warnings/errors are shown.
10. Data is persisted.
11. New month automatically appears in Year/Month filters.
```

---

# 68. Corrected Month Documentation

Explain how a month can be replaced safely.

Include:

```text
existing period detection
duplicate prevention
validation
replacement transaction
reconciliation
rollback on failure
```

---

# 69. Unsupported Metrics Documentation

Explicitly list unavailable analytics and missing source data.

Include:

```text
Paid CTR
Paid Clicks
Paid Impressions
Platform ROAS
Campaign ROAS
New Customer CAC
Paid Traffic Quality
Plan Adherence
```

Explain why each is unavailable.

---

# 70. Future Expansion Documentation

Explain how later data can unlock:

```text
Paid CTR
Verified ROAS
Campaign ROAS
New Customer Acquisition
Traffic Quality
Demand Built
Plan Adherence
Measurement Hygiene
Final approved Media score
```

Architecture should allow these additions without rewriting the entire Media module.

---

# 71. API Documentation

For every API document:

```text
Method
Route
Query parameters
Request
Response
Purpose
Errors
```

---

# 72. Database Documentation

Document:

```text
collections
important fields
indexes
relationships
period model
lineage fields
```

Include example MongoDB documents.

---

# 73. Accuracy Documentation

Explain:

```text
source reconciliation
formula tests
floating-point tolerances
rounding
safe division
duplicate prevention
yearly ratio logic
```

---

# 74. Root README

Create:

```text
README.md
```

Include:

```text
Project overview
Architecture
Tech stack
Prerequisites
Installation
Environment variables
MongoDB setup
Client setup
Server setup
Development commands
Build commands
Testing
Folder structure
Monthly import workflow
Documentation links
```

---

# 75. Environment Variables

Server `.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bizcom-engine
CLIENT_ORIGIN=http://localhost:5173
MAX_UPLOAD_SIZE_MB=50
```

Client `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Do not commit real credentials.

---

# 76. Testing Stack

Use:

```text
Vitest or Jest
Supertest
```

Test server logic heavily.

Important tests:

```text
Excel parsing
Sheet detection
Column validation
Normalization
Duplicate imports
Corrected month replacement
Source reconciliation
Calculation engine
Monthly filtering
Yearly filtering
Partial periods
Safe division
API endpoints
```

---

# 77. Code Quality

Use:

```text
strict TypeScript
ESLint
Prettier
clear types
small functions
reusable services
central constants
consistent API errors
consistent logging
```

Avoid:

```text
any
hardcoded analytics
huge controllers
huge React pages
duplicated calculation logic
Excel row-number assumptions
silent error handling
business formulas in JSX
```

---

# 78. Error Handling

Create consistent server errors.

Possible import errors:

```text
UNSUPPORTED_FILE
MISSING_WORKBOOK
MISSING_SHEET
MISSING_COLUMN
INVALID_PERIOD
DUPLICATE_IMPORT
RECONCILIATION_FAILED
INVALID_NUMERIC_VALUE
```

Return meaningful errors.

Frontend should show clear messages.

---

# 79. Logging

Log important import events:

```text
upload started
files detected
period detected
validation completed
reconciliation result
records inserted
period replaced
import failed
```

Never log secrets or entire sensitive source datasets.

---

# 80. Performance

Do not send full raw Excel datasets to the frontend.

Aggregate on the server.

Use:

```text
MongoDB aggregation
pagination
sorting
indexed queries
filtered endpoints
```

Campaign tables should support pagination if large.

---

# 81. Campaign Table Features

Support:

```text
sorting
pagination
platform tabs
brand filter
segment filter
stage/type filter where available
```

Do not implement filters for fields that do not exist.

---

# 82. Data Formatting

Use reusable utilities for:

```text
AED currency
numbers
percentages
ratios
dates
month labels
partial period labels
```

Examples:

```text
AED 1.73M
12,720
105.4%
9.04x
Aug 2026
Sep 1-10 2026
```

---

# 83. UI Data Status Notice

At the top or near relevant sections show a concise status notice when necessary.

Example:

```text
Some Media metrics are directional because verified paid-media revenue attribution is not available in the current source files.
```

Do not hide analytical limitations.

---

# 84. Do Not Show Fake Media Score

The existing HTML may contain a Media score.

Do not calculate a final official score unless the required scoring inputs actually exist.

For current data use:

```text
MEDIA
PROVISIONAL
```

or:

```text
MEDIA SCORE
NOT AVAILABLE
```

where appropriate.

Do not create an arbitrary score from available metrics just to fill the UI.

---

# 85. Visual Comparison Before Completion

Compare the final React Media page with:

```text
GP-BizCom-Dashboard.html
```

Verify:

```text
Media header
KPI hierarchy
spacing
card structure
tables
campaign layout
tabs
chart placement
responsive hierarchy
```

The final UI should clearly originate from the provided HTML design.

---

# 86. Calculation Comparison Before Completion

For multiple periods manually compare:

```text
Excel source
vs
MongoDB normalized totals
vs
API result
vs
UI display
```

Test at least:

```text
one complete month
another complete month
one partial month
full year aggregation
```

---

# 87. Hardcoded Value Audit

Before completion search the project for demo analytical numbers copied from the HTML.

No dashboard metric may be hardcoded.

Every displayed analytical number must originate from:

```text
imported source data
```

or:

```text
a documented server-side calculation using imported data
```

---

# 88. Required Project Output

Final project:

```text
bizcom-engine/
│
├── client/
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── .env.example
│   └── README.md
│
├── server/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
│
├── MEDIA_IMPLEMENTATION.md
├── README.md
└── .gitignore
```

---

# 89. Implementation Order

Follow this sequence:

```text
1. Inspect GP-BizCom-Dashboard.html.
2. Inspect data.zip completely.
3. Inspect documentation.zip completely.
4. Create source/data availability matrix.
5. Map workbooks, sheets and columns.
6. Define normalized domain types.
7. Define period model.
8. Define MongoDB models.
9. Build import parser.
10. Build validation.
11. Build reconciliation.
12. Build duplicate/replacement handling.
13. Build calculation engine.
14. Write calculation tests.
15. Write yearly aggregation tests.
16. Build REST APIs.
17. Build periods API.
18. Build React Media layout from HTML.
19. Build Year dropdown.
20. Build Month dropdown.
21. Synchronize filters with URL.
22. Connect dashboard APIs.
23. Build charts and tables.
24. Build campaign tabs.
25. Build reconciliation UI.
26. Build Brand Performance.
27. Build Segment Performance.
28. Build Site Funnel where supported.
29. Build Organic Demand where supported.
30. Build Media import screen.
31. Add statuses/tooltips.
32. Make complete UI responsive.
33. Complete automated testing.
34. Perform Excel → API → UI accuracy audit.
35. Write MEDIA_IMPLEMENTATION.md.
36. Write/update README files.
```

---

# 90. Non-Negotiable Rules

The following requirements must not be violated.

1. `GP-BizCom-Dashboard.html` is the Media UI reference.
2. `data.zip` is the factual data source.
3. `documentation.zip` defines intended meaning and business context.
4. Inspect the actual files before implementation.
5. Preserve source Excel business labels.
6. Do not hardcode dashboard data.
7. Client and server must be separate projects.
8. Use React + TypeScript + Vite on the client.
9. Use Tailwind CSS and CSS where necessary.
10. Use Node + Express + TypeScript on the server.
11. Use MongoDB with Mongoose.
12. All authoritative Media calculations must run on the server.
13. Support monthly client imports.
14. Support yearly filtering.
15. Support monthly filtering.
16. Dynamically derive available months and years from imported data.
17. Support partial months.
18. Do not treat partial months as full months.
19. Do not average monthly ratios to produce yearly ratios.
20. Aggregate numerators and denominators before yearly ratio calculations.
21. Verify source totals after every import.
22. Add automated calculation tests.
23. Prevent duplicate imports.
24. Support safe replacement of corrected periods.
25. Never substitute organic CTR for paid CTR.
26. Never infer paid clicks or impressions.
27. Never allocate site revenue to Google/Meta using claimed conversion share.
28. Never estimate campaign revenue using campaign spend share.
29. Never fabricate campaign ROAS.
30. Clearly label directional analytics.
31. Clearly label platform-claimed analytics.
32. Clearly label partial-period analytics.
33. Do not generate a false official Media score.
34. Use consistent safe-division handling.
35. Never render NaN or Infinity.
36. Make every dashboard number traceable to source data or a documented formula.
37. Maintain the HTML Media tab's visual direction.
38. UI must be responsive across mobile, tablet, laptop and desktop.
39. `MEDIA_IMPLEMENTATION.md` is mandatory.
40. Documentation must explain data sources, formulas, filtering, imports, architecture, workflow, limitations, validation and future expansion.

---

# 91. Definition of Done

The Media project is complete only when all of the following are true:

```text
✓ Existing source HTML was inspected.

✓ All supplied data files were inspected.

✓ Documentation was inspected.

✓ Media data imports successfully.

✓ Invalid workbook structures are rejected.

✓ MongoDB stores normalized records.

✓ Imported totals reconcile with Excel.

✓ Monthly dropdown works.

✓ Yearly dropdown works.

✓ Filters are dynamic.

✓ URL filter synchronization works.

✓ Monthly analytics are correct.

✓ Yearly analytics are mathematically correct.

✓ Partial periods are visibly identified.

✓ KPI cards use real calculations.

✓ Platform comparison uses supported metrics.

✓ Campaign Spend replaces unsupported Campaign ROAS.

✓ Meta and Google campaign tables use real source fields.

✓ Attribution reconciliation works.

✓ Brand analytics work.

✓ Segment analytics work.

✓ Supported funnel analytics work.

✓ Supported organic-demand analytics work.

✓ Unsupported metrics are not fabricated.

✓ Calculations have automated tests.

✓ Yearly weighted/aggregate ratio rules have tests.

✓ Dashboard matches the HTML visual direction.

✓ Dashboard is responsive.

✓ Every important metric has clear source lineage.

✓ MEDIA_IMPLEMENTATION.md is complete.

✓ README files are complete.

✓ No analytical values are hardcoded.
```

The priority order is:

```text
DATA ACCURACY
>
CORRECT BUSINESS MEANING
>
TRACEABILITY
>
UI FIDELITY
>
VISUAL COMPLETENESS
```

A dashboard with missing but correctly labelled metrics is acceptable.

A dashboard containing fabricated or analytically invalid metrics is not acceptable.

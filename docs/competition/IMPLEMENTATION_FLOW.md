# Competition Implementation Flow

## Simple flow

```text
Competition workbook in spreadsheets data/compititaion-tab
        |
        v
Match configured competitor and required capture headers
        |
        v
Validate identifiers, dates, status, format, and source rows
        |
        v
Normalise one observation per competitor + capture date + Library ID
        |
        v
Calculate date-only days running and compare with supplied values
        |
        v
Extract workbook images and verify screenshot captions against Library IDs
        |
        v
Keep source-backed data available and sync new records to MongoDB
        |
        v
Apply capture-period and competitor filters
        |
        v
Calculate activity, history, mixes, launches, and longest-running ads
        |
        v
Return REST data and render the React Competition tab
```

## 1. Configuration

`competition.config.ts` stores:

- Client and competitor IDs.
- Display names.
- Exact Meta page.
- Website.
- Workbook filename aliases.
- Format groups.
- Theme groups.
- Optional comparison labels.

Adding another competitor uses configuration and a supported workbook. Calculation logic does not contain hard-coded competitor totals.

## 2. Workbook discovery

The parser looks under `spreadsheets data/compititaion-tab` for configured `.xlsx` files. It then checks sheet headers before accepting capture data.

Required values include Library ID, capture date, start date, status, and format. Missing optional fields remain `null`.

## 3. Duplicate protection

Ad identity key:

```text
Competitor/account + Library ID
```

Observation key:

```text
Competitor/account + Capture date + Library ID
```

A duplicate in one capture is rejected from totals and reported in the audit.

## 4. Screenshot extraction

The workbook is also a ZIP package internally. The importer reads:

- `xl/media` image files.
- Drawing relationships.
- Drawing order and anchors.
- Screenshot captions.
- Captioned Library IDs.

Assets are written to a capture-specific folder so a future import cannot overwrite an earlier capture's images.

## 5. Persistence

When MongoDB is connected, the server syncs:

- Stable ad identities.
- Capture observations.
- Capture metadata and screenshot assets.

Insert-only upserts preserve earlier captures. Dashboard reads can still use the source-backed parser when MongoDB is unavailable.

## 6. Server calculations

The Competition service chooses the exact competitor and capture before calculating totals. It never sums the same Library ID across capture dates.

Historical trend appears only when at least two captures exist.

## 7. Client rendering

The React page displays summary cards, grouped start dates, longest-running creatives, mixes, a searchable table, and a modal gallery.

Missing workbooks show `Data not received`. Missing optional values show `N/A`.

No Competition value is sent to Media or Creative scoring code.

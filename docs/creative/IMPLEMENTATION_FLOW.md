# Creative Implementation Flow

## Simple flow

```text
CSV files in spreadsheets data/creative-tab
        |
        v
Detect encoding and parse CSV tables
        |
        v
Select the configured canonical complete post export
        |
        v
Compare duplicate exports and record conflicts
        |
        v
Normalise posts and source coverage
        |
        v
Build Year, Month, and Brand filter options
        |
        v
Filter posts by publication period and Brand
        |
        v
Calculate supported Organic totals, rates, and optional reference scores
        |
        v
Return the Creative REST response
        |
        v
Render Organic, supported paid Meta subset, and unavailable sections in React
```

## 1. File discovery

The server looks for Creative data in `spreadsheets data/creative-tab`.

Brand names, aliases, account names, post-level availability, source precedence, and benchmark anchors are kept in `creative-source.config.ts`.

## 2. CSV parsing

The parser detects UTF-8 and UTF-16 files, removes a `sep=,` line, handles quoted commas, and ignores empty table rows.

Malformed post rows without a Post ID or valid publication timestamp are rejected and counted in the source audit.

## 3. Duplicate prevention

The Union Coop complete exports overlap. The selected source is normalised once. The alternate source is compared field by field, and conflicts are reported without adding its rows to totals.

## 4. Coverage handling

Post-level exports create post coverage. Souq daily or summary exports create coverage records only.

Year and Month options come from actual dated posts and source coverage. A period ending before the final day of the month is marked partial.

## 5. Filtering

The filter uses publication year and month. `All months` includes every available month in the selected year.

Changing filters preserves the current Organic or Paid subtab.

## 6. Server calculations

The Express server calculates:

- Eligible post count.
- Summed post reach.
- Views and frequency.
- Active actions and active engagement rate.
- Watch-time coverage.
- Ranked post records.
- Reference scores when enabled.

The React client only formats and displays returned values.

## 7. Unavailable states

Pocari Sweat paid Meta detail is parsed separately from Union Coop Organic data. The five detail records support matching-total CTR, reach, impressions, spend, and spend-ranked galleries only at the whole-export scope. Earned engagement, the complete Paid score, and Google Shopping remain unavailable because their required source fields do not exist.

Souq Brands show a clear unavailable state because account totals cannot safely create individual post performance.

## 8. Image handling

Only configured or source-supplied safe image URLs are used. When an image is missing, the gallery displays `Image not available`. Post links remain separate from image URLs.

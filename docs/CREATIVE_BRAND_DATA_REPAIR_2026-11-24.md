# Creative Brand Data: Source and Filter Repair (24 Nov 2026)

## Baseline
`Bizcom-Engine-Nov24-Spreadsheets-Categorized-Full.zip`. The React / Express / file-backed import structure and every original source spreadsheet and CSV were retained. No MongoDB or Docker integration was introduced.

## Root cause
1. The Creative API returned **six brands** internally but its public options **filtered out the two brands actually identified by the supplied Souq CSV exports** (`souq-al-bahar` and `souq-al-jubair`). The visible entries `Souq Al Haraj` and `Souq Al Jubail` had `accountLevelAvailable: false` and no matching CSVs, so selecting them could not produce account metrics.
2. The Brand dropdown reused the Union Coop reporting period when the brand changed. Pocari's paid details are valid only for its **whole January 1 to October 1, 2026 export**, presented under **All months**, and selecting Pocari on August left the Paid panel without data.
3. Pocari opened on Organic, although its supplied material covers **paid Meta**, not a verified organic post feed.
4. Existing source-labelled Souq daily account metrics appeared only lower inside Attention, with the other three sections correctly unavailable for missing post-level records.

## Implemented changes
- **Creative API options:** `brandYears` exposes actual selectable periods by brand. Pocari returns All months only; source-labelled Souq brands return real months with daily CSV rows. Brands with no verified files have only a clearly marked All months (no verified data) scope.
- **Brand selector:** exposes Souq Al Bahar and Souq Al Jubair, previously hidden. Retains the user-requested Souq Al Haraj and Souq Al Jubail entries, but does not misattribute another brand's records.
- **Selection behavior:** preserves an existing valid month when possible, or chooses a valid brand-specific period. Switching to Pocari chooses All months and opens Paid automatically; manually selecting its Paid tab also selects All months.
- **Visible account metrics:** source-backed Souq daily sums and daily average/peak-based metrics appear immediately below the brand summary, with platforms, observed days and periods disclosed. Account reach or viewer counts are never summed as a purported unique monthly audience.
- **Unknown brand identities:** Souq Al Haraj and Souq Al Jubail present a precise missing-source message. The provided CSV files are explicitly labelled **Souq Al Bahar** and **Souq Al Jubair** (also spelled Juabir). Those names cannot safely be substituted for Haraj/Jubail without approved source-identity confirmation.
- **Regression coverage:** added a dependency-free source contract, isolated execution check of the actual `getCreativeOptions` function, and Vitest integration cases for all relevant brands.

## Available evidence
| Dropdown brand | Original source | What can appear now |
|---|---|---|
| Pocari Sweat | `creative/pocari-sweat/buffer-posts-analytics-csv/posts-20260101-to-20261001.csv` and supporting paid CSVs | 5 paid Meta creative detail records and account summary (12 paid posts), only for All months export scope |
| Souq Al Bahar | `creative/souqs/SOUQ Al Jubair and Bahar/SAB*` and `Souq Al Bahar*` CSVs | Daily account metrics for recorded 2026 dates, not per-post ranking |
| Souq Al Jubair | `creative/souqs/SOUQ Al Jubair and Bahar/Souq Al Jubair*` and `Souq Al Juabir*` CSVs | Daily Facebook account metrics for recorded 2026 dates, not per-post ranking |
| Souq Al Haraj | No filename or approved mapping with that brand name | Honest awaiting state, no metrics assigned |
| Souq Al Jubail | No filename or approved mapping with that brand name | Honest awaiting state, no metrics assigned |

The unverified Haraj/Jubail identities must be settled by the data owner. Provide separate exact-brand exports, or a signed brand ID crosswalk before any reuse of similarly named source data.

## Verification
- `npm run verify:creative-brands`: passes the contract and executed backend options checks.
- `npm run verify:spreadsheets`: 19 original Excel files and 61 CSV files match their original SHA-256 checksums.
- `npm run verify:creative`, `npm run verify:media-creative`, `npm run verify:competition-visual`: pass source-level checks.
- 124 TS/TSX source and test files parse with zero syntax errors.
- `npm ci --offline` fails because `zod-4.6.5.tgz` is absent from the npm cache. **Full TypeScript compilation, Vitest execution, API/browser interaction and pixel-based UI testing were not verified**.

## Run after installing npm dependencies
```
npm ci
npm run verify:creative-brands
npm run test --workspace server
npm run build
npm run dev
```

Check `/creative?year=2026&month=0&brand=pocari-sweat` for Meta paid details. For account data, use `/creative?year=2026&month=8&brand=souq-al-jubair` and `/creative?year=2026&month=8&brand=souq-al-bahar`. Haraj and Jubail remain marked awaiting until identity-matched imports are supplied.

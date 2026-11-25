# Bizcom Engine: Spreadsheet and CSV Source Inventory

This directory contains the **unaltered original** source workbooks and CSV exports. The application remains the same Express/React npm-workspace project. No Docker or database migration was introduced by this reorganization.

## Categories

| Category | Excel files | CSV files | Location |
|---|---:|---:|---|
| Media | 6 | 0 | `media/` |
| Creative | 3 | 61 | `creative/` |
| Consumer | 4 | 0 | `consumer/` |
| Competition | 3 | 0 | `competition/` |
| Search / AI Search | 1 | 0 | `search/` |
| Highlights / TBL | 2 | 0 | `highlights/` |
| **Total** | **19** | **61** | **80 source files** |

The data is grouped by dashboard category and then by client. Source files are not renamed or changed. Older alternate copies are retained under `archived-imports/` and are not used as live imports.

## Directory layout

```text
spreadsheets data/
  media/
    rivoli/                    (six brand/spend/site workbooks)
    union-coop/                (awaiting approved burst/media sources)
  creative/
    union-coop/                (prepared Top 3 and Buffer exports)
      archived-imports/       (historical alternate copies)
    pocari-sweat/              (post analytics exports)
    souqs/                     (Souq Al Bahar and Jubair exports)
  consumer/
    rivoli/                    (consumer, cohort, segmentation)
      archived-imports/       (alternate copy)
    union-coop/                (awaiting comment-type export)
  competition/
    rivoli/                    (EDIT Meta October/November + Google)
    union-coop/                (awaiting Carrefour and LuLu captures)
  search/
    union-coop/                (CLEO market import)
  highlights/
    tbl/                       (TBL Reads originals; approval not assumed)
```

## Excel workbook inventory

### Media

- `media/rivoli/Rivoli Shop Segmentation with reconciled campaigns .xlsx`
- `media/rivoli/Rivoli Shop. Brand Segmentation 16.09.xlsx`
- `media/rivoli/Rivoli-Brand-Plot-MODULE2-Jan-Sep-2026.xlsx`
- `media/rivoli/Rivoli-Google-Brand-Spend-Jan-Sep-2026.xlsx`
- `media/rivoli/Rivoli-Meta-Brand-Spend-Jan-Sep-2026.xlsx`
- `media/rivoli/Rivoli-Organic-Brand-Demand-Jan-Sep-2026.xlsx`

### Creative

- `creative/union-coop/UnionCoop-Creative-WhyItWorked-Import.xlsx`
- `creative/union-coop/archived-imports/UnionCoop-Creative-WhyItWorked-Import (2).xlsx` (archived alternate copy)
- `creative/union-coop/archived-imports/from-root/UnionCoop-Creative-WhyItWorked-Import.xlsx` (archived alternate copy)

### Consumer

- `consumer/rivoli/Rivoli-Consumer-Cohorts-Jan-Sep-2026.xlsx`
- `consumer/rivoli/Rivoli-Consumer-Import.xlsx`
- `consumer/rivoli/Rivoli-Consumer-Segment-Cut-Jan-Sep16-2026.xlsx`
- `consumer/rivoli/archived-imports/Rivoli-Consumer-Import (1).xlsx` (archived alternate copy)

### Competition

- `competition/rivoli/Competition-Capture-EDIT-Byedit-01-Oct-2026.xlsx`
- `competition/rivoli/EDIT-AdLibrary-Capture2-03Nov2026.xlsx`
- `competition/rivoli/EDIT-Google-Capture1-18Nov2026.xlsx`

### Search / AI Search

- `search/union-coop/UnionCoop-CLEO-Market-Import.xlsx`

### Highlights / TBL

- `highlights/tbl/TBL-Reads-Import-Template-and-First-Fill (1).xlsx`
- `highlights/tbl/TBL-Reads-Import.xlsx`

## CSV exports

All **61 CSV exports** are in Creative, grouped by the Union Coop Buffer exports, Pocari Sweat post analytics, and Souq Al Bahar/Jubair datasets. Each original CSV path is preserved below its client folder except for the category/client prefix.

For every individual file moved, use `docs/SPREADSHEET_FILE_MAPPING.json` (old relative path to new relative path) or `docs/SPREADSHEET_SOURCE_MANIFEST.json` (including SHA-256).

## Missing approved sources: where to add them

| Required source | Place under | Status |
|---|---|---|
| `Rivoli-Consumer-GA4-Import-v4.xlsx` | `media/rivoli/` | Missing |
| `UnionCoop-Media-Burst-Import.xlsx` | `media/union-coop/` | Missing |
| Union Coop October verified five-channel workbook | `creative/union-coop/` | Missing; filename not yet established |
| `Competition-Capture-UnionCoop-Carrefour-LuLu-01-Oct-2026.xlsx` | `competition/union-coop/` | Missing |
| `Competition-Capture-UnionCoop-Carrefour-LuLu-18-Nov-2026.xlsx` | `competition/union-coop/` | Missing |
| Union Coop monthly comment-type export | `consumer/union-coop/` | Missing; filename not yet established |
| Explicitly signed Highlights workbook | `highlights/tbl/` | Missing approved version; historical Reads workbooks exist |

**Note:** The approved Carrefour/LuLu gallery ZIP is also missing; it is an image asset archive, not a spreadsheet. Existing EDIT thumbnails remain in `server/data/competition-assets/`.

## Compatibility and validation

Runtime source path resolution was updated in Media, Creative, Consumer, Competition, AI Search/CLEO, and Highlights. Source-validation scripts and tests were also updated. The existing `npm run dev` workflow is unchanged.

Run `npm run verify:spreadsheets` at the project root to check the integrity manifest and expected file locations.

## 24 November delivered imports

Additional active sources are now present: Rivoli `media/rivoli/Rivoli-Consumer-GA4-Import-v4.xlsx`; Union Coop `competition/union-coop/Competition-Capture-UnionCoop-Carrefour-LuLu-01-Oct-2026.xlsx` and `...-18-Nov-2026.xlsx`; `highlights/tbl/TBL-Reads-Import-Template-and-First-Fill.xlsx`; and the approved EDIT thumbnail archive in `competition/rivoli/`. The Union Coop prepared Creative workbook was deliberately updated from the supplied 24 Nov copy. Existing CSV files and other original sources are preserved. Refer to `docs/NOV24_ALL_IMPORTS_INTEGRATION.md` for the actual data coverage and remaining missing inputs.

# Bizcom Engine: 24 November 2026 approved import integration

## Source and scope

Baseline: `Bizcom-Engine-Nov24-Creative-Brands-Fixed-Full.zip`.
New data: `Bizcom-Engine-Imports-All-24Nov2026.zip` (eight files).
Reference: `Bizcom-Engine-Changes-Simple-18-Nov-2026(1).pdf`.

The existing React/Vite, Express/TypeScript, npm-workspace and spreadsheet-source directory structure is preserved. No Docker setup or MongoDB migration has been added.

## Integrated source locations

| Source | Category | Application use |
|---|---|---|
| Rivoli-Consumer-GA4-Import-v4.xlsx | `spreadsheets data/media/rivoli/` | Media GA4 summaries, Sep/Oct channel revenue and first-time purchasers, yearly chart periods |
| TBL-Reads-Import-Template-and-First-Fill.xlsx | `spreadsheets data/highlights/tbl/` | Authored TBL read rows, gated by explicit signed status |
| UnionCoop-Creative-WhyItWorked-Import.xlsx | `spreadsheets data/creative/union-coop/` | Prepared Union Coop Creative metrics and Top 3; the new approved upload replaces the previous active workbook |
| EDIT-AdLibrary-Capture2-03Nov2026.xlsx | `spreadsheets data/competition/rivoli/` | EDIT Meta 3 Nov capture |
| EDIT-Capture2-Thumbnails.zip | `spreadsheets data/competition/rivoli/` | Approved thumbnail archive; all 15 existing served images match its payloads byte for byte |
| EDIT-Google-Capture1-18Nov2026.xlsx | `spreadsheets data/competition/rivoli/` | EDIT Google logged sample; population count separately sourced |
| Competition-Capture-UnionCoop-Carrefour-LuLu-01-Oct-2026.xlsx | `spreadsheets data/competition/union-coop/` | Union Coop competition baseline, both competitors |
| Competition-Capture-UnionCoop-Carrefour-LuLu-18-Nov-2026.xlsx | `spreadsheets data/competition/union-coop/` | Union Coop new competitor registers, side-by-side theme mixes, delta sheet and unsigned draft highlights |

## Verified values from the actual workbook data

### Rivoli GA4 v4

| Month | GA4 net revenue | First-time purchasers | Channels | Unassigned net revenue | Channel sum - summary |
|---|---:|---:|---:|---:|---:|
| September 2026 | AED 1,863,332 | 1,060 | 17 | AED -202,434 | AED +1 |
| October 2026 | AED 3,026,634 | 1,712 | 17 | AED -237,851 | AED +1 |

The channel sheets' integer totals are AED 1 greater than the summary in both months, despite the workbook README claiming exact reconciliation. The importer explicitly permits at most AED 1. This is documented rather than silently calling the figures identical.

Negative Unassigned revenue is retained and labelled as including unattributed refunds. GA4 net revenue remains distinct from item-revenue and advertising platform claims. First-time purchasers are sourced only from the monthly GA4 summary. A true repeat purchase rate still needs a monthly-level purchaser export.

### Union Coop Meta captures

| Capture | Carrefour logged rows | Carrefour readable IDs | LuLu logged rows | LuLu readable IDs |
|---|---:|---:|---:|---:|
| 1 Oct 2026 | 30 | 29 | 24 | 24 |
| 18 Nov 2026 | 57 | 56 | 54 | 39 |

On 18 Nov, one Carrefour row and 15 LuLu rows have no readable Library ID. They are included in observed ad counts but not in cross-capture identity matching. The workbook's delta sheet lists 56 new *readable* Carrefour IDs and 39 new *readable* LuLu IDs. Its two adjacent Theme Mix tables are now read independently for each competitor. No missing IDs are invented as real IDs; synthetic identifiers are used only internally to keep the rows distinct.

## Editorial and image restrictions

- **Draft Highlights:** the supplied TBL Reads workbook has no explicit `Signed` or `Approved` field. It contains editorial text but it is not published until signed data is delivered. The Carrefour/LuLu November Draft Highlights sheet also has no Signed column, and its contents remain hidden.
- **Union Coop competitor wall:** neither an approved Carrefour/LuLu gallery ZIP nor a workbook Gallery tab is included. The UI continues to show a thin awaiting line rather than invented thumbnails.
- **Creative Top 3:** the prepared Union Coop workbook has all five expected sheets, including `Creative Cuts (import)`. Unsigned prose is not invented or displayed.
- **EDIT gallery:** all 15 provided thumbnails match the 15 previously served images.

## Not in the new ZIP

- Union Coop October verified five-channel Creative workbook.
- Union Coop Media Burst Register and daily paid/organic reach workbook.
- Union Coop monthly comment-type export.
- Approved per-section signed Highlights v2 / sign-off field.
- Approved Carrefour/LuLu gallery image ZIP.
- Approved campaign objective and creative thumbnail mappings for Rivoli.
- Source exports that explicitly identify **Souq Al Haraj** or **Souq Al Jubail**. Available sources identify **Souq Al Bahar** and **Souq Al Jubair**; these are not interchangeable names.

## Executed verification

- Incoming ZIP: eight files extracted safely and categorized.
- Artifact-tool inspection: GA4 17+17 channel rows and Sep/Oct summary values; four Union Coop capture registers; TBL sign-off field absence; five Creative workbook sheets.
- All 15 EDIT approved thumbnail files: checksum match against existing served PNGs.
- `npm run verify:creative`: passed.
- `npm run verify:media-creative`: passed (14 source checks).
- `npm run verify:competition-visual`: passed (13 source checks).
- `npm run verify:creative-brands`: passed.
- `npm run verify:spreadsheets`: passed (79 historic files unchanged, one newly supplied Creative workbook intentionally replacing the live copy).
- `npm run verify:nov24-imports`: passed (8 imported files retained).
- TypeScript/TSX: syntax parsing passed; CSS syntax checked.
- Full TypeScript semantic compilation, Vitest execution, and full React browser regressions: **not verified**; npm offline installation fails because `zod-4.6.5.tgz` is not in the package cache.

## Local run

```bash
npm ci
npm run verify:nov24-imports
npm run verify:spreadsheets
npm run test --workspace server
npm run build
npm run dev
```

Check `/media?year=2026&month=10`, select Union Coop competition and the 18 Nov capture, and verify Google/Meta capture selection for Rivoli. The 18 Nov Union Coop capture is independent of the selected own-media reporting month.

A full application test and production certification still require a successful dependency install and browser/API validation.

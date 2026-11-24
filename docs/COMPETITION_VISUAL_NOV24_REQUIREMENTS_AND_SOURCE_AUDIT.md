# Bizcom Engine: Competition, Visual Refresh and Source Inventory

Date: 24 November 2026

## Baseline and architecture

- Baseline: `Bizcom-Engine-Nov24-Media-Creative-Structure-Preserved-Full.zip` (the latest source-preserved Media + Creative project).
- Root npm workspaces remain `client` (React/Vite) and `server` (Express/TypeScript).
- Existing spreadsheet-backed import/service structure is preserved. No new database, Docker, containers or workspace migration.
- Source files are placed under `spreadsheets data/compititaion-tab` (existing spelling) and competition images are served from `server/data/competition-assets`.

## Section 5: Competition requirements, in source-document sequence

| Item | Status | Implementation / caveat |
|---|---|---|
| UC Carrefour & LuLu Oct 1 baseline + Nov 18 workbook | **Blocked by inputs** | Both exact workbooks are absent. The V2 importer now recognizes per-competitor Register sheets and routes them to the full v2 parser rather than the legacy parser. Historical dates remain distinct. |
| UC deltas, theme mixes, capture comparisons | **Import path implemented; unpopulated** | The importer reads separate competitor registers, signed highlights, theme totals and competitor-specific delta rows. Only imported values are displayed. No 57/54 counts are hardcoded. |
| UC draft Highlights only once TBL signs | **Implemented** | `Signed=yes/signed/approved/true/1` is required, alongside the matching brand. All other sentences are excluded. |
| UC gallery images | **Import path implemented; awaiting data** | The v2 parser uses workbook Library ID and filename joins; it can extract only those exact approved filenames from a sibling TBL gallery ZIP. Without assets, Media and Creative Competition show a thin amber line; no mock gallery is generated. |
| Rivoli EDIT Meta Nov 3 capture | **Present and validated** | 68 unique IDs, 36 marked new launches, 15 images with matching library IDs. Previous October capture remains in the picker. |
| Rivoli EDIT Google Nov 18 capture | **Present and integrated** | 30 logged creatives (11 Search, 5 Local/Maps, 7 Shopping, 7 Display) and a separate source-reported ~200 population. Individual Google IDs and exact start dates stay marked uncaptured where absent. |
| Channel chip on every Competition card | **Implemented in source** | Meta gold / Google navy provenance chips added to KPI, format, gallery, Creative context and detail cards. This color denotes source, not ad performance. |
| Compare-against separated from reporting filters | **Implemented in source** | Separate control with divider and off label `Off - own performance`. |
| Dark persistent Competitor View strip | **Implemented in source** | Moved to the top of the panel and kept sticky, stating competitor, provider, and `activity, not spend`. |

## Section 6: Visual reference

| Rule | Status | Evidence / limitation |
|---|---|---|
| One prominent serif signed highlight per tab | **Partial** | Existing signed TBL Reads hero style retained. Missing approval prevents display; the engine does not generate editorial text. |
| No stock or invented imagery | **Implemented for competition** | Only workbook-approved ad thumbnails are served. Missing images use neutral unavailable states. Other source imports retain their existing media mappings. |
| Missing data is one thin amber line | **Improved; partial across all heads** | Missing competition captures and galleries now use compact amber lines. Other legacy module states may still require separate UI review. |
| Green/red for deltas, Google navy and Meta gold | **Improved; source-level** | Neutralized additional legacy decorative CSS and introduced explicit platform source chips. Not a full page-by-page pixel validation. |
| Warning chips on cards | **Partially implemented** | Union Coop `PAID CONFIRMED` labels appear only for approved daily reach flags. Unsupplied `DELIVERY PENDING` is not invented. |
| One-time numeric/chart motion; hover raw rate counts | **Partial** | Existing 300ms reduced-motion-aware CountUp component applied to additional Competition KPIs. Existing source counts are shown next to many theme percentages. Full chart animation/hover testing still required. |
| One theme across tabs | **Improved; not browser-verified** | Shared paper/ink/grey tokens, neutral surfaces, no fake imagery. Legacy components may still need detailed visual review. |

## Section 7: File shopping list

| Dataset | Expected filename | Status in this archive | Expected destination |
|---|---|---|---|
| Rivoli GA4 v4 | `Rivoli-Consumer-GA4-Import-v4.xlsx` | Not supplied | Rivoli Media / GA4 |
| TBL Reads / initial Highlights | `TBL-Reads-Import-Template-and-First-Fill.xlsx` | Similar/older variants present; signed approvals unverified | All Highlights |
| Union Coop Creative notes | `UnionCoop-Creative-WhyItWorked-Import.xlsx` | Present | Union Coop Creative |
| EDIT Meta Capture 2 | `EDIT-AdLibrary-Capture2-03Nov2026.xlsx` | Present | Rivoli Competition Meta |
| UC Carrefour/LuLu baseline | `Competition-Capture-UnionCoop-Carrefour-LuLu-01-Oct-2026.xlsx` | Not supplied | Union Coop Competition Oct |
| UC Carrefour/LuLu new capture | `Competition-Capture-UnionCoop-Carrefour-LuLu-18-Nov-2026.xlsx` | Not supplied | Union Coop Competition Nov |
| EDIT Google sample | `EDIT-Google-Capture1-18Nov2026.xlsx` | Present | Rivoli Competition Google |
| UC October verified (five channels) | Filename not yet specified by TBL | Not supplied; final filename not specified | UC Creative October |
| UC Burst Register | Filename not yet specified by TBL | Not supplied; final filename not specified | UC Media |
| UC Consumer comment types | Filename not yet specified by TBL | Not supplied; final filename not specified | UC Consumer |
| Highlights v2 per section | Filename not yet specified by TBL | Not supplied; final filename not specified | All Highlights |
| EDIT Capture 2 thumbnail assets | TBL `EDIT-Capture2-Thumbnails.zip` or already-extracted images | Present (15 PNGs) | Rivoli Meta gallery |
| Carrefour + LuLu approved gallery ZIP | TBL archive, filename to be confirmed | Not supplied | UC Competition wall |

**Do not assume differently named workbooks are the approved replacement.** October verified Creative, GA4 v4, UC Burst, signed Highlights v2, and UC gallery data are still required for full Section 7 compliance.

## How to add a monthly UC capture

1. Place the official `Competition-Capture-UnionCoop-Carrefour-LuLu-01-Oct-2026.xlsx` and `Competition-Capture-UnionCoop-Carrefour-LuLu-18-Nov-2026.xlsx` in `spreadsheets data/compititaion-tab`.
2. If TBL provides a gallery ZIP, put it beside the relevant workbook. The workbook Gallery sheet must map each approved Library ID to an exact image basename. A gallery ZIP containing a date in its name is used only for the matching capture date.
3. Mark approved Draft Highlights with an explicit signed flag. Unsigned highlights remain invisible.
4. Restart the API after changing source files, because Competition caches the parsed source dataset per process.
5. Use the Media page, select client Union Coop and Compare against Carrefour or LuLu. Use Capture to select a historical date. The source and capture date must be printed above every panel.

## Testing actually carried out

- `npm run verify:creative` passed.
- `npm run verify:media-creative` passed (14 checks).
- `npm run verify:competition-visual` passed (13 source checks).
- `python tools/validate_edit_capture2.py` passed: 68 unique ads and 15 matched images.
- TypeScript/TSX source parsing and CSS syntax parsing performed separately. These **are not a substitute** for `tsc`, Vitest, or browser regression testing.
- Full TypeScript build and live React browser testing remain unverified because the supplied baseline contains empty `node_modules` placeholders and the required npm dependencies are absent from the local package cache.

## Local commands (no Docker)

```sh
npm ci
npm run verify:creative
npm run verify:media-creative
npm run build
npm run test
npm run dev
```

The original application may depend on its already configured database/service environment. This update does not introduce any new infrastructure.

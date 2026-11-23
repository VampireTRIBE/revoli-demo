# Bizcom Engine V2: November 23 implementation and accuracy review

## Baseline and scope

Baseline: `Bizcom-Engine-V2-Creative-Fixed-Four-PDF-Audited.zip` from the preceding project iteration. The four November 18 specification PDFs remain bundled in the full archive. The newly supplied `EDIT-Google-Capture1-18Nov2026.xlsx`, duplicate EDIT Capture 2 workbook, and thumbnail ZIP were inspected. The Google file is now included in the source-data folder; the supplied Meta workbook matched the already archived workbook byte-for-byte. The 15 supplied PNG filenames already existed in the project and were retained, not duplicated.

**This is not a production certification.** Source syntax and selected data-contract checks pass. The actual React application build, server integration tests, and browser-level interaction tests are not complete because npm dependencies could not be installed in this environment.

## Code modifications

1. **Competition Google import:** `EDIT-Google-Capture1-18Nov2026.xlsx` placed under `spreadsheets data/compititaion-tab/`, preserving the intentionally misspelled existing folder. The version-aware capture parser now reads the Google Read Me statement that the Transparency Center reports approximately 200 ads, without misrepresenting this as the 30 logged creatives.
2. **Google 30-record sample:** Observed Google records no longer disappear because they lack Meta's `Active` status. The parser reads Creative/copy text and Screenshot/Shot reference. Google per-ad start dates and Library IDs stay explicitly uncaptured. No ad longevity or new-launch timeline is invented.
3. **Google format categories:** Strict source-supported mapping provides Search 11, Local/Maps 5, Shopping 7, Display 7. The new Competition cards show all four, and display verified payer entities counted only within the 30 sampled records. Google population and sample remain distinct throughout the UI.
4. **Google register:** Search now includes creative copy, payer and capture reference. Full-register table adds verified payer, creative/copy, capture reference and destination. The Meta register/dialog and 15-photo gallery remain available.
5. **Google source honesty:** When Google capture thumbnails are absent, one slim AWAITING line appears. Missing start dates do not render fake launch waves. Draft Google Highlights without explicit sign-off remain hidden.
6. **Campaign objectives:** The Media parser now only accepts `Objective` values `Conversion`, `Traffic`, or `Awareness` from an explicit workbook field. The backend stores it and the frontend ranks only same-objective campaigns. Existing source workbooks lack the approved field, so their campaigns remain `Not supplied` and the objective rankings remain unavailable. The former keyword-based objective inference has been removed.
7. **Media CAC correction:** The former headline called platform-claimed cost per conversion `Blended customer acquisition cost`. This was misleading. The UI now labels that source measure correctly, labels site AOV separately, and shows *blended new-customer CAC* as n/a until approved first-time purchaser data exists. This is a necessary data-integrity correction, not a new calculation.
8. **Client header:** The shared header follows the selected Rivoli/Union Coop client in Media and Consumer, and handles both approved Souq identifiers in Creative.
9. **Highlights:** The repeated pending Highlights strip inside Competition is removed. Approved capture highlights still render only with explicit sign-off. The existing generic TBL Reads workbook lacks a Signed/Approved column, so its texts are not silently published.
10. **KPI presentation:** A source-preserving one-time approximately 300 ms numeric display animation is applied to selected Media and Creative cards and respects reduced-motion settings. Shared SparkBars now preserve missing-month positions instead of collapsing them. Other KPI cards and full-UI animation parity remain partial.
11. **Tests:** A Vitest test covers the real Google workbook, reported count versus sample, format breakdown, no invented dates, no unsigned Highlights, and Google/Meta channel isolation. Its execution requires npm dependencies; it has not passed in this environment.

## Data validation: November 18 EDIT Google import

- Capture date: 2026-11-18.
- Registered sample creatives: **30**.
- Reported source population: **approximately 200**, as stated by Google in the workbook Read Me; not a count produced by the local register.
- Logged format groups: **Search 11, Local/Maps 5, Shopping 7, Display 7**.
- Verified payer rows: **28 Ahmed Seddiqi & Sons L.L.C, 1 Amnet MENA FZ-LLC, 1 ETHINOS DIGITAL MARKETING**.
- The workbook has no per-ad Library IDs and no per-ad start dates. No active-status or launch-longevity inference is permitted.
- The `Draft Highlights` worksheet has no Signed flag. Zero Google highlights may be published without separate approval.

## Data validation: EDIT Meta capture

- November 3, 2026 register has **68 distinct Meta Library IDs**.
- Gallery has **15** records, all IDs resolve to registered ads and all 15 imported PNG files are present.
- Row distribution: **4, 4, 4, 3**.
- The supplied duplicate capture and current project copy have matching SHA-256 contents and the archive preserves one canonical file.

## Outstanding input dependencies

The following November 18 requirements cannot be truthfully completed with the inputs currently available:

- `Rivoli-Consumer-GA4-Import-v4.xlsx`: September/October new-customer revenue and 17 channels.
- Approved Media Google/Meta September and October spend exports for both Meta accounts, including Hour Choice.
- `Competition-Capture-UnionCoop-Carrefour-LuLu-01-Oct-2026.xlsx` and November 18 capture.
- Approved Carrefour/LuLu gallery ZIP.
- Union Coop October verified five-channel Creative import.
- Union Coop media Burst Register and site analytics.
- Per-section signed Highlights v2 import.
- Union Coop monthly customer comment-type export.
- Approved campaign Objective fields and thumbnail mapping.
- Other approved Creative Top 3 thumbnails and Souqs v2 import.

Absent sources are represented as unavailable/awaiting, not copied from specification mockups. The four PDF design references describe ideal UI and some example figures but do not themselves verify those figures.

## Change control

The separate detailed requirement matrix is in `docs/BIZCOM_NOV23_REQUIREMENT_STATUS.md`. New uploads can be copied into their existing `spreadsheets data/` tab folders; source parsers should be retested after import and cache invalidation. `server/data/competition-assets/` stores imported gallery images. The app never scrapes competitor ads or generates editorial text.

## Run and test

```bash
npm ci
npm run verify:creative
npm test
npm run lint
npm run build
npm run dev
```

The uploaded project keeps `client` and `server` npm workspaces. In this environment `npm ci --offline` failed with `ENOTCACHED` for `zod-4.6.5.tgz`; Vitest and ESLint cannot be run without dependencies. Source syntax checks are **not** a substitute for the full build.

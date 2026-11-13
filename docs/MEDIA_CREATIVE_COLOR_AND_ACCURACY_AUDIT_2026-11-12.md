# Bizcom Engine: Media Palette and Source Accuracy Audit

Date: 12 November 2026  
Baseline: `Bizcom-Engine-Creative-Media-Capture2-Updated.zip`  
Deliverable: `Bizcom-Engine-Creative-Media-Audited.zip`

## 1. Release verdict

**This project is NOT certified as completely accurate or production ready.** The supplied EDIT Capture 2 workbook and gallery asset mappings pass independent source-data checks. However, the requested September/October GA4 v4 and complete advertising exports, the Souqs v2 import, and approved editorial materials remain unavailable. The app cannot be fully compiled or browser-tested in this environment because npm dependencies are not cached.

A correct imported count does not prove that all metrics across the dashboard, or its browser interactions, work at runtime.

## 2. Visual changes actually applied

- Added `client/src/styles/media-palette.css`, loaded last in `client/src/main.tsx`.
- Media page and its global header are now scoped to the same palette used by Creative: background `#f4f5f3`, paper/white cards `#ffffff`, primary text `#222927`, subdued labels `#5f6b66`, borders `#d8dedb`, graphite selection `#303d37`.
- Removed blue/teal styling on **Media dashboard** nav states, hover states, KPIs, filters, buttons, table headers, competitor capture panel, competition cards, charts' decorative UI bars, and the EDIT wall. Existing intentional data colors remain possible: green `#246f51`, red `#ad4146`, amber `#906318`.
- Applied the same neutral style to the 15-thumbnail competition wall, full register, and mobile controls.
- Scope is `:has(.reference-media-page)` / `.reference-media-page`, so the Creative, GEO, Consumer and Media Import pages are not intentionally restyled.
- Source badges now say **PARTIAL SOURCE COVERAGE**, instead of potentially implying all requested inputs have been verified.

These are code/CSS changes. A full real-application visual regression was **not** performed.

## 3. Accuracy correction actually made

`client/src/features/media/components/MediaConsumerAlignment.tsx` previously called the current `overview.metrics.siteRevenue` value **Net site revenue** and attributed it to the **Consumer/GA4 import**. This was misleading: the backend reads `Item revenue (AED)` from the reconciled **Media site** workbook (`server/src/modules/media/import/source-parser.ts`), whereas the official Media change document expects *net GA4 revenue* from a separate GA4 v4 workbook that has **not** been supplied.

The card now reads **Reported site item revenue · selected period** and its supporting line explains **Reconciled site import, not GA4 net revenue; GA4 v4 pending**. The underlying numeric value was not modified. Replacing this with GA4 net revenue still requires the approved GA4 v4 workbook and backend integration.

## 4. Independent Capture 2 workbook audit

Audit source: `spreadsheets data/compititaion-tab/EDIT-AdLibrary-Capture2-03Nov2026.xlsx` and the actual 15 PNG files in `server/data/competition-assets/edit-by-ahmed-seddiqi/2026-11-03/`.

| Check | Result |
|---|---|
| Registered active Library IDs | 68; all unique |
| Records flagged new since 1 October | 36 |
| Active ads in original October capture | 37 (document and preexisting source/tests) |
| Net active-ad difference (68 minus 37) | +31; **not** the same as the 36 starts |
| Age groups (0-30, 31-90, >90 days) | 36 / 20 / 12 |
| Average registered-ad age | 39.897 days, displayed as 39.9 |
| Maximum registered-ad age | 168 days |
| Campaign platform `Own Your Moment / moments` | 15 ads |
| New launch dates | 27 Oct: 6; 28 Oct: 4; 30 Oct: 15; 2 Nov: 11 |
| Gallery image entries | 15 |
| Gallery layout | Rows 1-4 contain 4 / 4 / 4 / 3 entries |
| Gallery Library ID joins | All 15 refer to registered ads |
| Gallery PNG existence | All 15 supplied files present |

The project validation script `python tools/validate_edit_capture2.py` passed these checks; an independent workbook inspection corroborated the summary. The screenshots are **selected ads**, not the best-performing ads. Meta Ad Library does not provide performance or spend for these competitors.

## 5. What is not yet verifiable or complete

| Area | Reason |
|---|---|
| Media Slot 1 GA4 net revenue | `Rivoli-Consumer-GA4-Import-v4.xlsx` missing. Current card is the separately labeled, older site item-revenue figure. |
| Media Slot 2 September/October CAC and platform CTR coverage | Google and Meta exports from both Meta accounts not supplied; reconciliation remains open. |
| Media Slot 3 17-channel September/October data | GA4 v4 Channel Revenue worksheet missing. Correct output is AWAITING, not a fabricated breakdown. |
| Media Slot 4 signed TBL verdict | No approved Highlights for the relevant reporting periods; only mechanical, caveated campaign rankings. |
| Capture 2 approved November Highlights | Its workbook has **Draft Highlights (sign-off)**, not approved import bullets; pending state is correct. |
| Union Coop Stories share and ranked-post thumbnails | Complete approved output split and top-three thumbnail pack absent. |
| Souq Al Haraj / Al Jubail post-level records | `Souqs-Creative-Import.xlsx` v2 missing; older Bahar/Jubair records cannot be repurposed. |
| Media and Competition interactive behavior | No full browser/end-to-end regression executed in this environment. |
| Overall compilation, type checking and lint | `npm ci --offline` failed (`ENOTCACHED` for `zod@4.6.5`), preventing project dependency resolution. |

## 6. Executed validation (distinguish levels)

- **PASS**: independent source inspection of Capture 2 workbook values and record IDs.
- **PASS**: `python tools/validate_edit_capture2.py` checks 68 ads / 36 starts / 15 tags / 15 image mappings.
- **PASS**: TypeScript/TSX **parse/syntax** validation, 110 source/test files using the globally available TypeScript parser. This is *not* semantic TypeScript type checking.
- **PASS**: CSS syntax and declaration validation of `media-palette.css` using a CSS parser.
- **PASS**: source text search finds no displayed old `TBL reads this period` / `Biggest mover: Blended CTR` / `Blended CTR` strings in TS/TSX files.
- **BLOCKED**: `npm ci --offline --ignore-scripts` failed because required npm tarballs are not cached, including `zod-4.6.5.tgz`.
- **BLOCKED**: full TypeScript build, lint, API tests and React/Vite browser execution. Missing dependency types cause the compiler to fail before meaningful semantic validation.
- **NOT EXECUTED**: visual screenshot comparison of the running application and complete responsive/device testing.

## 7. Earlier 41-marker status

The preceding delivery documented 41 markers as **23 source-complete / 13 partial / 5 blocked**. That is a **source progress record**, not an independently certified completion count. The present audit checks concrete source figures, presentation hazards, and syntax; it does **not** upgrade the 41 markers to all complete. The original checklist remains in `docs/CREATIVE_MEDIA_CAPTURE2_IMPLEMENTATION.md`.

## 8. How to verify the application locally

From the project root with npm registry connectivity:

```bash
npm ci
npm run lint
npm test
npm run build
npm run dev
```

Visit `/media`, choose EDIT by Ahmed Seddiqi, and select the **3 Nov 2026** competition capture. Compare October 37 versus November 68, 36 starts, and the 15-image wall. Also check Media `/creative`, `/geo` and `/consumer` to rule out regressions. Ensure imported missing values are shown as `n/a` or AWAITING rather than unsupported zeroes.

**Deployment gate:** resolve missing imports, finish runtime/type/browser tests, reconcile both Meta accounts, and obtain TBL approvals before describing this build as completely accurate.

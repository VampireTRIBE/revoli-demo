# Bizcom Engine V2: four-PDF requirement verification and Creative repair

**Audit date:** 19 November 2026  
**Baseline:** `Bizcom-Engine-V2-Full-Updated.zip` from the preceding delivery.  
**Sources reviewed:** `Bizcom-Engine-Changes-Simple-18-Nov-2026.pdf`, `Bizcom Engine Visual Refresh.pdf`, `Competition-Capture-Import-Spec-v2.pdf`, and `Competition — how the capture data renders.pdf`.

**Interpretation:** "Implemented (source)" means the relevant source code exists and its syntax or independent data source can be checked; it does **not** mean successful browser execution. "Partial" means only some aspects are implemented, or full verification needs additional imports. "Blocked" means a required approved input or a running project environment is unavailable. No complete-production-pass is claimed.

## Confirmed Creative crash and fixes

1. **Runtime ReferenceError fixed.** `client/src/pages/CreativeDashboardPage.tsx` declared `CreativeSlot({ number, title, subtitle, children })` but referenced `client`, `year`, and `month`. Those variables were not bound in its function scope and would throw as soon as an organic Creative slot rendered. The component now extracts all seven required props and forwards the source period to `SectionAnatomy`.
2. **Error-state ordering fixed.** The old `dashboard.isLoading || !dashboard.data` branch swallowed API errors when data was absent and rendered "Loading" indefinitely. Errors now take precedence, with an accessible alert.
3. **Creative error boundary added.** An unexpected future rendering error now surfaces a recovery panel rather than a blank page. This is a fallback, not a substitute for fixing errors.
4. **Trend data range fixed.** Monthly charts now stop at the selected month, and explicitly represent missing months with `null` gaps. Previously they could show future selected-period points or connect missing months implicitly.
5. **Regressions added.** `client/src/pages/CreativeDashboardPage.test.tsx` checks render behavior with React Query; `scripts/verify_creative_render_contract.cjs` independently evaluates the transpiled Creative slot with mocked JSX runtime to catch the precise `ReferenceError` even without installing the full app.
6. **Competition source-integrity correction.** An unspecified V2 ad status is now reported as `(not captured)`, not an invented `Active`. Undocumented Google start dates are marked unavailable in Creative competition details and excluded from date filter options.

## Document 1: Bizcom-Engine-Changes-Simple-18-Nov-2026.pdf (pages 1-3)

| Requirement | Status | Verification and limitation |
|---|---|---|
| Media: GA4 v4 Sep/Oct charts and channel data | **Blocked** | Exact `Rivoli-Consumer-GA4-Import-v4.xlsx` not supplied; existing `Rivoli-Consumer-Import` is not equivalent. |
| Import signed TBL Highlights | **Partial** | `reads.service.ts` enforces explicit sign-off; approved complete coverage not verifiable from current inputs. |
| Media section label, question and definition | **Implemented (source)** | `MediaDashboardPage.tsx` uses the five explicit November 18 definitions. |
| Media signed line, historical deltas and eight bars on *every* KPI | **Partial** | Reusable `SectionAnatomy`, `DeltaLine`, `SparkBars` exist. Not every historical source/KPI supports them. |
| Remove "what to stop" and blended CTR | **Implemented (source)** | Revised Media headings and platform-specific rate definitions; review all old supporting notes during browser QA. |
| Campaign Objective column and objective-separated ranking | **Partial** | Objective-aware rows exist, but underlying exports lack approved objective/image fields for every campaign. |
| Campaign thumbnail and short name, full name on hover | **Partial** | Display name supported; approved creative thumbnail mapping incomplete. |
| Union Coop Media reference page | **Partial** | Four sections exist with awaiting states; approved burst register and analytics missing. |
| Union Coop prepared Why It Worked import | **Partial** | Workbook in `creative-tab`; monthly top-three numbers load, but signed analyst text and images are not supplied. |
| Rename "Engagement, honestly" to "Engagement" | **Implemented (source)** | `CreativeSlot` uses the new neutral label and exact question/definition. |
| Signed section highlights; single tab-level pending state | **Partial** | Signed-only query works; old generic pending states in some legacy areas remain. |
| Creative deltas and eight-period bars for each relevant large KPI | **Partial** | Present for selected sourced metrics, absent where historical pairs missing. |
| October UC verified five-channel Creative import | **Blocked** | Required approved October file not in repository. |
| Consumer uniform palette | **Partial** | Scoped neutral V2 CSS overrides, full browser visual QA outstanding. |
| UC comment categories under "What customers are saying" | **Partial** | Awaiting section exists; approved comment-type workbook absent. |
| Rivoli Consumer existing data kept | **Implemented (source)** | Existing Consumer view preserved; missing order-level export remains a blocker to repeat metrics. |
| Search replaces standalone GEO head | **Implemented (source)** | `/search?panel=ai` embeds existing GEO; `/geo` redirects; Classic search awaits source. |
| UC Carrefour/LuLu October and Nov capture history | **Blocked** | Neither verified version-specific workbook is in the source ZIP. |
| Signed-only UC competition analysis and supplier breakdown | **Partial** | V2 parser handles signed flags but cannot be validated on missing UC captures. |
| UC competitor wall | **Blocked** | Approved Carrefour/LuLu thumbnail ZIP not supplied. |
| EDIT Nov 3 Meta capture and 15-image wall | **Implemented, data verified** | 68 unique Ad Library IDs; all 15 image files match the gallery records. |
| EDIT Nov 18 Google channel | **Blocked** | `EDIT-Google-Capture1-18Nov2026.xlsx` absent; sample count must not be inferred from PDF. |
| Comparison as a separate source switch, dark strip | **Implemented (source)** | Competition toggle, channel chips and dark source badge exist. |
| One oversized signed hero per tab | **Partial** | Imported signed Highlights can become a hero. No unapproved text displayed; not every tab has one. |
| Thin amber awaiting states and source owners | **Partial** | Introduced across new V2 sections; some legacy unavailable cards persist. |
| Delta colors only; fixed platform-color semantics | **Partial** | V2 ink and delta tokens defined; existing charts need browser verification and selective cleanup. |
| Warning chips on KPI cards | **Partial** | Some warning chips exist, not uniformly adopted. |
| One-shot 300ms count-up/chart draw with reduced motion | **Blocked / not implemented** | Not introduced without browser/runtime verification. |

## Document 2: Bizcom Engine Visual Refresh.pdf (pages 1-7)

| Visual requirement | Status | Verification and limitation |
|---|---|---|
| Ink `#141413`, grey `#5A646E`, line `#E2E2DE`, paper `#F2F2EF`, card `#FFFFFF` | **Implemented (source)** | CSS variables set in `client/src/styles/bizcom-v2.css`. |
| Green `#1E8E5A`, red `#C2362B`, amber `#B45309` | **Implemented (source)** | Tokens present; verify remaining legacy styles visually. |
| IBM Plex Sans three-size text hierarchy and one serif hero | **Partial** | Style hierarchy and hero rule present, uniform font adoption incomplete. |
| White cards, hairlines, no decorative shadows or gradients | **Partial** | New V2 components match; legacy components have layered CSS overrides. |
| Flat chart grammar, no pie, dual-axis, unverified smoothing | **Partial** | Major updated panels comply; complete chart inventory not browser-verified. |
| Six-element section anatomy | **Partial** | Label, question, definition, signed text, delta, sparklines supported; not all data contexts populated. |
| Exact five Media/four Creative section headers | **Implemented (source)** | Defined in `Reporting.tsx`, Media and Creative pages; Creative runtime crash repaired. |
| Data-depth/unscored/source labels | **Partial** | Displayed in major areas; exact context varies by source. |
| Gallery as primary imagery; approved sources only | **Partial** | EDIT wall source verified; Creative Top 3 image package still missing. |
| Compare against separated from filters, dark competitor strip | **Implemented (source)** | Control and source badge present; visual/browser verification outstanding. |
| Media campaign thumbnails/objective cards | **Partial** | Objective segmentation exists; approved campaign media missing. |
| UC Media and UC Creative October example values | **Blocked for data** | PDF contains design mock numbers; source workbooks necessary before publication. |
| Count-up once and chart draw once, accessible motion | **Blocked / not implemented** | Requires real browser validation and implementation. |

## Document 3: Competition-Capture-Import-Spec-v2.pdf (pages 1-2)

| Contract requirement | Status | Verification and limitation |
|---|---|---|
| Monthly import, retain capture history | **Partial** | Existing EDIT 1 Oct / 3 Nov supported; UC 18 Nov/EDIT Google files absent. |
| One workbook with per-competitor registers | **Partial** | `capture-v2-parser.ts` recognizes per-competitor register sheets; real V2 UC files absent. |
| Delta sheet: new/survivors/not observed, never "stopped" | **Partial** | Preserves new counts when imported; complete delta register semantics not implemented for every schema. |
| Theme Mix and supplier-funded separation | **Partial** | Imported mix supported; supplier-funded classifications depend on missing UC files. |
| Signed-only Draft Highlights | **Implemented (source)** | Strict signed-flag check; unsigned rows excluded. |
| Gallery from approved ZIP and matching Library IDs | **Partial** | EDIT 15/15 verified; other client/channel assets awaiting. |
| Meta/Google compatible schema, allow missing channel-only fields | **Partial** | Google missing IDs/start dates accepted; status now stays `(not captured)`; mixed Meta/Google rows within one register need schema-specific validation. |
| Distinguish Google reported population from sample | **Implemented (source)** | `reportedPopulation` separate from `sampleSize`; no population inference. |
| Source strip on every competitor view | **Implemented (source)** | Dark `COMPETITOR VIEW` strip with channel source. |
| Longevity at campaign context, not evidence of results | **Partial** | Days are calculated for known starts; campaign-level continuity needs source attribution beyond ad IDs. |
| Capture dates on every panel; no interpolation | **Partial** | Dated selectors/source contexts; not all per-card repeated labels verified in browser. |

## Document 4: Competition — how the capture data renders.pdf (page 1)

| Example requirement | Status | Verification and limitation |
|---|---|---|
| Union Coop Carrefour: 57 ads, 56 new, 24 avg days, 24 supplier-funded | **Blocked** | November 18 UC workbook missing. Do not copy image numbers into code. |
| Union Coop LuLu comparison | **Blocked** | Approved baseline and new source files missing. |
| Carrefour 1 Oct vs 18 Nov campaign/ad-ID turnover explanation | **Blocked** | Source-based comparison not available. |
| Competition wall for Carrefour/LuLu | **Blocked** | Approved image pack not supplied. |
| Rivoli EDIT: Meta 68 registered Nov 3 | **Implemented, data verified** | Existing capture workbook and gallery files checked. |
| Rivoli EDIT Google: ~200 reported, 30 sampled, 11/5/7/7 formats | **Blocked** | Actual Google workbook absent; UI supports sample vs reported labels. |
| Cross-channel Own Your Moment observation | **Blocked** | Google record required; PDF is illustrative, not a data feed. |
| Mandatory source labels, sample/census and signed bullets | **Partial** | Source labels and sign-off logic implemented; Google/UC coverage absent. |

## Files verified missing from current baseline

- `Rivoli-Consumer-GA4-Import-v4.xlsx`
- `Competition-Capture-UnionCoop-Carrefour-LuLu-01-Oct-2026.xlsx`
- `Competition-Capture-UnionCoop-Carrefour-LuLu-18-Nov-2026.xlsx`
- `EDIT-Google-Capture1-18Nov2026.xlsx`
- Approved Union Coop October five-channel Creative import
- Approved Union Coop burst/spend register
- Approved Carrefour/LuLu gallery ZIP
- Approved Consumer comment-type export
- Approved per-section Highlights v2 with signed values
- Approved Union Coop Top 3 image mapping

These dependencies remain unavailable. **Do not claim all four PDFs are implemented or that the application is fully accurate.**

## Tests and audit limits

- `NODE_PATH=<global node modules> npm run verify:creative`: **Passed**. The extracted/transpiled Creative component is evaluated, ensuring all four slot variants forward `client`, `year`, and `month` with no ReferenceError.
- `scripts/verify_bizcom_sources.py`: **Passed**. Raw source structures confirm 68 unique EDIT IDs, 15 matching gallery images and all seven CLEO worksheets.
- `tools/validate_cleo_source.py`: **Passed**. Confirms six CLEO data worksheets, 12 market questions, topic/engine/funnel rows, and that appearances (3) are not wins (0).
- TypeScript TSX/TS parse check: **Passed**, all application and test sources (runtime type correctness not established).
- `npm ci`: **Failed** due incomplete packages/registry availability in this runtime.
- `npm test`, `npm run lint`, full production build, real browser E2E: **Not verified** due unavailable installed dependencies.

### Local acceptance sequence

```bash
npm ci
npm run verify:creative
npm run test --if-present
npm run lint --if-present
npm run build
npm run dev
```

Open `/creative?year=2026&month=8&brand=union-coop`. Confirm the four slot sections render instead of a blank page. Switch to a missing-source Souq, verify its awaiting state. Then test `/media`, `/consumer`, `/search?panel=ai` and existing EDIT Meta competition captures.

# Bizcom Engine V2: implementation record

**Baseline:** `source code.zip` uploaded November 19, 2026. The application was edited in place. The architecture remains React 19 / TypeScript / Vite / React Router and Express / TypeScript / imported XLSX workbooks. The original media, Creative, Consumer, CLEO and EDIT November data files remain unmodified.

**Build qualification:** This is a code implementation candidate. A successful dependency install and end-to-end browser verification were not possible in this environment. None of the entries below claims a passing runtime test unless separately indicated.

## Requirement status matrix

| Area / requirement | Status | Implementation / evidence |
|---|---|---|
| Navigation: eight heads with Search instead of SEO/GEO | Complete (source) | `App.tsx`, `AppLayout.tsx`, `SearchDashboardPage.tsx`; Overview/Tech/UI-UX/Business are explicitly marked awaiting |
| Classic search | Blocked | Approved source not supplied; thin awaiting state |
| GEO folded into Search AI search | Complete (source) | Existing GEO component reused, `/geo` redirects to `/search?panel=ai` |
| Shared color system | Partial | New `bizcom-v2.css` overrides decorative blue/teal; browser verification outstanding |
| Six-element section anatomy | Partial | Shared section label/question/definition, optional signed highlight, DeltaLine, SparkBars, source line; not every old card supplies historical pairs |
| One hero per tab | Partial | Imported signed first highlight renders as larger serif text; current legacy workbook has no verified signed flag |
| Motion once in 300 ms, reduced motion | Blocked | Not implemented. Must be tested against the running app before adding animation |
| Media 01 Spend and return | Partial | Existing separate spend/FTP charts retained, conditional spend delta + historical spark bars; GA4 v4 absent |
| Media 02 Acquisition cost | Partial | Existing CAC/AOV retained; correctly labeled platform attribution; no new GA4 first-time source |
| Media 03 Channels | Blocked | GA4 v4 absent. Displays thin awaiting line instead of a large empty KPI card |
| Media 04 Campaigns, objective-aware ranking | Partial | Conversion/Traffic/Awareness objectives only when identifiable from imported type, unavailable objectives not ranked; full register opens visibly as dialog; approved thumbnail mapping absent |
| Media 05 Competition | Partial | Compare-against separated, channel-aware Meta/Google UI and capture selector; Google workbook absent |
| Union Coop Media reference structure | Partial | Four sections with correctly named source-dependency waiting states; no PDF example numbers hardcoded |
| Creative Output/Attention/Engagement/Top content labels | Complete (source) | `CreativeDashboardPage.tsx` uses November 18 labels and exact definitions |
| Creative signed highlights per section | Partial | Shared API can match signed Linked card and reporting period; original workbook has no signed flag and therefore stays pending |
| Creative 8-period trends and delta | Partial | Historical benchmark values used for median engagement when comparable; partial months suppressed; not every KPI has a source-backed history |
| Creative October verified 5-channel workbook | Blocked | Not supplied; no October figures copied from mockup |
| Creative Top 3 imagery/why-it-worked | Partial | Source-import ranking retained, images rendered only when approved; unsanctioned analyst explanations remain pending |
| Consumer unified style | Partial | Neutral V2 styling and separate count/share charts, no dual axes; browser runtime not verified |
| Union Coop Consumer comment types | Blocked | Client switch added, one awaiting line, no invented counts |
| Rivoli Consumer order-level repeat figures | Blocked | Thirty31North order export not supplied; line awaiting, existing verified Consumer kept |
| Competition V2 multi-client and dated imports | Partial | New version-aware parser for UC per-competitor registers and EDIT Google sample, preserves original October + November Meta parser; no actual V2 file to test |
| Google sample vs reported population | Partial | Separate sample/reported fields; reported count only when explicitly found in Read Me, never inferred from sample |
| Meta/Google selection | Partial | Channel state and API query implemented; Google import absent, so empty-state only today |
| Signed competition highlights | Partial | V2 Draft Highlights loaded only if signed=yes; legacy TBL Reads also strict signed gating |
| Competition dark strip | Complete (source) | Persistent label for competitor/source/activity-not-spend on selected competition panel |
| Gallery and full register | Complete (existing, source-validated) | Original 15 EDIT images retained and 68 unique Library IDs; full-register modal preserved |
| Campaign/ad unit longevity interpretation | Partial | Google records with missing dates excluded from age, churn not computed from uncaptured IDs; requires real V2 file validation |
| Responsive layout/visual screenshots | Not verified | No running browser application in this environment. Static CSS parsing passed |
| Full production build and tests | Blocked | npm dependency installation could not complete; build fails on missing type packages |

## Key source changes

**Frontend:** New Search page and placeholder heads; revised navigation; reusable reporting components, shared V2 stylesheet; Media five-slot headings, objective-aware campaign ranking with full table modal; Consumer client selector and separate trend scales; revised Creative names; Competition channel switch, source strip and sample labels.

**Backend:** V2 competition import adapter, optional Google channel query, separate sample metadata and signed capture highlights; secure whitelist of gallery assets; unsigned TBL Highlights excluded from publication. Original 1 Oct and 3 Nov EDIT parsing remains intact.

## Important source accuracy rules

- The existing Media `siteRevenue` value represents imported site item revenue, not necessarily GA4 net revenue.
- Source workbook numbers are never substituted with PDF illustration values.
- Current imported campaign maps do not have a verified Objective field for all rows. Unknown objectives are not ranked.
- All historical captures and source workbooks are preserved. Missing Google / Carrefour / LuLu inputs do not create dummy captures.
- No competitor spending, reach, performance or success claim is generated from ad library captures.
- A Google sample of logged creatives is not equated to the full reported advertising population.
- The documented 135-day/168-day EDIT longest-running discrepancy is not silently reconciled. The existing November workbook has multiple 168-day rows, so the old parser retains its workbook-backed calculation.
- CLEO composite GEO scores, placeholder sentiment and threat labels remain excluded.

## Monthly import instructions

1. Add a new approved workbook inside its existing tab folder. For competition, use `spreadsheets data/compititaion-tab/` without removing older captures.
2. Extract approved thumbnails under `server/data/competition-assets/{competitor-id}/{YYYY-MM-DD}/`.
3. Ensure V2 workbook has separate competitor registers, valid capture dates, channel fields, status, and signed flags for publishable Highlights.
4. Start the backend from the project root or `server` workspace. Capture files are resolved relative to those locations.
5. Restart the backend after adding imports so the in-memory source cache reloads.
6. Run `npm ci`, `npm test`, `npm run lint`, `npm run build` and then browser/interaction checks before deploying.

## Runtime routes

- `/media` Rivoli reporting (existing sources)
- `/media?client=union-coop` Union Coop Media awaiting approved October spending/burst imports
- `/creative` Creative data
- `/consumer?client=rivoli` and `/consumer?client=union-coop`
- `/search?panel=classic` traditional search awaiting data
- `/search?panel=ai` existing GEO/CLEO data
- `/geo` permanent redirect to Search AI
- `/competition` redirects to the Media competition context

See `BIZCOM_ENGINE_V2_SOURCE_AUDIT.md` and `BIZCOM_ENGINE_V2_TEST_RESULTS.md` for limitations.

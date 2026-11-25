# Bizcom Engine V2 | Four-PDF Implementation and Verification Audit

**Baseline:** `Bizcom-Engine-Nov24-Competitor-Mapping-Corrected-Full.zip`, modified directly. No Docker/database migration or workspace restructuring.

**Priority:** Newer explicit user instructions override the November 18 PDF where they conflict: Media is Rivoli-only, comparing against EDIT; Union Coop Creative compares against Carrefour/LuLu; Consumer and Search have no comparison control.

**Proof threshold:** “Implemented in source” means code/contract checked, not a passing full React build. Browser runtime and semantic TypeScript build could not be performed because npm installation failed.

## Requirement matrix

| ID | Source | Requirement | Status / evidence | Primary code | Missing input |
|---|---|---|---|---|---|
| S1.1 | Changes p1 | Rivoli GA4 v4 Sep/Oct and Channels | Implemented in source; source present | MediaDashboardPage.tsx, Ga4Channels.tsx, media-supplements.service.ts | Rivoli-Consumer-GA4-Import-v4.xlsx |
| S1.2 | Changes p1 | TBL Highlights signed text only | Partial: importer/sign-off gate present; original reads lack Signed field | reads.service.ts, TblReadsStrip.tsx | Signed TBL reads approval pending |
| S1.3 | Changes p1 / Visual p6 | Five Media headers exactly label/question/definition | Implemented in source | MediaDashboardPage.tsx, Reporting.tsx | Available |
| S1.4 | Changes p1 / Visual p6 | KPI previous comparisons and eight-period spark bars | Partial: covered where comparable source months exist | Reporting.tsx, MediaHistory.tsx, MediaConsumerAlignment.tsx, OverviewCards.tsx | Missing matching source months/periods |
| S1.5 | Changes p1 / Visual p4 | Campaign Objective imported, intra-objective rankings | Implemented in source; many rows unclassified until approved metadata | CampaignSection.tsx, source-parser.ts | Campaign Objectives import pending |
| S1.6 | Changes p1 / Visual p4 | Campaign thumbnails, short names, full hover | Partial: approved metadata/asset path supported; many assets absent | CampaignSection.tsx, media.routes.ts | Approved campaign thumbnail mapping/files |
| S1.7 | Changes p1 / Visual p5 | Union Coop Media reference build | Superseded by later explicit request: Media Rivoli-only | MediaDashboardPage.tsx | User-approved tab-scope override |
| S2.1 | Changes p1 | Union Coop Creative Why-It-Worked source | Implemented with source metrics; unsigned prose omitted | creative-source-parser.ts, CreativeDashboardPage.tsx | Workbook has no signed prose |
| S2.2 | Changes p1 / Visual p6 | Creative four neutral section labels | Implemented in source | CreativeDashboardPage.tsx, Reporting.tsx | Available |
| S2.3 | Changes p1 | One signed highlight per section and pending once per tab | Implemented mechanism; signed section values pending | reads.service.ts, Reporting.tsx, TblReadsStrip.tsx | Signed section Highlights |
| S2.4 | Changes p1 / Visual p6 | Creative KPI deltas and eight-period trends | Partial: available Union Coop monthly data only; no invented periods | CreativeDashboardPage.tsx, Reporting.tsx | October verified five-channel workbook |
| S2.5 | Changes p1 | Union Coop October verified five-channel import | Blocked by missing approved workbook | creative-source-parser.ts, creative.service.ts | October verified Creative 5-channel workbook |
| S2.6 | Visual p1/p7 | Top 3 gallery with source details | Partial: source-backed Top 3/Creative Cuts present; approved images/notes absent | CreativeDashboardPage.tsx | Signed analyst interpretation and approved images |
| S2.7 | Later scope | Other Creative brands cannot inherit Union Coop competitors | Newly corrected; source checks passed | CreativeDashboardPage.tsx, ContextualCompetition.tsx, use-competition-data.ts | No dependency |
| S3.1 | Changes p2 | Consumer unified neutral UI | Implemented tokens/source-level; visual parity not browser-verified | reference-consumer.css, bizcom-v2.css | Browser comparison |
| S3.2 | Changes p2 | Union Coop comment categories import | Implemented optional reader/UI; no monthly export available | union-comments.service.ts, ConsumerDashboardPage.tsx | Monthly comment-type export |
| S3.3 | Changes p2 | Rivoli Consumer existing logic and order export warning | Preserved existing behavior | ConsumerDashboardPage.tsx, consumer.service.ts | Thirty31North order-level export |
| S4.1 | Changes p2 / Visual p4 | GEO moved to Search; classic+AI | Implemented in source; classic is awaiting | App.tsx, SearchDashboardPage.tsx | Classic Search approved source |
| S4.2 | Later scope | No Compare-against on Consumer/Search | Implemented in source | ConsumerDashboardPage.tsx, SearchDashboardPage.tsx | No dependency |
| S5.1 | Changes p2 / Competition v2 pp1-2 | Carrefour/LuLu baseline and Nov registers | Implemented import; source count 57/54 validated structurally | capture-v2-parser.ts, competition-source-parser.ts | Available |
| S5.2 | Changes p2 / Competition v2 pp1-2 | Delta/theme/launch/payer and no fabricated IDs | Implemented import pathway; runtime tests unavailable | competition.service.ts, capture-v2-parser.ts | Missing ID rows retained as uncaptured |
| S5.3 | Changes p2 / Competition v2 p1 | Display only signed competition highlights | Implemented gate | capture-v2-parser.ts | Signed approval pending |
| S5.4 | Changes p2 / Competition v2 p2 | Carrefour/LuLu approved gallery | Blocked: approved gallery ZIP absent; thin awaiting | ContextualCompetition.tsx | Gallery thumbnails from TBL |
| S5.5 | Changes p2 | EDIT Meta Nov3 68 register + 15 thumbnails | Present and preserved | edit-capture-two-parser.ts, MediaCompetitionPanel.tsx | Available |
| S5.6 | Changes p2 / Competition render p1 | EDIT Google 200 reported / 30 sample | Implemented source separation, four sample formats | competition.service.ts, MediaCompetitionPanel.tsx | Available |
| S5.7 | Changes p2 / Visual p4 | Correct competitor dropdown by tab | Implemented source and newly tested | MediaDashboardPage.tsx, CreativeDashboardPage.tsx, ContextualCompetition.tsx | Later user mapping overrides PDF every-head rule |
| S5.8 | Competition render p1 | Dark competitor strip, channel, capture and activity label | Implemented in source | ContextualCompetition.tsx | Browser verification outstanding |
| S5.9 | Competition v2 p1 | Historical captures never overwritten | Implemented dated capture selection | competition.service.ts, capture-v2-parser.ts | Available |
| S5.10 | Competition v2 p2 / Visual p4 | See all ad register usable and searchable | Newly added Creative modal; existing Media modal preserved | ContextualCompetition.tsx, CampaignSection.tsx, MediaCompetitionPanel.tsx | Browser validation pending |
| S6.1 | Visual pp3-4 | Design tokens/neutral chrome and no stock art | Implemented tokens; legacy CSS parity remains partial | bizcom-v2.css, creative-palette.css | Browser visual regression pending |
| S6.2 | Visual pp4-6 | One signed serif hero per tab | Implemented; absent without signed import | TblReadsStrip.tsx | Editorial approval |
| S6.3 | Visual pp4-6 | One thin awaiting line for missing data | Implemented in shared and major module views; residual legacy UI partial | Reporting.tsx, ContextualCompetition.tsx | Visual review outstanding |
| S6.4 | Visual pp3-6 | Green/red used for deltas only; Google navy/Meta gold | Implemented shared tokens and platform chips; complete review outstanding | bizcom-v2.css, CompetitionChannelChip.tsx | Browser review |
| S6.5 | Visual pp4-6 | One-time 300ms number/chart motion | Implemented shared CountUp and selected charts; incomplete coverage possible | CountUpValue.tsx, Ga4Channels.tsx | Browser and reduced-motion verification |
| S6.6 | Visual p4 | Rate hover with actual numerator and denominator | Newly added campaign hover; broader rate-tooling partial | CampaignSection.tsx | Source numerator/denominator not available for every rate |
| S7.1 | Changes p3 | Input inventory and integrity | Source workbooks preserved; missing optional files documented | spreadsheets data/, docs/ | October creative, burst, gallery, comments, signed Highlights |

## Latest implementation fixes

- Creative: only Union Coop may show Carrefour/LuLu competitor selector. Other brands have neither selector nor a stale competition request.
- Creative Competition: full source register moved behind an immediately visible native `<dialog>` with search, close, Escape support and horizontal scrolling.
- Media Campaigns: percentage hover exposes the source CTR numerator and impressions denominator when supplied.
- Testing: new `npm run verify:latest` checks 16 tab, workbook, source/visual and control contracts.

## Inspected delivered workbooks (actual file contents)

- `Rivoli-Consumer-GA4-Import-v4.xlsx`: Monthly Series, Channel Revenue, and supporting sheets. Monthly Series is 11 rows including headers (Jan-Oct). Channel Revenue 37 rows including headers (Sep/Oct channels).
- `UnionCoop-Creative-WhyItWorked-Import.xlsx`: Post Metrics 279 rows including header (278 posts); Top 3 31 rows including header (30 rankings); Monthly Benchmarks 11 rows including header; Creative Cuts 139 rows including header.
- `Competition-Capture-UnionCoop-Carrefour-LuLu-18-Nov-2026.xlsx`: Carrefour register 58 rows including header (57 entries), LuLu register 55 including header (54 entries), Delta, Theme Mix, unsigned Draft Highlights.
- `EDIT-Google-Capture1-18Nov2026.xlsx`: register 31 rows including header (30 sample entries), separate sample-format sheet. Approximately 200 is source-reported, not a 200-row register.
- `TBL-Reads-Import-Template-and-First-Fill.xlsx`: Reads headers are Client, Section, Period, Order, Bullet, Linked card, Author, Date written. **No Signed field**. None of its prose can be published as signed without explicit approval.

## Outstanding source dependencies

1. Union Coop October 2026 verified five-channel Creative workbook.
2. Union Coop media burst/paid-organic reach exports.
3. Union Coop customer comment-type monthly export.
4. Approved Carrefour/LuLu thumbnail gallery archive.
5. Explicit signed/approved TBL Highlights, including section-specific v2 and any competition editorial lines.
6. Approved campaign Objective, short-name and thumbnail metadata/files for campaigns lacking these fields.
7. Thirty31North order-level export for repeat-purchase measurements and approved classic-search source data.

## Testing and limits

- `npm run verify:latest`: 16/16 source contracts pass.
- Existing `verify:creative-v2`, `verify:media-creative`, `verify:competition-visual`, `verify:tab-scope`, `verify:nov18`, `verify:spreadsheets`, `verify:media-ui` and `verify:nov24-imports` pass after updating expectations to cover brand-scoped competition.
- `npm ci --offline` failed: `zod-4.6.5.tgz` not available in cache.
- Normal `npm ci` failed: npm `Exit handler never called` in this environment.
- Therefore backend/frontend semantic TypeScript builds, Vitest, live APIs, Chrome visual comparisons, and cross-tab interactions **are not certified**.

## Local verification

```bash
npm ci
npm run verify:latest
npm run verify:creative-v2
npm run verify:media-ui
npm run verify:competition-visual
npm run build
npm run dev
```

Open `/creative?brand=union-coop&year=2026&month=8` to inspect the Carrefour/LuLu comparison, then switch to Pocari/Souqs and verify the competitor selector disappears. Open `/media?year=2026&month=10` to review GA4 and EDIT Meta/Google. Confirm no comparison selector in `/consumer` and `/search`.

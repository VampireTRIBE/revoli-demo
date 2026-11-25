> **Historical record, superseded on 24 November 2026.** The current requested mapping is Creative → Carrefour UAE / LuLu Hypermarket; Media → EDIT by Ahmed Seddiqi. See [competitor mapping correction](COMPETITOR_TAB_MAPPING_CORRECTION.md).

# Bizcom Engine: tab scope update (24 November 2026)

## User-requested rule, overriding the 18 November general scope

The 18 November PDF says **Compare against on every head** and shows a **Union Coop Media reference build**. The subsequent, explicit instruction changes both requirements for this deliverable:

1. **Media is Rivoli-only.** It must not offer Union Coop as a Media client.
2. **Compare against is shown only on Creative.** Media, Consumer, and Search do not show the control or embedded competitor view.

These are deliberate user-requested deviations from the historical PDF. Competitor records and their importers are **not deleted**.

## Implementation, in PDF order

| PDF item | Current code behavior | Scope / remaining input |
| --- | --- | --- |
| 1. Media | Rivoli Media retains its GA4 v4 channels, Spend and return, Acquisition cost, and objective-aware Campaigns. The Media client selector and Union Coop Media view are removed from the rendered route. Old `?client=union-coop` URLs are normalized without losing the year, month, brand or segment filters. | Approved campaign metadata and thumbnail assets can still be missing. Union Coop Media reference UI is intentionally not offered on Media because of the latest instruction. |
| 2. Creative | Creative retains its brands, prepared Union Coop post metrics, four neutral section labels, source-backed trends, and signed-only Highlights. **The sole Compare against control** appears beside Year / Month / Brand with a divider. | Unapproved Highlights and missing Oct five-channel data are still unavailable. |
| 3. Consumer | Existing Consumer behavior, including Rivoli/Union Coop client selection and missing comment data, is preserved. Compare against control and panel are removed; old `competition` query parameters are discarded. | Consumer is otherwise unchanged. |
| 4. Search | AI Search/GEO and Classic Search remain. Compare against control and panel are removed; old `competition` query parameters are discarded. | Classic Search awaits its source workbook. |
| 5. Competition | Comparisons remain usable **inside Creative only**. Competition options, baseline/Nov captures, EDIT Meta and Google, sample/census distinctions, signed-only editorial text, capture gallery, source strip, and register endpoints are preserved. A legacy `/competition` link redirects to Creative. | Carrefour/LuLu imagery needs an approved gallery ZIP. |
| 6. Visual treatment | Compare against is visibly divided from Creative reporting filters; the menu and active state use the neutral palette, with responsive width. Media filters now occupy four aligned fields without an unused Comparison column. The static heading in Creative is channel-neutral so Google isn't incorrectly called Meta. | A complete browser visual regression and production build have not been certified. |
| 7. Spreadsheet inventory | The original categorized spreadsheet and asset directories remain unchanged; no database migration or Docker setup was introduced. | Missing approved inputs continue to display truthful awaiting labels. |

## Files changed in this scope update

- `client/src/pages/MediaDashboardPage.tsx`: Rivoli-only Media, legacy parameter normalization, remove Compare against and Union Coop Media UI branch.
- `client/src/pages/ConsumerDashboardPage.tsx`: remove Compare against control/panel and obsolete comparison parameter.
- `client/src/pages/SearchDashboardPage.tsx`: remove Compare against control/panel and obsolete comparison parameter.
- `client/src/pages/CreativeDashboardPage.tsx`: keep sole Compare against control and neutral source heading.
- `client/src/layouts/AppLayout.tsx`: correct client label by tab.
- `client/src/App.tsx`: route legacy `/competition` to `/creative`.
- `client/src/styles/media-palette.css`: four-filter Media layout.
- `client/src/styles/creative-palette.css`: comparator divider, sizing and responsive layout.
- `scripts/verify_tab_scope.cjs`: added scope-specific source-contract test.
- `scripts/verify_media_creative_nov24.cjs`: updated the old five-Media-section expectation to match the new Rivoli-only scope.
- `package.json`: `npm run verify:tab-scope`.

## Verification and caveats

Run the source-level tests:

```sh
npm run verify:tab-scope
npm run verify:creative-v2
npm run verify:media-ui
npm run verify:media-creative
npm run verify:competition-visual
npm run verify:nov24-imports
npm run verify:nov18
npm run verify:spreadsheets
```

The checks validate source contracts and import consistency, not browser behavior. Full app testing requires installing npm dependencies, running Express and Vite, and building both workspaces. No test should claim full PDF completion without approved missing data.

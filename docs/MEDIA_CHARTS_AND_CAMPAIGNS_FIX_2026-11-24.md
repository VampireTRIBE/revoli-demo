# Bizcom Engine: GA4 charts, Spend and Return, Campaigns, and Compare-against repair

Date: 24 November 2026

## Baseline and constraints

Updated the latest `Bizcom-Engine-Nov24-Nov18-Spec-Implemented-Full.zip` source, preserving the existing React + Express + TypeScript workspaces, Excel-backed source readers, media data paths, imports, and prior Creative / Competition fixes. No Docker or MongoDB migration.

## Corrections

1. **GA4 month charts:** Uses only imported GA4 channel observations for bar plots. The workbook contains channel rows for September and October; January-August are not rendered as empty bar categories. The underlying per-month KPI spark bars still preserve missing periods as gaps. Fixed the clipped Y-axis by using compact `K` / `M` labels, a 72px axis, explicit chart margins, and a 230px chart height.
2. **Spend and Return data integrity:** The previous KPI used an overview calculation returning `0` for months without Google/Meta spend or reconciled item-revenue source records. Now missing spend is `n/a`, and verified GA4 net revenue is displayed from the GA4 Monthly Series with explicit source identity. It is not renamed to item revenue or platform-reported conversion revenue. Monthly coverage is not calculated when period data, scope, or two-account spend coverage is missing. Historical ratios derive from matching spend/revenue sources rather than unrelated item-revenue history.
3. **Acquisition and attribution:** Avoid AED 0 for unimported selected-month platform CAC and site AOV. Show unavailable instead of a fabricated 0-versus-0 claims/purchases comparison.
4. **Campaigns UI:** Select `All objectives · grouped` to show available imported campaigns in separate Conversion, Traffic, Awareness, and `Not supplied` groups. Each supported cost ordering is **within its own imported objective**. Unclassified campaigns stay visible and unranked. The full original campaign name remains accessible on hover, with searchable full-register dialog and an explicitly labeled source-period register for records without monthly granularity.
5. **Campaign import:** Read approved Objective, Short name, and Thumbnail file fields from existing Google/Meta campaign sheets when provided, as well as the optional `Campaign Metadata` sheet; normalize approved platform labels. Images display only when the given filename is safe and the actual image exists under `server/data/media-campaign-assets/`. There are currently **no campaign image files** in that folder (only a README).
6. **Union Coop Compare against:** Restrained selector width to 290px on desktop and preserved its distinct source-switch semantics; responsive full width on narrow screens. Fixed the oversized desktop dropdown shown in the screenshot.

## Verified imported GA4 data

The verified `Rivoli-Consumer-GA4-Import-v4.xlsx` has monthly net-revenue summaries for January-October 2026 and *channel-level sessions and revenues* for September and October only.

| Channel-derived value | September 2026 | October 2026 |
|---|---:|---:|
| GA4 sessions | 618,864 | 781,706 |
| GA4 channel revenue (AED) | 1,863,333 | 3,026,635 |
| GA4 monthly net summary (AED) | 1,863,332 | 3,026,634 |
| First-time purchasers | 1,060 | 1,712 |

The channel-revenue totals exceed the net summary by AED 1 each month. Both metrics retain their labels and are not silently substituted.

## Source limitations

- Approved campaign Objective, short-name, and thumbnail rows may be missing from the current inputs. The engine supports them but does **not invent an objective or image**. An unavailable imported field remains `Not supplied` or image-less.
- The Meta campaign register is a nine-month total (January-September) rather than an August or October monthly campaign series. The period switch remains explicit.
- The combined Hour Choice Meta account export remains incomplete; the full two-account revenue-coverage ratio is deliberately withheld. No ROAS is reported.
- Union Coop's approved Media Burst Register and gallery imagery, plus per-section signed Highlights, are still needed for full reference-spec content.

## Changed application files

- `client/src/features/media/components/Ga4Channels.tsx`
- `client/src/features/media/components/MediaConsumerAlignment.tsx`
- `client/src/features/media/components/OverviewCards.tsx`
- `client/src/features/media/components/CampaignSection.tsx`
- `client/src/pages/MediaDashboardPage.tsx`
- `client/src/styles/media-palette.css`
- `server/src/modules/media/import/source-parser.ts`
- `scripts/verify_media_ui_reporting.cjs`
- `package.json`

## Verification and run

```sh
npm ci
npm run verify:media-ui
npm run verify:media-creative
npm run verify:competition-visual
npm run build
npm run dev
```

`verify:media-ui` runs 14 source-contract checks; this is not an end-to-end browser test. The existing Media/Creative and Competition source checks pass. Full `npm ci --offline` failed in this environment because `zod-4.6.5.tgz` was not present in the npm cache. Thus an executable full build, runtime API integration, and browser screenshots are not certified here.

## Acceptance checks for local testing

1. Open `/media?year=2026` and inspect GA4 Channels: only September/October have channel bars, with readable `K/M` Y-axis ticks; January-August do not appear as zero-valued bars.
2. Select October 2026. GA4 net revenue is from the monthly summary; platform spend is `n/a` if the export has no October source rows; coverage remains `n/a`.
3. In Campaigns, switch Google / Meta and select All objectives. Imported objectives must group separately; `Not supplied` rows remain unranked and the source-period toggle never treats Meta nine-month totals as October spend.
4. Short names / images are displayed only if imported from approved metadata and physically present.
5. In Union Coop Media, Compare against appears as a compact control; choosing Carrefour or LuLu updates only the competitor source view.

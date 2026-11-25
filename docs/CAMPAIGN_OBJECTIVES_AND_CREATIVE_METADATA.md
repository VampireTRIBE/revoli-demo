# Campaign table implementation, 24 November 2026

## Baseline and scope

Baseline: `Bizcom-Engine-Media-Channels-Campaigns-Updated-Full.zip`. Only campaign-related parser, analytics, UI, styles and tests were changed. The existing React/Express workspaces, client mapping, Union Coop Media reference view, and all original imports/assets remain unchanged. No new infrastructure was introduced.

## Workbook evidence

| Source sheet | Actual records | Objective coverage | Creative metadata |
| --- | ---: | --- | --- |
| Rivoli-Meta-Brand-Spend-Jan-Sep-2026.xlsx / Meta Campaign Brand Map | 83 campaign rows (including 14 with zero spend) | 77 Traffic, 6 Awareness, 0 Conversion; exact stage labels defined by Rules & flags (loader spec) | No approved short-name or thumbnail columns |
| Rivoli Shop Segmentation with reconciled campaigns .xlsx / Campaign Brand Map | 145 monthly campaign rows | No explicit Objective column; Search, Shopping, Performance Max and Video are campaign types, not proof of a business objective | No approved short-name or thumbnail columns |
| Rivoli-Google-Brand-Spend-Jan-Sep-2026.xlsx / Google Campaign Map | Nine-month mapping/control sheet | No explicit Objective column. Rules describe Capture and Build, not a Conversion/Traffic/Awareness mapping | No approved short-name or thumbnail columns |

The seven Media workbooks contain no embedded image assets. The approved Media campaign asset directory has only its README. The competitor gallery belongs to a different entity and cannot be reused as Rivoli campaign imagery. Meta loader rules say zero-spend rows must be carried; the old parser omitted 14. Meta campaign coverage is Jan 1 to Sep 10, 2026 (September partial); the register is not selected-month performance. The current Meta campaign map supplies spend but no campaign-level result denominators. Google supplies counts but no approved objectives. No performance ranking is assigned to either unsupported category.

## Implementation

- Objective labels come from the explicit `Objective` field, or the two exact source-authorized Meta Stage values. No name-based inference. API exposes the objective's source lineage. Conflicting aggregate objectives are unclassified.
- Restored zero-spend Meta records, rejecting missing or invalid spend instead of manufacturing a zero. Invalid optional numeric values stay unavailable.
- Costs use positive, finite denominators. Conversion uses reported conversions; traffic uses link clicks for Meta and interactions for Google. Awareness uses reported views per 1,000 when available or impressions per 1,000 when views are not captured. Views and impressions are distinct measures and never ranked together. No awareness ad is evaluated using conversions. Separate groups for platform, objective and measure.
- Aggregation with missing observations does not combine a partial denominator with complete spend. Conflicting thumbnail/name mappings within an aggregate are withheld. Imported classifications take precedence over stale legacy classifications for matched source records.
- Rankable rows and unranked rows remain distinct. Unclassified Google records show imported counts as unranked context, not a cost ranking. Cost formatting retains two decimal places; reported conversions can be fractional. The full searchable register honors the selected objective and shows its result count.
- Campaign identity has a 48px thumbnail slot, compact name with exact original string on hover and keyboard focus, and a visible missing-image treatment if an approved asset is absent or fails to load. No fabricated campaign names or images. Original campaign labels are truncated visually only when short names are unavailable.

## Supplying the missing approved campaign metadata

Use explicit fields on the existing source campaign sheets (`Objective`, `Short name`, `Thumbnail file`), or add a workbook with a `Campaign Metadata` worksheet under `spreadsheets data/media/rivoli/`.

| Column | Required value |
| --- | --- |
| Platform | Google Ads or Meta Ads |
| Campaign | Exact full source campaign name |
| Objective | Conversion, Traffic or Awareness (approved by the media team) |
| Short name | Approved display label |
| Thumbnail file | Exact local PNG, JPEG or WebP filename |

Place matching approved images in `server/data/media-campaign-assets/`. Do not insert guessed metadata or reuse competitor screenshots. Restart the existing backend to refresh cached workbook data. To rank Meta campaigns, supply the matching campaign-level clicks, views/impressions or conversions for the same spend/reporting window. The original files have not been edited.

## Verification

- `npm run verify:campaign-objectives`: executed actual ranking and aggregation functions with targeted fixtures; passed objective, platform and metric isolation, missing counts, zero spend, fractional conversions, conflicting metadata and strict aggregation assertions.
- Parsed real workbook rows independently with artifact_tool; executed the actual TypeScript campaign parser functions against extracted rows via a mocked XLSX sheet adapter. Verified 83 Meta and 145 Google monthly records, the 14 zero-spend rows, 77/6 objective split and unavailable creative metadata. This is not a live XLSX integration test.
- Added real-workbook assertions to the existing Vitest source-parser test, to run after dependency installation.
- Pure ranking helper: strict standalone TypeScript compilation passed.
- 12 existing source-contract commands passed. All 131 TS/TSX sources parsed; 16 CSS sheets parsed.
- Full npm installation failed offline (`ENOTCACHED`, zod-4.6.5.tgz). Full application compilation, Vitest, live API and browser integration remain unverified.

## Status

The two requested features are implemented in source. Data availability is partial: no approved Google Objective mapping, campaign thumbnails or short names exist in the supplied imports; no Meta campaign result denominators exist. The application does not invent them. This update is not a full-browser certification.

# Competition Future Monthly Import

## Monthly update steps

1. Keep every earlier workbook and screenshot asset folder.
2. Put the new `.xlsx` capture workbook in `spreadsheets data/compititaion-tab`.
3. Keep the supported capture headers.
4. Use one row per Library ID observed in that capture.
5. Use the exact capture date on every row.
6. Keep Library IDs as text so digits are not changed.
7. Add analyst themes; do not leave theme inference to code.
8. Add screenshot captions in the form `Screenshot N — Library IDs: ...`.
9. Embed the real screenshots in the workbook.
10. Restart the server so it parses and syncs the new capture.
11. Review the audit and filter options.
12. Run tests and the production build.

## Do not overwrite history

The capture archive starts with 1 October 2026. An older start date does not create an earlier capture.

Store every monthly workbook and its extracted assets. History calculations need the exact set of Library IDs observed on each capture date.

## Required columns

- Capture date
- Competitor
- Meta page
- Library ID
- Start date
- Days running
- Status
- Platforms
- Format
- Theme
- Featured brand / product
- Ad text (short)
- Click destination
- Language
- Screenshot ref

The source may retain an impressions note, but the application does not display or calculate it.

## Several captures in one month

Store each capture with its exact date. The UI automatically shows a Capture Date dropdown and defaults to the latest date in that month.

Never add the active counts from two captures together.

## Adding another competitor

1. Add a row in `competition.config.ts`.
2. Set client ID, labels, Meta page, website, workbook pattern, format groups, and theme groups.
3. Supply a workbook using the supported fields.
4. Add validation tests for source counts and mappings.

If no workbook exists, keep the configured competitor visible as `Data not received`.

## Future Union Coop data

For Carrefour and LuLu:

- Activity counts use individual Library IDs and are labelled `ads`.
- Creative-idea counts group matching analyst theme and ad text and are labelled `creatives`.
- These two totals must stay separate.
- Comparison views must say `Their paid ads vs our organic posts.`

Do not populate Union Coop figures from examples in the brief.

## Verification checklist

- Unique active Library ID count matches the workbook.
- Date calculations match supplied days.
- Duplicate and malformed row counts are zero or explained.
- Every screenshot association is verified.
- Missing images show `Image not available`.
- First observed uses all earlier captures.
- No longer observed compares with the previous capture only.
- Disappearance is not described as confirmed inactivity.
- No spend, impressions, reach, CTR, conversion, ROAS, targeting, or score appears.

Run:

```cmd
npm.cmd test --workspace server
npm.cmd run build
```

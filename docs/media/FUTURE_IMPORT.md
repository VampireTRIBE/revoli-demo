# Media Future Monthly Import

## What the client should provide

Provide either:

- One `.xlsx` workbook containing all supported sheets, or
- One `.zip` file containing the monthly `.xlsx` workbooks.

Keep the current sheet names, headers, Brand names, Segment names, and data types.

## Import steps

1. Keep a backup of the received package.
2. Start MongoDB, the server, and the client.
3. Open `http://localhost:5173/media/import`.
4. Select the workbook or ZIP package.
5. Leave replacement disabled for a normal new month.
6. Start the import.
7. Review validation warnings and reconciliation results.
8. Confirm the new year/month appears in the Media filters.
9. Check the overview, platforms, campaigns, Brand, Segment, funnel, and reconciliation sections.

## Required checks before import

- Dates belong to the intended month.
- Numeric columns contain numbers, not formatted sentences.
- Brand and Segment spelling matches the approved mapping.
- Platform names remain Google Ads and Meta Ads.
- Campaign sheets retain their campaign and mapping columns.
- The Reconciliation sheet contains the expected control totals.
- A partial month has the correct start and end dates.

## Correcting a month

Use `replaceExisting=true` only for a deliberate correction.

The server first validates the replacement package. It then replaces the stored period inside a transaction. If the transaction fails, MongoDB rolls back the change.

Do not use replacement merely because a file has a different name.

## Adding a new Brand or Segment

If the workbooks use the existing structure, a new Brand or Segment normally appears automatically after import.

Check that:

- Platform and site sheets use the same label.
- Campaign mapping identifies the correct Brand and Segment.
- Revenue and spend coverage exists for the intended directional-return level.

## Adding a new source format

If the client changes sheet names or headers, update and test the parser before importing. Do not guess field meanings during import.

Update:

- Source parser mappings.
- Reconciliation controls.
- Tests.
- This documentation.

## After-import verification

Run:

```cmd
npm.cmd test --workspace server
npm.cmd run build
```

Check that no API returns `NaN` or infinity. Missing denominators must display `N/A`.

# Creative Future Monthly Import

Creative currently uses folder-based source import. There is no Creative upload page yet.

## Monthly update steps

1. Keep the previous source files as an archive outside the active canonical path.
2. Receive the new complete post export and any account-summary files.
3. Confirm the CSV encoding and headers.
4. Put the new files under `spreadsheets data/creative-tab` using the configured Brand/account folder.
5. If two complete exports overlap, choose one through the source-precedence configuration. Do not concatenate them.
6. Update the reporting-period start/end mapping in the Creative source parser if the export coverage changed.
7. Restart the server or clear the Creative source cache.
8. Check Year, Month, Brand, partial-period labels, post counts, and source-audit conflicts.
9. Run tests and the production build.

## Required post-level columns

For the existing Union Coop parser, keep these columns:

- `Channel Name`
- `Network`
- `Post Id`
- `Published At`
- `Post Type`
- `Post Text (Excerpt)`
- `Post URL`
- `Reach`
- `Views`
- `Shares`
- `Saves`
- `Comments`
- `Reactions`
- `Avg. Watch Time (sec)` when available

Image URL columns are optional. Missing images use placeholders.

## Adding a new Brand

1. Add the Brand ID, label, account, aliases, and post-level availability in `creative-source.config.ts`.
2. Add a configured source path or content rule.
3. Map the real CSV headers to the normalised fields.
4. Add duplicate-precedence rules if exports overlap.
5. Add tests for the Brand's counts, dates, and missing fields.

Do not set `postLevelAvailable: true` for an account-summary file.

## Adding paid Meta data

Paid sections can use the current paid-post shape when it supplies Post ID, spend, paid impressions, paid reach, paid clicks, format, and reporting period. A complete Paid score additionally requires paid shares, paid saves, paid comments, and the reference video inputs such as ThruPlays.

Do not join account totals to Organic posts as a substitute.

## Adding Google Shopping creative data

Google product sections require product-level data such as Product ID, image, clicks, impressions, and reporting period.

Account totals cannot identify a top product or product-image CTR.

## Verification commands

```cmd
npm.cmd test --workspace server
npm.cmd run build
```

Also verify:

- Duplicate Post IDs are counted once.
- Missing values remain `N/A`.
- Zero reach never causes division by zero.
- Partial months are labelled correctly.
- The selected Brand updates every supported section.

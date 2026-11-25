# Spreadsheet reorganization and application path updates

The 19 Excel workbooks and 61 CSV files from the Nov 24 Competition Visual Full project have been moved into six dashboard categories without changing any workbook/CSV bytes. Two accompanying reference images were moved to `docs/reference-assets/`.

See `spreadsheets data/README.md` for the categorized file inventory and missing-source destinations.

Machine-readable mapping: `docs/SPREADSHEET_FILE_MAPPING.json`. Original SHA-256 digests: `docs/SPREADSHEET_SOURCE_MANIFEST.json`.

Runtime import path updates: Creative (including Union Coop, Pocari and Souqs), Media, Consumer, Competition, CLEO/Search, Highlights. Tests, source validators and the client CLEO error hint are updated.

The Express/React npm workspace structure is preserved. No Docker files or MongoDB-only migration were introduced.

Previous documentation may retain historical source paths as part of the original delivery record; this document and `spreadsheets data/README.md` are authoritative for the current paths.

# Media Tab Documentation

The Media tab shows paid media activity and directional business results for Rivoli. It reads the supplied Excel workbooks, validates the source totals, calculates supported metrics on the server, and displays them in the React dashboard.

The Media page is available at:

`http://localhost:5173/media`

## Documents in this folder

1. [API list](API.md)
2. [Formulas and data sources](FORMULAS_AND_SOURCES.md)
3. [Implementation flow and explanation](IMPLEMENTATION_FLOW.md)
4. [Future monthly import](FUTURE_IMPORT.md)
5. [Database structure and fields](DATABASE_STRUCTURE.md)

## Important reporting rule

Media return values are **directional**, not verified advertising attribution. Site revenue is compared with paid spend, but the data does not prove that every site order was caused by an ad.

The application therefore uses labels such as `DIRECTIONAL`, `PLATFORM_CLAIMED`, `DERIVED`, and `VERIFIED`.

## Main filters

- Year
- Month
- Segment
- Brand

All visible sections use the selected filters. A Brand list is limited by the selected Segment.

## Main source folder

The server reads the supplied media workbooks from `spreadsheets data/media-tab` in source-backed mode. New upload packages are accepted through the Media import API and stored in MongoDB after validation.

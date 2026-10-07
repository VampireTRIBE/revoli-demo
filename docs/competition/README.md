# Competition Tab Documentation

The Competition tab shows competitor advertising activity captured from Meta Ad Library. It is a separate dashboard tab and does not affect Media, Creative, or overall scores.

The Competition page is available at:

`http://localhost:5173/competition`

## Documents in this folder

1. [API list](API.md)
2. [Formulas and data sources](FORMULAS_AND_SOURCES.md)
3. [Implementation flow and explanation](IMPLEMENTATION_FLOW.md)
4. [Future monthly import](FUTURE_IMPORT.md)
5. [Database structure and fields](DATABASE_STRUCTURE.md)

## Required source label

Every Competition card and creative displays:

> Source: Meta Ad Library. Activity, not spend.

## Current dataset

- Client: Rivoli Shop.
- Competitor: EDIT by Ahmed Seddiqi.
- Meta page: Byedit.
- Capture date: 1 October 2026.
- Active ads: 37.
- Embedded screenshots: 13.

Carrefour UAE and LuLu Hypermarket are configured for Union Coop, but their capture workbook is not supplied. They display `Data not received`.

## Main filters

- Year
- Month
- Competitor
- Capture date, only when a competitor has several captures in one month

Year and Month select the capture period. They do not select ads by start month and do not create historical backfill.

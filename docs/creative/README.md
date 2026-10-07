# Creative Tab Documentation

The Creative tab shows supported social-post creative performance from the files in `spreadsheets data/creative-tab`.

The Creative page is available at:

`http://localhost:5173/creative`

## Documents in this folder

1. [API list](API.md)
2. [Formulas and data sources](FORMULAS_AND_SOURCES.md)
3. [Implementation flow and explanation](IMPLEMENTATION_FLOW.md)
4. [Future monthly import](FUTURE_IMPORT.md)
5. [Database structure and fields](DATABASE_STRUCTURE.md)

## Current supported data

- Union Coop has eligible Instagram post-level data.
- Souq Al Bahar and Souq Al Jubair currently have daily account totals or summary files, not complete post-level records.
- Pocari Sweat has five paid Meta detail records covering the whole 1 January to 1 October 2026 export. They are a subset of the 12 paid posts reported in the account summary.
- Paid shares, paid saves, ThruPlays, usable image URLs, and Google Shopping product-level data are not supplied.

Unsupported sections stay visible but show `N/A` or `Data not available`. Organic metrics are never copied into paid sections.

## Main filters

- Year
- Month, including `All months`
- Brand

Month filtering means performance of posts **published during the selected month**. It does not mean every engagement happened during that month.

## Important label

The current exports do not prove a clean organic-versus-boosted split. Supported results are labelled:

`Organic + boosted combined`

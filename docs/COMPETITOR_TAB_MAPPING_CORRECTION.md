# Bizcom Engine competitor mapping correction (24 Nov 2026)

## Requested scope

| Tab | Reporting client | Compare against | Source IDs |
|---|---|---|---|
| Creative | Union Coop (Creative brand may be selected independently) | Carrefour UAE; LuLu Hypermarket | `carrefour-uae`; `lulu-hypermarket` |
| Media | Rivoli only | EDIT by Ahmed Seddiqi | `edit-by-ahmed-seddiqi` |
| Consumer, Search | Existing brands | No Compare against control | n/a |

Media remains Rivoli-only. Restored a separate Media comparison selector and its fifth Competition section, using the existing `rivoli-shop` Competition API. Creative always loads the `union-coop` competitor list for its Compare against selector. Competition data and source workbooks remain unchanged. EDIT supports its Meta and Google capture channels. Older URLs with `client=union-coop` are still normalized to Rivoli Media; a valid `competition=edit-by-ahmed-seddiqi` query may open the Media competitor.

**Note:** The 18 Nov PDF says Compare against can appear on every head, but the latest requested tab scope is Creative and Media only. Creative's Carrefour/LuLu captures are Union Coop sources even if a different Creative brand is selected; they must not be presented as another brand's own competitor performance.

## Verification

- `npm run verify:tab-scope`: checks corrected tab wiring and backend client IDs.
- `npm run verify:media-ui`: checks restored, separate Media selector and previous charts/campaign source rules.
- `npm run verify:competition-visual`: preserves current Competition source checks.
- Both full and compact ZIPs should pass `ZipFile.testzip()`.

Full browser runtime checks require npm dependencies. Do not treat source or syntax checks as proof of browser behavior.

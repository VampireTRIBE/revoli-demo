# Bizcom Engine V2: source data and consistency audit

The source files below were inspected within the uploaded baseline. The application imports data but does not infer missing workbook content.

## Verified data in source ZIP

| File | Validation |
|---|---|
| `spreadsheets data/compititaion-tab/EDIT-AdLibrary-Capture2-03Nov2026.xlsx` | 68 unique numeric Library IDs in Ad Register, excluding one narrative footer; 15 gallery mappings |
| `server/data/competition-assets/edit-by-ahmed-seddiqi/2026-11-03/` | All 15 gallery-referenced image files exist |
| `spreadsheets data/compititaion-tab/Competition-Capture-EDIT-Byedit-01-Oct-2026.xlsx` | Historical October workbook retained, not overwritten |
| `spreadsheets data/creative-tab/UnionCoop-CLEO-Market-Import.xlsx` | All six data sheets and display-rules README present |
| `spreadsheets data/creative-tab/UnionCoop-Creative-WhyItWorked-Import.xlsx` | Prepared Creative workbook retained without modification |
| `spreadsheets data/TBL-Reads-Import.xlsx` | Legacy Highlights workbook present. Its rows lack an explicit verified signed field, so the revised frontend shows pending instead of claiming approval |

The raw XLSX and gallery validation is reproducible using `python scripts/verify_bizcom_sources.py` (standard library only). Detailed counts are in `BIZCOM_ENGINE_V2_SOURCE_VALIDATION.json`.

## Imports not found under their required approved filenames

- `Rivoli-Consumer-GA4-Import-v4.xlsx`: no approved September/October GA4 v4 channels and refunds in uploaded source.
- `Competition-Capture-UnionCoop-Carrefour-LuLu-01-Oct-2026.xlsx`: no baseline workbook in expected name.
- `Competition-Capture-UnionCoop-Carrefour-LuLu-18-Nov-2026.xlsx`: no November 18 57/54-ad capture to parse.
- `EDIT-Google-Capture1-18Nov2026.xlsx`: Google reported population and 30-creatives sample cannot be published.
- Union Coop verified October five-channel Creative workbook and spend/burst register.
- Carrefour/LuLu approved gallery thumbnails.
- Union Coop monthly Consumer comment-type export.
- Signed per-section Highlights v2.
- Approved Media campaign objective and thumbnail fields where absent from older imports.
- Thirty31North order-level export for true repeat customer measurements.

The missing files are described as delivered in some November 18 documents, but they are not physically contained in the uploaded source archive. No such source records were invented or copied from a PDF screenshot.

## Source conflicts and cautions

1. **EDIT longest-running ad:** Prior documentation sometimes shows 135 days, while the supplied 3 Nov workbook includes 168-day rows. This implementation retains the workbook-backed value and flags the illustrative mismatch.
2. **Revenue basis:** The existing site `Item revenue (AED)` workbook is not automatically GA4 net revenue. The Media label is qualified accordingly.
3. **CLEO wins:** Earlier Creative document wording says "3 wins / 844"; the CLEO import records appearances, with a different win-rate definition. Do not reinterpret appearances as wins.
4. **Competitor turnover:** Library IDs not observed at the next capture are not proven stopped or unsuccessful. Campaign longevity and ad-unit longevity are separate concepts.
5. **Google sample:** Reported ~200 versus 30 logged are different denominators. The figure ~200 is only displayable when read from the approved Google workbook's Read Me.
6. **Media spend:** September/October Google and both Meta-account coverage is incomplete; no fabricated two-account reconciled totals were generated.
7. **Signed Highlights:** Existing authored text is not automatically treated as approved under the revised sign-off contract.
8. **Charts:** Partial periods do not receive fabricated comparison deltas. Absent periods are gaps, not zeroes.

## Source directory policy

Retain the existing spelling `compititaion-tab`. Competition assets must map filenames to register IDs, and URLs remain constrained to the configured local asset directory and imported gallery whitelist. No external scraping is performed.

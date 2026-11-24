# Bizcom Engine: Present and Missing Spreadsheets

**Baseline inspected:** `Bizcom-Engine-Nov24-Competition-Visual-Full-Updated.zip`  
**Requirement source:** `Bizcom-Engine-Changes-Simple-18-Nov-2026.pdf`, section 7, with related sections 1–6  
**Inventory date:** 24 November 2026

## Summary

| Inventory | Count |
|---|---:|
| Missing required spreadsheet/data imports | **7** |
| Required spreadsheets present under their specified filenames | **3** |
| Required Highlights workbook present as a renamed variant (approval not verified) | **1** |
| Excel workbook files actually present in ZIP, including duplicates and legacy files | **19** |
| CSV data files actually present in ZIP | **61** |
| Missing separately approved competitor-thumbnail archive | **1** |

## A. Missing required spreadsheets / imports

| # | Expected filename or source | Destination | Needed for |
|---:|---|---|---|
| 1 | `Rivoli-Consumer-GA4-Import-v4.xlsx` | Rivoli / Media | September and October GA4 metrics: traffic, channels, revenue and customer data |
| 2 | `Competition-Capture-UnionCoop-Carrefour-LuLu-01-Oct-2026.xlsx` | Union Coop / Competition | October 1 baseline for both competitors |
| 3 | `Competition-Capture-UnionCoop-Carrefour-LuLu-18-Nov-2026.xlsx` | Union Coop / Competition | November 18 registers, delta against baseline, themes and draft Highlights |
| 4 | Union Coop October verified Creative workbook (5 channels; **filename not supplied**) | Union Coop / Creative | October metrics, comparable KPI change lines and spark bars |
| 5 | Union Coop Burst Register / media-spend workbook (**filename not supplied**) | Union Coop / Media | Spend, campaigns and paid-versus-organic burst reporting |
| 6 | Union Coop monthly comment-type export (**filename not supplied**) | Union Coop / Consumer | Counts for contest entries, product questions, complaints and praise |
| 7 | Per-section signed Highlights v2 workbook (**filename not supplied**) | All reporting tabs | Approved, section-level, period-dated editorial Highlights |

**Meaning of missing:** The file was not found inside the inspected project ZIP. It may exist outside the uploaded project, but that is not evidence it is available to this build.

## B. Required spreadsheet sources already present

| # | Requirement | Actual file in ZIP | Status |
|---:|---|---|---|
| 1 | Union Coop Creative Why-It-Worked | `spreadsheets data/creative-tab/UnionCoop-Creative-WhyItWorked-Import.xlsx` | Present |
| 2 | EDIT Meta Capture 2 (3 Nov 2026) | `spreadsheets data/compititaion-tab/EDIT-AdLibrary-Capture2-03Nov2026.xlsx` | Present |
| 3 | EDIT Google Capture 1 (18 Nov 2026) | `spreadsheets data/compititaion-tab/EDIT-Google-Capture1-18Nov2026.xlsx` | Present |
| 4 | TBL Reads / initial Highlights | `spreadsheets data/TBL-Reads-Import-Template-and-First-Fill (1).xlsx` | Present with `(1)` suffix; explicit signing/approval still unverified |

**Important:** A present workbook is not the same as approved, signed content. Do not publish unsigned Highlights. `Rivoli-Consumer-Import.xlsx` and other earlier workbooks do **not** establish that GA4 v4 is present.

## C. Thumbnail ZIP / non-spreadsheet assets

| Asset | Status | Notes |
|---|---|---|
| EDIT Capture 2 gallery | **Present as 15 extracted image assets** | The application already has the EDIT Meta gallery images; the original ZIP archive itself need not be included to render them. |
| Carrefour and LuLu approved gallery ZIP | **Missing** | TBL must supply approved thumbnails and Library-ID mappings. |

## D. Complete Excel workbook inventory in the current ZIP (19 files)

These are all `.xlsx`, `.xls` and `.xlsm` entries by *exact archive path*, including duplicate versions and older imports.

1. `spreadsheets data/Rivoli-Consumer-Import (1).xlsx`
2. `spreadsheets data/TBL-Reads-Import-Template-and-First-Fill (1).xlsx`
3. `spreadsheets data/TBL-Reads-Import.xlsx`
4. `spreadsheets data/UnionCoop-Creative-WhyItWorked-Import (2).xlsx`
5. `spreadsheets data/UnionCoop-Creative-WhyItWorked-Import.xlsx`
6. `spreadsheets data/compititaion-tab/Competition-Capture-EDIT-Byedit-01-Oct-2026.xlsx`
7. `spreadsheets data/compititaion-tab/EDIT-AdLibrary-Capture2-03Nov2026.xlsx`
8. `spreadsheets data/compititaion-tab/EDIT-Google-Capture1-18Nov2026.xlsx`
9. `spreadsheets data/consumer-tab/Rivoli-Consumer-Import.xlsx`
10. `spreadsheets data/creative-tab/Rivoli-Consumer-Cohorts-Jan-Sep-2026.xlsx`
11. `spreadsheets data/creative-tab/Rivoli-Consumer-Segment-Cut-Jan-Sep16-2026.xlsx`
12. `spreadsheets data/creative-tab/UnionCoop-CLEO-Market-Import.xlsx`
13. `spreadsheets data/creative-tab/UnionCoop-Creative-WhyItWorked-Import.xlsx`
14. `spreadsheets data/media-tab/Rivoli Shop Segmentation with reconciled campaigns .xlsx`
15. `spreadsheets data/media-tab/Rivoli Shop. Brand Segmentation 16.09.xlsx`
16. `spreadsheets data/media-tab/Rivoli-Brand-Plot-MODULE2-Jan-Sep-2026.xlsx`
17. `spreadsheets data/media-tab/Rivoli-Google-Brand-Spend-Jan-Sep-2026.xlsx`
18. `spreadsheets data/media-tab/Rivoli-Meta-Brand-Spend-Jan-Sep-2026.xlsx`
19. `spreadsheets data/media-tab/Rivoli-Organic-Brand-Demand-Jan-Sep-2026.xlsx`

## E. CSV inventory (61 files)

These are existing CSV exports, mainly from Union Coop Creative / Buffer and Souq performance. Their presence does not replace the new verified November imports.

1. `spreadsheets data/creative-tab/Buffer insights Union Coop/UC Instagram Buffer/posts.csv`
2. `spreadsheets data/creative-tab/Buffer insights Union Coop/UC Instagram Buffer/summary.csv`
3. `spreadsheets data/creative-tab/Buffer insights Union Coop/UC Instagram Buffer/timeseries.csv`
4. `spreadsheets data/creative-tab/Buffer insights Union Coop/UC buffer Instagram/posts.csv`
5. `spreadsheets data/creative-tab/Buffer insights Union Coop/UC buffer Instagram/summary.csv`
6. `spreadsheets data/creative-tab/Buffer insights Union Coop/UC buffer Instagram/timeseries.csv`
7. `spreadsheets data/creative-tab/Buffer insights Union Coop/Union Coop Facebook/average-performance-statistics-20260101-to-20260923.csv`
8. `spreadsheets data/creative-tab/Buffer insights Union Coop/Union Coop Facebook/demographic-cities-20260101-to-20260923.csv`
9. `spreadsheets data/creative-tab/Buffer insights Union Coop/Union Coop Facebook/demographic-countries-20260101-to-20260923.csv`
10. `spreadsheets data/creative-tab/Buffer insights Union Coop/Union Coop Facebook/demographic-gender-age-20260101-to-20260923.csv`
11. `spreadsheets data/creative-tab/Buffer insights Union Coop/Union Coop Facebook/metrics-insights-20260101-to-20260923.csv`
12. `spreadsheets data/creative-tab/Buffer insights Union Coop/Union Coop Facebook/performance-statistics-20260101-to-20260923.csv`
13. `spreadsheets data/creative-tab/Buffer insights Union Coop/Union Coop Facebook/posts-20260101-to-20260923.csv`
14. `spreadsheets data/creative-tab/Buffer insights Union Coop/Union Coop Facebook/posts-hashtags-20260101-to-20260923.csv`
15. `spreadsheets data/creative-tab/Buffer insights Union Coop/Union Coop Facebook/posts-summary-20260101-to-20260923.csv`
16. `spreadsheets data/creative-tab/Buffer insights Union Coop/Union Coop Tik Tok Buffer/posts.csv`
17. `spreadsheets data/creative-tab/Buffer insights Union Coop/Union Coop Tik Tok Buffer/summary.csv`
18. `spreadsheets data/creative-tab/Buffer insights Union Coop/Union Coop Tik Tok Buffer/timeseries.csv`
19. `spreadsheets data/creative-tab/Buffer insights Union Coop/buffer-overview-analytics-csv/average-performance-statistics-20260101-to-20260923.csv`
20. `spreadsheets data/creative-tab/Buffer insights Union Coop/buffer-overview-analytics-csv/demographic-cities-20260101-to-20260923.csv`
21. `spreadsheets data/creative-tab/Buffer insights Union Coop/buffer-overview-analytics-csv/demographic-countries-20260101-to-20260923.csv`
22. `spreadsheets data/creative-tab/Buffer insights Union Coop/buffer-overview-analytics-csv/demographic-gender-age-20260101-to-20260923.csv`
23. `spreadsheets data/creative-tab/Buffer insights Union Coop/buffer-overview-analytics-csv/metrics-insights-20260101-to-20260923.csv`
24. `spreadsheets data/creative-tab/Buffer insights Union Coop/buffer-overview-analytics-csv/performance-statistics-20260101-to-20260923.csv`
25. `spreadsheets data/creative-tab/Buffer insights Union Coop/buffer-overview-analytics-csv/posts-20260101-to-20260923.csv`
26. `spreadsheets data/creative-tab/Buffer insights Union Coop/buffer-overview-analytics-csv/posts-hashtags-20260101-to-20260923.csv`
27. `spreadsheets data/creative-tab/Buffer insights Union Coop/buffer-overview-analytics-csv/posts-summary-20260101-to-20260923.csv`
28. `spreadsheets data/creative-tab/Buffer insights Union Coop/buffer-overview-analytics-csv/stories-summary-20260101-to-20260923.csv`
29. `spreadsheets data/creative-tab/Buffer insights Union Coop/posts.csv`
30. `spreadsheets data/creative-tab/Buffer insights Union Coop/summary.csv`
31. `spreadsheets data/creative-tab/Buffer insights Union Coop/timeseries.csv`
32. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/SAB Insta views .csv`
33. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/SAB Intercations .csv`
34. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/SAB follows Insta .csv`
35. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/SAB interactions insta .csv`
36. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/SAB reach insta .csv`
37. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/SAB visits insta.csv`
38. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/SAB vists .csv`
39. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/SAB.csv`
40. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/SAb audience insta .csv`
41. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/SAb content formats .csv`
42. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/Souq Al Bahar Views .csv`
43. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/Souq Al JUbair Views .csv`
44. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/Souq Al Juabir Vsists .csv`
45. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/Souq Al Juabir follows .csv`
46. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/Souq Al Jubair Interactions .csv`
47. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/Souq Al Jubair Links  .csv`
48. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/Souq Al Jubair audience .csv`
49. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/Souq Al Jubair viewers .csv`
50. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/Souq Al bahar Viewers .csv`
51. `spreadsheets data/creative-tab/SOUQ Al Jubair and Bahar/Souq Al jubair content formats .csv`
52. `spreadsheets data/creative-tab/buffer-posts-analytics-csv/average-performance-statistics-20260101-to-20261001.csv`
53. `spreadsheets data/creative-tab/buffer-posts-analytics-csv/demographic-cities-20260101-to-20261001.csv`
54. `spreadsheets data/creative-tab/buffer-posts-analytics-csv/demographic-countries-20260101-to-20261001.csv`
55. `spreadsheets data/creative-tab/buffer-posts-analytics-csv/demographic-gender-age-20260101-to-20261001.csv`
56. `spreadsheets data/creative-tab/buffer-posts-analytics-csv/metrics-insights-20260101-to-20261001.csv`
57. `spreadsheets data/creative-tab/buffer-posts-analytics-csv/performance-statistics-20260101-to-20261001.csv`
58. `spreadsheets data/creative-tab/buffer-posts-analytics-csv/posts-20260101-to-20261001.csv`
59. `spreadsheets data/creative-tab/buffer-posts-analytics-csv/posts-hashtags-20260101-to-20261001.csv`
60. `spreadsheets data/creative-tab/buffer-posts-analytics-csv/posts-summary-20260101-to-20261001.csv`
61. `spreadsheets data/creative-tab/buffer-posts-analytics-csv/stories-summary-20260101-to-20261001.csv`

## F. Import instructions

1. Put the new officially supplied workbooks into the existing `spreadsheets data/` directories for their modules. Preserve the existing `compititaion-tab` folder spelling unless updating all code references.
2. Do not rename unrelated older workbooks to imitate the required new files.
3. Ensure Highlights carry an explicit signed/approved flag before displaying their sentences.
4. Keep October and November competitor captures separately selectable; never overwrite historical captures.
5. Place only TBL-approved gallery images alongside the matching capture and verify their Library ID mapping.
6. Re-run the application’s import/verification commands after adding new files and check actual UI results.


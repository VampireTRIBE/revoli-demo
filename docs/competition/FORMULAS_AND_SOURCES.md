# Competition Formulas and Data Sources

## Current source

Workbook:

`spreadsheets data/compititaion-tab/Competition-Capture-EDIT-Byedit-01-Oct-2026.xlsx`

Important sheets:

| Sheet | Use |
| --- | --- |
| `Capture 2026-10-01` | 37 ad observations |
| `Ad Screenshots` | Screenshot captions and embedded images |
| `Monthly Summary` | Human-readable source checks; calculations still use capture rows |
| `Brands Featured` | Source context only |

The parser validates the actual capture headers instead of trusting only the filename.

## Normalised field mapping

| Workbook field | Stored field |
| --- | --- |
| Capture date | `captureDate` |
| Competitor | Configured `competitorId` and label |
| Meta page | `metaPage` |
| Library ID | `libraryId` string |
| Start date | `startDate` |
| Days running | `suppliedDaysRunning` for validation |
| Status | `status` |
| Platforms | `platforms` |
| Format | Original `format` and grouped `formatGroup` |
| Theme | Original `theme` and grouped `themeGroup` |
| Featured brand / product | `featuredBrandProduct` |
| Ad text | `adText` |
| Click destination | Safe `clickDestination` |
| Language | `language` |
| Screenshot ref | `screenshotRef` and verified screenshot metadata |

The source impressions column is deliberately not included in the API or UI.

## Days running

```text
Calculated days running = Capture date - Start date
```

UTC date-only arithmetic is used. The calculated value is compared with the supplied workbook value.

## Active ads

```text
Active ads = Count of unique active Library IDs in the selected capture
```

The same Library ID in another capture is the same ad observed again, not another ad.

## Average days running

```text
Average days running = Sum of calculated days for eligible active ads / Eligible active ad count
```

Current verified result: approximately `28.6` days.

## Started during selected month

```text
Count active captured ads whose Start date is inside the selected capture year and month
```

For the October 2026 capture, this value is zero. Nineteen captured ads started on 28–29 September, and the UI reports that separately.

## First observed ads

```text
Current capture IDs absent from every earlier stored capture
```

This value is `N/A` for the first capture. The first workbook's 37 ads are not automatically called new launches.

## No longer observed ads

```text
Previous capture IDs absent from the current capture
```

Disappearance does not prove that an ad became inactive.

## Mix calculations

```text
Group percentage = Group count / All active ads with that field
```

### Current format grouping

| Original format | Group |
| --- | --- |
| `Image` | Image |
| `Image (product tile)` | Image |
| `Catalog / carousel` | Catalog / carousel |

Current result: 22 Image and 15 Catalog/carousel.

### Current theme grouping

| Original label starts with | Group |
| --- | --- |
| `Catalog` | Catalog |
| `Offer code` | Offer code |
| `Product spotlight` | Product spotlight |
| `Gifting` | Gifting |

Current result: 15 catalog, 9 offer code, 7 product spotlight, and 6 gifting.

Themes come from analyst tags only. Code does not infer a theme from ad text.

## Longest-running ads

Active ads are sorted by calculated days from highest to lowest. The first three are shown.

Current result: three ads started on 19 May 2026 and had run for 135 days at capture.

Longevity is activity context. It does not prove performance or profitability.

## Screenshot rules

The importer extracts real embedded workbook images. Screenshot captions identify the Library IDs contained in each image.

When one screenshot contains several ads, the UI lists all IDs and identifies it as a full multi-ad screenshot. It is not presented as an individual crop.

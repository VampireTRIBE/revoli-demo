# Competition Tab Implementation

This document explains the Competition tab in simple language. The tab is market-activity context. It does not measure competitor performance and it never affects a Media, Creative, or overall score.

Every Competition card and creative displays this exact notice:

> Source: Meta Ad Library. Activity, not spend.

## 1. What was implemented

The application now has a separate `/competition` tab with:

- Year, Month, and Competitor dropdowns.
- A capture-date dropdown when a competitor has more than one capture in a month.
- The exact selected capture date and source workbook name.
- Competitor activity and average days running.
- Recent-launch information that separates ad start dates from first observation.
- The three longest-running active ads and their supplied screenshots.
- Grouped format, language, and analyst-theme mixes.
- A searchable ad-details table with original workbook labels.
- A button that opens the extracted creative screenshots in a gallery.
- Clear `N/A` and `Data not received` states.
- Desktop, tablet, and mobile layouts matching the existing dark BizCom design.

The current supported capture is for Rivoli Shop competitor **EDIT by Ahmed Seddiqi**, Meta page **Byedit**.

## 2. Sources inspected

| Source | Purpose |
| --- | --- |
| `spreadsheets data/compititaion-tab/Competition-Capture-EDIT-Byedit-01-Oct-2026.xlsx` | Actual ad observations and 13 embedded screenshots |
| `spreadsheets data/compititaion-tab/Competition-Block-Build-Brief-Tech-Team.docx` | Rivoli competition rules and acceptance totals |
| `spreadsheets data/compititaion-tab/UnionCoop-Competition-Build-Brief-Tech-Team.docx` | Future Union Coop rules and missing-dataset limits |
| `docs/documentation/GP-BizCom-Dashboard.html` | Colours, typography, cards, tables, spacing, and responsive visual direction |

The build briefs and Competition workbook are read from `spreadsheets data/compititaion-tab`. The misspelled directory name is preserved intentionally because it is the supplied source-of-truth path.

The HTML contains no Competition tab and supplies no Competition data. Its cached demo values are never used.

## 3. Workbook field mapping

The server locates capture sheets by their actual headers. It does not accept a workbook merely because its filename looks correct.

| Workbook column | Normalised field | Rule |
| --- | --- | --- |
| Capture date | `captureDate` | Required ISO date |
| Competitor | `competitor` and configured `competitorId` | Must match configuration |
| Meta page | `metaPage` | Preserved |
| Library ID | `libraryId` | Required string; never converted to a number |
| Start date | `startDate` | Required ISO date |
| Days running | `suppliedDaysRunning` | Preserved only for validation |
| Status | `status` | Preserved; active count uses `Active` |
| Platforms | `platforms` | Preserved |
| Format | `format` | Original value preserved |
| Theme | `theme` | Original analyst label preserved; never inferred |
| Featured brand / product | `featuredBrandProduct` | Preserved or `null` |
| Ad text (short) | `adText` | Preserved or `null` |
| Click destination | `clickDestination` | Only safe HTTP or HTTPS links are returned |
| Language | `language` | Preserved or `null` |
| Screenshot ref | `screenshotRef` | Matched to the caption and embedded workbook image |

The workbook's `Impressions (if shown)` field is intentionally not included in the API or UI. Values such as `<100` are never displayed.

Every observation also retains `sourceFile`, `sourceSheet`, and `sourceRow`.

## 4. Configuration

Competitors are configured in:

`server/src/modules/competition/config/competition.config.ts`

Each configuration row contains:

- Client ID and label.
- Competitor ID and display label.
- Exact Meta page.
- Website when available.
- Workbook filename alias pattern.
- Raw-to-grouped format mapping.
- Analyst-theme grouping prefixes.
- Optional comparison honesty label.

Current rows are:

- EDIT by Ahmed Seddiqi: data received.
- Carrefour UAE: configured, but data not received.
- LuLu Hypermarket: configured, but data not received.

Carrefour and LuLu results are not copied from the brief. Selecting them shows `Data not received`.

Future Union Coop comparison views must carry this exact label:

> Their paid ads vs our organic posts.

## 5. Import and validation flow

```text
spreadsheets data/compititaion-tab workbook
        |
        v
Find sheets by required capture headers
        |
        v
Validate competitor, Library ID, capture date, start date, format, and status
        |
        v
Normalise rows and calculate date-only days running
        |
        v
Deduplicate by competitor + capture date + Library ID
        |
        v
Extract embedded workbook images and read screenshot captions
        |
        v
Verify each row's screenshot ref contains its Library ID
        |
        v
Keep source-backed data available and persist identities/observations when MongoDB is connected
        |
        v
Calculate selected-capture summaries in the Competition API
        |
        v
Render the separate React Competition tab
```

Malformed rows are rejected. Missing optional values remain `null`; they are not silently changed to zero.

Duplicate identity is:

`competitor/account + Library ID`

Duplicate capture observation is:

`competitor/account + capture date + Library ID`

A repeated Library ID in a later capture is the same ad observed again. It is not an extra ad.

## 6. Formulas

### Days running

```text
calculated days running = capture date - start date
```

The calculation uses UTC date-only values, so browser timezone and daylight-saving changes cannot alter the result. The calculated value is compared with the supplied workbook value. A difference is flagged in the import audit and details table.

### Active ads

```text
active ads = count of unique active Library IDs in the selected capture
```

Repeated captures are never added together.

### Average days running

```text
average days running = sum(calculated days for eligible active ads) / eligible active ad count
```

### Mix percentages

```text
group percentage = group count / all eligible active ads with that field
```

Missing language or theme values are not invented and are not put into a fake zero group.

### Started during selected month

An ad is counted when its `Start date` falls inside the selected capture year and month. The Year and Month filters choose a capture period; they do not rewrite or backfill the ad's start month.

### First observed ads

```text
current Library IDs absent from every earlier stored capture
```

This is `N/A` for the first capture. The 37 ads in the first EDIT capture are not labelled as 37 new launches.

### No longer observed ads

```text
Library IDs in the previous capture but absent from the current capture
```

This means only that the ID is absent from the later capture. It does not prove that Meta marked the ad inactive.

### Longest-running ads

Active observations are sorted by calculated days running from highest to lowest. The first three are displayed. The UI clearly says longevity does not prove performance or profitability.

## 7. Grouping rules

Original format and theme labels remain visible in the Ad details table. Grouping is used only for summary mixes.

### EDIT format groups

| Original value | Summary group |
| --- | --- |
| `Image` | Image |
| `Image (product tile)` | Image |
| `Catalog / carousel` | Catalog / carousel |

### EDIT theme groups

| Original label begins with | Summary group |
| --- | --- |
| `Catalog` | Catalog |
| `Offer code` | Offer code |
| `Product spotlight` | Product spotlight |
| `Gifting` | Gifting |

Themes come only from the analyst column. Code never guesses a theme from ad text or screenshots.

For future Union Coop data, activity uses individual Library IDs. Creative-idea counts must separately group matching analyst theme and ad text, and must be labelled `ads` and `creatives`.

## 8. Screenshot extraction

The importer reads the workbook ZIP structure, including `xl/media`, the drawing relationships, and screenshot captions. Captions are processed in sheet order and paired with embedded drawings in anchor order.

The current workbook contains 13 embedded PNG files and captioned screenshot references 1, 2, 3, and 5 through 14. There is no screenshot 4. The importer preserves those supplied reference numbers instead of renumbering them.

Extracted assets are stored under:

`server/data/competition-assets/<competitor-id>/<capture-date>/`

The API serves only an asset that belongs to a known stored capture and matches the safe screenshot filename pattern.

Twelve current screenshots contain three ads each. The gallery lists all associated Library IDs and says that the image is a full multi-ad screenshot. It does not present that image as an individually cropped ad. When an association cannot be verified, the UI shows `Image not available`.

## 9. API

Base path:

`http://localhost:5000/api/v1/competition`

| Route | Purpose |
| --- | --- |
| `GET /options` | Returns years, months, capture dates by competitor, configured competitors, and defaults |
| `GET /dashboard?year=2026&month=10&competitor=edit-by-ahmed-seddiqi&captureDate=2026-10-01` | Returns the selected capture, calculations, details, audit, and screenshot metadata |
| `GET /assets/:competitorId/:captureDate/:assetFile` | Returns a verified extracted screenshot asset |

Example missing-data request:

`GET /dashboard?year=2026&month=10&competitor=carrefour-uae`

The response is successful but has `available: false`, `availabilityMessage: "Data not received"`, and `null` metrics.

The API never returns a competitor spend, impressions, reach, CTR, conversions, ROAS, targeting, or performance-score field.

## 10. Persistence and capture history

The MongoDB layer separates three records:

1. `CompetitionAdIdentity`: competitor/account plus Library ID.
2. `CompetitionObservation`: capture date plus ad identity and that capture's values.
3. `CompetitionCapture`: capture metadata, screenshot metadata, source audit, and provenance.

Unique indexes stop the same ad from being counted twice in one capture. Import uses insert-only upserts for an existing capture key, so an older capture is not overwritten during normal startup syncing.

The dashboard also supports source-backed read mode when MongoDB is unavailable, matching the existing application behaviour.

## 11. Missing and prohibited information

The current source does not support and the tab does not show or estimate:

- Spend.
- Impressions, including `<100` annotations.
- Reach.
- CTR.
- Conversions.
- ROAS.
- Targeting.
- Performance scores.
- Own-brand comparisons.

Unavailable numeric values display `N/A`. A configured competitor or period without a capture displays `Data not received`.

Competition data is isolated from Media and Creative calculations and from every 0–100 score.

## 12. Adding the next monthly capture

1. Keep the earlier workbook and extracted asset folders. Never replace an older capture.
2. Put the new `.xlsx` workbook in `spreadsheets data/compititaion-tab`.
3. Use the same capture headers as the current workbook.
4. Give every row a valid capture date, Library ID, start date, status, platforms, format, analyst theme, language, and screenshot reference where available.
5. Put the screenshots in the workbook and keep caption text in the form `Screenshot N — Library IDs: ...`.
6. Start or rebuild the server. The importer detects the new capture and extracts its assets into a separate capture-date directory.
7. Check the server tests and import audit for duplicate IDs, malformed rows, days-running differences, and screenshot-association failures.
8. Confirm the new date appears in the filters. If a month contains several captures, the newest is selected by default and the capture-date dropdown appears.
9. Compare first-observed and no-longer-observed counts with the source. Do not call an absent ID confirmed inactive without explicit source support.

To add another competitor, add a configuration row and provide a workbook with the supported columns. Calculation logic does not need to change.

## 13. Validation results for capture 1

| Check | Result |
| --- | ---: |
| Source rows | 37 |
| Accepted unique active ads | 37 |
| Duplicate rows | 0 |
| Malformed rows | 0 |
| Average calculated days running | 28.5946, displayed as 28.6 |
| Ads started on 28–29 September | 19 |
| Longest-running ads | 3 at 135 days, start date 19 May 2026 |
| Catalog theme | 15 |
| Offer code theme | 9 |
| Product spotlight theme | 7 |
| Gifting theme | 6 |
| Image group, including product tiles | 22 |
| Catalog/carousel group | 15 |
| English language | 37 |
| Days-running discrepancies | 0 |
| Embedded screenshots | 13 |
| Verified row-to-screenshot associations | 37 |
| Unverified row-to-screenshot associations | 0 |

Automated tests also verify missing Carrefour/LuLu states, prohibited API fields, safe image serving, grouped values, raw labels, and first-capture history behaviour.

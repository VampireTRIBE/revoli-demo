# Competition API List

Base URL:

`http://localhost:5000/api/v1/competition`

## Standard response

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": {}
}
```

## `GET /options`

Returns capture filters and configured competitors.

Important fields:

| Field | Meaning |
| --- | --- |
| `years` | Years derived from stored captures |
| `months` | Months containing at least one capture |
| `captureDates` | All capture dates in that month |
| `captureDatesByCompetitor` | Capture dates available for each competitor |
| `competitors` | Configured competitors and `dataReceived` status |
| `defaultSelection` | Latest capture selection |

## `GET /dashboard`

Returns one competitor's selected capture.

### Parameters

| Parameter | Meaning |
| --- | --- |
| `year` | Capture year |
| `month` | Capture month from `1` to `12` |
| `competitor` | Configured competitor ID |
| `captureDate` | Optional exact date in `YYYY-MM-DD` format |

Example:

`GET /dashboard?year=2026&month=10&competitor=edit-by-ahmed-seddiqi&captureDate=2026-10-01`

Important response sections:

- `competitor`: configured client, competitor, page, and website.
- `capture`: selected date, available dates, source file, and first-capture status.
- `activity`: active ads, average days, history, first observed, and no longer observed.
- `launches`: started in selected month and grouped start dates.
- `longestRunning`: top three active ads.
- `formatMix`, `languageMix`, `themeMix`.
- `observations`: searchable ad-detail rows.
- `screenshots`: extracted image metadata and Library ID associations.
- `audit`: malformed rows, duplicates, date differences, and screenshot validation.

## `GET /assets/:competitorId/:captureDate/:assetFile`

Returns one extracted screenshot.

Example:

`GET /assets/edit-by-ahmed-seddiqi/2026-10-01/screenshot-1.png`

The server checks that:

- Competitor ID is valid.
- Capture date has the correct format.
- Filename matches the safe screenshot pattern.
- The asset belongs to a parsed capture.

Unknown or unsafe paths return `404 NOT_FOUND`.

## Missing-data response

A configured competitor without a workbook returns a successful dashboard response with:

```json
{
  "available": false,
  "availabilityMessage": "Data not received"
}
```

Numeric values are `null`, not misleading zeros.

## Data that is never returned

The Competition API does not return or estimate competitor:

- Spend.
- Impressions.
- Reach.
- CTR.
- Conversions.
- ROAS.
- Targeting.
- Performance scores.

# Media filter spacing and EDIT full-register click fix

Date: 12 November 2026

## Reported issues

1. Segment, Brand, and Competition controls were packed together, and the header spacing in the Media Competition panel was uneven.
2. The `See all 68 ads` gallery tile appeared to do nothing when clicked.

## Cause

The Media header's four-column `.period-filters` grid defined no desktop `gap`. Competition header/highlights spacing was likewise inherited from older layout styles.

The gallery tile toggled `registerOpen`, which controlled a `<details>` section located **after** the launch timeline and theme panels. Clicking the tile near the end of the gallery opened the register farther down the document, outside the visible viewport. The behavior was functionally obscured.

## Changes

- `client/src/styles/media-palette.css`: scoped 12px filter column gaps, 14px toolbar gaps, consistent label/control spacing, 20px competition panel padding, and 18px header/highlights separation, including mobile breakpoints.
- `client/src/features/competition/components/MediaCompetitionPanel.tsx`: replaced the out-of-view `<details>` register with a native accessible `<dialog>` modal, opening from the gallery tile **or** the additional `Browse full register` button. Preserved the same search/filters, summary, 8-column table, and source label. The close button, Escape key and backdrop click close the modal; focus is restored to the invoking control. Handles unavailable capture date safely.
- `client/src/features/competition/components/media-competition-wall.css`: styles the modal, dimmed backdrop, responsive dimensions, heading, close button and table overflow in the existing graphite/grey palette.

No changes were made to the underlying Media/Competition data parsers or imported workbook values.

## Checks run

- TypeScript/TSX syntax transpilation: **101 client/server application files, passed**.
- PostCSS parsing: **2 changed stylesheets, passed**.
- Native HTML dialog Chromium smoke check: **showModal, modal state, Escape and Close button passed**. This verifies browser support for the interaction pattern, **not** the full React application.
- `npm ci --offline`: **failed**, because `zod-4.6.5.tgz` was not in the npm cache. Therefore full build, Vitest, lint and in-app browser regression were not verified.
- Capture 1/2 workbooks and the 15 Capture 2 image assets remain unchanged and included.

## How to verify locally

```bash
npm ci
npm run dev
```

Open `http://localhost:5173/media`, select EDIT by Ahmed Seddiqi, then choose 3 November 2026. Scroll to the competitor's wall, click **See all 68 ads**, confirm a centered modal appears immediately and the full register has search, filters and 68 rows before filtering. Verify the close button, Escape and clicking the backdrop. Confirm filter spacing on narrow and wide screens.

Run `npm test && npm run lint && npm run build` after installing dependencies.

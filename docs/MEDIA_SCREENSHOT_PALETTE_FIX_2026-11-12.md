# Media palette: screenshot-specific fix (12 November 2026)

## Reported symptoms

The Media filter toolbar, Competition dropdown, and embedded Competition panel still displayed blue/cyan outlines and backgrounds even after the earlier neutral-palette update. The screenshot also shows August 2026 Media data next to a 3 November 2026 Ad Library capture.

## Cause and changes

- `media-filter-dropdown.css` specifies hardcoded blue border, gradient, checkmark and hover rules for Segment/Brand filters.
- `theme-light.css` contains higher-specificity nested Media Competition panel rules for blue/cyan backgrounds and borders.
- The previous Media palette did not target `.media-filter-trigger`, `.competition-context-trigger`, the custom menus, or several nested controls strongly enough.
- Move the Media palette import to the end of the Media page's stylesheet imports, and explicitly scope the corrected filter, menu, selection and nested capture styles to `.reference-media-page`.
- Preserve the meaning of the independent competition capture. Rewrite the label to make the two reporting dates unambiguous; do not change the capture selection algorithm or underlying data.

## Intended palette

Graphite `#222927`, off-white `#f4f5f3`, white `#ffffff`, muted grey `#5f6b66`, border `#d8dedb`. Amber remains for coverage/awaiting. Green/red remain only for meaningful change indicators.

## Files changed

- `client/src/main.tsx`
- `client/src/pages/MediaDashboardPage.tsx`
- `client/src/features/competition/components/ContextualCompetition.tsx`
- `client/src/styles/media-palette.css`

## Limitations

This update targets the screenshot's visual inconsistency and clarifies a label. It does **not** certify source-data completeness, fix missing GA4 or campaign exports, or change how competition captures are selected. Syntax and ZIP checks are not equivalent to a compiled/browser-tested application.

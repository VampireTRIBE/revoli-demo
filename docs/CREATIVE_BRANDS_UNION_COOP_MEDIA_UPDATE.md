# Creative brands and Union Coop Media reference update

Baseline: Bizcom-Engine-Campaign-Objectives-Updated-Full.zip. No new database, Docker, framework or dependency. Existing files and historical imports retained.

## Creative

| Brand | Verified supplied account source | Implemented display |
|---|---|---|
| Souq Al Bahar | 1,528 dated metric observations, four summary blocks | Facebook/Instagram selector, publishing summary, attention and engagement cards, complete-month comparisons and eight-period history; format and audience summaries behind details |
| Souq Al Jubair | 1,596 dated metric observations, six summary blocks | Facebook account metrics, publishing counts, monthly history, and whole-export format and audience breakdowns |
| Pocari Sweat | 274 daily follower stocks, feed and Stories summaries, existing 5 paid detail rows | Account/content view, latest observed followers, monthly follower history, feed/Stories counts and separately labelled reach, impressions and engagement; Paid view uses four section headers and preserves existing detail metrics |
| Souq Al Haraj | No exact-identity source in the supplied project | Compact awaiting line; no borrowing from Bahar |
| Souq Al Jubail | No exact-identity source in the supplied project | Compact awaiting line; no borrowing from Jubair |
| Union Coop | Existing prepared workbook | Existing reporting preserved |

Pocari's 55 posts, 473 Stories and 15,104 total followers on 1 October 2026 are supplied CSV observations. These are not October totals; the post/Stories summary covers the full export (1 January to 1 October 2026). Follower stocks are never summed. Its account-source identity uses the configured Pocari Buffer export group, which contains the five caption-identified Pocari posts. Unqualified feed and Stories metrics are not asserted to be organic-only. Paid remains the default tab for Pocari; select Account / content for additional metrics. Souq daily reach and viewers are daily averages, not unique monthly audiences. A change requires both months to contain every calendar day of that metric, and a zero comparison denominator is not given a relative percentage. Summary files without dates are shown as whole-export only, not attributed to the selected month. Account-level data cannot support an approved organic Top 3; post-level data and approvals remain required. No brand alias was invented.

## Union Coop Media reference

Based on page 5 of the included `Bizcom Engine Visual Refresh.pdf`. The exact `UnionCoop-Media-Build-Brief-Tech-Team.docx` is not present among the supplied files, and the spend/daily reach register is absent. This implementation follows the supplied reference page's four-section composition, not an invented workbook schema presented as official.

1. Spend and return: source-driven burst cards, count-up values, per-1,000 public-view cost only with a valid denominator, explicit delivery warning, and awaiting site analytics.
2. Paid beside organic: date-ordered native SVG bars, amber for confirmed paid observations, grey for unconfirmed observations. No unsupported organic-only interpretation. Chart only renders when approved daily reach exists.
3. Bursts: compact source-driven rows with platform, objective, flight, boosted-post counts, spend, public/known views and valid cost per 1,000 public views. Awaiting until the register arrives.
4. Competition: side-by-side Carrefour UAE and LuLu Hypermarket capture summaries, source-backed theme bars, capture selector independent of own period, signed-only notes and approved gallery. Compare against still opens the individual capture/register. No inferred performance metrics or spend. No synthetic gallery.

Media retains the separate Rivoli/Union Coop views per the user's latest request to build Union Coop Media. Rivoli defaults to EDIT; Union Coop uses Carrefour/LuLu. Consumer and Search unchanged.

## Validation and limitations

Actual CSV import executed through TypeScript transpilation: 1,528 / 1,596 / 274 observations; 55 posts, 473 Stories and latest follower stock verified. Source aggregation exercised against actual August observations. All dependency-free verification scripts rerun; TypeScript syntax parsed for 132 files (not a semantic build). CSS parsed. Original source files and assets preserved, verified during packaging. `npm ci --offline` failed ENOTCACHED for zod-4.6.5.tgz. Full TypeScript build, API integration and React browser rendering not verified. No claim of pixel-identical layout. Remaining data: Haraj/Jubail exact identity or approved mapping, post-level Souq details, Union Coop spend/reach and site analytics, approved thumbnails and signed period highlights, exact Union Coop Media brief.

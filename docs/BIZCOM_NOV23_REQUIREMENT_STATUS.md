# November 18 simple change document: ordered implementation status

**Scope:** Six requirement sections (30 requested changes), plus the seventh section listing required import files. `Complete in source` does not assert browser/runtime verification. `Partial` means some UI or backend support exists but source data or visual parity is incomplete. `Blocked` means required approved inputs are not available.

| Section / # | Requested behavior | Status (2026-11-23) | Evidence / limitation |
|---|---|---|---|
| Media 1 | Load GA4 v4 and Sep/Oct | Blocked | GA4 v4 absent; no invented channels |
| Media 2 | Approved imported Highlights | Partial | Signed-only handling exists; older Reads file has no approval flag |
| Media 3 | Six-element section headers, deltas and sparklines | Partial | Section anatomy and partial delta/spark coverage; not every metric |
| Media 4 | Imported campaign Objective, separate rankings | Partial | Explicit Objective import field implemented; old workbook lacks field, so rankings disabled |
| Media 5 | Campaign thumbnail, short name and long hover | Blocked | Short names exist; approved campaign image mapping absent |
| Media 6 | Union Coop Media reference page | Partial | Layout and awaiting states exist; spend/burst sources absent |
| Creative 1 | Union Coop why-it-worked import | Partial | Import present; approved text and thumbnails not complete |
| Creative 2 | Rename neutral Engagement section | Complete in source | Section label and question updated |
| Creative 3 | One signed highlight per section, pending once per tab | Partial | Section support; full signed feed absent |
| Creative 4 | Comparable deltas and 8-period sparks | Partial | Missing-period gaps preserved; not every KPI mapped |
| Creative 5 | Verified October five-channel workbook | Blocked | Approved October source absent |
| Consumer 1 | Unified paper/ink design | Partial | Shared tokens installed; browser visual parity unverified |
| Consumer 2 | Union Coop customer comment types | Blocked | Approved monthly source absent, awaiting line shown |
| Consumer 3 | Preserve Rivoli Consumer and order-export caveat | Complete in source | Existing Rivoli module preserved |
| Search 1 | Search head with Classic and AI | Complete in source | `/search` route and both panels exist |
| Search 2 | Move GEO into AI search panel | Complete in source | `/geo` redirect and CLEO retained |
| Competition 1 | Carrefour/LuLu October and November | Blocked | New approved workbooks absent |
| Competition 2 | Draft Highlights only after sign-off | Complete in source | Parser strictly checks approval; Google drafts hidden |
| Competition 3 | Approved Carrefour/LuLu gallery / awaiting | Partial | Awaiting available, gallery source absent |
| Competition 4 | EDIT Meta captures and 15-image gallery | Complete in source | Meta register has 68 IDs; 15 gallery files validated |
| Competition 5 | EDIT Google capture, channel selector | Complete in source | New 18 Nov workbook added, 30 sample rows represented |
| Competition 6 | Google reported ~200 versus 30 sampled | Complete in source | Separate labeled figures; 11/5/7/7 format breakdown |
| Competition 7 | Separate Compare-against from report filters | Complete in source | Toolbar, off state and selection behavior; browser not verified |
| Competition 8 | Persistent dark competitor strip | Complete in source | Channel-specific source strip in Competition panel |
| Look 1 | One signed serif hero per tab | Partial | Shared style exists, signed source not supplied |
| Look 2 | Only approved imagery | Partial | EDIT gallery verified; other client image sources missing |
| Look 3 | Thin amber awaiting state | Partial | New components comply; some older cards remain |
| Look 4 | Meaning-based colors and platform palette | Partial | Shared tokens exist; complete visual audit not run |
| Look 5 | Warning chips on individual cards | Partial | Several badges exist, not comprehensive |
| Look 6 | Count-up, chart draw-once, rates on hover | Partial | Selected numeric cards count once; complete chart/hover coverage incomplete |

**Totals: 10 complete in source, 15 partial, 5 blocked.** None of these totals should be presented as production validation.

## PDF-specific coverage

- **Bizcom Engine Changes Simple, 18 Nov:** as above.
- **Bizcom Engine Visual Refresh:** theme, shared section components and selected animations implemented; full pixel comparison and all board-specific UI details remain partial.
- **Competition Capture Import Spec v2:** Meta/Google and legacy capture support implemented; missing Google-only identifiers remain uncaptured; Union Coop multi-competitor v2 cannot be verified until the November workbook arrives.
- **Competition capture renders:** EDIT Meta gallery and Google 30-record source imported; Carrefour/LuLu comparison mockup still awaits approved input. Never substitute screenshot examples for workbook data.

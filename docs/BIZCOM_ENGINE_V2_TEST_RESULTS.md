# Bizcom Engine V2: tests and verification

**This implementation has NOT passed a complete production build.** The npm installation was blocked by unavailable registry packages, and runtime visual QA could not be performed. Source syntax and raw workbook verification are not substitutes for a browser integration test.

| Check | Status | Evidence |
|---|---|---|
| TypeScript and TSX syntax | Passed | Parsed all 106 application source files using the globally available TypeScript parser (no parse errors) |
| Bizcom V2 CSS stylesheet | Passed | `tinycss2.parse_stylesheet` found zero parsing errors |
| Original EDIT Nov workbook | Passed | `python scripts/verify_bizcom_sources.py` confirmed 68 distinct Library IDs |
| EDIT Gallery mapping | Passed | 15 matching gallery records and 15 existing image files |
| CLEO workbook structure | Passed | Six named data sheets plus the README present |
| `npm ci --offline` | Failed | `ENOTCACHED`, required `zod` package unavailable in npm cache |
| `npm ci --prefer-offline` | Failed/timed out | Registry fetch did not finish within the attempted run; partial `node_modules` removed from final ZIP |
| `npm run build` | Failed | `TS2688` missing type definition packages including `adm-zip`, `babel__core`, etc., due to incomplete npm installation |
| `npm run lint` | Not executed | No successfully installed local ESLint runtime |
| Vitest unit/integration tests | Not executed | Dependencies unavailable. New synthetic V2 parser tests are included for the next environment |
| Browser interaction checks | Not executed | Could not start the full app without dependencies |
| Responsive screenshots | Not executed | No live runtime was available for a reliable app screenshot |
| Final ZIP integrity | To be checked after packaging | See final delivery verification |

## Local follow-up checks

```bash
npm ci
npm run lint
npm test
npm run build
npm run dev
```

Open the running application and verify `/search?panel=ai`, `/media`, `/media?client=union-coop`, `/creative`, `/consumer?client=union-coop`, and an EDIT November capture. Check the full-register dialog (open, search/filter, Escape, close), source badge strip, channel switching, and viewport widths 1440, 1024, 768 and 390px. Do not declare production-ready until these pass.

## Creative crash repair verification, 19 November 2026

- Root script `npm run verify:creative`, executed using globally available TypeScript for the isolated slot runtime check: **PASS**. All four Creative slots preserve `client`, `year`, and `month`; the former unbound-variable `ReferenceError` does not recur in this contract test.
- TypeScript/TSX parser check of **117** application/test source files: **PASS**, zero parser diagnostics. This does not establish type correctness.
- Stylesheet syntax check of **16** CSS files: **PASS**, zero parse errors.
- `python scripts/verify_bizcom_sources.py`: **PASS**, 68 distinct November EDIT IDs and 15 valid thumbnail matches.
- `python tools/validate_cleo_source.py`: **PASS**, all seven workbook sheets; 12 question rows; 815 all-topic answers and 3 Union Coop appearances (0 verified wins).
- `npm ci --ignore-scripts --no-audit --no-fund --fetch-retries=0 --fetch-timeout=12000`: **FAILED** in this environment, npm error `Exit handler never called!`. Required dependencies remain unavailable.
- Full `npm run build`, Vitest, ESLint, and actual live browser rendering: **NOT VERIFIED** because dependency installation did not succeed.

See `docs/BIZCOM_FOUR_PDF_REQUIREMENTS_AUDIT_2026-11-19.md` for document-by-document implementation statuses and missing inputs.

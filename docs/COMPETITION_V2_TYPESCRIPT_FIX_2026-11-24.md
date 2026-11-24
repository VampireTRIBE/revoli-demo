# Competition V2 strict TypeScript compile fixes (24 November 2026)

## Baseline
Updated directly from the user-provided `Bizcom-Engine-V2-Nov23-Full-Updated(1).zip`.
This is the Nov23 source build supplied in the current message, not a separate MongoDB-migrated archive.

## Source changes

### `server/src/modules/competition/import/capture-v2-parser.ts`
- Guard each slash-delimited date component before converting to numbers for `Date.UTC`.
- Check the parsed UTC year in addition to the day and month, to reject invalid dates.
- Guard the optional `RegExpExecArray[1]` capture before passing it to `numeric(string)`.
- Narrow the candidate register `sampleRow` before calling `get(Row, ...)`.
- Explicitly type `rowDate` as `string` once a capture date has been verified.

### `server/tests/competition-v2-import.test.ts`
- Explicitly verify the returned Google capture exists before asserting its fields.
- Guard the initial Google observation before reading its properties.
- Explicitly verify both Carrefour and LuLu captures exist before assertions.

These edits address the specific TS2769, TS18048, TS2345, TS7022, and TS2532 errors supplied by the user without disabling strict null checks or adding unsafe casts.

## Validation actually performed
- PASS: Node `scripts/verify_creative_render_contract.cjs`.
- PASS: TypeScript compiler parser syntax diagnostics across 119 TS/TSX source and test files: zero errors.
- PASS: Full ZIP CRC/entry integrity and original source file preservation.
- BLOCKED: Full backend `tsc -p server/tsconfig.json` cannot be verified in this environment: `npm ci --offline` fails with `ENOTCACHED` for `zod-4.6.5.tgz`, and the normal npm install did not complete. A subsequent compiler invocation reports missing dependency type packages.
- NOT EXECUTED: Vitest runtime tests, which require the npm dependencies.

## How to verify in a network-enabled environment
```bash
npm ci
npm run build --workspace server
npm run test --workspace server
npm run build
```

The application data, existing spreadsheets, other application modules, and PDFs are unchanged.

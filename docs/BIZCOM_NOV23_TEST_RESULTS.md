# Test evidence and limitations (23 Nov 2026)

| Check | Result | Description |
|---|---|---|
| Creative isolated contract | PASS | `node scripts/verify_creative_render_contract.cjs`, checks Creative slots and loading/error ordering |
| TypeScript/TSX parser | PASS | 118 project TS/TSX sources parsed using globally available TypeScript (syntax only) |
| CSS parser | PASS | 16 project CSS files parsed using globally available PostCSS (syntax only) |
| Google workbook raw source | PASS | 30 capture records, 11 Search / 5 Local / 7 Shopping / 7 Display, approx. 200 reported in source Read Me |
| Google sample status logic | PASS | Isolated `activeObservations` check retains 30 Google observed rows while preserving Meta Active-only filtering |
| Google payer fields | PASS | 28 own payer, 1 Amnet MENA, 1 Ethinos; no inferred spend |
| Meta source | PASS | 68 distinct Library IDs, 15 gallery rows and 15 existing images |
| Google/Meta integration test | NOT EXECUTED | Added `server/tests/competition-google-capture.test.ts`, requires Vitest and `xlsx` from npm |
| npm ci | FAILED / BLOCKED | Offline cache missing zod-4.6.5.tgz. Online install timed out. |
| npm test | FAILED / BLOCKED | Vitest unavailable without npm dependencies |
| npm lint | NOT EXECUTED | Requires npm dependencies; no claim of a passed lint |
| npm build | NOT VERIFIED | Dependencies absent; successful production compile cannot be claimed |
| Browser interaction/responsive | NOT VERIFIED | React application could not be launched without node_modules |
| ZIP CRC / required files | TO VERIFY AT PACKAGE TIME | Archive build and integrity verification run in delivery step |

These checks are intentionally narrower than a working application or complete UI certification.

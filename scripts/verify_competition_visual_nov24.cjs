/** Source contract smoke checks, not a replacement for tsc, Vitest or browser tests. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const tests = [
  ['Preserve npm workspaces', () => ['client','server'].every((w)=>JSON.parse(read('package.json')).workspaces.includes(w))],
  ['No new Docker infrastructure', () => !fs.existsSync(path.join(root,'docker-compose.yml'))&&!fs.existsSync(path.join(root,'compose.yaml'))],
  ['Union Coop workbook v2 routing', () => /SheetNames\.some\(\(name\).*register/.test(read('server/src/modules/competition/import/competition-source-parser.ts'))],
  ['Per-competitor delta routing', () => read('server/src/modules/competition/import/capture-v2-parser.ts').includes("config.id==='carrefour-uae'")],
  ['Signed-only Highlights', () => read('server/src/modules/competition/import/capture-v2-parser.ts').includes("'yes','signed','approved'")],
  ['Approved-only ZIP/gallery joins', () => ['hydrateApprovedGalleryAsset','getEntries()', 'byId.get(id)'].every((x)=>read('server/src/modules/competition/import/capture-v2-parser.ts').includes(x))],
  ['Meta and Google channel chip', () => fs.existsSync(path.join(root,'client/src/features/competition/components/CompetitionChannelChip.tsx'))],
  ['Dark source strip and off selector', () => ['COMPETITOR VIEW','Off - own performance'].every((x)=>read('client/src/features/competition/components/ContextualCompetition.tsx').includes(x))],
  ['Thin awaiting state', () => read('client/src/features/competition/components/ContextualCompetition.tsx').includes('role="status"')],
  ['Google sample vs population', () => ['reportedPopulation','sampleSize'].every((x)=>read('server/src/modules/competition/import/capture-v2-parser.ts').includes(x))],
  ['EDIT Meta Capture 2 preserved', () => fs.existsSync(path.join(root,'spreadsheets data/compititaion-tab/EDIT-AdLibrary-Capture2-03Nov2026.xlsx'))],
  ['EDIT Google Capture 1 preserved', () => fs.existsSync(path.join(root,'spreadsheets data/compititaion-tab/EDIT-Google-Capture1-18Nov2026.xlsx'))],
  ['All 15 EDIT images preserved', () => fs.readdirSync(path.join(root,'server/data/competition-assets/edit-by-ahmed-seddiqi/2026-11-03')).filter((x)=>/\.png$/.test(x)).length===15],
];
let failed=0;
for(const [name,fn] of tests){try{const ok=fn();console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}catch(e){failed++;console.error('FAIL',name,String(e));}}
console.log(`${tests.length-failed}/${tests.length} source checks passed`);
process.exitCode=failed?1:0;

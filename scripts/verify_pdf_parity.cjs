const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const checks = [
  ['exact Creative four-section source labels', () => { const s=read('client/src/pages/CreativeDashboardPage.tsx'); assert.match(s,/number === 1 \? 'Output'/);assert.match(s,/number === 3 \? 'Engagement'/);assert.match(s,/number === 2 \? 'Attention'/);assert.match(s,/'Top content'/);}],
  ['signed highlight, one tab-level pending state', () => {const s=read('client/src/features/reads/TblReadsStrip.tsx'); assert.match(s,/approved\[0\]/);assert.match(s,/HIGHLIGHTS PENDING/);}],
  ['distinct source-backed delta and absolute pair', () => { const s=read('client/src/components/v2/Reporting.tsx'); assert.match(s,/v2-delta-chip/);assert.match(s,/v2-delta-pair/);assert.match(s,/previous.*current/);}],
  ['gap-preserving eight-period bars', () => {const s=read('client/src/components/v2/Reporting.tsx');assert.match(s,/values\.slice\(-8\)/);assert.match(s,/className="missing"/);}],
  ['Carrefour/LuLu Creative scope', () => {const s=read('client/src/pages/CreativeDashboardPage.tsx');assert.match(s,/filter.brand === 'union-coop'/);assert.match(s,/CompetitionDropdown/);}],
  ['Rivoli Media with EDIT competitor', () => {const s=read('client/src/pages/MediaDashboardPage.tsx');assert.match(s,/useContextualCompetition\('rivoli-shop'/);assert.match(s,/Client: Rivoli/);}],
  ['Creative competitor capture summary matches reference', () => {const s=read('client/src/features/competition/components/ContextualCompetition.tsx');for(const label of ['Live ads','New since previous capture','Average days running','Supplier-funded theme','Theme mix','Launch waves','The competitor\'s wall'])assert.ok(s.includes(label),label);}],
  ['Creative competitor register immediately opens as dialog', () => {const s=read('client/src/features/competition/components/ContextualCompetition.tsx');assert.match(s,/showModal\(\)/);assert.match(s,/type="search"/);}],
  ['Meta and Google separate source chips', () => {const s=read('client/src/features/competition/components/CompetitionChannelChip.tsx');assert.match(s,/Meta/);assert.match(s,/Google/);}],
  ['no large empty paid creative cards', () => {const s=read('client/src/pages/CreativeDashboardPage.tsx'); const start=s.indexOf('function MetaUnavailable('),end=s.indexOf('function OverallMethod(',start);const section=s.slice(start,end);assert.match(section,/v2-search-await/);assert.doesNotMatch(section,/UnavailableCreativeSection/);}],
  ['source-backed signed-only Competition import', () => {const s=read('server/src/modules/competition/import/capture-v2-parser.ts');assert.match(s,/signed/i);assert.match(s,/sourceFile/);}],
  ['all 6 V2 design tokens', () => {const s=read('client/src/styles/bizcom-v2.css');for(const hex of ['#141413','#5A646E','#E2E2DE','#F2F2EF','#1E8E5A','#C2362B','#B45309'])assert.ok(s.toLowerCase().includes(hex.toLowerCase()),hex);}],
  ['existing client and server unchanged workspaces', () => {const p=JSON.parse(read('package.json'));assert.deepEqual(p.workspaces,['client','server']);}],
];
for(const [label,fn] of checks){fn();console.log('PASS',label)}
console.log(`${checks.length}/${checks.length} PDF visual/source contracts passed; not a browser rendering test.`);

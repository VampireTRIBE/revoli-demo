/* Dependency-free contract/source check for Creative brand selection. */
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const base=path.join(__dirname,'..');
const source=(p)=>fs.readFileSync(path.join(base,p),'utf8');
const service=source('server/src/modules/creative/services/creative.service.ts');
const page=source('client/src/pages/CreativeDashboardPage.tsx');
const config=source('server/src/modules/creative/config/creative-source.config.ts');
const filters=source('client/src/features/creative/components/CreativeFilters.tsx');
assert.match(service,/brands: creativeBrands\.map\(/,'source-labelled Souq brands must not be hidden from selector');
assert.match(service,/brandYears,/,'brand-specific month coverage missing');
assert.match(service,/brand\.id === 'pocari-sweat'/,'Pocari paid export scope missing');
assert.match(filters,/options\.brandYears\?\.\[brand/,'filters must honor brand-specific months');
assert.match(page,/setMainTab\(filter\.brand === 'pocari-sweat' \? 'paid'/,'Pocari should open on Paid tab');
assert.match(page,/source-backed account metrics/,'Souq account observations must be visible');
assert.match(service,/without approved identity confirmation/,'unverified Souq identity must not be re-labelled');
assert.match(page,/onFilterChange\(\{ month: 0 \}\)/,'switching to Pocari paid must select whole export');
const data=path.join(base,'spreadsheets data','creative');
const checks=[
 ['pocari-sweat/buffer-posts-analytics-csv/posts-20260101-to-20261001.csv', 'Pocari source'],
 ['souqs/SOUQ Al Jubair and Bahar/Souq Al JUbair Views .csv','Souq Al Jubair source'],
 ['souqs/SOUQ Al Jubair and Bahar/Souq Al Bahar Views .csv','Souq Al Bahar source'],
];
for(const [p,label] of checks){ const full=path.join(data,...p.split('/'));assert.ok(fs.statSync(full).size>0,`${label} missing`); }
const allSouq=fs.readdirSync(path.join(data,'souqs','SOUQ Al Jubair and Bahar')).join('\n').toLowerCase();
assert.ok(!allSouq.includes('souq al haraj'),'Haraj-specific source unexpected; update audit if found');
assert.ok(!allSouq.includes('souq al jubail'),'Jubail-specific source unexpected; update audit if found');
console.log('PASS: brand-specific selector periods, Pocari paid mode, source-labelled Souq account data and identity guards.');

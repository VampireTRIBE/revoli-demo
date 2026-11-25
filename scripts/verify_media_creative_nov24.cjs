// Source contract test, deliberately does not claim to be a React runtime/build test.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=(filename)=>fs.readFileSync(path.join(root,filename),'utf8');
const checks=[
  ['Creative prepared workbook imported', fs.existsSync(path.join(root,'spreadsheets data/creative/union-coop/UnionCoop-Creative-WhyItWorked-Import.xlsx'))],
  ['Creative monthly KPI aggregation uses source post metrics', read('server/src/modules/creative/services/creative.service.ts').includes('buildPreparedMonthlyKpis(prepared, selected.year)')],
  ['Creative KPI history display', read('client/src/pages/CreativeDashboardPage.tsx').includes('creativeHistory(data,')],
  ['Creative Top3 displays imported factors rather than unsigned prose', read('client/src/pages/CreativeDashboardPage.tsx').includes('Imported factors:')],
  ['Creative plain heading', read('client/src/pages/CreativeDashboardPage.tsx').includes("name = number === 1 ? 'Output'")],
  ['Signed Highlights required', read('server/src/modules/reads/services/reads.service.ts').includes("if (!['yes','signed','approved','true','1'].includes(signed)) {")],
  ['Media source-backed section labels and Rivoli Competition', ['Spend and return','Acquisition cost','Channels','Campaigns','Competition'].every(label=>read('client/src/pages/MediaDashboardPage.tsx').includes(`label="${label}"`)) && read('client/src/pages/MediaDashboardPage.tsx').includes("useContextualCompetition('rivoli-shop'")],
  ['Media monthly histories', read('server/src/modules/media/services/media-analytics.service.ts').includes('getMediaKpiHistory')],
  ['Media GA4 optional workbook', read('server/src/modules/media/services/media-supplements.service.ts').includes('Rivoli-Consumer-GA4-Import-v4.xlsx')],
  ['Media Union Coop optional workbook', read('server/src/modules/media/services/media-supplements.service.ts').includes('UnionCoop-Media-Burst-Import.xlsx')],
  ['Campaign Objectives only imported', read('server/src/modules/media/import/source-parser.ts').includes('verifiedObjective(value(row, \'Objective\'))')],
  ['Approved campaign asset mapping', read('server/src/modules/media/import/source-parser.ts').includes('Campaign Metadata')],
  ['Original npm workspace preserved', JSON.stringify(require(path.join(root,'package.json')).workspaces)==='["client","server"]'],
  ['No Docker introduced', !fs.existsSync(path.join(root,'docker-compose.yml'))&&!fs.existsSync(path.join(root,'compose.yml'))],
];
for(const [name,passed] of checks){console.log(`${passed?'PASS':'FAIL'} ${name}`);assert.ok(passed,name)}
console.log(`All ${checks.length} source-contract checks passed. Browser and TS semantic compilation are separate checks.`);

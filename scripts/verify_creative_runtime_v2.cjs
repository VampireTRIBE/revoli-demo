/** Execute the actual Creative service without npm dependencies, using source-shaped fixtures.
 * This does not replace React/browser or xlsx integration testing.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const file = path.join(root, 'server/src/modules/creative/services/creative.service.ts');
const source = fs.readFileSync(file,'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const brand={id:'union-coop',label:'Union Coop',account:'union.coop',postLevelAvailable:true,paidPostLevelAvailable:false,accountLevelAvailable:false};
const post=(month)=>({postId:`post-${month}`,year:2026,month,brandId:'union-coop',publishedAtDubai:`2026-${String(month).padStart(2,'0')}-15 12:00`,postType:'Post',reach:1000,views:2000,activeActions:40,activeEngagementRate:.04,frequency:2,eligibleForRanking:true,language:'Arabic',giveaway:false,band:'Top',theme:'Uncategorized',caption:'Source caption',postUrl:'https://example.com',day:'Fri',timeSlot:'Noon',followsFromPost:3,sourceFile:'prepared.xlsx'});
const benchmark=(month,stories,output,partial)=>({year:2026,month,stories,publishedOutput:output,partial,eligiblePosts:30,rankingEligiblePosts:30,medianActiveEngagementRate:.05,meanActiveEngagementRate:.05,medianFrequency:1.4,giveawayPosts:4,giveawayActionShare:.4,sourceFile:'prepared.xlsx'});
const dataset={posts:[8,9].map(m=>({brandId:'union-coop',year:2026,month:m,publishedAt:`2026-${String(m).padStart(2,'0')}-15T00:00:00.000Z`,postType:'Post',postId:`post-${m}`})),paidPosts:[],accountDailyMetrics:[],accountSummarySections:[],accountAudit:{mappedFiles:[],flaggedFiles:[],malformedDailyRows:0},coverage:[],audit:{sourceSelectionRule:'source',conflictingPostCount:0},paidAudit:{accountPaidPostCount:0},paidSummary:{},preparedImport:{sourceFile:'prepared.xlsx',postMetrics:[post(8),post(9)],monthlyTopPosts:[],monthlyBenchmarks:[benchmark(8,219,271,false),benchmark(9,147,175,true)],creativeCuts:[]}};
const modules={
 '../config/creative-source.config.js':{creativeBrands:[brand],creativeScoringMode:'disabled',CREATIVE_TIMEZONE:'UTC',paidMetaSource:{reportingPeriodStart:'2026-01-01',reportingPeriodEnd:'2026-10-01'}},
 '../calculations/creative-calculations.js':{calculateOrganic:()=>({eligiblePostCount:2,summedPostReach:2000,totalViews:4000,activeActions:80,activeEngagementRate:.04,frequency:2,watchTimeCoverage:{populatedReels:0,totalReels:0},posts:[]}),calculatePaidCreative:()=>({detailRecordCount:0,records:[],videos:[],statics:[]})},
 '../import/creative-source-parser.js':{parseCreativeSources:()=>dataset},
};
const sandbox={exports:{},require:(name)=>{assert.ok(modules[name],`unexpected dependency ${name}`);return modules[name];}};
vm.runInNewContext(compiled,sandbox,{filename:file,timeout:5000});
const {getCreativeOptions,getCreativeDashboard}=sandbox.exports;
const options=getCreativeOptions();
assert.equal(options.brandYears['union-coop'][0].months.find(row=>row.month===8).partial,false,'Aug is full despite last post on day 15');
assert.equal(options.brandYears['union-coop'][0].months.find(row=>row.month===9).partial,true,'Sep flagged partial');
const aug=getCreativeDashboard({year:2026,month:8,brand:'union-coop'});
const sep=getCreativeDashboard({year:2026,month:9,brand:'union-coop'});
assert.equal(aug.partial,false);
assert.equal(sep.partial,true);
assert.equal(aug.organic.preparedInsights.monthlyKpis.find(r=>r.month===8).stories,219);
assert.equal(aug.organic.preparedInsights.monthlyKpis.find(r=>r.month===8).publishedOutput,271);
assert.equal(sep.organic.preparedInsights.monthlyKpis.find(r=>r.month===9).partial,true);
console.log('PASS Creative actual service runtime: Aug/Sep reporting completeness, Stories and published output.');

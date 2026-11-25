/** Run real source parser / analytics using workbook cells extracted by openpyxl.
 * This is a dependency-light regression, not an Express, MongoDB or browser test.
 * Requires TypeScript and Python openpyxl. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');process.chdir(root);
const workbookDir=path.join(root,'spreadsheets data/media/rivoli');
const paths=fs.readdirSync(workbookDir).filter(n=>n.endsWith('.xlsx')).map(n=>path.join(workbookDir,n));
const raw=JSON.parse(execFileSync('python',['-c',`import openpyxl,json,sys,datetime
out={}
for p in sys.argv[1:]:
 w=openpyxl.load_workbook(p,read_only=True,data_only=True)
 out[p]={s.title:[list(r) for r in s.values] for s in w};w.close()
print(json.dumps(out,default=str))`,...paths],{maxBuffer:32*1024*1024}));
const xlsx={readFile(p){const sheets=raw[p];assert.ok(sheets,p);return {SheetNames:Object.keys(sheets),Sheets:sheets};},utils:{sheet_to_json(sheet,opts={}){const start=opts.range??0;const headers=sheet[start]??[];return sheet.slice(start+1).filter(r=>r.some(v=>v!==null)).map(r=>Object.fromEntries(headers.flatMap((h,i)=>h===null?[]:[[String(h),r[i]??opts.defval??null]])));}}};
const cache=new Map();
function load(file){if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);const out=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 const req=id=>id==='xlsx'?xlsx:id.includes('repositories/media.repository')?{readDataset:async()=>null}:id.startsWith('.')?load(path.resolve(path.dirname(file),id.replace(/\.js$/,'.ts'))):require(id);
 vm.runInNewContext(out,{module,exports:module.exports,require:req,Date,Buffer,console,process},{filename:file,timeout:10000});return module.exports;}
(async()=>{const base=path.join(root,'server/src/modules/media');const parser=load(path.join(base,'import/source-parser.ts'));const d=parser.parseMediaSources(paths);assert.equal(d.campaigns.filter(r=>r.platform==='Google Ads').length,145);assert.equal(d.campaigns.filter(r=>r.platform==='Google Ads'&&r.objective==='Awareness').length,29);assert.equal(d.campaigns.filter(r=>r.platform==='Meta Ads'&&r.objective==='Traffic').length,77);assert.equal(d.campaigns.filter(r=>r.platform==='Meta Ads'&&r.objective==='Awareness').length,6);assert.equal(parser.googleNamedObjective('TTN_PMAX'),null);assert.equal(parser.googleNamedObjective('TTN_AWARENESS_TRAFFIC'),null);
const a=load(path.join(base,'services/media-analytics.service.ts'));const periods=await a.getPeriods();assert.equal(periods.years[0].months.length,10);const seg=await a.getSegments({year:2026});const brands=await a.getBrands({year:2026,segment:['Swiss']});assert.ok(seg.segments.some(r=>r.label==='Swiss'));assert.ok(brands.brands.some(r=>r.label==='Omega'));const oct=await a.getPlatforms({year:2026,month:10,segment:['Swiss'],brand:['Omega']});assert.ok(oct.platforms.every(r=>r.spend===null));assert.match(oct.metadata.sourcePeriodLabel,/October 2026/);const aug=await a.getPlatforms({year:2026,month:8,segment:['Swiss'],brand:['Omega']});assert.ok(aug.platforms.some(r=>r.spend>0));const ga=load(path.join(base,'services/media-supplements.service.ts')).getGa4V4(2026);assert.equal(ga.available,true,ga.reason);assert.equal(ga.summaries.find(r=>r.month===10).netRevenueAed,3026634);assert.equal(ga.channels.filter(r=>r.month===10).length,17);const campaigns=await a.getCampaigns({year:2026,platform:'Google Ads',page:1,limit:1000,sort:'spend',order:'desc'});assert.ok(campaigns.campaigns.some(r=>r.objective==='Awareness'));console.log('PASS actual workbook cells through source parser and analytics (openpyxl adapter; database unavailable).');console.log('Yearly segments:',seg.segments.length,'Swiss brands:',brands.brands.length,'Google aggregated campaigns:',campaigns.campaigns.length,'October spend:',oct.platforms.map(r=>r.spend));})().catch(e=>{console.error(e);process.exitCode=1});

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
(async()=>{
 const page=fs.readFileSync(path.join(root,'client/src/pages/MediaDashboardPage.tsx'),'utf8');
 const dropdown=fs.readFileSync(path.join(root,'client/src/features/media/components/MediaPeriodFilters.tsx'),'utf8');
 assert.match(page,/const optionYearFilter = useMemo<MediaFilter>\(\(\) => \({\s*year: filter.year,\s*}\), \[filter.year\]\)/);
 assert.ok(page.includes('useSegments(optionYearFilter)'));
 assert.match(page,/\.\.\.optionYearFilter,\s*segment: filter.segment/);
 assert.ok(page.includes('useBrands(brandFilter)'));
 assert.ok(page.includes('useOverview(filter)') && page.includes('usePlatforms(filter)'));
 assert.ok(page.includes('year === filter.year ? { ...filter, year, month }'));
 assert.ok(dropdown.includes('>{entry.label}</option>') && !dropdown.includes('(partial)'));
 for(const [name,source] of [['MediaDashboardPage.tsx',page],['MediaPeriodFilters.tsx',dropdown]]){
  const result=ts.transpileModule(source,{fileName:name,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}});
  assert.equal(result.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
 }
 const a=load(path.join(root,'server/src/modules/media/services/media-analytics.service.ts'));
 const periods=await a.getPeriods();const months=periods.years.find(r=>r.year===2026).months;
 assert.ok(months.some(r=>r.month===10));assert.equal(typeof months.find(r=>r.month===9).partial,"boolean");
 const seg=await a.getSegments({year:2026});const brands=await a.getBrands({year:2026,segment:['Swiss']});
 const allBrands=await a.getBrands({year:2026});
 assert.ok(seg.segments.some(r=>r.label==='Swiss'));assert.ok(brands.brands.some(r=>r.label==='Omega'));
 assert.ok(allBrands.brands.length>brands.brands.length);
 const oct=await a.getPlatforms({year:2026,month:10,segment:['Swiss'],brand:['Omega']});
 assert.ok(oct.platforms.every(r=>r.spend===null));
 const aug=await a.getPlatforms({year:2026,month:8,segment:['Swiss'],brand:['Omega']});assert.ok(aug.platforms.some(r=>r.spend>0));
 const overallOct=await a.getPlatforms({year:2026,month:10});assert.ok(overallOct.platforms.every(r=>r.spend===null&&r.platformClaims===null));
 const history=await a.getMediaKpiHistory({year:2026});assert.ok(!history.months.some(r=>r.month===10&&r.spend!==null));
 const supplements=load(path.join(root,'server/src/modules/media/services/media-supplements.service.ts'));
 const ga4=supplements.getGa4V4(2026,10);assert.ok(ga4.available);assert.equal(ga4.itemPurchaseBreakdown.length,1);
 const item=ga4.itemPurchaseBreakdown[0];assert.equal(item.itemRevenueAed,3289187);assert.equal(item.reportedPurchases,2063);assert.equal(item.totalsConsistent,false);
 const sept=supplements.getGa4V4(2026,9).itemPurchaseBreakdown[0];assert.equal(sept.itemRevenueAed,2253199);assert.equal(sept.reportedPurchases,1245);assert.equal(sept.totalsConsistent,false);
 const card=fs.readFileSync(path.join(root,'client/src/features/media/components/OverviewCards.tsx'),'utf8');
 const platform=fs.readFileSync(path.join(root,'client/src/features/media/components/PlatformComparisonTable.tsx'),'utf8');
 for(const [name,source] of [['OverviewCards.tsx',card],['PlatformComparisonTable.tsx',platform]]){
  const result=ts.transpileModule(source,{fileName:name,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}});assert.equal(result.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
 }
 assert.ok(card.includes('selectedMonth&&!scopedSelection&&ga4?.available'));assert.ok(card.includes('not net revenue or verified order AOV'));assert.ok(card.includes('missing.length?<AwaitingLine'));assert.ok(platform.includes('if(!hasData)return <AwaitingLine'));
 console.log('PASS October acquisition: no platform data, GA4 component totals and discrepancy flag, selected-scope UI guards, TSX syntax. Gross item revenue per reported purchase:', item.itemRevenueAed/item.reportedPurchases);

 console.log('PASS filter query scope, month labels, TSX syntax and real workbook-cell analytics (openpyxl adapter, no database/browser).');
 console.log('Yearly segments:',seg.segments.length,'All brands:',allBrands.brands.length,'Swiss brands:',brands.brands.length,'October spend:',oct.platforms.map(r=>r.spend));
})().catch(e=>{console.error(e);process.exitCode=1});

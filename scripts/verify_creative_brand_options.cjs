/** Isolated execution of the real Creative options function using a minimal source fixture. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('typescript');
const root=path.join(__dirname,'..');
const filepath=path.join(root,'server/src/modules/creative/services/creative.service.ts');
const source=fs.readFileSync(filepath,'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const brands=[
 {id:'union-coop',label:'Union Coop',account:null,postLevelAvailable:true,paidPostLevelAvailable:false,accountLevelAvailable:false},
 {id:'souq-al-bahar',label:'Souq Al Bahar',account:null,postLevelAvailable:false,paidPostLevelAvailable:false,accountLevelAvailable:true},
 {id:'souq-al-jubair',label:'Souq Al Jubair',account:null,postLevelAvailable:false,paidPostLevelAvailable:false,accountLevelAvailable:true},
 {id:'souq-al-haraj',label:'Souq Al Haraj',account:null,postLevelAvailable:false,paidPostLevelAvailable:false,accountLevelAvailable:false},
 {id:'souq-al-jubail',label:'Souq Al Jubail',account:null,postLevelAvailable:false,paidPostLevelAvailable:false,accountLevelAvailable:false},
 {id:'pocari-sweat',label:'Pocari Sweat',account:null,postLevelAvailable:false,paidPostLevelAvailable:true,accountLevelAvailable:false},
];
const coverage=(brandId,date)=>({brandId,platform:'facebook',metric:'views',sourceFile:'real-source.csv',startDate:date,endDate:date,rowCount:1,grain:'daily-account'});
const dataset={
 posts:[{brandId:'union-coop',publishedAt:'2026-08-15T09:00:00Z'}],
 paidPosts:[{brandId:'pocari-sweat',publishedAt:'2026-03-25T09:00:00Z'}],
 accountDailyMetrics:[{brandId:'souq-al-jubair',date:'2026-08-05'},{brandId:'souq-al-bahar',date:'2026-05-17'}],
 coverage:[coverage('souq-al-jubair','2026-08-05'),coverage('souq-al-bahar','2026-05-17')],
 preparedImport:{postMetrics:[]},
};
const modules={
 '../config/creative-source.config.js':{creativeBrands:brands,creativeScoringMode:'disabled',CREATIVE_TIMEZONE:'UTC',paidMetaSource:{reportingPeriodStart:'2026-01-01',reportingPeriodEnd:'2026-10-01'}},
 '../calculations/creative-calculations.js':{calculateOrganic:()=>({}),calculatePaidCreative:()=>({})},
 '../import/creative-source-parser.js':{parseCreativeSources:()=>dataset},
};
const sandbox={exports:{},require:(name)=>{assert.ok(modules[name],`unexpected dependency ${name}`);return modules[name]}};
vm.runInNewContext(compiled,sandbox,{filename:filepath,timeout:5000});
const options=sandbox.exports.getCreativeOptions();
for(const brand of brands) assert.ok(options.brands.some((item)=>item.id===brand.id),`${brand.id} must be listed`);
assert.deepEqual(Array.from(options.brandYears['pocari-sweat'][0].months.map((m)=>m.month)),[0], 'Pocari must expose only whole-export period');
assert.ok(options.brandYears['souq-al-jubair'][0].months.some((m)=>m.month===8),'Jubair must offer its recorded month');
assert.ok(options.brandYears['souq-al-bahar'][0].months.some((m)=>m.month===5),'Bahar must offer its recorded month');
assert.deepEqual(Array.from(options.brandYears['souq-al-haraj'][0].months.map((m)=>m.month)),[0],'unverified Haraj has no claimed monthly data');
assert.deepEqual(Array.from(options.brandYears['souq-al-jubail'][0].months.map((m)=>m.month)),[0],'unverified Jubail has no claimed monthly data');
console.log('PASS: executed backend getCreativeOptions with source fixtures, including all six brands and brand-specific periods.');

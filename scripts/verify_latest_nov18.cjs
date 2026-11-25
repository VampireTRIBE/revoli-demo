/** Source and delivery contract for the Nov 18 PDFs + the user's later mapping.
 * This does NOT replace TypeScript, API, or browser runtime tests. */
const assert=require('node:assert/strict');
const {readFileSync,existsSync,statSync}=require('node:fs');
const {join}=require('node:path');
const base=join(__dirname,'..');
const read=(path)=>readFileSync(join(base,path),'utf8');
const has=(path)=>existsSync(join(base,path));
const checks=[];
function verify(label,fn){try{fn();checks.push({label,passed:true});console.log('PASS',label)}catch(e){checks.push({label,passed:false});console.error('FAIL',label,':',e.message);process.exitCode=1}}
const media=read('client/src/pages/MediaDashboardPage.tsx');
const creative=read('client/src/pages/CreativeDashboardPage.tsx');
const comp=read('client/src/features/competition/components/ContextualCompetition.tsx');
const campaigns=(read('client/src/features/media/components/CampaignSection.tsx') + '\n' + read('client/src/features/media/utils/campaign-ranking.ts'));
const reads=read('server/src/modules/reads/services/reads.service.ts');
const ga4=read('client/src/features/media/components/Ga4Channels.tsx');
const section=read('client/src/components/v2/Reporting.tsx');
const visual=read('client/src/styles/bizcom-v2.css');
verify('Separate Rivoli and Union Coop Media',()=>{assert.match(media,/Client: Rivoli/);assert.match(media,/union\?<UnionCoopMediaView\/>:<RivoliMediaPage\/>/)});
verify('Media compares only approved Rivoli EDIT client',()=>assert.match(media,/useContextualCompetition\('rivoli-shop'/));
verify('Union Coop Creative comparison gated by exact brand',()=>{assert.match(creative,/filter\.brand === 'union-coop'/);assert.match(creative,/creativeCompetitionEnabled \? <CompetitionDropdown/);assert.match(creative,/creativeCompetitionEnabled \? <section className="creative-competition-strip/)});
verify('Source competitor IDs scoped by client',()=>{const v=read('server/src/modules/competition/config/competition.config.ts');assert.match(v,/id: 'edit-by-ahmed-seddiqi',[\s\S]*?clientId: 'rivoli-shop'/);assert.match(v,/id: 'carrefour-uae',[\s\S]*?clientId: 'union-coop'/);assert.match(v,/id: 'lulu-hypermarket',[\s\S]*?clientId: 'union-coop'/)});
verify('No comparison control on Consumer/Search',()=>{for (const path of ['ConsumerDashboardPage','SearchDashboardPage']) assert.doesNotMatch(read(`client/src/pages/${path}.tsx`),/CompetitionDropdown|ContextualCompetitionPanel/)});
verify('Exact five Media section titles and definitions',()=>{for (const title of ['Spend and return','Acquisition cost','Channels','Campaigns','Competition']) assert.ok(media.includes(`label="${title}"`),title);assert.match(media,/Coverage, not ROAS/)});
verify('Exact four Creative section titles',()=>{for (const title of ['Output','Attention','Engagement','Top content']) assert.ok(creative.includes(`title="${title}"`),title);assert.doesNotMatch(creative,/title="Engagement, honestly"/)});
verify('Signed only Highlights and one top-level pending state',()=>{assert.match(reads,/if \(!\['yes','signed','approved','true','1'\]\.includes\(signed\)\) \{/);assert.match(read('client/src/features/reads/TblReadsStrip.tsx'),/HIGHLIGHTS PENDING/);assert.doesNotMatch(section,/HIGHLIGHTS PENDING/)});
verify('Section anatomy with source-backed deltas and gap-preserving bars',()=>{assert.match(section,/function DeltaLine/);assert.match(section,/function SparkBars/);assert.match(section,/className="missing"/)});
verify('Campaign objectives only source supplied, ranked within bucket',()=>{assert.match(campaigns,/function objective\(row: Campaign\)/);assert.match(campaigns,/return 'Not supplied'/);assert.match(campaigns,/function ObjectiveBucket/);assert.match(campaigns,/title=\{rateEvidence\}/)});
verify('Media GA4 shows verified periods and avoids fake zero months',()=>{assert.match(ga4,/chartMonths=visible\.filter/);assert.match(ga4,/revenueAed===null/);assert.match(ga4,/Net revenue from the summary is not silently replaced/)});
verify('Ad register opens immediate searchable modal',()=>{assert.match(comp,/competition-register-dialog/);assert.match(comp,/showModal\(\)/);assert.match(comp,/type="search"/);assert.match(comp,/aria-label="Close ad register"/)});
verify('Competition sample/census separated',()=>{const f=read('server/src/modules/competition/services/competition.service.ts');assert.match(f,/sampleOnly: selectedChannel === 'Google'/);assert.match(f,/reported: selectedCapture\.reportedPopulation/)});
verify('Source workbooks retained',()=>{for(const f of ['spreadsheets data/media/rivoli/Rivoli-Consumer-GA4-Import-v4.xlsx','spreadsheets data/creative/union-coop/UnionCoop-Creative-WhyItWorked-Import.xlsx','spreadsheets data/competition/union-coop/Competition-Capture-UnionCoop-Carrefour-LuLu-01-Oct-2026.xlsx','spreadsheets data/competition/union-coop/Competition-Capture-UnionCoop-Carrefour-LuLu-18-Nov-2026.xlsx','spreadsheets data/competition/rivoli/EDIT-AdLibrary-Capture2-03Nov2026.xlsx','spreadsheets data/competition/rivoli/EDIT-Google-Capture1-18Nov2026.xlsx']){assert.ok(has(f),f);assert.ok(statSync(join(base,f)).size>5000,f)}});
verify('Visual color tokens consistent with supplied reference',()=>{for(const code of ['#141413','#5A646E','#E2E2DE','#F2F2EF','#FFFFFF','#1E8E5A','#C2362B','#B45309']) assert.ok(visual.toLowerCase().includes(code.toLowerCase()),code)});
verify('No Docker or MongoDB migration added',()=>{assert.ok(!has('docker-compose.yml'));assert.ok(!has('compose.yaml'));assert.ok(!has('Dockerfile'));});
console.log(`${checks.filter(x=>x.passed).length}/${checks.length} latest requirement source-contract checks passed.`);

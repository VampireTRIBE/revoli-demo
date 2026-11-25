/** Dependency-free source/data integrity checks for the November 18 update.
 * Syntax, semantic TS, API integration and browser tests are separate checks. */
const {existsSync,readFileSync,statSync}=require('node:fs');
const {resolve}=require('node:path');
const root=resolve(__dirname,'..');
const read=(name)=>readFileSync(resolve(root,name),'utf8');
function check(label,pass){if(!pass){console.error('FAIL',label);process.exitCode=1;}else console.log('PASS',label);}
const exists=(f)=>existsSync(resolve(root,f));
const creative=read('client/src/pages/CreativeDashboardPage.tsx');
const media=read('client/src/pages/MediaDashboardPage.tsx');
const top=read('client/src/features/reads/TblReadsStrip.tsx');
const server=read('server/src/server.ts');
const consumer=read('client/src/pages/ConsumerDashboardPage.tsx');
const campaigns=(read('client/src/features/media/components/CampaignSection.tsx') + '\n' + read('client/src/features/media/utils/campaign-ranking.ts'));
check('GA4 v4 available',exists('spreadsheets data/media/rivoli/Rivoli-Consumer-GA4-Import-v4.xlsx'));
check('Union Coop Creative source available',exists('spreadsheets data/creative/union-coop/UnionCoop-Creative-WhyItWorked-Import.xlsx'));
check('Union Coop October and November competition captures', ['01-Oct','18-Nov'].every((d)=>exists(`spreadsheets data/competition/union-coop/Competition-Capture-UnionCoop-Carrefour-LuLu-${d}-2026.xlsx`)));
check('EDIT Meta and Google captures',exists('spreadsheets data/competition/rivoli/EDIT-Google-Capture1-18Nov2026.xlsx')&&exists('spreadsheets data/competition/rivoli/EDIT-AdLibrary-Capture2-03Nov2026.xlsx'));
check('Signed-only highlight hero',top.includes('const hero = approved.find(')&&top.includes('?? approved[0]!')&&top.includes('query.data?.reads ?? []')&&read('server/src/modules/reads/services/reads.service.ts').includes('if (![\'yes\',\'signed\',\'approved\',\'true\',\'1\'].includes(signed))'));
check('Four neutral Creative sections',creative.includes('title="Engagement"')&&creative.includes('title="Top content"')&&creative.includes('title="Output"'));
check('Campaign objectives are source-only',campaigns.includes('function objective(row: Campaign)')&&campaigns.includes("return 'Not supplied';"));
check('Media GA4 independently rendered',read('client/src/features/media/components/MediaConsumerAlignment.tsx').includes('A missing legacy Consumer'));
check('Media independent from Creative API failure at startup',server.includes('source warmup failed')&&server.includes('if (process.env.MONGODB_URI?.trim())'));
check('Union Coop optional comments import route',exists('server/src/modules/consumer/services/union-comments.service.ts')&&read('server/src/modules/consumer/routes/consumer.routes.ts').includes('/union-comments'));
check('Competitor comparison on Creative and Media only (latest UI scope)', read('client/src/pages/CreativeDashboardPage.tsx').includes("creativeCompetitionEnabled ? 'union-coop'") && read('client/src/pages/MediaDashboardPage.tsx').includes("useContextualCompetition('rivoli-shop'") && ['SearchDashboardPage','ConsumerDashboardPage'].every(x=>!read(`client/src/pages/${x}.tsx`).includes('CompetitionDropdown')));
check('Media includes separate requested Union Coop reference view',media.includes('UnionCoopMediaView')&&media.includes('<option value="union-coop"')&&media.includes('Client: Rivoli'));
check('Source assets preserved',exists('spreadsheets data/competition/rivoli/EDIT-Capture2-Thumbnails.zip')&&statSync(resolve(root,'spreadsheets data/competition/rivoli/EDIT-Capture2-Thumbnails.zip')).size>1_000_000);
if(!process.exitCode)console.log('All November 18 source/data readiness checks passed. Not a browser/TypeScript build certification.');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function read(file) {return fs.readFileSync(path.join(root,file),'utf8');}
const ga4 = read('client/src/features/media/components/Ga4Channels.tsx');
const alignment = read('client/src/features/media/components/MediaConsumerAlignment.tsx');
const campaign = (read('client/src/features/media/components/CampaignSection.tsx') + '\n' + read('client/src/features/media/utils/campaign-ranking.ts'));
const parser = read('server/src/modules/media/import/source-parser.ts');
const palette = read('client/src/styles/media-palette.css');
const acquisition = read('client/src/features/media/components/OverviewCards.tsx');
const checks=[
 ['GA4 monthly bars omit unobserved months', ga4.includes('chartMonths=visible.filter') && ga4.includes('months were not imported, not zero')],
 ['GA4 chart labels use compact ticks and sufficient axis width', ga4.includes('MonthlyGa4Bars') && read('client/src/features/media/components/MonthlyGa4Bars.tsx').includes('viewBox="0 0 1000 248"') && read('client/src/features/media/components/MonthlyGa4Bars.tsx').includes("notation:'compact'")],
 ['GA4 net revenue is separate from item revenue', alignment.includes('ga4Months') && alignment.includes('GA4 net revenue (all site channels)')],
 ['Missing spend is n/a, not a zero-filled overview', alignment.includes("platformSpend===null?'n/a'")],
 ['Coverage withheld when full two-account spend is absent', alignment.includes('hasCompletePlatformCoverage') && alignment.includes('Hour Choice')],
 ['Revenue coverage history only compares matching source periods', alignment.includes('matchedCoverageSeries')],
 ['Acquisition cards do not turn missing sources into zeros', acquisition.includes('claimedCost==null') && acquisition.includes('siteAov==null')],
 ['Campaign objectives are only source-backed', campaign.includes("row.objective === 'Conversion'") && !campaign.includes('row.campaign.toLowerCase()')],
 ['Campaign register groups by objective', campaign.includes("ObjectiveBucket") && campaign.includes('All objectives · grouped')],
 ['Original campaign names accessible on hover', campaign.includes('<td title={row.campaign}>')],
 ['Campaign thumbnails require actual approved file on disk', parser.includes('approvedCampaignImage') && parser.includes('existsSync(resolve(root,image))')],
 ['Source short campaign name is imported, not synthesized', parser.includes("value(row,'Short name','Short campaign name')")],
 ['Media has four filters and the separate Rivoli/EDIT comparison', palette.includes('grid-template-columns: minmax(0, 1fr) minmax(195px, 230px)') && read('client/src/pages/MediaDashboardPage.tsx').includes("useContextualCompetition('rivoli-shop'")],
 ['Original v2 GA4 workbook retained', fs.existsSync(path.join(root,'spreadsheets data/media/rivoli/Rivoli-Consumer-GA4-Import-v4.xlsx'))],
];
for(const [label,success] of checks){assert.ok(success,label); console.log('PASS',label);}
console.log(`PASS ${checks.length}/${checks.length} Media source and UI contracts (not a browser runtime check)`);

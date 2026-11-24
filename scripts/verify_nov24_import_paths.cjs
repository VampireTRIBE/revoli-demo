const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const paths = [
  'spreadsheets data/media/rivoli/Rivoli-Consumer-GA4-Import-v4.xlsx',
  'spreadsheets data/highlights/tbl/TBL-Reads-Import-Template-and-First-Fill.xlsx',
  'spreadsheets data/creative/union-coop/UnionCoop-Creative-WhyItWorked-Import.xlsx',
  'spreadsheets data/competition/union-coop/Competition-Capture-UnionCoop-Carrefour-LuLu-01-Oct-2026.xlsx',
  'spreadsheets data/competition/union-coop/Competition-Capture-UnionCoop-Carrefour-LuLu-18-Nov-2026.xlsx',
  'spreadsheets data/competition/rivoli/EDIT-AdLibrary-Capture2-03Nov2026.xlsx',
  'spreadsheets data/competition/rivoli/EDIT-Google-Capture1-18Nov2026.xlsx',
  'spreadsheets data/competition/rivoli/EDIT-Capture2-Thumbnails.zip',
];
for(const file of paths){
  const absolute=path.join(root,file);
  if(!fs.existsSync(absolute)||fs.statSync(absolute).size===0)throw new Error(`Missing or empty import ${file}`);
  console.log(`OK ${file}`);
}
console.log('All 8 new source imports retained');

import path from 'node:path';
import { existsSync } from 'node:fs';
import XLSX from 'xlsx';
import { dateOnlyDifference } from '../calculations/competition-calculations.js';
import { groupCompetitionFormat, groupCompetitionTheme } from '../config/competition.config.js';
import type { CompetitionCapture, CompetitionConfig, CompetitionObservation, CompetitionGalleryEntry, MixRow } from '../types/competition.types.js';
import { resolveCompetitionAssetDirectory } from './competition-source-parser.js';

type Row = Record<string, unknown>;
const text = (value:unknown):string => value==null?'':String(value).trim();
const normalize = (str:string):string=>str.toLowerCase().replace(/[^a-z0-9]/g,'');
function get(row:Row,...aliases:string[]):string {
  const index=new Map(Object.keys(row).map((key)=>[normalize(key),key]));
  for(const alias of aliases){const key=index.get(normalize(alias));if(key)return text(row[key]);}
  return '';
}
const numeric=(str:string):number|null=>{const n=Number(str.replace(/,/g,''));return str!==''&&Number.isFinite(n)?n:null;};
function isoDate(value:string):string|null {
  if(!value||/^(?:n\/a|\(not captured\)|not captured|-|pending)$/i.test(value))return null;
  if(/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
  if(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)){
    // Validate each component before calling Date.UTC; noUncheckedIndexedAccess
    // correctly treats elements from a split string as potentially absent.
    const [dayPart,monthPart,yearPart]=value.split('/');
    if(!dayPart||!monthPart||!yearPart)return null;
    const day=Number(dayPart),month=Number(monthPart),year=Number(yearPart);
    const dt=new Date(Date.UTC(year,month-1,day));
    return dt.getUTCDate()===day&&dt.getUTCMonth()+1===month&&dt.getUTCFullYear()===year?dt.toISOString().slice(0,10):null;
  }
  const dt=new Date(value);return Number.isFinite(dt.getTime())?dt.toISOString().slice(0,10):null;
}
function captureFromFilename(name:string):string|null {
  const m=/(\d{1,2})[-_ ]?(Oct|Nov|Dec|Sep|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug)[-_ ]?(20\d{2})/i.exec(name);
  return m?isoDate(`${m[1]} ${m[2]} ${m[3]}`):null;
}
function rows(book:XLSX.WorkBook,sheetName:string):Row[] {
  const sheet=book.Sheets[sheetName];return sheet?XLSX.utils.sheet_to_json<Row>(sheet,{defval:'',raw:false}):[];
}
function assetEntries(book:XLSX.WorkBook,config:CompetitionConfig,captureDate:string,ads:CompetitionObservation[],channel:'Meta'|'Google') {
  const sheetName=book.SheetNames.find((s)=>/gallery/i.test(s));
  const sourceRows=sheetName?rows(book,sheetName):[];
  const directory=path.resolve(resolveCompetitionAssetDirectory(),config.id,captureDate);
  const byId=new Map(ads.map((a)=>[a.libraryId,a]));
  const gallery:CompetitionGalleryEntry[]=[];
  for(const [index,row] of sourceRows.entries()) {
    const file=get(row,'Thumbnail file','Thumbnail filename','Image file','File name');
    if(!file)continue;
    const id=get(row,'Library ID','Ad Library ID');
    const ad=byId.get(id);
    if (!/^[a-z0-9_-]+\.(?:png|jpg|jpeg|webp)$/i.test(file)||!ad||!existsSync(path.join(directory,file))) continue;
    const group=numeric(get(row,'Row','Gallery row'))??1;
    const slot=numeric(get(row,'Slot','Position'))??(index+1);
    gallery.push({row:group,title:get(row,'Row title','Section','Category')||'Analyst-selected creative',slot,libraryId:id,caption:get(row,'Caption','Title')||'Captured ad',metaLine:get(row,'Meta line','Details')||`${channel} captured evidence`,chip:get(row,'Chip','Theme')||'Analyst selection',thumbnailFile:file,assetUrl:`/competition/assets/${config.id}/${captureDate}/${file}`,startDate:ad.startDate,daysRunning:ad.suppliedDaysRunning??ad.calculatedDaysRunning});
  }
  return {gallery,screenshots:gallery.map((g)=>({ref:g.thumbnailFile,assetFile:g.thumbnailFile,assetUrl:g.assetUrl,libraryIds:[g.libraryId],multiAd:false,associationVerified:true}))};
}
/** Only a clearly labelled reported population is loaded; sample size is separate. */
function reportedPopulation(book:XLSX.WorkBook):number|null {
  const sheetName=book.SheetNames.find((name)=>/read\s*me|readme/i.test(name));
  const sheet=sheetName?book.Sheets[sheetName]:undefined;
  if(!sheet)return null;
  const cells=XLSX.utils.sheet_to_json<unknown[]>(sheet,{header:1,defval:'',raw:false}).flat().map(text).join(' ');
  const expressions=[
    /(?:google|transparency\s+center)\s+reports?\s*(?:approximately|about|around)?\s*[~≈]?\s*(\d[\d,]*)\s+ads/i,
    /reported\s+(?:ads|total|population|count)\s*[:=]?\s*[~≈]?\s*(\d[\d,]*)/i,
    /[~≈]\s*(\d[\d,]*)\s+reported\s+(?:ads|creatives)/i,
  ];
  for(const exp of expressions){
    const match=exp.exec(cells);
    const reported=match?.[1];
    if(!reported)continue;
    const count=numeric(reported);
    if(count!=null&&count>0)return count;
  }
  return null;
}
function signedHighlights(book:XLSX.WorkBook,config:CompetitionConfig):string[] {
  const sheetName=book.SheetNames.find((name)=>/draft highlights/i.test(name));
  if(!sheetName)return [];
  return rows(book,sheetName).flatMap((r)=>{
    const brand=get(r,'Brand','Competitor','Client');
    const flag=get(r,'Signed','Signed flag','Approved','Status');
    const sentence=get(r,'Sentence','Highlight','Bullet','Text');
    if(!sentence||!['yes','signed','approved','true','1'].includes(flag.toLowerCase()))return [];
    if(brand&&!`${config.label} ${config.metaPage} ${config.clientLabel}`.toLowerCase().includes(brand.toLowerCase())&&!brand.toLowerCase().includes(config.label.toLowerCase()))return [];
    return [sentence];
  });
}
/** Version 2 import: one workbook can contain multiple competitors, or one Google sample. */
export function parseCompetitionCaptureV2(file:string,config:CompetitionConfig):CompetitionCapture[] {
  const book=XLSX.readFile(file,{raw:false,cellDates:false});
  const filename=path.basename(file);
  const google=/google/i.test(filename);
  const candidates=book.SheetNames.filter((sheetName)=>/register|ad log|logged creatives|google sample/i.test(sheetName));
  const captures:CompetitionCapture[]=[];
  for(const sheetName of candidates){
    const nameNorm=sheetName.toLowerCase();
    if(/carrefour|lulu/i.test(nameNorm)&&!nameNorm.includes(config.id.startsWith('carrefour')?'carrefour':'lulu'))continue;
    if(config.id==='edit-by-ahmed-seddiqi'&&/carrefour|lulu/i.test(nameNorm))continue;
    const raw=rows(book,sheetName);
    const sourceRows=raw.filter((r)=>Object.values(r).some((v)=>text(v)));
    if(!sourceRows.length)continue;
    const sampleRow=sourceRows.find((r)=>get(r,'Capture date','Capture Date')||get(r,'Channel','Source'))??sourceRows[0];
    if(!sampleRow)continue;
    const captureDate=isoDate(get(sampleRow,'Capture date','Capture Date'))??captureFromFilename(filename);
    if(!captureDate)throw new Error(`Competition V2 has no verifiable capture date: ${filename} / ${sheetName}`);
    const observations:CompetitionObservation[]=[];
    const duplicates=new Set<string>();
    let duplicateRows=0,malformedRows=0;
    let channel:'Meta'|'Google'=google?'Google':'Meta';
    for(const [index,r] of sourceRows.entries()){
      const rawId=get(r,'Library ID','Ad Library ID','ID');
      const rawChannel=get(r,'Channel','Source');
      const rowChannel=/google/i.test(rawChannel)?'Google':/meta/i.test(rawChannel)?'Meta':channel;
      channel=rowChannel;
      const rowDate:string=isoDate(get(r,'Capture date','Capture Date'))??captureDate;
      const format=get(r,'Format','Ad format','Type');
      const page=get(r,'Competitor / Meta page','Competitor','Meta page');
      if(page&&!`${config.label} ${config.metaPage} ${config.id}`.toLowerCase().includes(page.toLowerCase())&&!page.toLowerCase().includes(config.label.toLowerCase())){
        if(/carrefour|lulu|edit/i.test(page))continue;
      }
      if(!format||rowDate!==captureDate){malformedRows++;continue;}
      const hasCapturedId=rawId!==''&&!/not captured|^n\/a$|^-$/.test(rawId.toLowerCase());
      if(rowChannel==='Meta'&&!hasCapturedId){malformedRows++;continue;}
      // The generated key is INTERNAL only. The UI must show '(not captured)' for Google records without IDs.
      const libraryId=hasCapturedId?rawId:`not-captured-${sheetName.replace(/[^a-z0-9]/gi,'').toLowerCase()}-${index+2}`;
      if(duplicates.has(libraryId)){duplicateRows++;continue;}
      duplicates.add(libraryId);
      const start=isoDate(get(r,'Start date','Start Date'));
      const suppliedDays=numeric(get(r,'Days running','Age (days)'));
      const calculatedDays=start?dateOnlyDifference(captureDate,start):0;
      const theme=get(r,'Theme','Theme (analyst)');
      const newFlag=get(r,'New since last capture','New since previous capture','New');
      observations.push({competitorId:config.id,competitor:config.label,clientId:config.clientId,clientLabel:config.clientLabel,metaPage:config.metaPage,
        channel:rowChannel,libraryId,captureDate,startDate:start??captureDate,startDateAvailable:!!start,
        suppliedDaysRunning:suppliedDays,calculatedDaysRunning:calculatedDays,daysRunningDiscrepancy:start&&suppliedDays!=null?calculatedDays!==suppliedDays:false,
        status:get(r,'Status')||'(not captured)',platforms:get(r,'Platforms','Surface','Google surface')||'not captured',format,formatGroup:groupCompetitionFormat(config,format),
        theme:theme||null,themeGroup:groupCompetitionTheme(config,theme||null),featuredBrandProduct:get(r,'Featured brand / product','Brand','Product')||null,
        adText:get(r,'Ad text (short)','Creative / copy (short)','Ad text')||null,clickDestination:get(r,'Click destination','Destination')||null,language:get(r,'Language')||null,
        screenshotRef:get(r,'Screenshot ref','Screenshot batch','Shot')||null,screenshot:null,payerVerified:get(r,'Payer (verified)','Verified payer')||null,
        newSincePreviousCapture:/^yes$/i.test(newFlag),sourceFile:filename,sourceSheet:sheetName,sourceRow:index+2});
    }
    if(!observations.length)continue;
    if(observations.some((r)=>r.channel!==channel))throw new Error(`Mixed Google/Meta rows in V2 register ${sheetName}; separate channel-specific register sheets required.`);
    const {gallery,screenshots}=assetEntries(book,config,captureDate,observations,channel);
    const importedThemeMix:MixRow[]=[];
    const themeSheet=book.SheetNames.find((name)=>/theme mix/i.test(name));
    if(themeSheet)for(const r of rows(book,themeSheet)){
      const owner=get(r,'Competitor','Brand');
      if(owner&&!config.label.toLowerCase().includes(owner.toLowerCase()))continue;
      const label=get(r,'Theme','Theme (analyst)'); const count=numeric(get(r,'Count','Ads'));
      if(label&&count!=null&&!/total/i.test(label))importedThemeMix.push({label,count,percentage:observations.length?count/observations.length:0});
    }
    const deltaName=book.SheetNames.find((name)=>/delta vs/i.test(name));
    const deltas=deltaName?rows(book,deltaName):[];
    const newCount=deltas.map((r)=>{
      const label=get(r,'Metric','Card','Label').toLowerCase();
      return /new since|new launch|newly observed/.test(label)?numeric(get(r,'Current','Capture 2','New','Value','Count')):null;
    }).find((v)=>v!=null);
    const reportedCount: number|null = channel === 'Google' ? reportedPopulation(book) : null; // Never infer the total from the sample.
    captures.push({competitorId:config.id,competitor:config.label,clientId:config.clientId,clientLabel:config.clientLabel,metaPage:config.metaPage,channel,captureDate,
      sourceFile:filename,observations,screenshots,gallery,importedThemeMix:importedThemeMix.length?importedThemeMix:undefined,
      launchesSincePreviousCapture:newCount??(observations.some((r)=>r.newSincePreviousCapture)?observations.filter((r)=>r.newSincePreviousCapture).length:undefined),
      reportedPopulation:reportedCount,sampleSize:observations.length,highlights:signedHighlights(book,config),
      audit:{sourceRows:sourceRows.length,acceptedRows:observations.length,malformedRows,duplicateRows,conflictingDuplicateRows:0,
        daysRunningDiscrepancies:observations.filter((r)=>r.daysRunningDiscrepancy).length,verifiedScreenshotAssociations:gallery.length,unverifiedScreenshotAssociations:0}});
  }
  return captures;
}

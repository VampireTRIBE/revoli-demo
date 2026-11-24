import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import XLSX from 'xlsx';

/** These optional workbooks are TBL-controlled import inputs, not mock dashboard data. */
function workbookPath(name: string, folders: string[]): string | null {
  for (const folder of folders) {
    for (const root of [process.cwd(), resolve(process.cwd(), '..')]) {
      const candidate = resolve(root, 'spreadsheets data', folder, name);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}
const datePattern = /^(\d{4})[-/](0?[1-9]|1[0-2])$/;
const shortMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function parseMonth(input: unknown): {year: number; month: number} | null {
  if (input instanceof Date && !Number.isNaN(input.getTime())) return { year: input.getUTCFullYear(), month: input.getUTCMonth()+1 };
  if (typeof input === 'number' && input > 35000) {
    const parsed = XLSX.SSF.parse_date_code(input);
    if (parsed && parsed.y >= 2020 && parsed.m >= 1 && parsed.m <= 12) return {year:parsed.y,month:parsed.m};
  }
  const raw = String(input ?? '').trim();
  const iso = datePattern.exec(raw);
  if (iso) return {year:Number(iso[1]),month:Number(iso[2])};
  const words = /^([A-Za-z]{3,9})[ -](\d{4})$/.exec(raw);
  if (words) {
    const month = shortMonths.findIndex((name) => name.toLowerCase() === words[1]?.slice(0,3).toLowerCase())+1;
    return month > 0 ? {year:Number(words[2]),month} : null;
  }
  return null;
}
function numberOrNull(input: unknown): number | null {
  if (input === '' || input == null) return null;
  const value = typeof input === 'number' ? input : Number(String(input).replace(/[ ,]/g, ''));
  return Number.isFinite(value) && value >= 0 ? value : null;
}
function getValue(row: Record<string, unknown>, ...names: string[]): unknown {
  for (const name of names) {
    const key = Object.keys(row).find((actual) => actual.toLowerCase().trim() === name.toLowerCase());
    if (key !== undefined) return row[key];
  }
  return undefined;
}
function sheetRows(book: XLSX.WorkBook, sheet: string): Array<Record<string, unknown>> {
  const source = book.Sheets[sheet];
  return source ? XLSX.utils.sheet_to_json<Record<string, unknown>>(source, {defval:null, raw:true}) : [];
}
export interface Ga4Channel {year:number;month:number;channel:string;sessions:number|null;revenueAed:number|null;}
export interface Ga4Summary {year:number;month:number;netRevenueAed:number|null;firstTimePurchasers:number|null;refundsAed:number|null;}
export function getGa4V4(year?: number, month?: number) {
  const sourceFile = 'Rivoli-Consumer-GA4-Import-v4.xlsx';
  const file = workbookPath(sourceFile,['media-tab','consumer-tab','']);
  const missing = {available:false,sourceFile,channels:[] as Ga4Channel[],summaries:[] as Ga4Summary[],reason:'Approved GA4 v4 import has not been supplied. September/October channel and net-revenue figures are not inferred from the older site-item workbook.'};
  if (!file) return missing;
  const book = XLSX.readFile(file, {cellDates:true});
  const channels: Ga4Channel[] = [];
  const summaries: Ga4Summary[] = [];
  for (const sheet of book.SheetNames) {
    for (const row of sheetRows(book,sheet)) {
      const date = parseMonth(getValue(row,'Month','Period','Reporting month','Year-Month'));
      if (!date) continue;
      const channel = String(getValue(row,'Channel','Default channel group','Session default channel group','Channel group') ?? '').trim();
      const sessions = numberOrNull(getValue(row,'Sessions','Session count'));
      const revenueAed = numberOrNull(getValue(row,'Net revenue (AED)','Revenue (AED)','Revenue','Total revenue'));
      if (channel && (sessions!==null||revenueAed!==null)) channels.push({...date,channel,sessions,revenueAed});
      if (!channel) {
        const ftp = numberOrNull(getValue(row,'First-time purchasers','First time purchasers','New purchasers'));
        const refunds = numberOrNull(getValue(row,'Refunds (AED)','Refunds AED','Refunds'));
        if (ftp!==null||revenueAed!==null||refunds!==null) summaries.push({...date,netRevenueAed:revenueAed,firstTimePurchasers:ftp,refundsAed:refunds});
      }
    }
  }
  if (!channels.length && !summaries.length) return {...missing,reason:`${sourceFile} is present but has no recognized dated channel/summary fields. Verify the workbook schema before publishing.`};
  const within = (row: {year:number;month:number}) => (!year||row.year===year)&&(!month||row.month===month);
  return {available:true,sourceFile,channels:channels.filter(within),summaries:summaries.filter(within),reason:null};
}

export interface CoopBurst {year:number;month:number;name:string;platform:string;objective:string;spendAed:number|null;publicViews:number|null;knownViews:number|null;boostedPosts:number|null;startDate:string;endDate:string;}
export interface CoopReach {year:number;month:number;date:string;pageReach:number;paidConfirmed:boolean;}
export function getUnionCoopMedia(year?:number,month?:number) {
  const sourceFile = 'UnionCoop-Media-Burst-Import.xlsx';
  const file = workbookPath(sourceFile,['media-tab','']);
  const missing = {available:false,sourceFile,bursts:[] as CoopBurst[],dailyReach:[] as CoopReach[],reason:'Verified Union Coop media burst and paid/organic reach exports have not been supplied.'};
  if (!file) return missing;
  const book = XLSX.readFile(file,{cellDates:true});
  const bursts:CoopBurst[] = sheetRows(book,'Bursts').flatMap((row) => {
    const date = parseMonth(getValue(row,'Month','Period'));
    const name=String(getValue(row,'Campaign','Burst name')??'').trim();
    if (!date||!name) return [];
    return [{...date,name,platform:String(getValue(row,'Platform')??'Not captured'),objective:String(getValue(row,'Objective')??'Not supplied'),spendAed:numberOrNull(getValue(row,'Spend (AED)','Spend')),publicViews:numberOrNull(getValue(row,'Public views','Views')),knownViews:numberOrNull(getValue(row,'Known views')),boostedPosts:numberOrNull(getValue(row,'Boosted posts')),startDate:String(getValue(row,'Start date')??''),endDate:String(getValue(row,'End date')??'')}];
  });
  const dailyReach:CoopReach[] = sheetRows(book,'Daily Reach').flatMap((row) => {
    const sourceDate=getValue(row,'Date');
    const dateText=sourceDate instanceof Date ? sourceDate.toISOString().slice(0,10) : String(sourceDate??'').slice(0,10);
    const dateMatch=/^(\d{4})-(\d{2})-(\d{2})/.exec(dateText);
    const pageReach=numberOrNull(getValue(row,'Page reach','Daily page reach','Reach'));
    if (!dateMatch||pageReach===null) return [];
    return [{year:Number(dateMatch[1]),month:Number(dateMatch[2]),date:dateText,pageReach,paidConfirmed:/^(yes|true|paid|1)$/i.test(String(getValue(row,'Paid confirmed','Paid')??''))}];
  });
  if (!bursts.length&&!dailyReach.length) return {...missing,reason:`${sourceFile} found, but no valid Bursts or Daily Reach entries matched the import contract.`};
  const within=(row:{year:number;month:number})=>(!year||row.year===year)&&(!month||row.month===month);
  return {available:true,sourceFile,bursts:bursts.filter(within),dailyReach:dailyReach.filter(within),reason:null};
}

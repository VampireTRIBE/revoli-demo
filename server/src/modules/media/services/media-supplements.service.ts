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
/** Import the GA4 v4 workbook by its approved sheet schema, preserving signed
 * channel revenue (including unattributed refunds in Unassigned). Never use
 * item-revenue exports or daily Total purchasers as first-time purchasers. */
export function getGa4V4(year?: number, month?: number) {
  const sourceFile = 'Rivoli-Consumer-GA4-Import-v4.xlsx';
  const file = workbookPath(sourceFile, ['media/rivoli','consumer/rivoli']);
  const missing = {available:false,sourceFile,channels:[] as Ga4Channel[],summaries:[] as Ga4Summary[],reason:'Rivoli GA4 v4 import has not been supplied.'};
  if (!file) return missing;
  const book = XLSX.readFile(file, {cellDates:true});
  if (!book.Sheets['Monthly Series'] || !book.Sheets['Channel Revenue']) return {
    ...missing,reason:'The GA4 v4 workbook must contain Monthly Series and Channel Revenue sheets.'
  };
  const summaries:Ga4Summary[]=[];
  const channels:Ga4Channel[]=[];
  for (const row of sheetRows(book,'Monthly Series')) {
    const date=parseMonth(getValue(row,'Month'));
    if (!date) continue;
    summaries.push({...date,
      netRevenueAed:numberOrNull(getValue(row,'Net revenue (AED)')),
      firstTimePurchasers:numberOrNull(getValue(row,'First-time purchasers')),
      refundsAed:null, // Refunds are already embedded in net revenue, not a separate verified total.
    });
  }
  for (const row of sheetRows(book,'Channel Revenue')) {
    const date=parseMonth(getValue(row,'Month'));
    const channel=String(getValue(row,'Channel')??'').trim();
    if (!date||!channel) continue;
    // Signed revenue: Unassigned is negative when it contains unattributed refunds.
    const rawRevenue=getValue(row,'Net revenue (AED)');
    const normalized=String(rawRevenue??'').replace(/[ ,]/g,'');
    const revenueAed=normalized!==''&&Number.isFinite(Number(normalized)) ? Number(normalized) : null;
    channels.push({...date,channel,
      sessions:numberOrNull(getValue(row,'Sessions')),
      revenueAed,
    });
  }
  if (!summaries.length || !channels.length) return {
    ...missing,reason:'The GA4 v4 workbook is present, but has no valid monthly summary or channel rows.'
  };
  // Reconciliation against the monthly NET summary prevents accidental publication
  // of an incomplete channel set or double-counted refunds.
  for (const summary of summaries) {
    const relevant=channels.filter((item)=>item.year===summary.year&&item.month===summary.month);
    if (!relevant.length || summary.netRevenueAed===null) continue;
    const sum=relevant.reduce((total,item)=>total+(item.revenueAed??0),0);
    if (relevant.some((item)=>item.revenueAed===null) || Math.abs(sum-summary.netRevenueAed)>1) {
      return {...missing,reason:`GA4 ${summary.year}-${String(summary.month).padStart(2,'0')} channel/net revenue reconciliation failed: channel sum ${sum}, monthly net ${summary.netRevenueAed}.`};
    }
  }
  const within=(row:{year:number;month:number})=>(!year||row.year===year)&&(!month||row.month===month);
  return {available:true,sourceFile,channels:channels.filter(within),summaries:summaries.filter(within),reason:null};
}

export interface CoopBurst {year:number;month:number;name:string;platform:string;objective:string;spendAed:number|null;publicViews:number|null;knownViews:number|null;boostedPosts:number|null;startDate:string;endDate:string;}
export interface CoopReach {year:number;month:number;date:string;pageReach:number;paidConfirmed:boolean;}
export function getUnionCoopMedia(year?:number,month?:number) {
  const sourceFile = 'UnionCoop-Media-Burst-Import.xlsx';
  const file = workbookPath(sourceFile,['media/union-coop']);
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

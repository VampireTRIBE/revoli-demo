import { useQuery } from '@tanstack/react-query';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { http } from '../../../api/http';
import type { ConsumerDashboard } from '../../../types/consumer';
import type { Ga4V4, MediaMonthlyHistory, Overview } from '../../../types/media';
import { MediaHistory } from './MediaHistory';
import { DeltaLine, SparkBars } from '../../../components/v2/Reporting';
import { CountUpValue } from '../../../components/v2/CountUpValue';
import { formatAED, formatNumber, formatRatio } from '../utils/formatters';
import '../../../styles/reference-consumer.css';

async function loadConsumerAlignment(year: number): Promise<ConsumerDashboard> {
  return (await http.get<{ data: ConsumerDashboard }>('/consumer/dashboard', { params: { year, month: 0 } })).data.data;
}

export function MediaConsumerAlignment({ year, month, overview, history, ga4, scopedSelection = false }: { year?: number; month?: number; overview?: Overview; history?:MediaMonthlyHistory; ga4?:Ga4V4; scopedSelection?: boolean }) {
  const query = useQuery({ queryKey: ['consumer', 'media-alignment', year], queryFn: () => loadConsumerAlignment(year!), enabled: Boolean(year) && !ga4?.available });
  if (!year) return <div className="reference-card">Select a reporting year to see spend and purchasers.</div>;
  const animate=typeof window !== 'undefined' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // GA4 v4 is a self-contained approved site source. A missing legacy Consumer
  // workbook/API must never hide verified Media KPI cards and GA4 charts.
  const legacyAvailable = !ga4?.available && Boolean(query.data);
  // GA4 v4 is authoritative for first-time purchasers and complete September/
  // October months. The older Consumer import remains a separate legacy source.
  const entriesByMonth = new Map((query.data?.aligned ?? []).map((row) => [row.month, row]));
  const ga4Purchasers = new Map((ga4?.available ? ga4.summaries : []).filter((row)=>row.year===year).map((row)=>[row.month,row.firstTimePurchasers]));
  const partialMonths = new Set((query.data?.series ?? []).filter((row) => row.partial).map((row) => row.month));
  const included = year === 2026 ? Array.from({length:12},(_,index)=>index+1) : Array.from(new Set([...(history?.months.map((row)=>row.month) ?? []), ...((ga4?.summaries ?? []).map((row)=>row.month))])).sort((a,b)=>a-b);
  const rows = included.map((month) => {
    const record = entriesByMonth.get(month);
    const hasGa4 = Boolean(ga4?.available && ga4Purchasers.has(month));
    const verifiedPurchasers = ga4?.available ? (ga4Purchasers.get(month) ?? null) : (record?.firstTimePurchasers ?? null);
    const importedSpend = history?.months.find((item) => item.month === month)?.spend;
    return {
      month: new Intl.DateTimeFormat('en-US',{month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,1))),
      spend: importedSpend ?? record?.mediaSpendAed ?? null, ftp: verifiedPurchasers ?? null, partial: !hasGa4 && partialMonths.has(month),
    };
  });
  // Never equate a zero-filled legacy overview with an absent source period.
  // GA4 site net revenue and the Google/Meta spend workbook have different coverage.
  const selectedHistory=month ? history?.months.find((row)=>row.year===year&&row.month===month) : undefined;
  const spendMonths=(history?.months??[]).filter((row)=>row.year===year&&row.spend!==null);
  const platformSpend=month ? selectedHistory?.spend??null : spendMonths.length?spendMonths.reduce((total,row)=>total+(row.spend??0),0):null;
  const ga4Months=(ga4?.available ? ga4.summaries : []).filter((row)=>row.year===year);
  const selectedGa4=month ? ga4Months.find((row)=>row.month===month) : undefined;
  const siteNetRevenue=ga4?.available
    ? (month ? selectedGa4?.netRevenueAed??null : ga4Months.length&&ga4Months.every((row)=>row.netRevenueAed!==null)
      ? ga4Months.reduce((total,row)=>total+(row.netRevenueAed??0),0) : null)
    : (month ? selectedHistory?.itemRevenue??null : null);
  const revenueSource=ga4?.available ? 'GA4 net revenue (all site channels)' : 'Reconciled site item revenue';
  const hasCompletePlatformCoverage=!overview?.metadata?.warnings?.some((warning)=>/Hour Choice|combined.*Meta|two.account/i.test(warning));
  const matchedCoverage=Boolean(month)&&!scopedSelection&&hasCompletePlatformCoverage&&platformSpend!==null&&platformSpend>0&&siteNetRevenue!==null;
  const coverage=matchedCoverage ? siteNetRevenue!/platformSpend! : null;
  const priorGa4=month ? ga4Months.find((row)=>row.month===month-1) : undefined;
  const comparableRevenue=Boolean(selectedGa4&&priorGa4&&selectedGa4.netRevenueAed!==null&&priorGa4.netRevenueAed!==null);
  const revenueSparks=month ? Array.from({length:Math.min(month,8)},(_,i)=>{
    const m=month-Math.min(month,8)+i+1;
    return ga4Months.find((row)=>row.month===m)?.netRevenueAed??null;
  }) : [];
  const matchedCoverageSeries=month ? Array.from({length:Math.min(month,8)},(_,i)=>{
    const m=month-Math.min(month,8)+i+1;
    const matchingSpend=history?.months.find((row)=>row.year===year&&row.month===m);
    const matchingRevenue=ga4?.available?ga4Months.find((row)=>row.month===m)?.netRevenueAed:matchingSpend?.itemRevenue;
    return matchingSpend?.spend!=null&&matchingSpend.spend>0&&matchingRevenue!=null&&!matchingSpend.partial&&hasCompletePlatformCoverage
      ? matchingRevenue/matchingSpend.spend:null;
  }) : [];
  const previousCoverage=matchedCoverageSeries.length>1?matchedCoverageSeries[matchedCoverageSeries.length-2]:null;
  const coverageExplanation=scopedSelection ? 'GA4 is site-wide; revenue coverage cannot be compared with a filtered brand or segment.'
    : !hasCompletePlatformCoverage ? 'Missing the Hour Choice/combined Meta account; full two-account coverage cannot be calculated.'
    : !month ? 'Spend and GA4 revenue have different available-month coverage; select one month for a comparable ratio.'
    : platformSpend===null ? 'Advertising spend has not been imported for this month; coverage is unavailable.'
    : siteNetRevenue===null ? 'Verified site revenue has not been imported for this month.'
    : 'GA4 net revenue divided by matched-month platform spend; coverage is not ROAS.';
  return <section className="reference-card media-alignment-v2">
    <div className="media-inout-kpis">
      <article><span>Platform spend · {month?'selected month':'imported months'}</span><strong>{platformSpend===null?'n/a':<CountUpValue value={formatAED(platformSpend)}/>}</strong><small>Google + Meta imports. Missing period is not AED 0.</small><MediaHistory history={history} month={month} keyName="spend"/></article>
      <article><span>{revenueSource} · {month?'selected month':'imported months'}</span><strong>{siteNetRevenue===null?'n/a':<CountUpValue value={formatAED(siteNetRevenue)}/>}</strong><small>Source: {ga4?.available?'GA4 v4 monthly summary':'reconciled site workbook'}; not a platform conversion value.</small>{ga4?.available ? <>{comparableRevenue&&selectedGa4&&priorGa4 ? <DeltaLine previous={priorGa4.netRevenueAed!} current={selectedGa4.netRevenueAed!} period={`Month ${month!-1}, ${year}`} /> : null}<SparkBars values={revenueSparks}/></> : <MediaHistory history={history} month={month} keyName="itemRevenue"/>}</article>
      <article><span>Revenue coverage</span><strong>{coverage===null?'n/a':<CountUpValue value={formatRatio(coverage)}/>}</strong><small>{coverageExplanation}</small>{coverage!==null ? <>{previousCoverage!=null ? <DeltaLine previous={previousCoverage} current={coverage} period={`Month ${month!-1}, ${year}`}/>:null}<SparkBars values={matchedCoverageSeries}/></>:null}</article>
    </div>
    <h3>Spend and first-time purchasers · {year}</h3>
    {query.isError && !ga4?.available ? <p className="v2-section-definition">Legacy Consumer alignment is unavailable; charts show only imported Media history.</p> : null}
    <p>Separate sources and separate axes. Missing spend months remain gaps, never zeros. No platform ROAS is inferred. {scopedSelection ? "This yearly chart is overall Rivoli context and does not inherit the selected brand or segment filter; the KPI row above follows the current Media selection." : null}</p>
    <div className="media-aligned-chart"><h4>Platform advertising spend · AED</h4>
      <ResponsiveContainer width="100%" height={170}><LineChart data={rows} margin={{left:18,right:18,top:8,bottom:8}}>
        <CartesianGrid stroke="#e6e7e8" vertical={false}/><XAxis dataKey="month" tick={{fontSize:11,fill:'#626a73'}}/><YAxis width={70} tickMargin={8} tick={{fontSize:10,fill:'#626a73'}} tickFormatter={(value:number)=>`${Math.round(value/1000)}K`}/><Tooltip formatter={(value, _key) => value == null ? 'n/a' : formatAED(Number(value))} />
        <Line dataKey="spend" type="linear" connectNulls={false} stroke="#30343a" strokeWidth={2} dot={{r:2}} isAnimationActive={animate} animationDuration={300}/>
      </LineChart></ResponsiveContainer>
    </div>
    <div className="media-aligned-chart"><h4>First-time purchasers · site</h4>
      <ResponsiveContainer width="100%" height={170}><LineChart data={rows} margin={{left:18,right:18,top:8,bottom:8}}>
        <CartesianGrid stroke="#e6e7e8" vertical={false}/><XAxis dataKey="month" tick={{fontSize:11,fill:'#626a73'}}/><YAxis width={70} tickMargin={8} tick={{fontSize:10,fill:'#626a73'}} tickFormatter={(value:number)=>formatNumber(value)}/><Tooltip formatter={(value, _key) => value == null ? 'n/a' : formatNumber(Number(value))} />
        <Line dataKey="ftp" type="linear" connectNulls={false} stroke="#596677" strokeWidth={2} dot={{r:2}} isAnimationActive={animate} animationDuration={300}/>
      </LineChart></ResponsiveContainer>
    </div>
    <p className="media-alignment-footnote">{rows.filter((row)=>row.spend==null).length} month(s) have unavailable spend; {rows.filter((row)=>row.ftp==null).length} lack purchaser figures; {rows.filter((row)=>row.partial).length} carry partial reporting status. {ga4?.available ? 'GA4 v4 is authoritative for first-time purchasers. No legacy Consumer values were substituted into missing GA4 months.' : legacyAvailable ? 'Legacy Consumer first-time purchasers are shown as a separately sourced series; GA4 v4 has not been verified.' : 'GA4 v4 and legacy Consumer first-time-purchaser data are unavailable.'}</p>
  </section>;
}

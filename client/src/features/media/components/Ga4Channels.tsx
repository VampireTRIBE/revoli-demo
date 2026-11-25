import type { Ga4V4 } from '../../../types/media';
import { AwaitingLine, DeltaLine, SparkBars } from '../../../components/v2/Reporting';
import { formatAED, formatNumber } from '../utils/formatters';
import { MonthlyGa4Bars } from './MonthlyGa4Bars';

export function Ga4Channels({data,year,month}:{data?:Ga4V4;year?:number;month?:number}) {
  if (!data?.available) return <AwaitingLine source={data?.reason??'Rivoli-Consumer-GA4-Import-v4.xlsx has not been loaded.'} owner="GA4 / TBL"/>;
  const periods=new Map<number,{sessions:number|null;revenue:number|null}>();
  for (const row of data.channels) if (!year||row.year===year) {
    const previous=periods.get(row.month)??{sessions:null,revenue:null};
    periods.set(row.month,{sessions:row.sessions===null?previous.sessions:(previous.sessions??0)+row.sessions,
      revenue:row.revenueAed===null?previous.revenue:(previous.revenue??0)+row.revenueAed});
  }
  // Preserve every calendar month; absent months remain gaps, never packed together.
  const endMonth=month&&month>0?month:Math.max(...periods.keys(),0);
  const visible=Array.from({length:endMonth},(_,index)=>[index+1,periods.get(index+1)??{sessions:null,revenue:null}] as const);
  // Bars are snapshots, not a continuous time series: plot only verified months.
  // Missing months stay null in KPI spark bars and are explicitly disclosed below.
  const chartMonths=visible.filter(([,period])=>period.sessions!==null||period.revenue!==null);
  const chartRows=chartMonths.map(([m,period])=>({
    month:new Intl.DateTimeFormat('en-US',{month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(year??2026,m-1,1))),
    sessions:period.sessions, revenue:period.revenue,
  }));
  const selected=data.channels.filter((row)=>(!year||row.year===year)&&(!month||row.month===month));
  const summaryRows=data.summaries.filter((row)=>!year||row.year===year);
  // Without a month selected, aggregate the available monthly summaries rather
  // than accidentally presenting January as the whole year's net revenue.
  const selectedSummary=month
    ? summaryRows.find((row)=>row.month===month)
    : summaryRows.length ? {
      year:year??summaryRows[0]!.year,month:0,
      netRevenueAed:summaryRows.every((row)=>row.netRevenueAed!==null)?summaryRows.reduce((sum,row)=>sum+(row.netRevenueAed??0),0):null,
      firstTimePurchasers:summaryRows.every((row)=>row.firstTimePurchasers!==null)?summaryRows.reduce((sum,row)=>sum+(row.firstTimePurchasers??0),0):null,
      refundsAed:null,
    } : undefined;
  const previousSummary=month?summaryRows.find((row)=>row.month===month-1):undefined;
  const current=month?periods.get(month):undefined;
  const prev=month?periods.get(month-1):undefined;
  const previousMonth=month&&month>1?new Intl.DateTimeFormat('en-US',{month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(year??2026,month-2,1))):'';
  if (!selected.length&&!selectedSummary) return <AwaitingLine source={`GA4 v4 is available, but no verified ${year??''}-${month??''} channel/summary rows were found.`} owner="GA4 / TBL"/>;
  return <div className="v2-ga4-view">
    <div className="media-inout-kpis">
      <article><span>GA4 sessions · {month?'selected month':'imported channel months'}</span><strong>{formatNumber(selected.some((r)=>r.sessions!==null)?selected.reduce((sum,r)=>sum+(r.sessions??0),0):null)}</strong>
        {current?.sessions!=null&&prev?.sessions!=null? <DeltaLine previous={prev.sessions} current={current.sessions} period={`${previousMonth} ${year}`}/>:null}
        <SparkBars values={visible.map(([,v])=>v.sessions)}/></article>
      <article><span>GA4 net revenue · {month?'selected month':'available monthly summaries'}</span><strong>{selectedSummary?.netRevenueAed!=null?formatAED(selectedSummary.netRevenueAed):'n/a'}</strong><small>Net GA4 revenue, including negative unattributed refunds</small>{selectedSummary?.netRevenueAed!=null&&previousSummary?.netRevenueAed!=null ? <DeltaLine previous={previousSummary.netRevenueAed} current={selectedSummary.netRevenueAed} period={`${previousMonth} ${year}`}/> : null}<SparkBars values={visible.map(([m])=>data.summaries.find((r)=>r.month===m&&(!year||r.year===year))?.netRevenueAed??null)}/></article>
      <article><span>GA4 first-time purchasers · {month?'selected month':'available summaries'}</span><strong>{formatNumber(selectedSummary?.firstTimePurchasers??null)}</strong><small>Daily-summable first-time purchasers, not platform claims</small>{selectedSummary?.firstTimePurchasers!=null&&previousSummary?.firstTimePurchasers!=null?<DeltaLine previous={previousSummary.firstTimePurchasers} current={selectedSummary.firstTimePurchasers} period={`${previousMonth} ${year}`}/>:null}<SparkBars values={visible.map(([m])=>data.summaries.find((r)=>r.month===m&&(!year||r.year===year))?.firstTimePurchasers??null)}/></article>
    </div>
    {selected.length?<div className="reference-table-wrap"><table><thead><tr>{!month ? <th>Period</th> : null}<th>Channel</th><th className="num">Sessions</th><th className="num">Revenue (AED)</th></tr></thead><tbody>{selected.map((r,index)=><tr key={`${r.year}:${r.month}:${r.channel}:${index}`}>{!month ? <td>{r.year}-{String(r.month).padStart(2,'0')}</td> : null}<td>{r.channel}{r.channel.toLowerCase()==='unassigned' ? <small> · includes unattributed refunds</small> : null}</td><td className="num">{formatNumber(r.sessions)}</td><td className="num">{r.revenueAed==null?'n/a':formatAED(r.revenueAed)}</td></tr>)}</tbody></table></div>:null}
    <MonthlyGa4Bars title="GA4 sessions · imported months" rows={chartRows.map(row=>({label:row.month,value:row.sessions}))} />
    <MonthlyGa4Bars title="GA4 channel revenue · imported months · AED" rows={chartRows.map(row=>({label:row.month,value:row.revenue}))} currency />
    {chartMonths.length < visible.length ? <p className="v2-section-definition">Only {chartMonths.map(([m])=>new Intl.DateTimeFormat('en-US',{month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(year??2026,m-1,1)))).join(' and ')} have verified GA4 observations in this chart. Other months were not imported, not zero.</p>:null}
    <p className="v2-section-source">Source: {data.sourceFile}. Missing months are gaps, not zeros. Net revenue from the summary is not silently replaced with a channel sum. Unassigned may contain negative net revenue from unattributed refunds; it is not redistributed. GA4 privacy rounding applies to purchaser counts. Repeat-purchase percentage remains pending a monthly-level purchaser export.</p>
  </div>;
}

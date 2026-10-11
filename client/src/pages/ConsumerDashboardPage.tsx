import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { http } from '../api/http';
import { TblReadsStrip } from '../features/reads/TblReadsStrip';
import type { ConsumerDashboard, ConsumerOptions } from '../types/consumer';
import '../styles/reference-consumer.css';

const api = async <T,>(path:string,params?:Record<string,number>) => (await http.get<{data:T}>(path,{params})).data.data;

export function ConsumerDashboardPage() {
  const [params,setParams]=useSearchParams();
  const options=useQuery({queryKey:['consumer','options'],queryFn:()=>api<ConsumerOptions>('/consumer/options')});
  const year=Number(params.get('year'))||options.data?.defaultSelection?.year;
  const month=params.has('month')?Number(params.get('month')):options.data?.defaultSelection?.month;
  useEffect(()=>{ if(!params.has('year')&&options.data?.defaultSelection) setParams({year:String(options.data.defaultSelection.year),month:String(options.data.defaultSelection.month)},{replace:true}); },[options.data,params,setParams]);
  const dashboard=useQuery({queryKey:['consumer','dashboard',year,month],queryFn:()=>api<ConsumerDashboard>('/consumer/dashboard',{year:year!,month:month!}),enabled:Boolean(year&&month!==undefined)});
  const months=options.data?.years.find((row)=>row.year===year)?.months??[];
  return <section className="consumer-page">
    <div className="consumer-heading"><div><h2>Consumer <span className="reference-badge live">IMPORTED DATA</span></h2><p>Rivoli customer behaviour · directional — baselines pending</p></div><div className="consumer-filters"><label><span>Year</span><select value={year??''} onChange={(event)=>setParams({year:event.target.value,month:'0'})}>{options.data?.years.map((row)=><option key={row.year}>{row.year}</option>)}</select></label><label><span>Month</span><select value={month??0} onChange={(event)=>setParams({year:String(year),month:event.target.value})}>{months.map((row)=><option key={row.month} value={row.month}>{row.label}{row.partial?' (partial)':''}</option>)}</select></label></div></div>
    <TblReadsStrip client="Rivoli" section="Consumer" year={year} month={month} />
    {dashboard.isLoading?<div className="consumer-state">Loading Consumer data...</div>:dashboard.isError||!dashboard.data?<div className="consumer-state error">Consumer data could not be loaded.</div>:<ConsumerContent data={dashboard.data}/>} 
  </section>;
}

function ConsumerContent({data}:{data:ConsumerDashboard}) {
  const cards=[
    ['Customer base',num(data.cards.customerBase),'Monthly buyers (cohort size)'],
    ['New customer intake',num(data.cards.newCustomerIntake),data.cards.intakeDelta==null?'No comparison for partial/all-period view':`${deltaPct(data.cards.intakeDelta)} vs previous full month`],
    ['Repeat buying share',ratePct(data.cards.repeatBuyingShare),'approximate, GA4 privacy rounding applies'],
    ['Consideration window',ratePct(data.cards.considerationWindow),'People purchasing more than 7 days after first visit · provisional'],
    ['Visitor retention','N/A','Day-1 / Day-7 / Day-30 values not supplied'],
    ['True repeat & value','Awaiting order export — Thirty31North','6/12-month repeat and value per customer'],
  ];
  const trend=data.series.map((row)=>({month:row.label.replace(' 2026',''),intake:row.firstTimePurchasers,buyers:row.monthlyBuyers,repeat:row.observedRepeatPercent*100}));
  return <>
    <div className="consumer-period"><b>{data.periodLabel}</b>{data.partial?<span>Partial period — excluded from comparisons and flags</span>:null}{data.biggestMover?<small>Biggest mover: {data.biggestMover.label} intake {deltaPct(data.biggestMover.deltaVsPreviousMonth)}</small>:null}</div>
    <div className="consumer-card-grid">{cards.map(([label,value,note],index)=><article className={`consumer-card${index===5?' awaiting':''}`} key={label}><span>{label}</span><strong>{value}</strong><p>{note}</p>{index<4?<MiniTrend values={index===0?data.series.map(r=>r.monthlyBuyers):index===1?data.series.map(r=>r.firstTimePurchasers):index===2?data.series.map(r=>r.observedRepeatPercent*100):[]}/>:null}</article>)}</div>
    <section className="consumer-panel"><h3>Monthly customer trend</h3><p>September is partial and remains visible, but is excluded from deltas and biggest-mover flags.</p><ResponsiveContainer width="100%" height={300}><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke="var(--line)"/><XAxis dataKey="month" stroke="var(--muted)"/><YAxis yAxisId="count" stroke="var(--blue)"/><YAxis yAxisId="rate" orientation="right" tickFormatter={(value)=>`${value}%`} stroke="var(--teal)"/><Tooltip/><Legend/><Line yAxisId="count" dataKey="intake" name="First-time purchasers" stroke="var(--blue)" strokeWidth={3}/><Line yAxisId="count" dataKey="buyers" name="Monthly buyers" stroke="#6f7fc7" strokeWidth={2}/><Line yAxisId="rate" dataKey="repeat" name="Observed repeat %" stroke="var(--teal)" strokeWidth={2}/></LineChart></ResponsiveContainer></section>
    <section className="consumer-panel"><div className="consumer-panel-heading"><div><h3>Aligned</h3><p>Monthly Media spend beside first-time purchaser intake. Separate sources; not one calculation.</p></div><span>Supported pair</span></div><div className="consumer-aligned">{data.aligned.map((row)=><div key={row.month}><b>{row.label.replace(' 2026','')}</b><span>{row.mediaSpendAed==null?'Spend N/A':`AED ${row.mediaSpendAed.toLocaleString()}`}</span><span>{row.firstTimePurchasers.toLocaleString()} first-time purchasers</span></div>)}</div></section>
    <section className="consumer-panel"><div className="consumer-panel-heading"><div><h3>Aligned</h3><p>Media spend per channel beside purchases by first-touch channel.</p></div><span>Data not available</span></div><div className="consumer-unavailable">First-touch purchase-channel values are not supplied in the Consumer import.</div></section>
    <details className="consumer-method"><summary>Coverage and calculation notes</summary><ul>{data.limitations.map((item)=><li key={item}>{item}</li>)}</ul><p>Source: {data.sourceFile}. Displayed values are imported or use the existing Media spend calculation for the aligned monthly view.</p></details>
  </>;
}

function MiniTrend({values}:{values:number[]}) { if(!values.length)return null; const max=Math.max(...values,1); return <div className="consumer-mini" aria-hidden="true">{values.map((value,index)=><i key={index} style={{height:`${Math.max(8,(value/max)*100)}%`}}/>)}</div>; }
const num=(value:number|null)=>value==null?'N/A':value.toLocaleString();
const ratePct=(value:number|null)=>value==null?'N/A':`${(value*100).toFixed(1)}%`;
const deltaPct=(value:number|null)=>value==null?'N/A':`${value>0?'+':''}${(value*100).toFixed(1)}%`;

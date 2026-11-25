import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { http } from '../api/http';
import { TblReadsStrip } from '../features/reads/TblReadsStrip';
import { AwaitingLine, SectionAnatomy } from '../components/v2/Reporting';
import type { ConsumerDashboard, ConsumerOptions } from '../types/consumer';
import '../styles/reference-consumer.css';

const api = async <T,>(path:string,params?:Record<string,number>) => (await http.get<{data:T}>(path,{params})).data.data;

export function ConsumerDashboardPage() {
  const [params,setParams]=useSearchParams();
  useEffect(()=>{if(!params.has('competition'))return;const next=new URLSearchParams(params);next.delete('competition');setParams(next,{replace:true});},[params,setParams]);
  const client=params.get('client')==='union-coop'?'union-coop':'rivoli';
  const options=useQuery({queryKey:['consumer','options'],queryFn:()=>api<ConsumerOptions>('/consumer/options')});
  const year=Number(params.get('year'))||options.data?.defaultSelection?.year;
  const month=params.has('month')?Number(params.get('month')):options.data?.defaultSelection?.month;
  useEffect(()=>{ if(!params.has('year')&&options.data?.defaultSelection) setParams({year:String(options.data.defaultSelection.year),month:String(options.data.defaultSelection.month),client},{replace:true}); },[options.data,params,setParams,client]);
  const comments=useQuery({queryKey:['consumer','union-comments',year,month],queryFn:()=>api<UnionCoopComments>('/consumer/union-comments',{year:year!,month:month??0}),enabled:Boolean(client==='union-coop'&&year)});
  const dashboard=useQuery({queryKey:['consumer','dashboard',year,month],queryFn:()=>api<ConsumerDashboard>('/consumer/dashboard',{year:year!,month:month!}),enabled:Boolean(year&&month!==undefined)});
  const months=options.data?.years.find((row)=>row.year===year)?.months??[];
  return <section className="consumer-page">
    <div className="consumer-heading"><div><h2>Consumer <span className="reference-badge live">IMPORTED DATA</span></h2><p>{client==='rivoli'?'Rivoli customer behaviour · directional · baselines pending':'Union Coop · customer comment categories · import pending'}</p></div><div className="consumer-filters"><label><span>Client</span><select value={client} onChange={(event)=>setParams({year:String(year??2026),month:String(month??0),client:event.target.value})}><option value="rivoli">Rivoli</option><option value="union-coop">Union Coop</option></select></label><label><span>Year</span><select value={year??''} onChange={(event)=>setParams({year:event.target.value,month:'0',client})}>{options.data?.years.map((row)=><option key={row.year}>{row.year}</option>)}</select></label><label><span>Month</span><select value={month??0} onChange={(event)=>setParams({year:String(year),month:event.target.value,client})}>{months.map((row)=><option key={row.month} value={row.month}>{row.label}{row.partial?' (partial)':''}</option>)}</select></label></div></div>
    {client==='union-coop' ? <><TblReadsStrip client="Union Coop" section="Consumer" year={year} month={month} /><SectionAnatomy number={1} label="What customers are saying" question="What themes appear in customer comments" definition="Monthly counts of contest entries, product questions, complaints and praise, from the verified comment-type export."><UnionCoopCommentContent data={comments.data} error={comments.isError} loading={comments.isLoading}/></SectionAnatomy></> : <><TblReadsStrip client="Rivoli" section="Consumer" year={year} month={month} />
    {dashboard.isLoading?<div className="consumer-state">Loading Consumer data...</div>:dashboard.isError||!dashboard.data?<div className="consumer-state error">Consumer data could not be loaded.</div>:<ConsumerContent data={dashboard.data}/>}</>}
  </section>;
}

function ConsumerContent({data}:{data:ConsumerDashboard}) {
  const cards=[
    ['Customer base',num(data.cards.customerBase),'Monthly buyers (cohort size)'],
    ['New customer intake',num(data.cards.newCustomerIntake),data.cards.intakeDelta==null?'No comparison for partial/all-period view':`${deltaPct(data.cards.intakeDelta)} vs previous full month`],
    ['Repeat buying share',ratePct(data.cards.repeatBuyingShare),'approximate, GA4 privacy rounding applies'],
    ['Consideration window',ratePct(data.cards.considerationWindow),'People purchasing more than 7 days after first visit · provisional'],
    ['Visitor retention','N/A','Day-1 / Day-7 / Day-30 values not supplied'],
    // Do not create a large empty KPI card for an absent order export.
  ];
  const trend=data.series.map((row)=>({month:row.label.replace(' 2026',''),intake:row.firstTimePurchasers,buyers:row.monthlyBuyers,repeat:row.observedRepeatPercent*100}));
  return <>
    <div className="consumer-period"><b>{data.periodLabel}</b>{data.partial?<span>Partial period — excluded from comparisons and flags</span>:null}{data.biggestMover?<small>Biggest mover: {data.biggestMover.label} intake {deltaPct(data.biggestMover.deltaVsPreviousMonth)}</small>:null}</div>
    <div className="consumer-card-grid">{cards.map(([label,value,note],index)=><article className="consumer-card" key={label}><span>{label}</span><strong>{value}</strong><p>{note}</p>{index<4?<MiniTrend values={index===0?data.series.map(r=>r.monthlyBuyers):index===1?data.series.map(r=>r.firstTimePurchasers):index===2?data.series.map(r=>r.observedRepeatPercent*100):[]}/>:null}</article>)}</div>
    <AwaitingLine source="Thirty31North order-level export required for 6/12-month repeat purchasing and customer lifetime value." owner="Thirty31North"/>
    <section className="consumer-panel"><h3>Monthly customer trend</h3><p>September is partial and remains excluded from deltas. Counts and percentages use separate panels, never a dual axis.</p>
      <h4>First-time purchasers and monthly buyers</h4><ResponsiveContainer width="100%" height={190}><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke="var(--v2-line)"/><XAxis dataKey="month"/><YAxis/><Tooltip/><Line type="linear" dataKey="intake" name="First-time purchasers" stroke="#141413" strokeWidth={2} connectNulls={false}/><Line type="linear" dataKey="buyers" name="Monthly buyers" stroke="#5A646E" strokeWidth={2} connectNulls={false}/></LineChart></ResponsiveContainer>
      <h4>Observed repeat share (approximate; GA4 privacy rounding)</h4><ResponsiveContainer width="100%" height={150}><LineChart data={trend}><XAxis dataKey="month"/><YAxis tickFormatter={(v:number)=>`${v}%`}/><Tooltip/><Line type="linear" dataKey="repeat" name="Observed repeat %" stroke="#141413" strokeWidth={2} connectNulls={false}/></LineChart></ResponsiveContainer>
    </section>
    <section className="consumer-panel"><div className="consumer-panel-heading"><div><h3>Aligned</h3><p>Monthly Media spend beside first-time purchaser intake. Separate sources; not one calculation.</p></div><span>Supported pair</span></div><div className="consumer-aligned">{data.aligned.map((row)=><div key={row.month}><b>{row.label.replace(' 2026','')}</b><span>{row.mediaSpendAed==null?'Spend N/A':`AED ${row.mediaSpendAed.toLocaleString()}`}</span><span>{row.firstTimePurchasers.toLocaleString()} first-time purchasers</span></div>)}</div></section>
    <AwaitingLine source="First-touch purchase-channel values required for spend versus purchases by first-touch channel." owner="GA4 team"/>
    <details className="consumer-method"><summary>Coverage and calculation notes</summary><ul>{data.limitations.map((item)=><li key={item}>{item}</li>)}</ul><p>Source: {data.sourceFile}. Displayed values are imported or use the existing Media spend calculation for the aligned monthly view.</p></details>
  </>;
}

function MiniTrend({values}:{values:number[]}) { if(!values.length)return null; const max=Math.max(...values,1); return <div className="consumer-mini" aria-hidden="true">{values.map((value,index)=><i key={index} style={{height:`${Math.max(8,(value/max)*100)}%`}}/>)}</div>; }
const num=(value:number|null)=>value==null?'N/A':value.toLocaleString();
const ratePct=(value:number|null)=>value==null?'N/A':`${(value*100).toFixed(1)}%`;
const deltaPct=(value:number|null)=>value==null?'N/A':`${value>0?'+':''}${(value*100).toFixed(1)}%`;

interface UnionCoopComments { available:boolean; sourceFile:string; reason:string|null; categories:Array<{category:string;count:number}>; total:number|null; year:number;month:number; }
function UnionCoopCommentContent({data,error,loading}:{data?:UnionCoopComments;error:boolean;loading:boolean}) {
  if (loading) return <div className="v2-highlights-loading" role="status">Loading approved Union Coop comment counts...</div>;
  if (error || !data?.available) return <AwaitingLine source={data?.reason ?? 'Union Coop monthly comment-type export has not been supplied; no category counts can be reported.'} owner="TBL" />;
  return <div className="consumer-card-grid" aria-label="Imported Union Coop comment categories">
    {data.categories.map((item)=><article className="consumer-card" key={item.category}><span>{item.category}</span><strong>{item.count.toLocaleString('en-US')}</strong><p>Counted comments · approved monthly import</p></article>)}
    <p className="v2-section-source">Source: {data.sourceFile}. Period: {data.year}-{String(data.month).padStart(2,'0')}. No sentiment or success assessment is inferred.</p>
  </div>;
}

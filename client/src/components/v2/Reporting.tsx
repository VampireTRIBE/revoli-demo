import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { http } from '../../api/http';
import type { TblReadsResponse } from '../../types/reads';

export function AwaitingLine({source, owner, message}: {source:string; owner?:string; message?:string}) {
  return <div className="v2-search-await" role="status"><span className="v2-awaiting-dot"/><div><b>AWAITING</b> {message ?? source}{owner ? ` · Owner: ${owner}` : ''}</div></div>;
}
export function SectionAnatomy({number,label,question,definition,children,client,readSection,year,month,source}: {
  number:number; label:string; question:string; definition:string; children:ReactNode;
  client?:string; readSection?:'Media'|'Creative'|'Consumer'|'Competition';year?:number;month?:number;source?:string;
}) {
  const reads = useQuery({queryKey:['v2-section-highlights',client,readSection,year,month], enabled:Boolean(client&&readSection&&year&&month!==undefined),
    queryFn:async()=> (await http.get<{data:TblReadsResponse}>('/reads',{params:{client,section:readSection,year,month}})).data.data });
  const highlight = reads.data?.reads.find((r) => {
    const linked = r.linkedCard.toLowerCase();
    return linked === String(number) || linked.includes(`${String(number).padStart(2,'0')}`) || linked === label.toLowerCase();
  });
  return <section className="v2-report-section" aria-label={`${label}: ${question}`}>
    <header className="v2-section-header"><span className="v2-section-index">{String(number).padStart(2,'0')}</span><h3>{label}</h3><span className="v2-section-question">{question}</span></header>
    <p className="v2-section-definition">{definition}</p>
    {highlight ? <p className="v2-section-highlight"><span aria-hidden="true">💡</span>{highlight.bullet}<small>{reads.data?.period} · signed</small></p> : null}
    {children}
    {source ? <p className="v2-section-source">{source}</p> : null}
  </section>;
}
export function SparkBars({values}: {values:number[]}) {
  if(values.length < 2)return null;
  const recent=values.slice(-8).filter(Number.isFinite);
  const top=Math.max(1,...recent.map((v)=>Math.max(0,v)));
  return <div className="v2-sparkbars" title={`${recent.length} actual available reporting periods`} aria-hidden="true">{recent.map((v,i)=><i key={i} className={i===recent.length-1?'current':''} style={{height:`${Math.max(3,Math.round(Math.max(0,v)/top*100))}%`}}/>)}</div>;
}
export function DeltaLine({previous,current,period,partial=false,kind='relative'}:{previous:number|null;current:number|null;period:string;partial?:boolean;kind?:'relative'|'points'}) {
  if(partial||previous==null||current==null||!Number.isFinite(previous)||!Number.isFinite(current)||(kind==='relative'&&previous===0))return null;
  const difference=current-previous;
  const change=kind==='relative'?100*difference/Math.abs(previous):difference;
  return <span className={`v2-delta ${difference>0?'positive':difference<0?'negative':'neutral'}`} title={`Compared with ${period}`}>
    {difference>0?'▲':difference<0?'▼':'='} {difference>0?'+':''}{change.toFixed(1)}{kind==='relative'?'%':' pts'} · {previous.toLocaleString()} → {current.toLocaleString()} · vs {period}
  </span>;
}

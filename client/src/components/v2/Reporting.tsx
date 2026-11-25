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
    const linked = r.linkedCard.toLowerCase().trim();
    const normalizedLabel = label.toLowerCase().trim();
    const index = String(number).padStart(2,'0');
    return linked === String(number) || linked === index || linked === normalizedLabel || linked === `${readSection?.toLowerCase()} ${index}` || linked === `${index} · ${normalizedLabel}` || linked === `${readSection?.toLowerCase()} ${index} · ${normalizedLabel}`;
  });
  return <section className="v2-report-section" aria-label={`${label}: ${question}`}>
    <header className="v2-section-header"><span className="v2-section-index">{String(number).padStart(2,'0')}</span><h3>{label}</h3><span className="v2-section-question">{question}</span></header>
    <p className="v2-section-definition">{definition}</p>
    {highlight ? <p className="v2-section-highlight"><span aria-hidden="true">💡</span>{highlight.bullet}<small>{reads.data?.period} · signed</small></p> : null}
    {children}
    {source ? <p className="v2-section-source">{source}</p> : null}
  </section>;
}
export function SparkBars({values}: {values:Array<number|null|undefined>}) {
  // Preserve period positions. Filtering missing values would falsely connect
  // separated observations and suggest data existed for a missing month.
  const recent=values.slice(-8);
  const actual=recent.filter((v):v is number=>v!=null&&Number.isFinite(v));
  if(actual.length<2)return null;
  const top=Math.max(1,...actual.map((v)=>Math.max(0,v)));
  const lastActual=recent.reduce((index,v,i)=>v!=null&&Number.isFinite(v)?i:index,-1);
  return <div className="v2-sparkbars" title={`${actual.length} verified periods; blank positions indicate missing observations`} aria-hidden="true">{recent.map((v,i)=>
    v==null||!Number.isFinite(v) ? <i key={i} className="missing"/> :
    <i key={i} className={i===lastActual?'current':''} style={{height:`${Math.max(3,Math.round(Math.max(0,v)/top*100))}%`}}/>
  )}</div>;
}
function displayDeltaValue(value: number, kind: 'relative' | 'points'): string {
  const normalized = Math.abs(value) >= 100 ? Math.round(value).toLocaleString('en-US')
    : Number(value.toFixed(2)).toLocaleString('en-US', { maximumFractionDigits: 2 });
  return `${normalized}${kind === 'points' ? '%' : ''}`;
}

/** The chip and absolute pair are separate visual elements, as specified by Section anatomy.
 * Rates are expressed as percentage-point changes, never relative percent changes. */
export function DeltaLine({previous,current,period,partial=false,kind='relative'}:{previous:number|null;current:number|null;period:string;partial?:boolean;kind?:'relative'|'points'}) {
  if (partial || previous == null || current == null || !Number.isFinite(previous) || !Number.isFinite(current) || (kind === 'relative' && previous === 0)) return null;
  const difference = current - previous;
  const change = kind === 'relative' ? 100 * difference / Math.abs(previous) : difference;
  const direction = difference > 0 ? 'positive' : difference < 0 ? 'negative' : 'neutral';
  const arrow = difference > 0 ? '▲' : difference < 0 ? '▼' : '=';
  return <span className={`v2-delta v2-delta-block ${direction}`} title={`Compared with ${period}`}>
    <span className="v2-delta-chip">{arrow} {change > 0 ? '+' : ''}{Number(change.toFixed(1)).toLocaleString('en-US')}{kind === 'relative' ? '%' : ' pts'}</span>
    <span className="v2-delta-pair">{displayDeltaValue(previous,kind)} → {displayDeltaValue(current,kind)} · vs {period}</span>
  </span>;
}

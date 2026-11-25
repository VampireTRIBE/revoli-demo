import { formatAED, formatNumber } from '../utils/formatters';
export interface MonthlyBar {label:string;value:number|null;}
/** Native SVG uses a stable viewBox; no ResizeObserver or parent measurement is required. */
export function MonthlyGa4Bars({title,rows,currency=false}:{title:string;rows:MonthlyBar[];currency?:boolean}) {
  const real=rows.filter((r):r is {label:string;value:number}=>r.value!==null&&Number.isFinite(r.value));
  if(!real.length)return null;
  const max=Math.max(0,...real.map(r=>r.value)),min=Math.min(0,...real.map(r=>r.value));
  const range=max-min||1;
  const rough=range/4, magnitude=10**Math.floor(Math.log10(rough));
  const step=([1,2,2.5,5,10].find(n=>n*magnitude>=rough)??10)*magnitude;
  const lower=Math.floor(min/step)*step,upper=Math.max(step,Math.ceil(max/step)*step);
  const x0=94,x1=980,y0=32,y1=208;
  const y=(value:number)=>y1-(value-lower)/(upper-lower)*(y1-y0);
  const cell=(x1-x0)/real.length,bar=Math.min(110,cell*0.56);
  const compact=(value:number)=>new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1}).format(value);
  const format=(value:number)=>currency?formatAED(value):formatNumber(value);
  const ticks=Array.from({length:Math.round((upper-lower)/step)+1},(_,i)=>lower+i*step);
  return <figure className="v2-ga4-trend v2-native-ga4-chart"><figcaption>{title}</figcaption>
    <svg viewBox="0 0 1000 248" width="100%" role="img" aria-label={`${title}: ${real.map(r=>`${r.label}: ${format(r.value)}`).join('; ')}`}>
      {ticks.map(t=><g key={t}><line x1={x0} x2={x1} y1={y(t)} y2={y(t)} stroke="#E2E2DE"/><text x={x0-10} y={y(t)+4} textAnchor="end" fill="#5A646E" fontSize={13}>{compact(t)}</text></g>)}
      <line x1={x0} x2={x1} y1={y(0)} y2={y(0)} stroke="#5A646E"/>
      {real.map((r,i)=>{const x=x0+cell*(i+.5),height=Math.abs(y(r.value)-y(0));return <g key={r.label} tabIndex={0} aria-label={`${r.label}: ${format(r.value)}`}><title>{r.label}: {format(r.value)}</title><rect x={x-bar/2} y={Math.min(y(r.value),y(0))} width={bar} height={height} rx={2} fill={i===real.length-1?'#141413':'#8d9395'}/><text x={x} y={Math.max(15,y(Math.max(0,r.value))-8)} textAnchor="middle" fontSize={13} fill="#141413">{compact(r.value)}</text><text x={x} y={y1+25} textAnchor="middle" fontSize={14} fill="#5A646E">{r.label}</text></g>})}
    </svg><div className="v2-ga4-chart-values">{real.map(r=><span key={r.label}><b>{r.label}</b> {format(r.value)}</span>)}</div></figure>;
}

import type { UnionCoopMedia } from '../../../types/media';
import { AwaitingLine } from '../../../components/v2/Reporting';
import { CountUpValue } from '../../../components/v2/CountUpValue';
import { formatAED, formatNumber } from '../utils/formatters';

const cost=(r:UnionCoopMedia['bursts'][number])=>r.spendAed!=null&&r.publicViews!=null&&r.publicViews>0?formatAED(r.spendAed*1000/r.publicViews):'n/a';
export function UnionCoopSpendSummary({data}:{data?:UnionCoopMedia}) {
  if (!data?.bursts.length) return <AwaitingLine source={data?.reason ?? 'Union Coop approved burst spend register is not yet available for this period.'} owner="TBL / Media team" />;
  return <div className="media-inout-kpis v2-coop-burst-cards">{data.bursts.map((row,i)=><article key={`${row.name}-${i}`}><span>{row.name} · {row.platform}</span><strong><CountUpValue value={row.spendAed==null?'n/a':formatAED(row.spendAed)}/></strong><small>{row.publicViews!=null?`${formatNumber(row.publicViews)} public views`:row.knownViews!=null?`${formatNumber(row.knownViews)} known views`:'Delivery pending'} · {cost(row)} / 1,000 public views</small>{row.publicViews==null?<span className="v2-delivery-chip">DELIVERY PENDING</span>:null}</article>)}</div>;
}
export function UnionCoopBursts({data}:{data?:UnionCoopMedia}) {
  if (!data?.bursts.length) return <AwaitingLine source={data?.reason??'Approved Union Coop Burst Register not supplied for this period.'} owner="TBL / Media team"/>;
  return <div className="v2-union-media-bursts v2-coop-card">
    {data.bursts.map((r,i)=><article className="v2-coop-burst-row" key={`${r.name}-${i}`}><div><strong>{r.name}</strong> <span className="v2-objective">{r.objective}</span><p>{r.platform} · {r.startDate||'n/a'} to {r.endDate||'n/a'} · {formatNumber(r.boostedPosts)} boosted posts</p></div><div><small>SPEND</small><strong>{formatAED(r.spendAed)}</strong></div><div><small>{r.publicViews!=null?'PUBLIC VIEWS':'KNOWN VIEWS'}</small><strong>{formatNumber(r.publicViews??r.knownViews)}</strong></div><div><small>COST / 1,000 PUBLIC VIEWS</small><strong>{cost(r)}</strong></div></article>)}
    <p className="v2-section-source">Source: {data.sourceFile}. Public views may include paid and organic delivery. No conversions or paid-only delivery inferred.</p>
  </div>;
}
export function UnionCoopReach({data}:{data?:UnionCoopMedia}) {
  if (!data?.dailyReach.length) return <AwaitingLine source={data?.reason??'Approved Union Coop daily page-reach file not supplied for this period.'} owner="TBL / Media team"/>;
  const rows=[...data.dailyReach].sort((a,b)=>a.date.localeCompare(b.date));
  const max=Math.max(...rows.map(r=>r.pageReach),1), width=900, height=174, cell=width/rows.length;
  return <figure className="v2-coop-card v2-coop-reach"><figcaption>Facebook · daily page reach <small>Amber = paid confirmed · grey = paid not confirmed</small></figcaption><svg width="100%" viewBox="0 0 920 206" role="img" aria-label="Imported daily page reach; paid confirmation shown in amber">{rows.map((r,i)=><g key={r.date} tabIndex={0}><title>{r.date}: {formatNumber(r.pageReach)} reach · {r.paidConfirmed?'PAID CONFIRMED':'Paid not confirmed'}</title><rect x={10+i*cell+1} y={height-r.pageReach/max*height+5} width={Math.max(1,cell-2)} height={r.pageReach/max*height} fill={r.paidConfirmed?'#B45309':'#c8c8c2'}/>{(i===0||i===rows.length-1||i%7===0)?<text x={10+i*cell+cell/2} y={198} fontSize={10} fill="#5A646E" textAnchor="middle">{r.date.slice(5)}</text>:null}</g>)}</svg><p className="v2-section-source">Source: {data.sourceFile}. Only observed dates are shown. Page reach is not post reach; an unconfirmed date is not proof of organic-only delivery.</p></figure>;
}

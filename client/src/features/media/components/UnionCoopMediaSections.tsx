import type { UnionCoopMedia } from '../../../types/media';
import { AwaitingLine } from '../../../components/v2/Reporting';
import { formatAED, formatNumber } from '../utils/formatters';

export function UnionCoopBursts({data}:{data?:UnionCoopMedia}) {
  if (!data?.bursts.length) return <AwaitingLine source={data?.reason??'Approved Union Coop Burst Register has not been supplied.'} owner="TBL / Media team"/>;
  return <div className="v2-union-media-bursts">
    <div className="media-inout-kpis">
      <article><span>Verified burst spend</span><strong>{data.bursts.every(r=>r.spendAed!==null)?formatAED(data.bursts.reduce((sum,r)=>sum+(r.spendAed??0),0)):'n/a'}</strong><small>Only rows in the selected imported burst register</small></article>
      <article><span>Known public views</span><strong>{data.bursts.every(r=>r.publicViews!==null)?formatNumber(data.bursts.reduce((sum,r)=>sum+(r.publicViews??0),0)):'n/a'}</strong><small>As supplied, not a unique audience</small></article>
      <article><span>Burst records</span><strong>{formatNumber(data.bursts.length)}</strong><small>From approved campaign register</small></article>
    </div>
    <div className="reference-table-wrap"><table><thead><tr><th>Campaign / burst</th><th>Platform</th><th>Objective</th><th>Flight</th><th className="num">Spend</th><th className="num">Public views</th><th className="num">Known views</th></tr></thead><tbody>
      {data.bursts.map((r,i)=><tr key={`${r.name}-${i}`}><td>{r.name}</td><td>{r.platform}</td><td>{r.objective}</td><td>{r.startDate||'n/a'} to {r.endDate||'n/a'}</td><td className="num">{r.spendAed==null?'n/a':formatAED(r.spendAed)}</td><td className="num">{formatNumber(r.publicViews)}</td><td className="num">{formatNumber(r.knownViews)}</td></tr>)}
    </tbody></table></div><p className="v2-section-source">Source: {data.sourceFile}. Comparisons between paid page reach and organic post reach are not implied.</p>
  </div>;
}
export function UnionCoopReach({data}:{data?:UnionCoopMedia}) {
  if (!data?.dailyReach.length) return <AwaitingLine source={data?.reason??'Approved Union Coop daily page-reach file not supplied.'} owner="TBL / Media team"/>;
  const maximum=Math.max(...data.dailyReach.map(r=>r.pageReach),1);
  return <div className="v2-coop-daily" aria-label="Daily page reach by paid confirmation">
    {data.dailyReach.map(r=><div className="v2-coop-daily-row" key={r.date}><span>{r.date}</span><div className="v2-coop-track"><i className={r.paidConfirmed?'paid':''} style={{width:`${100*r.pageReach/maximum}%`}}/></div><strong>{formatNumber(r.pageReach)}</strong><small>{r.paidConfirmed?'PAID CONFIRMED':'Not confirmed'}</small></div>)}
    <p className="v2-section-source">Page-level reach, not post-level organic reach. Paid status comes exclusively from approved source rows.</p>
  </div>;
}

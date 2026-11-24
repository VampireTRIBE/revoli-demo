import type { Ga4V4, MediaMonthlyHistory, Overview } from '../../../types/media';
import { DeltaLine, SparkBars } from '../../../components/v2/Reporting';
import { MediaHistory } from './MediaHistory';
import { formatAED, formatPercent } from '../utils/formatters';
import { CountUpValue } from '../../../components/v2/CountUpValue';

/** Slot 2 only. A blended cross-platform CTR is deliberately never displayed. */
export function OverviewCards({ data, history, selectedMonth, ga4, scopedSelection=false }: { data: Overview; history?: MediaMonthlyHistory; selectedMonth?: number; ga4?:Ga4V4; scopedSelection?:boolean }) {
  const metrics = data.metrics;
  const summary = ga4?.summaries.find((item)=>item.month===selectedMonth);
  const spend=history?.months.find((item)=>item.month===selectedMonth)?.spend;
  const verifiedCac= !scopedSelection && spend!=null && summary?.firstTimePurchasers && summary.firstTimePurchasers>0
    ? spend/summary.firstTimePurchasers : null;
  const prev=history?.months.find((item)=>item.month===(selectedMonth??0)-1);
  const priorSummary=ga4?.summaries.find((item)=>item.month===(selectedMonth??0)-1);
  const priorCac=!scopedSelection && prev && !prev.partial && prev.spend!=null && priorSummary?.firstTimePurchasers && priorSummary.firstTimePurchasers>0
    ? prev.spend/priorSummary.firstTimePurchasers:null;
  const selectedHistory=history?.months.find((item)=>item.month===selectedMonth);
  const comparable=verifiedCac!==null&&priorCac!=null&&!selectedHistory?.partial;
  const cacSeries=selectedMonth&&selectedMonth>0?Array.from({length:Math.min(8,selectedMonth)},(_,i)=>{
    const m=selectedMonth-Math.min(8,selectedMonth)+i+1;
    const h=history?.months.find((r)=>r.month===m);
    const first=ga4?.summaries.find((r)=>r.month===m)?.firstTimePurchasers;
    return h?.spend!=null&&first!=null&&first>0?h.spend/first:null;
  }):[];
  return <div className="reference-media-grid two media-cost-overview">
    <article className="reference-card reference-kpi-card">
      <div className="reference-kpi-label">Blended new-customer CAC</div>
      <div className="reference-kpi-value">{verifiedCac==null?'n/a':<CountUpValue value={formatAED(verifiedCac)}/>}</div>
      <div className="reference-kpi-detail">{verifiedCac===null?'Requires matching overall spend and verified GA4 first-time purchasers, with no brand/segment subset.':'Matched overall spend ÷ GA4 first-time site purchasers. Not platform-claimed cost.'}</div>
      {comparable?<DeltaLine previous={priorCac} current={verifiedCac} period={prev?.label??'previous month'}/>:null}
      <SparkBars values={cacSeries}/>
    </article>
    <article className="reference-card reference-kpi-card">
      <div className="reference-kpi-label">Platform-claimed cost per conversion</div>
      <div className="reference-kpi-value"><CountUpValue value={formatAED(metrics.platformClaimedCac.value)}/></div>
      <div className="reference-kpi-detail">Platform spend ÷ platform-reported conversion claims. Overlapping attribution may apply; not verified site CAC.</div><MediaHistory history={history} month={selectedMonth} keyName="platformCostPerClaim"/>
    </article>
    <article className="reference-card reference-kpi-card">
      <div className="reference-kpi-label">Average order value · site import</div>
      <div className="reference-kpi-value"><CountUpValue value={formatAED(metrics.siteAov.value)}/></div>
      <div className="reference-kpi-detail">Platform-claimed cost is {formatPercent(metrics.cacAovRatio.value, 0)} of site AOV when available; this is not a blended-CAC ratio.</div><MediaHistory history={history} month={selectedMonth} keyName="siteAov"/>
    </article>
  </div>;
}

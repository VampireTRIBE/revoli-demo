import type { Ga4V4, MediaMonthlyHistory, Overview } from '../../../types/media';
import { AwaitingLine, DeltaLine, SparkBars } from '../../../components/v2/Reporting';
import { MediaHistory } from './MediaHistory';
import { formatAED, formatNumber, formatPercent } from '../utils/formatters';
import { CountUpValue } from '../../../components/v2/CountUpValue';

/** Acquisition metrics must match the selected month and scope. Never substitute
 * other months' ad spend or use first-time purchasers as total orders. */
export function OverviewCards({ data, history, selectedMonth, ga4, scopedSelection=false }: { data: Overview; history?: MediaMonthlyHistory; selectedMonth?: number; ga4?:Ga4V4; scopedSelection?:boolean }) {
  const metrics = data.metrics;
  const year=data.metadata.year;
  const matching=(m:number)=>history?.months.find(row=>(!year||row.year===year)&&row.month===m);
  const ga4Summary=(m:number)=>ga4?.available?ga4.summaries.find(row=>(!year||row.year===year)&&row.month===m):undefined;
  const selectedHistory=selectedMonth?matching(selectedMonth):undefined;
  const spend=selectedHistory?.spend;
  const cacForMonth=(m:number)=>{
    const h=matching(m), first=ga4Summary(m)?.firstTimePurchasers;
    return !scopedSelection&&h?.spend!=null&&first!=null&&first>0?h.spend/first:null;
  };
  const verifiedCac=selectedMonth?cacForMonth(selectedMonth):null;
  const prev=selectedMonth?matching(selectedMonth-1):undefined;
  const priorCac=selectedMonth&&!prev?.partial?cacForMonth(selectedMonth-1):null;
  const comparable=verifiedCac!==null&&priorCac!==null&&!selectedHistory?.partial;
  const claimedCost=selectedMonth?(selectedHistory?.platformCostPerClaim??null):metrics.platformClaimedCac.value;
  const siteAov=selectedMonth?(selectedHistory?.siteAov??null):metrics.siteAov.value;
  const itemBreakdown=selectedMonth&&!scopedSelection&&ga4?.available?ga4.itemPurchaseBreakdown?.find(row=>(!year||row.year===year)&&row.month===selectedMonth):undefined;
  const itemRatio=siteAov==null&&itemBreakdown&&itemBreakdown.reportedPurchases>0?itemBreakdown.itemRevenueAed/itemBreakdown.reportedPurchases:null;
  const cacSeries=selectedMonth?Array.from({length:Math.min(8,selectedMonth)},(_,i)=>cacForMonth(selectedMonth-Math.min(8,selectedMonth)+i+1)):[];
  const missing:string[]=[];
  if(verifiedCac==null) missing.push(scopedSelection?'Blended new-customer CAC requires site-wide spend and purchasers; clear brand/segment filters.':!selectedMonth?'Select a month to match spend and first-time purchasers for blended CAC.':spend==null?'Blended new-customer CAC requires the selected month’s ad-spend import.':'Blended new-customer CAC requires matching GA4 first-time purchasers.');
  if(claimedCost==null) missing.push('Platform-claimed cost per conversion requires matching ad spend and a positive reported conversion count.');
  if(siteAov==null) missing.push('Average order value requires reconciled site revenue and purchase data for this selection.');
  const hasCards=verifiedCac!=null||claimedCost!=null||siteAov!=null||itemRatio!=null;
  return <>
    {hasCards?<div className="reference-media-grid two media-cost-overview">
      {verifiedCac==null?null:<article className="reference-card reference-kpi-card">
        <div className="reference-kpi-label">Blended new-customer CAC</div>
        <div className="reference-kpi-value"><CountUpValue value={formatAED(verifiedCac)}/></div>
        <div className="reference-kpi-detail">Imported overall spend ÷ GA4 first-time site purchasers. {selectedHistory?.partial?'Partial media coverage; not a full-month CAC.':'Not platform-claimed cost.'}</div>
        {comparable?<DeltaLine previous={priorCac} current={verifiedCac} period={prev?.label??'previous month'}/>:null}
        <SparkBars values={cacSeries}/>
      </article>}
      {claimedCost==null?null:<article className="reference-card reference-kpi-card">
        <div className="reference-kpi-label">Platform-claimed cost per conversion</div>
        <div className="reference-kpi-value"><CountUpValue value={formatAED(claimedCost)}/></div>
        <div className="reference-kpi-detail">Platform spend ÷ platform-reported conversion claims. Overlapping attribution may apply; not verified site CAC.</div><MediaHistory history={history} month={selectedMonth} keyName="platformCostPerClaim"/>
      </article>}
      {siteAov==null?null:<article className="reference-card reference-kpi-card">
        <div className="reference-kpi-label">Average order value · site import</div>
        <div className="reference-kpi-value"><CountUpValue value={formatAED(siteAov)}/></div>
        <div className="reference-kpi-detail">Reconciled site item revenue ÷ reported purchases. {metrics.cacAovRatio.value!=null?`Platform-claimed cost is ${formatPercent(metrics.cacAovRatio.value,0)} of site AOV; not a blended-CAC ratio.`:''}</div><MediaHistory history={history} month={selectedMonth} keyName="siteAov"/>
      </article>}
      {itemRatio!=null&&itemBreakdown?<article className="reference-card reference-kpi-card">
        <div className="reference-kpi-label">Gross item revenue per reported purchase · GA4 v4</div>
        <div className="reference-kpi-value"><CountUpValue value={formatAED(itemRatio)}/></div>
        {!itemBreakdown.totalsConsistent?<span className="reference-badge media-coverage-badge">SOURCE TOTALS INCONSISTENT</span>:null}
        <div className="reference-kpi-detail">{formatAED(itemBreakdown.itemRevenueAed)} ÷ {formatNumber(itemBreakdown.reportedPurchases)} purchases. New + established visitor components, ALL BRANDS. Gross item revenue, not net revenue or verified order AOV. {!itemBreakdown.totalsConsistent?'Printed totals conflict with the components; ratio is provisional.':''}</div>
      </article>:null}
    </div>:null}
    {missing.length?<AwaitingLine source={missing.join(' ')} owner="TBL / Media and site analytics teams"/>:null}
  </>;
}

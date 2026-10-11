import type { Overview } from '../../../types/media';
import { formatAED, formatNumber, formatPercent, formatRatio } from '../utils/formatters';

interface TrendPoint { month: string; data: Overview }
export function OverviewCards({ data, trend, selectedMonth }: { data: Overview; trend: TrendPoint[]; selectedMonth?: number }) {
  const metrics = data.metrics;
  const movers=[
    {label:'Revenue coverage',delta:trendDelta(trend.map((row)=>row.data.metrics.directionalReturn.value),selectedMonth)},
    {label:'Blended CAC',delta:trendDelta(trend.map((row)=>row.data.metrics.platformClaimedCac.value),selectedMonth)},
    {label:'Blended CTR',delta:trendDelta(trend.map((row)=>row.data.metrics.blendedCtr.value),selectedMonth)},
    {label:'Platform conversions',delta:trendDelta(trend.map((row)=>row.data.metrics.platformClaims.value),selectedMonth)},
  ].filter((row):row is {label:string;delta:number}=>row.delta!=null).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
  const biggest=movers[0];

  return <>{biggest?<div className="reference-biggest-mover"><b>Biggest mover:</b> {biggest.label} {biggest.delta>=0?'+':''}{(biggest.delta*100).toFixed(1)}% · mechanical period comparison</div>:null}<div className="reference-media-grid four">
    <article className="reference-card reference-kpi-card">
      <div className="reference-kpi-label">Revenue coverage</div>
      <div className="reference-kpi-value">{formatRatio(metrics.directionalReturn.value)}</div>
      <div className="reference-kpi-detail" title={metrics.directionalReturn.formula}>
        {formatAED(metrics.directionalReturn.revenue, true)} rev / {formatAED(metrics.directionalReturn.spend, true)} spend
        {returnBasisLabel(data) ? <> &middot; {returnBasisLabel(data)}</> : null}
      </div>
      <MetricTrend points={trend.map((row)=>row.data.metrics.directionalReturn.value)} selectedMonth={selectedMonth} />
    </article>
    <article className="reference-card reference-kpi-card">
      <div className="reference-kpi-label">Blended CAC</div>
      <div className="reference-kpi-value">{formatAED(metrics.platformClaimedCac.value)}</div>
      <div className="reference-kpi-detail">AOV {formatAED(metrics.siteAov.value)} &rarr; CAC is {formatPercent(metrics.cacAovRatio.value, 0)} of AOV</div>
      <MetricTrend points={trend.map((row)=>row.data.metrics.platformClaimedCac.value)} selectedMonth={selectedMonth} />
    </article>
    <article className="reference-card reference-kpi-card">
      <div className="reference-kpi-label">Blended CTR</div>
      <div className="reference-kpi-value">{formatPercent(metrics.blendedCtr.value, 2)}</div>
      <div className="reference-kpi-detail" title={metrics.blendedCtr.definition}>
        {metrics.blendedCtr.value == null
          ? 'Comparable paid clicks are not available'
          : <>{formatNumber(metrics.paidTrafficActions)} clicks &divide; {formatNumber(metrics.paidImpressions)} impressions<br /><span>Raw compatible click rows only; Google Interactions excluded</span></>}
      </div>
      <MetricTrend points={trend.map((row)=>row.data.metrics.blendedCtr.value)} selectedMonth={selectedMonth} />
    </article>
    <article className="reference-card reference-kpi-card">
      <div className="reference-kpi-label">Platform conversions</div>
      <div className="reference-kpi-value">{formatNumber(metrics.platformClaims.value)}</div>
      <div className="reference-kpi-detail">vs {formatNumber(metrics.sitePurchases)} site purchases &mdash; see note</div>
      <MetricTrend points={trend.map((row)=>row.data.metrics.platformClaims.value)} selectedMonth={selectedMonth} />
    </article>
  </div></>;
}

function MetricTrend({ points, selectedMonth }: { points: Array<number | null>; selectedMonth?: number }) {
  const values=points.filter((value):value is number=>value!=null);
  if(values.length<2)return <div className="reference-kpi-trend unavailable">Trend N/A</div>;
  const max=Math.max(...values),min=Math.min(...values),range=max-min||1;
  const poly=values.map((value,index)=>`${(index/(values.length-1))*100},${28-((value-min)/range)*24}`).join(' ');
  const delta=trendDelta(points,selectedMonth);
  return <div className="reference-kpi-trend"><svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><polyline points={poly}/></svg><span>{delta==null?'N/A':`${delta>=0?'+':''}${(delta*100).toFixed(1)}%`} {selectedMonth?'vs previous full month':'last full vs prior 3 avg'}</span></div>;
}

function trendDelta(points: Array<number | null>, selectedMonth?: number): number | null {
  const values=points.filter((value):value is number=>value!=null);
  if(values.length<2)return null;
  const current=values.at(-1)!;
  const baseline=selectedMonth ? values.at(-2)! : values.slice(-4,-1).reduce((sum,value)=>sum+value,0)/Math.max(1,values.slice(-4,-1).length);
  return baseline===0?null:(current-baseline)/Math.abs(baseline);
}

function returnBasisLabel(data: Overview): string | null {
  const level = data.metrics.directionalReturn.calculationLevel;
  if (data.metadata.brand && level !== 'BRAND') return `${level === 'SEGMENT' ? 'Segment' : 'Overall'} basis`;
  if (data.metadata.segment && !data.metadata.brand && level !== 'SEGMENT') return 'Overall basis';
  return null;
}

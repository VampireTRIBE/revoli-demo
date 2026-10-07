import type { Overview } from '../../../types/media';
import { formatAED, formatNumber, formatPercent, formatRatio } from '../utils/formatters';

export function OverviewCards({ data }: { data: Overview }) {
  const metrics = data.metrics;

  return <div className="reference-media-grid four">
    <article className="reference-card reference-kpi-card">
      <div className="reference-kpi-label">Revenue coverage</div>
      <div className="reference-kpi-value">{formatRatio(metrics.directionalReturn.value)}</div>
      <div className="reference-kpi-detail" title={metrics.directionalReturn.formula}>
        {formatAED(metrics.directionalReturn.revenue, true)} rev / {formatAED(metrics.directionalReturn.spend, true)} spend
        {returnBasisLabel(data) ? <> &middot; {returnBasisLabel(data)}</> : null}
      </div>
    </article>
    <article className="reference-card reference-kpi-card">
      <div className="reference-kpi-label">Blended CAC</div>
      <div className="reference-kpi-value">{formatAED(metrics.platformClaimedCac.value)}</div>
      <div className="reference-kpi-detail">AOV {formatAED(metrics.siteAov.value)} &rarr; CAC is {formatPercent(metrics.cacAovRatio.value, 0)} of AOV</div>
    </article>
    <article className="reference-card reference-kpi-card">
      <div className="reference-kpi-label">Blended CTR</div>
      <div className="reference-kpi-value">{formatPercent(metrics.blendedCtr.value, 2)}</div>
      <div className="reference-kpi-detail" title={metrics.blendedCtr.definition}>
        {metrics.blendedCtr.value == null
          ? 'Comparable paid clicks are not available'
          : <>{formatNumber(metrics.paidTrafficActions)} clicks &divide; {formatNumber(metrics.paidImpressions)} impressions<br /><span>Raw compatible click rows only; Google Interactions excluded</span></>}
      </div>
    </article>
    <article className="reference-card reference-kpi-card">
      <div className="reference-kpi-label">Platform conversions</div>
      <div className="reference-kpi-value">{formatNumber(metrics.platformClaims.value)}</div>
      <div className="reference-kpi-detail">vs {formatNumber(metrics.sitePurchases)} site purchases &mdash; see note</div>
    </article>
  </div>;
}

function returnBasisLabel(data: Overview): string | null {
  const level = data.metrics.directionalReturn.calculationLevel;
  if (data.metadata.brand && level !== 'BRAND') return `${level === 'SEGMENT' ? 'Segment' : 'Overall'} basis`;
  if (data.metadata.segment && !data.metadata.brand && level !== 'SEGMENT') return 'Overall basis';
  return null;
}

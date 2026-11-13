import type { Overview } from '../../../types/media';
import { formatAED, formatPercent } from '../utils/formatters';

/** Slot 2 only. A blended cross-platform CTR is deliberately never displayed. */
export function OverviewCards({ data }: { data: Overview; trend?: unknown; selectedMonth?: number }) {
  const metrics = data.metrics;
  return <div className="reference-media-grid two media-cost-overview">
    <article className="reference-card reference-kpi-card">
      <div className="reference-kpi-label">Blended customer acquisition cost</div>
      <div className="reference-kpi-value">{formatAED(metrics.platformClaimedCac.value)}</div>
      <div className="reference-kpi-detail">Platform-reported acquisition cost; attribution overlap applies. Not incremental CAC.</div>
    </article>
    <article className="reference-card reference-kpi-card">
      <div className="reference-kpi-label">Average order value</div>
      <div className="reference-kpi-value">{formatAED(metrics.siteAov.value)}</div>
      <div className="reference-kpi-detail">Blended CAC represents {formatPercent(metrics.cacAovRatio.value, 0)} of AOV, when both are available.</div>
    </article>
  </div>;
}

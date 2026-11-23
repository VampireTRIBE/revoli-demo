import type { Overview } from '../../../types/media';
import { formatAED, formatPercent } from '../utils/formatters';
import { CountUpValue } from '../../../components/v2/CountUpValue';

/** Slot 2 only. A blended cross-platform CTR is deliberately never displayed. */
export function OverviewCards({ data }: { data: Overview; trend?: unknown; selectedMonth?: number }) {
  const metrics = data.metrics;
  return <div className="reference-media-grid two media-cost-overview">
    <article className="reference-card reference-kpi-card">
      <div className="reference-kpi-label">Blended new-customer CAC</div>
      <div className="reference-kpi-value">n/a</div>
      <div className="reference-kpi-detail">Approved GA4 v4 first-time site purchasers are unavailable. Spend ÷ platform claims is not new-customer CAC.</div>
    </article>
    <article className="reference-card reference-kpi-card">
      <div className="reference-kpi-label">Platform-claimed cost per conversion</div>
      <div className="reference-kpi-value"><CountUpValue value={formatAED(metrics.platformClaimedCac.value)}/></div>
      <div className="reference-kpi-detail">Platform spend ÷ platform-reported conversion claims. Overlapping attribution may apply; not verified site CAC.</div>
    </article>
    <article className="reference-card reference-kpi-card">
      <div className="reference-kpi-label">Average order value · site import</div>
      <div className="reference-kpi-value"><CountUpValue value={formatAED(metrics.siteAov.value)}/></div>
      <div className="reference-kpi-detail">Platform-claimed cost is {formatPercent(metrics.cacAovRatio.value, 0)} of site AOV when available; this is not a blended-CAC ratio.</div>
    </article>
  </div>;
}

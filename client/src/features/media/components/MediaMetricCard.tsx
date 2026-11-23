import type { MetricStatus } from '../../../types/media';
import { MetricStatusBadge } from './MetricStatusBadge';
import { MetricTooltip } from './MetricTooltip';
import { CountUpValue } from '../../../components/v2/CountUpValue';

interface Props {
  label: string;
  value: string;
  detail: React.ReactNode;
  status: MetricStatus;
  formula: string;
  definition: string;
}

export function MediaMetricCard({ label, value, detail, status, formula, definition }: Props) {
  return (
    <article className="metric-card">
      <div className="metric-card-top">
        <span className="metric-label">{label}</span>
        <MetricTooltip formula={formula} definition={definition} />
      </div>
      <div className="metric-value"><CountUpValue value={value}/></div>
      <div className="metric-detail">{detail}</div>
      <MetricStatusBadge status={status} />
    </article>
  );
}

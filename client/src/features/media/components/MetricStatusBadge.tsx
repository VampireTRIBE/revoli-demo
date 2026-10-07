import type { MetricStatus } from '../../../types/media';

export function MetricStatusBadge({ status }: { status: MetricStatus | 'COMPLETE' | 'PROVISIONAL' }) {
  return <span className={`status status-${status.toLowerCase().replace('_', '-')}`}>{status.replace('_', ' ')}</span>;
}

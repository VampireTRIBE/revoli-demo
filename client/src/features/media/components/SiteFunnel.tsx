import type { FunnelData } from '../../../types/media';
import { formatNumber, formatPercent } from '../utils/formatters';
import { SectionCard } from './SectionCard';

export function SiteFunnel({ data }: { data: FunnelData }) {
  const maximum = data.steps[0]?.value || 1;
  return <SectionCard title="Site funnel" eyebrow="Verified site behaviour">
    <div className="funnel">{data.steps.map((step) => <div className="funnel-row" key={step.label}><span>{step.label}</span><div className="funnel-track"><i style={{ width: `${Math.max(1, (step.value / maximum) * 100)}%` }} /></div><b>{formatNumber(step.value)}</b><em>{step.rate === undefined ? 'Baseline' : formatPercent(step.rate)}</em></div>)}</div>
    <div className="funnel-rates"><span>View → cart <b>{formatPercent(data.viewToCartRate)}</b></span><span>Cart → purchase <b>{formatPercent(data.cartToPurchaseRate)}</b></span><span>View → purchase <b>{formatPercent(data.viewToPurchaseRate, 2)}</b></span></div>
    <p className="section-note">Site-wide behaviour. It is not labelled paid traffic quality because the source is not restricted to paid sessions.</p>
  </SectionCard>;
}

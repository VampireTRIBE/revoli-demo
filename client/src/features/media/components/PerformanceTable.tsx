import type { PerformanceRow } from '../../../types/media';
import { formatAED, formatNumber, formatRatio } from '../utils/formatters';
import { SectionCard } from './SectionCard';

export function PerformanceTable({ title, rows }: { title: string; rows: PerformanceRow[] }) {
  return <SectionCard title={title} eyebrow="Directional economics">
    <div className="table-scroll table-tall"><table><thead><tr><th>{title.startsWith('Brand') ? 'Brand' : 'Segment'}</th><th className="num">Google spend</th><th className="num">Meta spend</th><th className="num">Total spend</th><th className="num">Purchases</th><th className="num">Site revenue</th><th className="num">AOV</th><th className="num">Directional return</th></tr></thead>
      <tbody>{rows.slice(0, 20).map((row) => <tr key={row.label}><td><strong>{row.label}</strong></td><td className="num">{formatAED(row.googleSpend)}</td><td className="num">{formatAED(row.metaSpend)}</td><td className="num">{formatAED(row.totalSpend)}</td><td className="num">{formatNumber(row.sitePurchases)}</td><td className="num">{formatAED(row.siteRevenue)}</td><td className="num">{formatAED(row.siteAov)}</td><td className="num"><span className="directional-value">{formatRatio(row.directionalReturn)}</span></td></tr>)}</tbody>
    </table></div>
    <p className="section-note">Site revenue includes organic and direct sales. Return is directional, not causal paid-media attribution.</p>
  </SectionCard>;
}

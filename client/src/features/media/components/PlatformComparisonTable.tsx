import type { PlatformData } from '../../../types/media';
import { formatAED, formatNumber, formatPercent, formatRatio } from '../utils/formatters';

export function PlatformComparisonTable({ data }: { data: PlatformData }) {
  return <section className="reference-card reference-mt">
    <h3>By platform &mdash; {data.metadata.sourcePeriodLabel}</h3>
    <div className="reference-table-wrap reference-mobile-table reference-platform-table">
      <table>
        <thead><tr><th>Platform</th><th className="num">Spend</th><th className="num">Impr.</th><th className="num">CTR</th><th className="num">Conv.</th><th className="num">CAC</th><th className="num">ROAS</th></tr></thead>
        <tbody>{data.platforms.map((row) => <tr key={row.platform}>
          <td><b>{row.platform}</b></td>
          <td className="num">{formatAED(row.spend)}</td>
          <td className="num">{formatNumber(row.impressions)}</td>
          <td className="num" title={row.ctrLabel}>{formatPercent(row.ctr, 2)}</td>
          <td className="num">{formatNumber(row.platformClaims)}</td>
          <td className="num">{formatAED(row.claimedCac)}</td>
          <td className={`num reference-roas ${roasTone(row.roas)}`} title={`${row.roasBasis} Directional, not platform-attributed revenue.`}>{formatRatio(row.roas)}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>;
}

function roasTone(value: number | null): string {
  if (value === null || value < 1.5) return 'bad';
  return value >= 2.5 ? 'good' : 'warn';
}

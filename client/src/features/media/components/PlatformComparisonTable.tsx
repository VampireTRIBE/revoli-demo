import { AwaitingLine } from '../../../components/v2/Reporting';
import type { PlatformData } from '../../../types/media';
import { formatAED, formatNumber, formatPercent } from '../utils/formatters';

export function PlatformComparisonTable({ data }: { data: PlatformData }) {
  const hasData=data.platforms.some(row=>row.spend!=null||row.impressions!=null||row.platformClaims!=null);
  const {year,month}=data.metadata;
  const period=year&&month?new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,1))):data.metadata.sourcePeriodLabel;
  if(!hasData)return <AwaitingLine source={`By platform · ${period}: no matching Google Ads or Meta Ads performance records for this selection.`} owner="TBL / Media team"/>;
  return <section className="reference-card reference-mt">
    <h3>By platform &mdash; {period}</h3>
    <div className="reference-table-wrap reference-mobile-table reference-platform-table">
      <table>
        <thead><tr><th>Platform</th><th className="num">Spend</th><th className="num">Impr.</th><th className="num">CTR</th><th className="num">Conv.</th><th className="num">CAC</th></tr></thead>
        <tbody>{data.platforms.map((row) => <tr key={row.platform}>
          <td><b>{row.platform}</b></td>
          <td className="num">{formatAED(row.spend)}</td>
          <td className="num">{formatNumber(row.impressions)}</td>
          <td className="num" title={row.ctrLabel}>{formatPercent(row.ctr, 2)}<small className="reference-rate-label">{row.ctrLabel}</small></td>
          <td className="num">{formatNumber(row.platformClaims)}</td>
          <td className="num">{formatAED(row.claimedCac)}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>;
}

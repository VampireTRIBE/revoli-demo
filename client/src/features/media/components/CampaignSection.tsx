import { useEffect, useMemo, useState } from 'react';
import type { Campaign, MediaFilter } from '../../../types/media';
import { useCampaigns } from '../hooks/use-media-data';
import { formatAED, formatCampaignName, formatNumber, formatPercent } from '../utils/formatters';
import { EmptyState, ErrorState } from './StateCard';
import { LoadingSkeleton } from './LoadingSkeleton';

function costPerReportedConversion(row: Campaign): number {
  return row.claims != null && row.claims > 0 ? row.spend / row.claims : Number.POSITIVE_INFINITY;
}
function table(rows: Campaign[]) {
  return <div className="reference-table-wrap reference-mobile-table reference-campaign-table"><table><thead><tr><th>Campaign</th><th className="num">Spend</th><th className="num">Reported conv.</th><th className="num">Cost / reported conv.</th><th className="num">CTR as reported</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.platform}-${row.campaign}`}>
    <td title={row.campaign}>{formatCampaignName(row.campaign)}</td><td className="num">{formatAED(row.spend)}</td><td className="num">{row.claims == null ? 'n/a' : formatNumber(row.claims)}</td>
    <td className="num">{Number.isFinite(costPerReportedConversion(row)) ? formatAED(costPerReportedConversion(row)) : 'n/a'}</td>
    <td className="num">{formatPercent(row.ctr,2)}<small className="reference-rate-label">{row.ctrLabel}</small></td>
  </tr>)}</tbody></table></div>;
}

export function CampaignSection({ filter }: { filter: MediaFilter }) {
  const [platform, setPlatform] = useState<'Meta Ads' | 'Google Ads'>('Meta Ads');
  const [showAll, setShowAll] = useState(false);
  const query = useCampaigns(filter, { platform, page: 1, limit: 1000, sort: 'spend', order: 'desc' });
  const availabilityQuery = useCampaigns(filter, { page: 1, limit: 1000, sort: 'spend', order: 'desc' });
  const availablePlatforms = useMemo(() => new Set(availabilityQuery.data?.campaigns.map((row) => row.platform) ?? []), [availabilityQuery.data]);
  const metaAvailable = availablePlatforms.has('Meta Ads');
  const googleAvailable = availablePlatforms.has('Google Ads');
  useEffect(() => {
    if (!availabilityQuery.isSuccess) return;
    if (platform === 'Meta Ads' && !metaAvailable && googleAvailable) setPlatform('Google Ads');
    if (platform === 'Google Ads' && !googleAvailable && metaAvailable) setPlatform('Meta Ads');
  }, [availabilityQuery.isSuccess, googleAvailable, metaAvailable, platform]);
  const rows = query.data?.campaigns ?? [];
  const best = [...rows].filter((row) => Number.isFinite(costPerReportedConversion(row))).sort((a,b)=>costPerReportedConversion(a)-costPerReportedConversion(b)).slice(0,3);
  const bestKeys = new Set(best.map((row)=>`${row.platform}:${row.campaign}`));
  const worst = [...rows].filter((row)=>!bestKeys.has(`${row.platform}:${row.campaign}`)).sort((a,b)=>costPerReportedConversion(b)-costPerReportedConversion(a)).slice(0,3);
  const shown = [...best,...worst];
  return <section className="reference-card reference-mt reference-campaign-detail-card">
    <h3>What worked, what to stop · Campaigns</h3><p className="media-comp-muted">Mechanical cost per platform-reported conversion, not incremental impact or ROI. Zero reported conversions appear as n/a cost; no editorial verdict is generated.</p>
    <div className="reference-subtabs" role="tablist" aria-label="Campaign platform">
      <button type="button" className={`reference-subtab${platform === 'Meta Ads' ? ' active' : ''}`} onClick={()=>{setPlatform('Meta Ads');setShowAll(false);}} role="tab" aria-selected={platform==='Meta Ads'} disabled={!availabilityQuery.isLoading&&!metaAvailable}>Meta</button>
      <button type="button" className={`reference-subtab${platform === 'Google Ads' ? ' active' : ''}`} onClick={()=>{setPlatform('Google Ads');setShowAll(false);}} role="tab" aria-selected={platform==='Google Ads'} disabled={!availabilityQuery.isLoading&&!googleAvailable}>Google</button>
    </div>
    {query.isLoading ? <LoadingSkeleton/> : query.isError ? <ErrorState message="Campaign data could not be loaded."/> : rows.length ? <>
      <div className="media-campaign-results"><b>Top 3 by lowest reported acquisition cost</b>{table(best)}<b>Bottom 3, including no reported conversions</b>{table(worst)}</div>
      <button type="button" className="media-see-all" onClick={()=>setShowAll(!showAll)} aria-expanded={showAll}>{showAll?'Hide full campaign table':`See all campaigns (${query.data?.pagination.total ?? rows.length})`}</button>
      {showAll ? table(rows) : null}
      {(query.data?.pagination.total ?? 0) > rows.length ? <p>More campaign records exist beyond the current API page. Increase the API limit to see all.</p> : null}
    </> : <EmptyState message="No campaign rows available for this platform and period."/>}
    <p className="media-comp-muted">TBL verdict: Highlights pending, unless signed-off text is provided by the Highlights import.</p>
  </section>;
}

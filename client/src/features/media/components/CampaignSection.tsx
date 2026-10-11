import { useEffect, useState } from 'react';
import type { MediaFilter } from '../../../types/media';
import { useCampaigns } from '../hooks/use-media-data';
import { formatAED, formatCampaignName, formatNumber, formatPercent } from '../utils/formatters';
import { EmptyState, ErrorState } from './StateCard';
import { LoadingSkeleton } from './LoadingSkeleton';

export function CampaignSection({ filter }: { filter: MediaFilter }) {
  const [platform, setPlatform] = useState<'Meta Ads' | 'Google Ads'>('Meta Ads');
  const query = useCampaigns(filter, { platform, page: 1, limit: 100, sort: 'spend', order: 'desc' });
  const availabilityQuery = useCampaigns(filter, { page: 1, limit: 100, sort: 'spend', order: 'desc' });
  const availablePlatforms = new Set(availabilityQuery.data?.campaigns.map((row) => row.platform) ?? []);
  const metaAvailable = availablePlatforms.has('Meta Ads');
  const googleAvailable = availablePlatforms.has('Google Ads');

  useEffect(() => {
    if (!availabilityQuery.isSuccess) return;
    if (platform === 'Meta Ads' && !metaAvailable && googleAvailable) setPlatform('Google Ads');
    if (platform === 'Google Ads' && !googleAvailable && metaAvailable) setPlatform('Meta Ads');
  }, [availabilityQuery.isSuccess, googleAvailable, metaAvailable, platform]);

  return <section className="reference-card reference-mt reference-campaign-detail-card">
    <h3>Campaign detail</h3>
    <div className="reference-subtabs" role="tablist" aria-label="Campaign platform">
      <button type="button" className={`reference-subtab${platform === 'Meta Ads' ? ' active' : ''}`} onClick={() => setPlatform('Meta Ads')} role="tab" aria-selected={platform === 'Meta Ads'} disabled={!availabilityQuery.isLoading && !metaAvailable} title={metaAvailable ? 'Show Meta campaigns' : 'No monthly Meta campaign-detail rows are available for this period'}>Meta</button>
      <button type="button" className={`reference-subtab${platform === 'Google Ads' ? ' active' : ''}`} onClick={() => setPlatform('Google Ads')} role="tab" aria-selected={platform === 'Google Ads'} disabled={!availabilityQuery.isLoading && !googleAvailable} title={googleAvailable ? 'Show Google campaigns' : 'No Google campaign-detail rows are available for this period'}>Google</button>
    </div>
    {query.isLoading ? <LoadingSkeleton /> : query.isError ? <ErrorState message="Campaign data could not be loaded." /> : query.data?.campaigns.length ? <div className="reference-table-wrap reference-mobile-table reference-campaign-table">
      <table>
        <thead><tr><th>Campaign</th><th className="num">Spend</th><th className="num">CTR</th><th className="num">Conv.</th></tr></thead>
        <tbody>{query.data.campaigns.map((row) => {
          const displayName = formatCampaignName(row.campaign);
          return <tr key={`${row.platform}-${row.campaign}`}>
            <td title={`Source name: ${row.campaign}`}>{displayName}</td>
            <td className="num" title={row.calculationBasis}>{formatAED(row.spend)}</td>
            <td className={row.ctr == null ? 'num reference-na' : 'num'} title={`${row.ctrLabel}${row.calculationBasis ? `; ${row.calculationBasis}` : ''}`}>{formatPercent(row.ctr, 2)}</td>
            <td className="num" title={row.calculationBasis}>{row.claims == null ? 'N/A' : formatNumber(row.claims)}</td>
          </tr>;
        })}</tbody>
      </table>
    </div> : <EmptyState message="No campaign rows are available for this platform and period." />}
  </section>;
}

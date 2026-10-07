import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Campaign, MediaFilter } from '../../../types/media';
import { useCampaigns } from '../hooks/use-media-data';
import { formatAED, formatCampaignName, formatNumber, formatPercent, formatRatio } from '../utils/formatters';
import { EmptyState, ErrorState } from './StateCard';
import { LoadingSkeleton } from './LoadingSkeleton';

export function CampaignSection({ filter }: { filter: MediaFilter }) {
  const [platform, setPlatform] = useState<'Meta Ads' | 'Google Ads'>('Meta Ads');
  const compactChart = useMediaQuery('(max-width: 640px)');
  const query = useCampaigns(filter, { platform, page: 1, limit: 100, sort: 'spend', order: 'desc' });
  const chartQuery = useCampaigns(filter, { page: 1, limit: 100, sort: 'spend', order: 'desc' });
  const availablePlatforms = new Set(chartQuery.data?.campaigns.map((row) => row.platform) ?? []);
  const metaAvailable = availablePlatforms.has('Meta Ads');
  const googleAvailable = availablePlatforms.has('Google Ads');

  useEffect(() => {
    if (!chartQuery.isSuccess) return;
    if (platform === 'Meta Ads' && !metaAvailable && googleAvailable) setPlatform('Google Ads');
    if (platform === 'Google Ads' && !googleAvailable && metaAvailable) setPlatform('Meta Ads');
  }, [chartQuery.isSuccess, googleAvailable, metaAvailable, platform]);
  const chartRows: CampaignChartRow[] = (chartQuery.data?.roasCampaigns ?? []).slice(0, 12).map((row) => ({
    ...row,
    label: `${row.platform === 'Google Ads' ? 'G' : 'M'}: ${formatCampaignName(row.campaign)}`,
  }));
  const chartHeight = Math.max(320, chartRows.reduce(
    (height, row) => height + Math.max(34, wrapCampaignLabel(row.label).length * 13 + 10),
    0,
  ));

  return <div className="reference-media-grid reference-mt">
    <section className="reference-card">
      <h3>Campaign ROAS (spend &gt; AED 300)</h3>
      <div className={compactChart ? 'reference-mobile-roas-list' : 'reference-chart-box'} style={compactChart ? undefined : { height: chartHeight }}>
        {chartQuery.isLoading ? <LoadingSkeleton /> : chartQuery.isError ? <ErrorState message="Campaign ROAS could not be loaded." /> : chartRows.length ? compactChart ? <MobileCampaignRoas rows={chartRows} /> : <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartRows} layout="vertical" margin={{ top: 4, right: 14, bottom: 4, left: 8 }}>
            <CartesianGrid stroke="#232936" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#8b94a7', fontSize: 11 }} axisLine={{ stroke: '#303747' }} tickLine={false} />
            <YAxis dataKey="label" type="category" width={380} tick={<CampaignAxisTick />} axisLine={false} tickLine={false} interval={0} />
            <Tooltip content={<CampaignRoasTooltip />} cursor={{ fill: 'rgba(124, 154, 255, 0.07)' }} wrapperStyle={{ outline: 'none', zIndex: 10 }} />
            <Bar dataKey="roas" barSize={20} radius={[0, 4, 4, 0]}>{chartRows.map((row) => <Cell key={`${row.platform}-${row.campaign}`} fill={roasColor(row.roas)} />)}</Bar>
          </BarChart>
        </ResponsiveContainer> : <div className="reference-chart-unavailable"><div><strong>Data not available</strong>Campaign-specific conversion value is not supplied, so Campaign ROAS cannot be calculated for this period.</div></div>}
      </div>
    </section>

    <section className="reference-card">
      <h3>Campaign detail</h3>
      <div className="reference-subtabs" role="tablist" aria-label="Campaign platform">
        <button type="button" className={`reference-subtab${platform === 'Meta Ads' ? ' active' : ''}`} onClick={() => setPlatform('Meta Ads')} role="tab" aria-selected={platform === 'Meta Ads'} disabled={!chartQuery.isLoading && !metaAvailable} title={metaAvailable ? 'Show Meta campaigns' : 'No monthly Meta campaign-detail rows are available for this period'}>Meta</button>
        <button type="button" className={`reference-subtab${platform === 'Google Ads' ? ' active' : ''}`} onClick={() => setPlatform('Google Ads')} role="tab" aria-selected={platform === 'Google Ads'} disabled={!chartQuery.isLoading && !googleAvailable} title={googleAvailable ? 'Show Google campaigns' : 'No Google campaign-detail rows are available for this period'}>Google</button>
      </div>
      {query.isLoading ? <LoadingSkeleton /> : query.isError ? <ErrorState message="Campaign data could not be loaded." /> : query.data?.campaigns.length ? <div className="reference-table-wrap reference-mobile-table reference-campaign-table">
        <table>
          <thead><tr><th>Campaign</th><th className="num">Spend</th><th className="num">CTR</th><th className="num">Conv.</th><th className="num">ROAS</th></tr></thead>
          <tbody>{query.data.campaigns.map((row) => {
            const displayName = formatCampaignName(row.campaign);
            return <tr key={`${row.platform}-${row.campaign}`}>
            <td title={`Source name: ${row.campaign}`}>{displayName}</td>
            <td className="num" title={row.calculationBasis}>{formatAED(row.spend)}</td>
            <td className={row.ctr == null ? 'num reference-na' : 'num'} title={`${row.ctrLabel}${row.calculationBasis ? `; ${row.calculationBasis}` : ''}`}>{formatPercent(row.ctr, 2)}</td>
            <td className="num" title={row.calculationBasis}>{row.claims == null ? 'N/A' : formatNumber(row.claims)}</td>
            <td className={`num reference-roas ${roasTone(row.roas)}`} title={row.roasBasis}>{formatRatio(row.roas)}</td>
          </tr>;
          })}</tbody>
        </table>
      </div> : <EmptyState message="No campaign rows are available for this platform and period." />}
    </section>
  </div>;
}

function roasTone(value: number | null): string {
  if (value === null) return 'unavailable';
  if (value < 1.5) return 'bad';
  return value >= 2.5 ? 'good' : 'warn';
}

function roasColor(value: number | null): string {
  const tone = roasTone(value);
  return tone === 'good' ? '#34d399' : tone === 'warn' ? '#fbbf24' : '#f87171';
}
type CampaignChartRow = Campaign & { label: string };


function wrapCampaignLabel(value: string, lineLength = 48): string[] {
  const words = value.split(' ');
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    if (!line || `${line} ${word}`.length <= lineLength) {
      line = line ? `${line} ${word}` : word;
      return;
    }
    lines.push(line);
    line = word;
  });
  if (line) lines.push(line);
  return lines;
}

function CampaignAxisTick({ x = 0, y = 0, payload, lineLength = 48, fontSize = 11 }: { x?: number; y?: number; payload?: { value?: string }; lineLength?: number; fontSize?: number }) {
  const lines = wrapCampaignLabel(String(payload?.value ?? ''), lineLength);
  const firstLineOffset = -((lines.length - 1) * 6);
  return <g transform={`translate(${x},${y})`}>
    <text x={-8} y={0} fill="#8b94a7" fontSize={fontSize} textAnchor="end">
      {lines.map((line, index) => <tspan key={`${line}-${index}`} x={-8} dy={index === 0 ? firstLineOffset : 12}>{line}</tspan>)}
    </text>
  </g>;
}

function MobileCampaignRoas({ rows }: { rows: CampaignChartRow[] }) {
  const maximum = Math.max(...rows.map((row) => row.roas ?? 0), 1);

  return <div className="reference-mobile-roas-items">
    {rows.map((row) => <article className="reference-mobile-roas-item" key={`${row.platform}-${row.campaign}`}>
      <div className="reference-mobile-roas-heading">
        <div><span>{row.platform}</span><strong>{formatCampaignName(row.campaign)}</strong></div>
        <b className={`reference-roas ${roasTone(row.roas)}`}>{formatRatio(row.roas)}</b>
      </div>
      <div className="reference-mobile-roas-track" aria-hidden="true"><span style={{ width: `${Math.max(((row.roas ?? 0) / maximum) * 100, 2)}%`, background: roasColor(row.roas) }} /></div>
      <small>{formatAED(row.spend)} spend</small>
    </article>)}
  </div>;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
}

function CampaignRoasTooltip({ active, payload }: { active?: boolean; payload?: { payload?: CampaignChartRow }[] }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return <div className="reference-chart-tooltip">
    <strong>{formatCampaignName(row.campaign)}</strong>
    <span>{row.platform}</span>
    <dl>
      <div><dt>Directional ROAS</dt><dd>{formatRatio(row.roas)}</dd></div>
      <div><dt>Spend</dt><dd>{formatAED(row.spend)}</dd></div>
    </dl>
    <small>{row.roasBasis}</small>
  </div>;
}

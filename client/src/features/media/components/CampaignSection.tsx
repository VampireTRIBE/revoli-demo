import { useEffect, useMemo, useRef, useState } from 'react';
import type { Campaign, MediaFilter } from '../../../types/media';
import { useCampaigns } from '../hooks/use-media-data';
import { formatAED, formatCampaignName, formatNumber, formatPercent } from '../utils/formatters';
import { AwaitingLine } from '../../../components/v2/Reporting';
import { http } from '../../../api/http';
import { ErrorState } from './StateCard';
import { LoadingSkeleton } from './LoadingSkeleton';

import { campaignResult, groupCampaignRankings, objective, objectives, type Objective } from '../utils/campaign-ranking';

type ObjectiveView = Objective | 'All';
type Platform = 'Meta Ads' | 'Google Ads';
const costCurrency = (value: number) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

function CampaignThumbnail({ row }: { row: Campaign }) {
  const [failed, setFailed] = useState(false);
  if (!row.thumbnailFile || failed) return <span className="v2-campaign-image-missing" title="Approved thumbnail not supplied or unavailable" aria-label="Approved thumbnail unavailable">n/a</span>;
  return <img className="v2-campaign-thumbnail" src={http.getUri({ url: `/media/campaign-thumbnails/${encodeURIComponent(row.thumbnailFile)}` })} alt={`Approved creative: ${row.shortName ?? row.campaign}`} loading="lazy" onError={() => setFailed(true)} />;
}

function CampaignTable({ rows }: { rows: Campaign[] }) {
  return <div className="reference-table-wrap reference-mobile-table reference-campaign-table">
    <table>
      <thead><tr><th>Campaign</th><th>Objective</th><th className="num">Spend</th><th className="num">Source result</th><th className="num">Cost / result</th><th className="num">Rate (source counts)</th></tr></thead>
      <tbody>{rows.map((row, index) => {
        const category = objective(row);
        const result = campaignResult(row);
        const clickOrInteraction = row.platform === 'Google Ads' ? row.interactions : row.clicks;
        const rateEvidence = clickOrInteraction != null && row.impressions != null && row.impressions > 0
          ? `${row.ctrLabel}: ${formatNumber(clickOrInteraction)} ${row.platform === 'Google Ads' ? 'interactions' : 'link clicks'} / ${formatNumber(row.impressions)} impressions`
          : `${row.ctrLabel}: original numerator or denominator was not supplied`;
        return <tr key={`${row.platform}-${row.campaign}-${index}`}>
          <td title={row.campaign}><span className="v2-campaign-identity">
            <CampaignThumbnail key={row.thumbnailFile ?? 'missing'} row={row} />
            <span className="v2-campaign-name" tabIndex={0} title={row.campaign} aria-label={row.campaign}>{row.shortName || formatCampaignName(row.campaign)}{!row.shortName?<small>Original name · short name not supplied</small>:null}</span>
          </span></td>
          <td><span className="v2-objective" title={row.objectiveSource ?? (category === 'Not supplied' ? 'Objective not supplied' : 'Imported objective')}>{category}</span></td>
          <td className="num">{formatAED(row.spend)}</td>
          <td className="num">{result ? <>{result.count == null ? 'n/a' : formatNumber(result.count, result.measure === 'conversions' ? 2 : 0)}<small>{result.measure}</small></> : <>{row.claims != null ? <small>{formatNumber(row.claims, 2)} reported conversions</small> : null}{row.interactions != null ? <small>{formatNumber(row.interactions)} interactions</small> : null}{row.impressions != null ? <small>{formatNumber(row.impressions)} impressions</small> : null}{row.claims == null && row.interactions == null && row.impressions == null ? 'n/a' : null}</>}</td>
          <td className="num">{result?.cost == null ? 'n/a' : costCurrency(result.cost)}{result ? <small>{result.label}</small> : null}</td>
          <td className="num" title={rateEvidence} aria-label={rateEvidence}>{formatPercent(row.ctr, 2)}<small className="reference-rate-label">{row.ctrLabel}</small></td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

/** A group can contain multiple measures, but each ranking uses one measure only. */
function ObjectiveBucket({category,rows}:{category:Objective;rows:Campaign[]}) {
  const { ranked, unranked } = groupCampaignRankings(rows, category);
  return <div className="v2-campaign-objective-bucket">
    <h3>{category === 'Not supplied' ? 'Objective not supplied' : category} · {rows.length} campaigns</h3>
    {ranked.map(group => <div key={group.label} className="media-campaign-results"><b>{group.label} · lowest cost first</b><CampaignTable rows={group.rows.slice(0, 5)}/></div>)}
    {unranked.length ? <><AwaitingLine source={category === 'Not supplied' ? 'The import does not specify an approved objective. These campaigns remain unranked.' : `${unranked.length} campaign(s) have no comparable result denominator and remain unranked.`} owner="Media team"/><CampaignTable rows={unranked.slice(0, 10)}/></> : null}
  </div>;
}

/**
 * Google has source-backed monthly campaign rows. The provided Meta source has
 * campaign totals covering Jan-Sep 2026 but no monthly campaign granularity.
 * Never assign those Meta totals to the selected month.
 */
export function CampaignSection({ filter }: { filter: MediaFilter }) {
  const [platform, setPlatform] = useState<Platform>('Google Ads');
  const [objectiveFilter, setObjectiveFilter] = useState<ObjectiveView>('All');
  const [showYearRegister, setShowYearRegister] = useState(false);
  const [search, setSearch] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const segmentKey = filter.segment?.join('|') ?? '';
  const brandKey = filter.brand?.join('|') ?? '';

  useEffect(() => {
    setShowYearRegister(false);
    setSearch('');
  }, [filter.year, filter.month, segmentKey, brandKey]);

  const extras={platform,page:1,limit:1000,sort:'spend',order:'desc'};
  const monthly = useCampaigns(filter, extras);
  const yearFilter = useMemo<MediaFilter>(() => ({...filter,month:undefined}),[filter]);
  const sourceRegister = useCampaigns(yearFilter, extras);
  const autoSourceRegister = Boolean(filter.month && monthly.isSuccess && !monthly.data.campaigns.length && sourceRegister.data?.campaigns.length);
  const usingSourceRegister=Boolean(filter.month&&(showYearRegister||autoSourceRegister));
  const campaigns=usingSourceRegister?sourceRegister:monthly;
  const rows = useMemo(() => campaigns.data?.campaigns ?? [], [campaigns.data]);
  const availableObjectives = useMemo(() => new Set(rows.map(objective)), [rows]);

  useEffect(() => {
    if (!rows.length || objectiveFilter === 'All' || availableObjectives.has(objectiveFilter)) return;
    setObjectiveFilter('All');
  }, [rows, availableObjectives, objectiveFilter]);

  const activeObjective = objectiveFilter === 'All' || availableObjectives.has(objectiveFilter) ? objectiveFilter : 'All';
  const fullFiltered = rows.filter((row) =>
    (activeObjective === 'All' || objective(row) === activeObjective) && `${row.campaign} ${row.shortName ?? ''} ${row.objective ?? ''} ${row.platform} ${row.campaignType}`
      .toLowerCase().includes(search.trim().toLowerCase()));

  const label = usingSourceRegister
    ? `${platform === 'Meta Ads' ? 'Jan 1–Sep 10' : 'Available months in'} ${filter.year ?? 2026} · source register (not selected-month results)`
    : filter.month ? `Selected month: ${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(Date.UTC(filter.year ?? 2026, filter.month - 1, 1)))} ${filter.year ?? 2026}`
      : `All available months${filter.year ? ` · ${filter.year}` : ''}`;

  const onPlatform = (value: Platform) => {
    setPlatform(value);
    setObjectiveFilter('All');
    setShowYearRegister(false);
    setSearch('');
  };
  return <section className="reference-card reference-mt reference-campaign-detail-card">
    <div className="reference-subtabs" aria-label="Campaign platform">
      <button type="button" className={`reference-subtab${platform === 'Meta Ads' ? ' active' : ''}`} onClick={() => onPlatform('Meta Ads')}>Meta</button>
      <button type="button" className={`reference-subtab${platform === 'Google Ads' ? ' active' : ''}`} onClick={() => onPlatform('Google Ads')}>Google</button>
      <label className="v2-campaign-objective">Objective <select value={!rows.length ? 'Not supplied' : (objectiveFilter === 'All' || availableObjectives.has(objectiveFilter) ? objectiveFilter : 'All')} onChange={(event) => setObjectiveFilter(event.target.value as ObjectiveView)} disabled={!rows.length}>
        {rows.length ? <option value="All">All objectives · grouped</option> : null}
        {objectives.filter((item) => availableObjectives.has(item)).map((item) => <option key={item} value={item}>{item === 'Not supplied' ? 'Not supplied (unranked)' : item}</option>)}
        {!rows.length ? <option value="Not supplied">No imported campaigns</option> : null}
      </select></label>
    </div>
    <p className="v2-section-definition" role="status">{label}</p>{autoSourceRegister?<p className="v2-section-definition">No campaigns were imported for the selected month. Showing the available source register with the same brand and segment filters, not the selected month.</p>:null}
    {showYearRegister && !autoSourceRegister ? <button type="button" className="media-see-all" onClick={() => setShowYearRegister(false)}>Return to selected month</button> : null}
    {campaigns.isLoading ? <LoadingSkeleton /> : campaigns.isError ? <ErrorState message="Campaign API failed. Check the Express server and /api/v1/media/campaigns endpoint." /> : rows.length ? <>
      <p className="v2-section-definition">Objectives come from an explicit Objective column or the source-defined Meta stage. Rankings use one platform, objective and result definition at a time.</p>
      {objectives.filter(item => availableObjectives.has(item) && (activeObjective === 'All' || activeObjective === item)).map(item => <ObjectiveBucket key={item} category={item} rows={rows.filter(row => objective(row) === item)}/>)}
      {platform === 'Meta Ads' && (usingSourceRegister || !filter.month) ? <p className="v2-section-definition">Meta Campaign Brand Map covers Jan 1–Sep 10, 2026 (September partial). Zero-spend rows are retained as supplied. These totals are not selected-month results.</p> : null}
      <button type="button" className="media-see-all" onClick={() => dialog.current?.showModal()}>See all {activeObjective === 'All' ? '' : `${activeObjective} `}campaigns ({rows.filter(row => activeObjective === 'All' || objective(row) === activeObjective).length})</button>
      <dialog ref={dialog} className="media-comp-register-dialog" aria-label="Complete campaign register" onClick={(event) => { if (event.target === dialog.current) dialog.current?.close(); }}>
        <div className="media-comp-register-content"><div className="media-comp-register-heading"><h2>Campaign register · {fullFiltered.length} of {rows.length}</h2><button type="button" onClick={() => dialog.current?.close()} aria-label="Close campaign register">Close ×</button></div>
          <p className="v2-section-definition">{label}. Objective labels appear only when approved in the source.</p>
          <label>Search <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a campaign" /></label>
          {!fullFiltered.length ? <p role="status">No matching campaigns.</p> : null}
          {objectives.filter(item=>fullFiltered.some(row=>objective(row)===item)).map(item=><div key={item}><h3>{item}</h3><CampaignTable rows={fullFiltered.filter(row=>objective(row)===item)} /></div>)}
        </div>
      </dialog>
    </> : <>
      <AwaitingLine source={platform === 'Meta Ads' && filter.month && !showYearRegister
        ? 'The Meta import provides Jan-Sep campaign totals, not campaign rows for the selected month.'
        : 'No campaign rows are available from this source for the selected reporting window.'} owner="Media team" />
      {filter.month && !usingSourceRegister ? <button type="button" className="media-see-all" onClick={() => setShowYearRegister(true)}>
        View available {filter.year ?? 2026} source register (different reporting window)
      </button> : null}
    </>}
    {rows.some((row) => !row.thumbnailFile) ? <p className="media-comp-muted">Creative thumbnails require matching approved Campaign Metadata entries and image files.</p> : null}
    <p className="media-comp-muted">Editorial verdicts appear only when explicitly signed. No analysis is generated.</p>
  </section>;
}

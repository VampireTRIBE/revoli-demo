import { useEffect, useMemo, useRef, useState } from 'react';
import type { Campaign, MediaFilter } from '../../../types/media';
import { useCampaigns } from '../hooks/use-media-data';
import { formatAED, formatCampaignName, formatNumber, formatPercent } from '../utils/formatters';
import { AwaitingLine } from '../../../components/v2/Reporting';
import { http } from '../../../api/http';
import { ErrorState } from './StateCard';
import { LoadingSkeleton } from './LoadingSkeleton';

type Objective = 'Conversion' | 'Traffic' | 'Awareness' | 'Not supplied';
type Platform = 'Meta Ads' | 'Google Ads';
const objectives: Objective[] = ['Conversion', 'Traffic', 'Awareness', 'Not supplied'];

/** Objectives must be explicitly approved and imported. Campaign names are not evidence. */
function objective(row: Campaign): Objective {
  if (row.objective === 'Conversion' || row.objective === 'Traffic' || row.objective === 'Awareness') return row.objective;
  return 'Not supplied';
}
function cost(row: Campaign, selected: Objective): number | null {
  if (selected === 'Conversion') return row.claims != null && row.claims > 0 ? row.spend / row.claims : null;
  if (selected === 'Traffic') {
    const actions = row.platform === 'Google Ads' ? row.interactions : row.clicks;
    return actions != null && actions > 0 ? row.spend / actions : null;
  }
  if (selected === 'Awareness') return row.impressions != null && row.impressions > 0 ? 1000 * row.spend / row.impressions : null;
  return null;
}
const resultLabel = (category: Objective) => category === 'Conversion' ? 'Reported conversions' : category === 'Traffic' ? 'Reported traffic actions' : category === 'Awareness' ? 'Reported impressions' : 'Result n/a';
const costLabel = (category: Objective) => category === 'Conversion' ? 'Cost / reported conversion' : category === 'Traffic' ? 'Cost / reported traffic action' : category === 'Awareness' ? 'Cost / 1,000 impressions' : 'Cost / result n/a';

function CampaignTable({ rows }: { rows: Campaign[] }) {
  return <div className="reference-table-wrap reference-mobile-table reference-campaign-table">
    <table>
      <thead><tr><th>Campaign</th><th>Objective</th><th className="num">Spend</th><th className="num">Source result</th><th className="num">Cost / result</th><th className="num">CTR as reported</th></tr></thead>
      <tbody>{rows.map((row, index) => {
        const category = objective(row);
        const unit = cost(row, category);
        const actions = category === 'Conversion' ? row.claims : category === 'Traffic' ? (row.platform === 'Google Ads' ? row.interactions : row.clicks) : category === 'Awareness' ? row.impressions : null;
        return <tr key={`${row.platform}-${row.campaign}-${index}`}>
          <td title={row.campaign}><span className="v2-campaign-identity">
            {row.thumbnailFile ? <img className="v2-campaign-thumbnail" src={http.getUri({ url: `/media/campaign-thumbnails/${encodeURIComponent(row.thumbnailFile)}` })} alt={`Approved creative: ${row.shortName ?? row.campaign}`} loading="lazy" /> : null}
            <span className="v2-campaign-name">{row.shortName || formatCampaignName(row.campaign).slice(0, 56)}</span>
          </span></td>
          <td><span className="v2-objective">{category}</span></td>
          <td className="num">{formatAED(row.spend)}</td>
          <td className="num" title={resultLabel(category)}>{actions == null ? 'n/a' : formatNumber(actions)}</td>
          <td className="num" title={costLabel(category)}>{unit == null ? 'n/a' : formatAED(unit)}</td>
          <td className="num">{formatPercent(row.ctr, 2)}<small className="reference-rate-label">{row.ctrLabel}</small></td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

/**
 * Google has source-backed monthly campaign rows. The provided Meta source has
 * campaign totals covering Jan-Sep 2026 but no monthly campaign granularity.
 * Never assign those Meta totals to the selected month.
 */
export function CampaignSection({ filter }: { filter: MediaFilter }) {
  const [platform, setPlatform] = useState<Platform>('Google Ads');
  const [objectiveFilter, setObjectiveFilter] = useState<Objective>('Not supplied');
  const [showYearRegister, setShowYearRegister] = useState(false);
  const [search, setSearch] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const segmentKey = filter.segment?.join('|') ?? '';
  const brandKey = filter.brand?.join('|') ?? '';

  useEffect(() => {
    setShowYearRegister(false);
    setSearch('');
  }, [filter.year, filter.month, segmentKey, brandKey]);

  const activeFilter = useMemo<MediaFilter>(() => showYearRegister ? { ...filter, month: undefined } : filter,
    [filter, showYearRegister]);
  const campaigns = useCampaigns(activeFilter, { platform, page: 1, limit: 1000, sort: 'spend', order: 'desc' });
  const rows = useMemo(() => campaigns.data?.campaigns ?? [], [campaigns.data]);
  const availableObjectives = useMemo(() => new Set(rows.map(objective)), [rows]);

  useEffect(() => {
    if (!rows.length || availableObjectives.has(objectiveFilter)) return;
    const next = objectives.find((item) => item !== 'Not supplied' && availableObjectives.has(item))
      ?? (availableObjectives.has('Not supplied') ? 'Not supplied' : null);
    if (next) setObjectiveFilter(next);
  }, [rows, availableObjectives, objectiveFilter]);

  const selected = rows.filter((row) => objective(row) === objectiveFilter);
  const comparable = selected.filter((row) => cost(row, objectiveFilter) != null)
    .sort((a, b) => (cost(a, objectiveFilter) ?? 0) - (cost(b, objectiveFilter) ?? 0));
  const lowest = comparable.slice(0, 3);
  const lowestKeys = new Set(lowest.map((row) => `${row.platform}|${row.campaign}`));
  const highest = comparable.filter((row) => !lowestKeys.has(`${row.platform}|${row.campaign}`)).reverse().slice(0, 3);
  const fullFiltered = rows.filter((row) =>
    `${row.campaign} ${row.shortName ?? ''} ${row.objective ?? ''} ${row.platform} ${row.campaignType}`
      .toLowerCase().includes(search.trim().toLowerCase()));

  const label = showYearRegister
    ? `${filter.year ?? 2026} campaign source register, all available months (not a single selected month)`
    : filter.month ? `Selected month: ${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(Date.UTC(filter.year ?? 2026, filter.month - 1, 1)))} ${filter.year ?? 2026}`
      : `All available months${filter.year ? ` · ${filter.year}` : ''}`;

  const onPlatform = (value: Platform) => {
    setPlatform(value);
    setObjectiveFilter('Not supplied');
    setShowYearRegister(false);
    setSearch('');
  };
  return <section className="reference-card reference-mt reference-campaign-detail-card">
    <div className="reference-subtabs" aria-label="Campaign platform">
      <button type="button" className={`reference-subtab${platform === 'Meta Ads' ? ' active' : ''}`} onClick={() => onPlatform('Meta Ads')}>Meta</button>
      <button type="button" className={`reference-subtab${platform === 'Google Ads' ? ' active' : ''}`} onClick={() => onPlatform('Google Ads')}>Google</button>
      <label className="v2-campaign-objective">Objective <select value={objectiveFilter} onChange={(event) => setObjectiveFilter(event.target.value as Objective)} disabled={!rows.length}>
        {objectives.filter((item) => availableObjectives.has(item)).map((item) => <option key={item} value={item}>{item === 'Not supplied' ? 'Not supplied (unranked)' : item}</option>)}
        {!rows.length ? <option value="Not supplied">No imported campaigns</option> : null}
      </select></label>
    </div>
    <p className="v2-section-definition" role="status">{label}</p>
    {showYearRegister ? <button type="button" className="media-see-all" onClick={() => setShowYearRegister(false)}>Return to selected month</button> : null}
    {campaigns.isLoading ? <LoadingSkeleton /> : campaigns.isError ? <ErrorState message="Campaign API failed. Check the Express server and /api/v1/media/campaigns endpoint." /> : rows.length ? <>
      {objectiveFilter === 'Not supplied' ? <>
        <AwaitingLine source="Campaign objectives are not in the approved import. The available source rows are shown below without objective rankings." owner="Media team" />
        <CampaignTable rows={selected.slice(0, 12)} />
      </> : <>
        <p className="v2-section-definition">Comparisons are within the imported {objectiveFilter.toLowerCase()} objective only. No recommendations are generated.</p>
        {lowest.length ? <div className="media-campaign-results"><b>Lowest reported cost ({objectiveFilter})</b><CampaignTable rows={lowest} />
          {highest.length ? <><b>Highest reported cost ({objectiveFilter})</b><CampaignTable rows={highest} /></> : null}
        </div> : <><AwaitingLine source="No comparable result denominator exists for these approved objective rows." owner="Media team" /><CampaignTable rows={selected.slice(0, 12)} /></>}
      </>}
      {platform === 'Meta Ads' && showYearRegister ? <p className="v2-section-definition">Meta Campaign Brand Map reports nine-month campaign spend only. These totals must not be interpreted as monthly spend or conversion results.</p> : null}
      <button type="button" className="media-see-all" onClick={() => dialog.current?.showModal()}>See all campaigns ({campaigns.data?.pagination.total ?? rows.length})</button>
      <dialog ref={dialog} className="media-comp-register-dialog" aria-label="Complete campaign register" onClick={(event) => { if (event.target === dialog.current) dialog.current?.close(); }}>
        <div className="media-comp-register-content"><div className="media-comp-register-heading"><h2>All imported campaigns · {rows.length}</h2><button type="button" onClick={() => dialog.current?.close()} aria-label="Close campaign register">Close ×</button></div>
          <p className="v2-section-definition">{label}. Objective labels appear only when approved in the source.</p>
          <label>Search <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a campaign" /></label>
          <CampaignTable rows={fullFiltered} />
        </div>
      </dialog>
    </> : <>
      <AwaitingLine source={platform === 'Meta Ads' && filter.month && !showYearRegister
        ? 'The Meta import provides Jan-Sep campaign totals, not campaign rows for the selected month.'
        : 'No campaign rows are available from this source for the selected reporting window.'} owner="Media team" />
      {filter.month && !showYearRegister ? <button type="button" className="media-see-all" onClick={() => setShowYearRegister(true)}>
        View available {filter.year ?? 2026} source register (different reporting window)
      </button> : null}
    </>}
    {rows.some((row) => !row.thumbnailFile) ? <p className="media-comp-muted">Creative thumbnails require matching approved Campaign Metadata entries and image files.</p> : null}
    <p className="media-comp-muted">Editorial verdicts appear only when explicitly signed. No analysis is generated.</p>
  </section>;
}

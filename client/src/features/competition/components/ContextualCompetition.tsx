/* eslint-disable react-refresh/only-export-components */
import { ChevronDown, ExternalLink, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { CompetitionDashboard, CompetitionMixRow, CompetitionScreenshot } from '../../../types/competition';
import { useCompetitionDashboard, useCompetitionOptions } from '../hooks/use-competition-data';
import { competitionAssetUrl } from '../services/competition-api';
import { CompetitionSourceLabel } from './CompetitionSourceLabel';
import { CompetitionChannelChip } from './CompetitionChannelChip';
import { MediaCompetitionPanel } from './MediaCompetitionPanel';
import '../../../styles/reference-competition.css';

export type CompetitionContextView = 'creative' | 'media' | 'consumer' | 'search';

export function useContextualCompetition(clientId: string, year?: number, month?: number, initialCompetitor?: string) {
  const approvedClient = clientId !== 'no-approved-creative-competitors';
  const options = useCompetitionOptions(clientId, approvedClient);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | undefined>(initialCompetitor);
  const [captureDate, setCaptureDate] = useState<string>();
  const [channel, setChannel] = useState<'Meta' | 'Google'>('Meta');
  const previousClient = useRef(clientId);

  useEffect(() => {
    if (previousClient.current !== clientId) {
      previousClient.current = clientId;
      setSelectedCompetitor(undefined);
      setCaptureDate(undefined);
      setChannel('Meta');
    }
  }, [clientId]);

  useEffect(() => {
    if (initialCompetitor && options.data?.competitors.some((item) => item.id === initialCompetitor)) setSelectedCompetitor(initialCompetitor);
  }, [initialCompetitor, options.data]);

  // A brand switch must not request or briefly display a prior client's capture.
  const activeCompetitor = approvedClient && options.data?.competitors.some((item) => item.id === selectedCompetitor) ? selectedCompetitor : undefined;
  const dashboard = useCompetitionDashboard({ year, month: month || undefined, competitor: activeCompetitor, captureDate, channel });
  return {
    clientId,
    year,
    month,
    options,
    dashboard,
    selectedCompetitor: activeCompetitor,
    captureDate,
    channel,
    selectChannel: (value: 'Meta' | 'Google') => {setChannel(value);setCaptureDate(undefined);},
    selectCompetitor: (value?: string) => { setSelectedCompetitor(value); setCaptureDate(undefined); setChannel('Meta'); },
    selectCapture: setCaptureDate,
    close: () => { setSelectedCompetitor(undefined); setCaptureDate(undefined); },
  };
}

export type CompetitionContextState = ReturnType<typeof useContextualCompetition>;

export function CompetitionDropdown({ context }: { context: CompetitionContextState }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const firstOptionRef = useRef<HTMLButtonElement>(null);
  const competitors = context.options.data?.competitors ?? [];
  const selected = competitors.find((item) => item.id === context.selectedCompetitor);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
    };
  }, [open]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') setOpen(false);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      window.setTimeout(() => firstOptionRef.current?.focus(), 0);
    }
  };

  return <div className="competition-context-dropdown" ref={rootRef}>
    <span>Compare against</span>
    <button type="button" className={`competition-context-trigger${open ? ' open' : ''}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)} onKeyDown={onKeyDown}>
      <span>{selected?.label ?? 'Off - own performance'}</span><ChevronDown size={14} aria-hidden="true" />
    </button>
    {open ? <div className="competition-context-menu" role="menu" aria-label="Competition">
      <button type="button" role="menuitem" onClick={() => { context.close();setOpen(false); }}>Off - own performance</button>
      {context.options.isLoading ? <div>Loading competitors...</div> : context.options.isError ? <div>Competition options could not be loaded</div> : competitors.length ? competitors.map((competitor, index) => <button
        type="button"
        role="menuitem"
        ref={index === 0 ? firstOptionRef : undefined}
        className={competitor.id === context.selectedCompetitor ? 'selected' : ''}
        key={competitor.id}
        onClick={() => { context.selectCompetitor(competitor.id); setOpen(false); }}
      ><span>{competitor.label}</span><small>{competitor.dataReceived ? `Meta page ${competitor.metaPage}` : 'Data not received'}</small></button>) : <div>Competitor data not configured</div>}
    </div> : null}
  </div>;
}

export function ContextualCompetitionPanel({ context, view }: { context: CompetitionContextState; view: CompetitionContextView }) {
  if (!context.selectedCompetitor) return null;
  const data = context.dashboard.data;
  const allDates = data?.capture.allAvailableDates ?? [];
  const showCaptureSelector = allDates.length > 1 || Boolean(data && !data.available && allDates.length);
  return <section className="competition-context-panel competition-mt" aria-label={`${view.charAt(0).toUpperCase() + view.slice(1)} Competition context`}>
    <div className="v2-competition-source" role="note">COMPETITOR VIEW · Viewing {data?.competitor.label ?? context.options.data?.competitors.find((item) => item.id === context.selectedCompetitor)?.label ?? 'selected competitor'} · {context.channel === 'Google' ? 'Google Ads Transparency Center' : 'Meta Ad Library'} · activity, not spend{data?.capture.date ? ` · ${formatDate(data.capture.date)}` : ''}</div>
    <div className="competition-context-heading">
      <div><h3>{view.charAt(0).toUpperCase() + view.slice(1)} Competition</h3><CompetitionChannelChip channel={context.channel}/><p>{data?.competitor.label ?? 'Selected competitor'}{context.channel === 'Meta' && data?.competitor.metaPage ? ` · Meta page ${data.competitor.metaPage}` : ''}</p></div>
      <div className="competition-context-actions">
        {context.clientId === 'rivoli-shop' ? <div className="v2-channel-switch" role="group" aria-label="Competition capture channel">
          <button type="button" className={context.channel==='Meta'?'selected':''} aria-pressed={context.channel==='Meta'} onClick={()=>context.selectChannel('Meta')}>Meta</button>
          <button type="button" className={context.channel==='Google'?'selected':''} aria-pressed={context.channel==='Google'} onClick={()=>context.selectChannel('Google')}>Google</button>
        </div> : null}
        {showCaptureSelector ? <label><span>Capture</span><select value={context.captureDate ?? ''} onChange={(event) => context.selectCapture(event.target.value || undefined)}>
          <option value="">Match page period</option>
          {allDates.map((date) => <option value={date} key={date}>{formatDate(date)}</option>)}
        </select></label> : null}
        <button type="button" onClick={context.close} aria-label="Close Competition panel"><X size={16} /> Close</button>
      </div>
    </div>

    {context.dashboard.isLoading ? <CompetitionState>Loading competition capture...</CompetitionState>
      : context.dashboard.isError ? <CompetitionState error>Competition capture could not be loaded.</CompetitionState>
        : !data ? <CompetitionState>Choose a competitor.</CompetitionState>
          : !data.available ? <UnavailableContext data={data} allDates={allDates} onSelectCapture={context.selectCapture} />
            : <>
              {data.signedHighlights?.length ? <div className="v2-competition-highlights"><strong>Highlights this month · {data.capture.date?.slice(0,7)}</strong>{data.signedHighlights.map((line,i)=><p key={i}>{line}</p>)}</div> : null}
              <div className="competition-context-capture"><div><span>Selected capture</span><strong>{formatDate(data.capture.date)}</strong><small>{data.capture.matchesReportingPeriod ? 'Matches the page reporting month' : `Competition capture is independent of the ${formatMonth(context.year, context.month)} ${view} reporting period`}</small></div><CompetitionSourceLabel value={data.sourceLabel} /></div>
              {context.clientId === 'union-coop' ? <CreativeCompetitionView data={data} /> : <MediaCompetitionPanel data={data} />}
            </>}
  </section>;
}

/** Render the two Union Coop competitors using capture facts first: this is
 * an ad-activity view, not a performance or spend dashboard. */
function CreativeCompetitionView({ data }: { data: CompetitionDashboard }) {
  const supplier = data.themeMix.find((row) => /supplier(?:[- ]funded)?(?: brand)?/i.test(row.label));
  const longest = data.longestRunning
    .filter((row) => row.startDateAvailable !== false && Number.isFinite(row.calculatedDaysRunning))
    .reduce<number | null>((top, row) => Math.max(top ?? 0, row.calculatedDaysRunning), null);
  const firstObserved = data.capture.firstCapture ? null : (data.launches.sincePreviousCapture ?? data.activity.firstObservedAds);
  const launchGroups = data.launches.groups.filter((row) => row.startDate && row.count > 0);
  return <div className="v2-capture-composition">
    <div className="v2-capture-kpis" aria-label="Verified competition capture summary">
      <CaptureFact label="Live ads" value={data.activity.activeAds} detail={`${data.observations.length} logged observations · Meta Ad Library`} channel={data.channel} />
      <CaptureFact label="New since previous capture" value={firstObserved} detail={data.capture.firstCapture ? 'Baseline capture: no earlier comparison' : 'First observed, not proven newly created'} channel={data.channel} />
      <CaptureFact label="Average days running" value={data.activity.averageDaysRunning} detail={longest == null ? 'Longest: n/a (dates not captured)' : `Longest observed: ${Math.round(longest)} days`} channel={data.channel} />
      <CaptureFact label="Supplier-funded theme" value={supplier?.count ?? null} detail={supplier ? `${supplier.count} of ${data.observations.length} registered · analyst-tagged` : 'Not separately tagged in this capture'} channel={data.channel} />
    </div>
    <div className="v2-capture-content">
      <section className="competition-card v2-capture-themes" aria-label="Captured themes">
        <CompetitionChannelChip channel={data.channel}/>
        <h3>Theme mix</h3>
        <p className="v2-section-definition">Analyst-tagged advertising themes from the selected capture. Supplier brands stay separate.</p>
        {data.themeMix.length ? <div className="competition-mix-list">
          {data.themeMix.map((row) => <div key={row.label}>
            <div className="competition-mix-copy"><span>{row.label}</span><strong>{row.count}</strong></div>
            <div className="competition-mix-track"><span style={{width:`${Math.max(0,Math.min(100,row.percentage*100))}%`}}/></div>
          </div>)}
        </div> : <div className="v2-gallery-awaiting" role="status">AWAITING · Theme categories were not captured · Owner: TBL</div>}
        <CompetitionSourceLabel value={data.sourceLabel}/>
      </section>
      <section className="competition-card v2-capture-wall" aria-label="The competitor's wall">
        <CompetitionChannelChip channel={data.channel}/>
        <h3>The competitor's wall</h3>
        <p className="v2-section-definition">Only approved analyst-selected thumbnails from the matching capture.</p>
        {data.screenshots.length ? <div className="competition-gallery">{data.screenshots.map((screenshot) => <article className="competition-gallery-card" key={screenshot.ref}>
          <CompetitionImage screenshot={screenshot} label={screenshot.ref}/>
          <div><h4>{screenshot.ref}</h4><small>{screenshot.libraryIds.length} linked ad ID(s)</small></div>
        </article>)}</div> : <div className="v2-gallery-awaiting" role="status">AWAITING · Carrefour/LuLu approved gallery thumbnails have not been supplied. Owner: TBL.</div>}
        <CompetitionSourceLabel value={data.sourceLabel}/>
      </section>
    </div>
    <section className="competition-card v2-capture-launches" aria-label="Launch waves">
      <CompetitionChannelChip channel={data.channel}/><h3>Launch waves</h3>
      {launchGroups.length ? <div className="v2-launch-waves">{launchGroups.map((row) => <div key={row.startDate}><span>{formatDate(row.startDate)}</span><strong>{row.count} observed</strong></div>)}</div>
        : <p className="v2-section-definition">No dated ad starts available for this capture; dates are not inferred.</p>}
      <p className="v2-section-definition">First observation describes a capture change, not a stopped campaign or advertising result.</p>
      {data.captureDeltaNote ? <p className="v2-section-source">Source delta sheet: {data.captureDeltaNote}</p> : null}
      <CompetitionSourceLabel value={data.sourceLabel}/>
    </section>
    <CreativeDetailTable data={data}/>
    <details className="competition-card v2-capture-extra"><summary>Additional imported format, language and product breakdowns</summary>
      <div className="competition-grid competition-grid-two competition-mt">
        <MixCard title="Format mix" rows={data.formatMix} source={data.sourceLabel} channel={data.channel}/>
        <MixCard title="Language mix" rows={data.languageMix} source={data.sourceLabel} channel={data.channel}/>
      </div>
    </details>
  </div>;
}

function CaptureFact({label,value,detail,channel}:{label:string;value:number|null|undefined;detail:string;channel:'Meta'|'Google'}) {
  return <article className="competition-card v2-capture-fact"><CompetitionChannelChip channel={channel}/>
    <span className="v2-capture-fact-label">{label}</span>
    <strong>{value == null || !Number.isFinite(value) ? 'n/a' : Number.isInteger(value) ? value.toLocaleString('en-US') : value.toFixed(1)}</strong>
    <small>{detail}</small>
  </article>;
}

function MixCard({ title, rows, source, channel }: { title: string; rows: CompetitionMixRow[]; source: string; channel: 'Meta' | 'Google' }) {
  return <article className="competition-card competition-mix-card"><CompetitionChannelChip channel={channel}/><h3>{title}</h3><div className="competition-mix-list">{rows.length ? rows.map((row) => <div key={row.label}><div className="competition-mix-copy"><span>{row.label}</span><strong>{row.count} <small>({formatPercent(row.percentage)})</small></strong></div><div className="competition-mix-track"><span style={{ width: `${row.percentage * 100}%` }} /></div></div>) : <div className="competition-empty">Data not available</div>}</div><CompetitionSourceLabel value={source} /></article>;
}

function CreativeDetailTable({ data }: { data: CompetitionDashboard }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState('');
  // All rows remain in the full source register. The landing page stays concise.
  // Search covers captured fields only, never inferred advertising results.
  const rows = data.observations.filter((row) =>
    [row.libraryId, row.startDate, row.format, row.theme, row.language, row.featuredBrandProduct,
      row.adText, row.clickDestination].filter(Boolean).join(' ').toLowerCase().includes(search.trim().toLowerCase()));
  return <section className="competition-card competition-details competition-mt" aria-label="Competition ad register">
    <CompetitionChannelChip channel={data.channel} />
    <div className="competition-card-heading">
      <div><h3>Ad register</h3><p>{data.observations.length} logged {data.channel} ad observations. Activity, not spend.</p></div>
      <button className="competition-register-open" type="button" onClick={() => {setSearch('');dialogRef.current?.showModal();}}>
        See all {data.observations.length} ads
      </button>
    </div>
    <CompetitionSourceLabel value={data.sourceLabel} />
    <dialog ref={dialogRef} className="competition-register-dialog" aria-label="Complete competitor ad register"
      onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current?.close(); }}>
      <div className="competition-register-dialog-inner">
        <div className="competition-register-dialog-header">
          <div><h2>Complete {data.competitor.label} register</h2><p>{data.channel} · {data.capture.date} · activity, not spend · {rows.length} of {data.observations.length} logged</p></div>
          <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close ad register">Close ×</button>
        </div>
        <label className="competition-register-search">Search captured fields
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Library ID, format, theme, text or destination" />
        </label>
        <div className="competition-table-wrap" role="region" aria-label="Scroll ad register" tabIndex={0}>
          <table><thead><tr><th>Library ID</th><th>Start date</th><th>Format</th><th>Theme</th><th>Language</th><th>Featured brand / product</th><th>Ad text</th><th>Destination</th></tr></thead>
            <tbody>{rows.map((row,index) => <tr key={`${row.libraryId}-${index}`}>
              <td>{row.libraryIdAvailable === false ? '(not captured)' : row.libraryId}</td>
              <td>{row.startDateAvailable === false ? '(not captured)' : formatDate(row.startDate)}</td>
              <td>{row.format}</td><td>{row.theme ?? 'N/A'}</td><td>{row.language ?? 'N/A'}</td>
              <td>{row.featuredBrandProduct ?? 'N/A'}</td><td className="competition-copy-cell">{row.adText ?? 'N/A'}</td>
              <td>{row.clickDestination ? <a href={row.clickDestination} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} /> Open</a> : 'N/A'}</td>
            </tr>)}</tbody>
          </table>
        </div>
        {!rows.length ? <p role="status">No records match this search.</p> : null}
      </div>
    </dialog>
  </section>;
}

function CompetitionImage({ screenshot, label }: { screenshot: CompetitionScreenshot; label: string }) {
  return screenshot.associationVerified
    ? <img className="competition-image" src={competitionAssetUrl(screenshot.assetUrl)} alt={`${label}; ${screenshot.multiAd ? `full screenshot containing ${screenshot.libraryIds.length} ads` : 'ad screenshot'}`} loading="lazy" />
    : <div className="competition-image-placeholder">Image not available</div>;
}

function UnavailableContext({ data, allDates, onSelectCapture }: { data: CompetitionDashboard; allDates: string[]; onSelectCapture: (value?: string) => void }) {
  return <div className="v2-gallery-awaiting" role="status">
    <strong>AWAITING</strong> · {data.competitor.label}: {allDates.length ? 'No matching capture for the selected reporting month.' : 'No approved capture workbook has been supplied.'} Owner: TBL.
    {allDates.length ? <button type="button" className="competition-alternative" onClick={() => onSelectCapture(allDates[0])}>Open available capture · {formatDate(allDates[0])}</button> : null}
    <CompetitionSourceLabel value={data.sourceLabel}/>
  </div>;
}

function CompetitionState({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return <div className={`competition-state${error ? ' error' : ''}`}>{children}</div>;
}

function formatDate(value: string | null): string { return value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)) : 'N/A'; }
function formatMonth(year?: number, month?: number): string { return year && month ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1))) : 'the selected page period'; }
function formatNumber(value: number | null): string { return value == null ? 'N/A' : value.toLocaleString('en-US'); }
function formatDecimal(value: number | null): string { return value == null ? 'N/A' : value.toFixed(1); }
function formatPercent(value: number): string { return `${(value * 100).toFixed(0)}%`; }

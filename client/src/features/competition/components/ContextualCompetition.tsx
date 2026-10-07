/* eslint-disable react-refresh/only-export-components */
import { ChevronDown, ExternalLink, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { CompetitionDashboard, CompetitionMixRow, CompetitionScreenshot } from '../../../types/competition';
import { useCompetitionDashboard, useCompetitionOptions } from '../hooks/use-competition-data';
import { competitionAssetUrl } from '../services/competition-api';
import { CompetitionSourceLabel } from './CompetitionSourceLabel';
import '../../../styles/reference-competition.css';

export type CompetitionContextView = 'creative' | 'media';

export function useContextualCompetition(clientId: string, year?: number, month?: number, initialCompetitor?: string) {
  const options = useCompetitionOptions(clientId);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | undefined>(initialCompetitor);
  const [captureDate, setCaptureDate] = useState<string>();
  const previousClient = useRef(clientId);

  useEffect(() => {
    if (previousClient.current !== clientId) {
      previousClient.current = clientId;
      setSelectedCompetitor(undefined);
      setCaptureDate(undefined);
    }
  }, [clientId]);

  useEffect(() => {
    if (initialCompetitor && options.data?.competitors.some((item) => item.id === initialCompetitor)) setSelectedCompetitor(initialCompetitor);
  }, [initialCompetitor, options.data]);

  const dashboard = useCompetitionDashboard({ year, month, competitor: selectedCompetitor, captureDate });
  return {
    clientId,
    year,
    month,
    options,
    dashboard,
    selectedCompetitor,
    captureDate,
    selectCompetitor: (value?: string) => { setSelectedCompetitor(value); setCaptureDate(undefined); },
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
    <span>Competition</span>
    <button type="button" className={`competition-context-trigger${open ? ' open' : ''}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)} onKeyDown={onKeyDown}>
      <span>{selected?.label ?? 'Competition'}</span><ChevronDown size={14} aria-hidden="true" />
    </button>
    {open ? <div className="competition-context-menu" role="menu" aria-label="Competition">
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
  return <section className="competition-context-panel competition-mt" aria-label={`${view === 'creative' ? 'Creative' : 'Media'} Competition context`}>
    <div className="competition-context-heading">
      <div><h3>{view === 'creative' ? 'Creative Competition' : 'Media Competition'}</h3><p>{data?.competitor.label ?? 'Selected competitor'}{data?.competitor.metaPage ? ` · Meta page ${data.competitor.metaPage}` : ''}</p></div>
      <div className="competition-context-actions">
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
              <div className="competition-context-capture"><div><span>Selected capture</span><strong>{formatDate(data.capture.date)}</strong><small>{data.capture.matchesReportingPeriod ? 'Matches the page reporting month' : `Alternative capture; page reporting period is ${formatMonth(context.year, context.month)}`}</small></div><CompetitionSourceLabel value={data.sourceLabel} /></div>
              {view === 'creative' ? <CreativeCompetitionView data={data} /> : <MediaCompetitionView data={data} />}
            </>}
  </section>;
}

function CreativeCompetitionView({ data }: { data: CompetitionDashboard }) {
  const featured = useMemo(() => countLabels(data.observations.map((row) => row.featuredBrandProduct)), [data.observations]);
  return <>
    <div className="competition-grid competition-grid-two competition-mt">
      <MixCard title="Format mix" rows={data.formatMix} source={data.sourceLabel} />
      <MixCard title="Theme mix" rows={data.themeMix} source={data.sourceLabel} />
      <MixCard title="Language mix" rows={data.languageMix} source={data.sourceLabel} />
      <article className="competition-card competition-mix-card"><h3>Featured brands / products</h3><div className="competition-mix-list">{featured.length ? featured.map((row) => <div className="competition-mix-copy" key={row.label}><span>{row.label}</span><strong>{row.count}</strong></div>) : <div className="competition-empty">Data not available</div>}</div><CompetitionSourceLabel value={data.sourceLabel} /></article>
    </div>
    <details className="competition-card competition-context-gallery competition-mt">
      <summary>Creative gallery ({data.screenshots.length})</summary>
      <div className="competition-gallery">{data.screenshots.map((screenshot) => <article className="competition-gallery-card" key={screenshot.ref}>
        <CompetitionImage screenshot={screenshot} label={screenshot.ref} />
        <div><h4>{screenshot.ref}</h4><p>{screenshot.multiAd ? `${screenshot.libraryIds.length} ads appear in this full screenshot` : 'One ad appears in this screenshot'}</p><div className="competition-gallery-ids">{screenshot.libraryIds.map((id) => <span key={id}>{id}</span>)}</div><CompetitionSourceLabel value={data.sourceLabel} /></div>
      </article>)}</div>
    </details>
    <CreativeDetailTable data={data} />
  </>;
}

function MediaCompetitionView({ data }: { data: CompetitionDashboard }) {
  return <>
    <div className="competition-grid competition-grid-two competition-mt">
      <article className="competition-card competition-summary-card"><h3>Competitor activity</h3><div className="competition-kpis"><div><strong>{formatNumber(data.activity.activeAds)}</strong><span>Active ads at capture</span></div><div><strong>{formatDecimal(data.activity.averageDaysRunning)}</strong><span>Average days running</span></div><div><strong>{data.activity.historicalTrend ? formatTrend(data.activity.historicalTrend) : 'N/A'}</strong><span>History</span></div></div><p>{data.historyNote}</p><CompetitionSourceLabel value={data.sourceLabel} /></article>
      <article className="competition-card competition-summary-card"><h3>Recent start-date activity</h3><div className="competition-kpis"><div><strong>{formatNumber(data.launches.startedInSelectedMonth)}</strong><span>Started during page month</span></div><div><strong>{formatNumber(data.launches.firstObservedAds)}</strong><span>First observed</span></div></div><p>Start date and first-observed date are kept separate. First-capture ads are not all labelled new.</p><CompetitionSourceLabel value={data.sourceLabel} /></article>
    </div>
    <section className="competition-card competition-mt"><div className="competition-card-heading"><div><h3>Longest-running ads</h3><p>Top three active ads by date-only days running. Longevity does not prove performance or profitability.</p></div></div><div className="competition-longest-grid">{data.longestRunning.map((row) => <article className="competition-activity-row" key={row.libraryId}><strong>{row.featuredBrandProduct ?? row.libraryId}</strong><dl><div><dt>Library ID</dt><dd>{row.libraryId}</dd></div><div><dt>Start date</dt><dd>{formatDate(row.startDate)}</dd></div><div><dt>Days running</dt><dd>{row.calculatedDaysRunning}</dd></div></dl><CompetitionSourceLabel value={data.sourceLabel} /></article>)}</div><CompetitionSourceLabel value={data.sourceLabel} /></section>
    <MediaDetailTable data={data} />
  </>;
}

function MixCard({ title, rows, source }: { title: string; rows: CompetitionMixRow[]; source: string }) {
  return <article className="competition-card competition-mix-card"><h3>{title}</h3><div className="competition-mix-list">{rows.length ? rows.map((row) => <div key={row.label}><div className="competition-mix-copy"><span>{row.label}</span><strong>{row.count} <small>({formatPercent(row.percentage)})</small></strong></div><div className="competition-mix-track"><span style={{ width: `${row.percentage * 100}%` }} /></div></div>) : <div className="competition-empty">Data not available</div>}</div><CompetitionSourceLabel value={source} /></article>;
}

function CreativeDetailTable({ data }: { data: CompetitionDashboard }) {
  return <section className="competition-card competition-details competition-mt"><div className="competition-card-heading"><div><h3>Creative detail</h3><p>Original analyst labels remain unchanged.</p></div></div><div className="competition-table-wrap"><table><thead><tr><th>Library ID</th><th>Start date</th><th>Format</th><th>Theme</th><th>Language</th><th>Featured brand / product</th><th>Ad text</th><th>Destination</th></tr></thead><tbody>{data.observations.map((row) => <tr key={row.libraryId}><td>{row.libraryId}</td><td>{formatDate(row.startDate)}</td><td>{row.format}</td><td>{row.theme ?? 'N/A'}</td><td>{row.language ?? 'N/A'}</td><td>{row.featuredBrandProduct ?? 'N/A'}</td><td className="competition-copy-cell">{row.adText ?? 'N/A'}</td><td>{row.clickDestination ? <a href={row.clickDestination} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} /> Open</a> : 'N/A'}</td></tr>)}</tbody></table></div><CompetitionSourceLabel value={data.sourceLabel} /></section>;
}

function MediaDetailTable({ data }: { data: CompetitionDashboard }) {
  return <section className="competition-card competition-details competition-mt"><div className="competition-card-heading"><div><h3>Activity detail</h3><p>Library IDs are counted once within this capture.</p></div></div><div className="competition-table-wrap"><table><thead><tr><th>Library ID</th><th>Start date</th><th className="num">Days</th><th>Status</th><th>Platforms</th><th>Format</th><th>Theme</th><th>Featured brand / product</th></tr></thead><tbody>{data.observations.map((row) => <tr key={row.libraryId}><td>{row.libraryId}</td><td>{formatDate(row.startDate)}</td><td className="num">{row.calculatedDaysRunning}</td><td>{row.status}</td><td>{row.platforms}</td><td>{row.format}</td><td>{row.theme ?? 'N/A'}</td><td>{row.featuredBrandProduct ?? 'N/A'}</td></tr>)}</tbody></table></div><CompetitionSourceLabel value={data.sourceLabel} /></section>;
}

function CompetitionImage({ screenshot, label }: { screenshot: CompetitionScreenshot; label: string }) {
  return screenshot.associationVerified
    ? <img className="competition-image" src={competitionAssetUrl(screenshot.assetUrl)} alt={`${label}; ${screenshot.multiAd ? `full screenshot containing ${screenshot.libraryIds.length} ads` : 'ad screenshot'}`} loading="lazy" />
    : <div className="competition-image-placeholder">Image not available</div>;
}

function UnavailableContext({ data, allDates, onSelectCapture }: { data: CompetitionDashboard; allDates: string[]; onSelectCapture: (value?: string) => void }) {
  return <article className="competition-card competition-unavailable"><h3>{data.competitor.label}</h3><strong>Data not received</strong><p>No capture was supplied for the page reporting month. Older ad start dates are not used to backfill a capture.</p>{allDates.length ? <button type="button" className="competition-alternative" onClick={() => onSelectCapture(allDates[0])}>Open available capture from {formatDate(allDates[0])}</button> : null}<CompetitionSourceLabel value={data.sourceLabel} /></article>;
}

function CompetitionState({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return <div className={`competition-state${error ? ' error' : ''}`}>{children}</div>;
}

function countLabels(values: Array<string | null>): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function formatDate(value: string | null): string { return value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)) : 'N/A'; }
function formatMonth(year?: number, month?: number): string { return year && month ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1))) : 'the selected page period'; }
function formatNumber(value: number | null): string { return value == null ? 'N/A' : value.toLocaleString('en-US'); }
function formatDecimal(value: number | null): string { return value == null ? 'N/A' : value.toFixed(1); }
function formatPercent(value: number): string { return `${(value * 100).toFixed(0)}%`; }
function formatTrend(rows: Array<{ activeAds: number }>): string { if (rows.length < 2) return 'N/A'; const delta = (rows.at(-1)?.activeAds ?? 0) - (rows.at(-2)?.activeAds ?? 0); return `${delta > 0 ? '+' : ''}${delta}`; }

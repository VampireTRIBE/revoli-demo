import { ExternalLink, Images, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CompetitionFilters } from '../features/competition/components/CompetitionFilters';
import { CompetitionSourceLabel } from '../features/competition/components/CompetitionSourceLabel';
import { useCompetitionDashboard, useCompetitionOptions } from '../features/competition/hooks/use-competition-data';
import { competitionAssetUrl, type CompetitionFilter } from '../features/competition/services/competition-api';
import type { CompetitionDashboard, CompetitionMixRow, CompetitionObservation, CompetitionScreenshot } from '../types/competition';
import '../styles/reference-competition.css';

export function CompetitionDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const options = useCompetitionOptions();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const filter = useMemo<CompetitionFilter>(() => ({
    year: numberParam(searchParams.get('year')),
    month: numberParam(searchParams.get('month')),
    competitor: searchParams.get('competitor') || undefined,
    captureDate: searchParams.get('captureDate') || undefined,
  }), [searchParams]);

  useEffect(() => {
    const defaults = options.data?.defaultSelection;
    if (!defaults || (filter.year && filter.month && filter.competitor)) return;
    setSearchParams({
      year: String(defaults.year), month: String(defaults.month), competitor: defaults.competitor, captureDate: defaults.captureDate,
    }, { replace: true });
  }, [filter.competitor, filter.month, filter.year, options.data, setSearchParams]);

  const dashboard = useCompetitionDashboard(filter);
  const onFilterChange = (next: CompetitionFilter) => {
    const year = next.year ?? filter.year ?? options.data?.defaultSelection?.year;
    const months = options.data?.years.find((entry) => entry.year === year)?.months ?? [];
    const requestedMonth = next.month ?? filter.month;
    const month = requestedMonth && months.some((entry) => entry.month === requestedMonth) ? requestedMonth : months[0]?.month;
    const competitor = next.competitor ?? filter.competitor ?? options.data?.defaultSelection?.competitor;
    const selectedPeriod = months.find((entry) => entry.month === month);
    const captureDates = competitor ? selectedPeriod?.captureDatesByCompetitor[competitor] ?? [] : selectedPeriod?.captureDates ?? [];
    const requestedCapture = next.captureDate ?? (next.year === undefined && next.month === undefined ? filter.captureDate : undefined);
    const captureDate = requestedCapture && captureDates.includes(requestedCapture) ? requestedCapture : captureDates[0];
    const params: Record<string, string> = { year: String(year ?? ''), month: String(month ?? ''), competitor: competitor ?? '' };
    if (captureDate) params.captureDate = captureDate;
    setSearchParams(params);
  };

  if (options.isError) return <section className="competition-page"><StateBox error>Competition capture options could not be loaded. Confirm the API is running.</StateBox></section>;

  return <section className="competition-page">
    <div className="competition-heading">
      <div>
        <h2>Competition <span className="reference-badge competition-badge">CAPTURED DATA</span></h2>
        <p>Market activity context only. Competition data never enters Media, Creative, or overall scores.</p>
      </div>
      {options.data ? <CompetitionFilters options={options.data} {...filter} onChange={onFilterChange} /> : <span className="competition-muted">Loading filters...</span>}
    </div>
    {dashboard.isLoading || !dashboard.data ? <StateBox>Loading competition capture...</StateBox> : dashboard.isError ? <StateBox error>Competition capture could not be loaded.</StateBox> : !dashboard.data.available ? <UnavailableDashboard data={dashboard.data} /> : <>
      <CaptureBanner data={dashboard.data} onOpenGallery={() => setGalleryOpen(true)} />
      <div className="competition-grid competition-grid-two competition-mt">
        <ActivityCard data={dashboard.data} />
        <LaunchesCard data={dashboard.data} />
      </div>
      <LongestRunning data={dashboard.data} />
      <div className="competition-grid competition-grid-two competition-mt">
        <MixCard title="Format mix" rows={dashboard.data.formatMix} source={dashboard.data.sourceLabel} />
        <MixCard title="Language mix" rows={dashboard.data.languageMix} source={dashboard.data.sourceLabel} />
      </div>
      <MixCard title="Theme mix" rows={dashboard.data.themeMix} source={dashboard.data.sourceLabel} wide />
      <AdDetails data={dashboard.data} />
      <details className="competition-method">
        <summary>How this capture is calculated and validated</summary>
        <div className="competition-method-grid">
          <p><b>Active ads:</b> unique active Library IDs in the selected capture. Repeated IDs are not summed.</p>
          <p><b>Days running:</b> capture date minus start date using date-only UTC arithmetic. Supplied values are checked, not trusted blindly.</p>
          <p><b>First observed:</b> IDs absent from every earlier capture. It is N/A for the first capture and is not treated as a launch count.</p>
          <p><b>No longer observed:</b> IDs in the previous capture but absent now. Absence does not confirm that an ad became inactive.</p>
        </div>
        <p>{dashboard.data.historyNote}</p>
        <p><b>Validation:</b> {dashboard.data.audit?.acceptedRows ?? 0} accepted rows; {dashboard.data.audit?.duplicateRows ?? 0} duplicate rows; {dashboard.data.audit?.malformedRows ?? 0} malformed rows; {dashboard.data.audit?.daysRunningDiscrepancies ?? 0} day-count discrepancies; {dashboard.data.audit?.verifiedScreenshotAssociations ?? 0} verified screenshot associations.</p>
        <CompetitionSourceLabel value={dashboard.data.sourceLabel} />
      </details>
      {galleryOpen ? <CreativeGallery data={dashboard.data} onClose={() => setGalleryOpen(false)} /> : null}
    </>}
  </section>;
}

function CaptureBanner({ data, onOpenGallery }: { data: CompetitionDashboard; onOpenGallery: () => void }) {
  return <div className="competition-capture-banner">
      <div><span>Selected capture</span><strong>{formatDate(data.capture.date)}</strong><small>{data.competitor.label} · Meta page {data.competitor.metaPage} · {data.capture.sourceFile}</small><CompetitionSourceLabel value={data.sourceLabel} /></div>
    <button type="button" onClick={onOpenGallery}><Images size={16} /> Creative gallery <span>{data.screenshots.length}</span></button>
  </div>;
}

function ActivityCard({ data }: { data: CompetitionDashboard }) {
  return <article className="competition-card competition-summary-card">
    <h3>Competitor activity</h3>
    <div className="competition-kpis">
      <div><strong>{formatNumber(data.activity.activeAds)}</strong><span>Active ads at capture</span></div>
      <div><strong>{formatDecimal(data.activity.averageDaysRunning)}</strong><span>Average days running</span></div>
      <div><strong>{data.activity.historicalTrend ? formatSignedTrend(data.activity.historicalTrend) : 'N/A'}</strong><span>Historical trend</span></div>
    </div>
    <p>{data.activity.historicalTrend ? 'Trend compares stored captures without summing repeated ads.' : 'Historical trend needs at least two captures.'}</p>
    <CompetitionSourceLabel value={data.sourceLabel} />
  </article>;
}

function LaunchesCard({ data }: { data: CompetitionDashboard }) {
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(data.filter.year, data.filter.month - 1, 1)));
  return <article className="competition-card competition-summary-card">
    <h3>Recent launches</h3>
    <div className="competition-kpis">
      <div><strong>{formatNumber(data.launches.startedInSelectedMonth)}</strong><span>Started during {monthName}</span></div>
      <div><strong>{formatNumber(data.launches.firstObservedAds)}</strong><span>First observed in capture</span></div>
    </div>
    {data.launches.startedOnSeptember28Or29 ? <div className="competition-burst"><b>{data.launches.startedOnSeptember28Or29} captured ads</b> started on 28–29 September. Start date is not first-observed date.</div> : null}
    <div className="competition-launch-groups" aria-label="Captured ads grouped by start date">
      <span>Captured ads by start date</span>
      <div>{data.launches.groups.map((group) => <span key={group.startDate}><b>{formatDate(group.startDate)}</b> {group.count}</span>)}</div>
    </div>
    {data.capture.firstCapture ? <p>This is the first capture, so the ads are not all labelled as new.</p> : null}
    <CompetitionSourceLabel value={data.sourceLabel} />
  </article>;
}

function LongestRunning({ data }: { data: CompetitionDashboard }) {
  return <section className="competition-card competition-mt">
    <div className="competition-card-heading"><div><h3>Longest-running ads</h3><p>Top three active ads by calculated days running. Longevity does not prove performance or profitability.</p></div></div>
    <div className="competition-longest-grid">
      {data.longestRunning.map((ad) => <article className="competition-creative" key={ad.libraryId}>
        <CreativeImage screenshot={ad.screenshot} label={ad.featuredBrandProduct ?? ad.libraryId} />
        <div className="competition-creative-body">
          <span className="competition-format">{ad.formatGroup}</span>
          <h4>{ad.featuredBrandProduct ?? 'Featured product not supplied'}</h4>
          <dl><div><dt>Start date</dt><dd>{formatDate(ad.startDate)}</dd></div><div><dt>Days running</dt><dd>{ad.calculatedDaysRunning}</dd></div><div><dt>Library ID</dt><dd>{ad.libraryId}</dd></div></dl>
          {ad.screenshot?.multiAd ? <small>Full screenshot contains {ad.screenshot.libraryIds.length} ads; this is not an individual crop.</small> : null}
          <CompetitionSourceLabel value={data.sourceLabel} />
        </div>
      </article>)}
    </div>
    <CompetitionSourceLabel value={data.sourceLabel} />
  </section>;
}

function MixCard({ title, rows, source, wide = false }: { title: string; rows: CompetitionMixRow[]; source: string; wide?: boolean }) {
  return <article className={`competition-card competition-mix-card${wide ? ' competition-mt' : ''}`}>
    <h3>{title}</h3>
    <div className="competition-mix-list">{rows.length ? rows.map((row, index) => <div key={row.label}>
      <div className="competition-mix-copy"><span>{row.label}</span><strong>{row.count} <small>({formatPercent(row.percentage)})</small></strong></div>
      <div className="competition-mix-track"><span style={{ width: `${row.percentage * 100}%`, background: mixColour(index) }} /></div>
    </div>) : <div className="competition-empty">Data not available</div>}</div>
    <CompetitionSourceLabel value={source} />
  </article>;
}

function AdDetails({ data }: { data: CompetitionDashboard }) {
  const [search, setSearch] = useState('');
  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data.observations;
    return data.observations.filter((row) => [row.libraryId, row.startDate, row.status, row.platforms, row.format, row.theme, row.featuredBrandProduct, row.language, row.adText]
      .some((value) => value?.toLowerCase().includes(query)));
  }, [data.observations, search]);
  return <section className="competition-card competition-details competition-mt">
    <div className="competition-card-heading"><div><h3>Ad details</h3><p>Original analyst format and theme labels are preserved.</p></div><label className="competition-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ads" aria-label="Search ad details" /></label></div>
    <div className="competition-table-wrap"><table><thead><tr><th>Library ID</th><th>Start date</th><th className="num">Days</th><th>Status</th><th>Platforms</th><th>Format</th><th>Theme</th><th>Featured brand / product</th><th>Language</th><th>Ad text</th><th>Destination</th></tr></thead><tbody>
      {rows.map((row) => <AdDetailRow key={row.libraryId} row={row} />)}
      {!rows.length ? <tr><td colSpan={11} className="competition-table-empty">No ads match this search.</td></tr> : null}
    </tbody></table></div>
    <CompetitionSourceLabel value={data.sourceLabel} />
  </section>;
}

function AdDetailRow({ row }: { row: CompetitionObservation }) {
  return <tr><td className="competition-id">{row.libraryId}</td><td>{formatDate(row.startDate)}</td><td className="num">{row.calculatedDaysRunning}{row.daysRunningDiscrepancy ? ' ⚠' : ''}</td><td><span className="competition-status">{row.status}</span></td><td>{row.platforms}</td><td>{row.format}</td><td>{row.theme ?? 'N/A'}</td><td>{row.featuredBrandProduct ?? 'N/A'}</td><td>{row.language ?? 'N/A'}</td><td className="competition-copy-cell">{row.adText ?? 'N/A'}</td><td>{row.clickDestination ? <a href={row.clickDestination} target="_blank" rel="noopener noreferrer" aria-label={`Open destination for Library ID ${row.libraryId}`}><ExternalLink size={14} /> Open</a> : 'N/A'}</td></tr>;
}

function CreativeGallery({ data, onClose }: { data: CompetitionDashboard; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return <div className="competition-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section className="competition-modal" role="dialog" aria-modal="true" aria-labelledby="competition-gallery-title">
      <div className="competition-modal-heading"><div><h3 id="competition-gallery-title">Creative gallery</h3><p>{data.competitor.label} · captured {formatDate(data.capture.date)} · {data.screenshots.length} supplied screenshots</p></div><button type="button" onClick={onClose} aria-label="Close creative gallery"><X size={19} /></button></div>
      <div className="competition-gallery">{data.screenshots.map((screenshot) => <article className="competition-gallery-card" key={screenshot.ref}>
        <CreativeImage screenshot={screenshot} label={screenshot.ref} />
        <div><h4>{screenshot.ref}</h4><p>{screenshot.multiAd ? `${screenshot.libraryIds.length} ads appear in this full screenshot` : 'One ad appears in this screenshot'}</p><div className="competition-gallery-ids">{screenshot.libraryIds.map((id) => <span key={id}>{id}</span>)}</div><CompetitionSourceLabel value={data.sourceLabel} /></div>
      </article>)}</div>
    </section>
  </div>;
}

function CreativeImage({ screenshot, label }: { screenshot: CompetitionScreenshot | null; label: string }) {
  return screenshot?.associationVerified
    ? <img className="competition-image" src={competitionAssetUrl(screenshot.assetUrl)} alt={`${label}; ${screenshot.multiAd ? `full screenshot containing ${screenshot.libraryIds.length} ads` : 'ad screenshot'}`} loading="lazy" />
    : <div className="competition-image-placeholder">Image not available</div>;
}

function UnavailableDashboard({ data }: { data: CompetitionDashboard }) {
  return <article className="competition-card competition-unavailable"><h3>{data.competitor.label}</h3><strong>Data not received</strong><p>No capture workbook was supplied for this competitor in the selected period. Results are not backfilled or inferred from the build brief.</p><CompetitionSourceLabel value={data.sourceLabel} /></article>;
}

function StateBox({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return <div className={`competition-state${error ? ' error' : ''}`}>{children}</div>;
}

function numberParam(value: string | null): number | undefined { const parsed = Number(value); return value && Number.isFinite(parsed) ? parsed : undefined; }
function formatDate(value: string | null): string { return value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)) : 'N/A'; }
function formatNumber(value: number | null): string { return value == null ? 'N/A' : value.toLocaleString('en-US'); }
function formatDecimal(value: number | null): string { return value == null ? 'N/A' : value.toFixed(1); }
function formatPercent(value: number): string { return `${(value * 100).toFixed(0)}%`; }
function formatSignedTrend(rows: Array<{ activeAds: number }>): string { if (rows.length < 2) return 'N/A'; const delta = (rows.at(-1)?.activeAds ?? 0) - (rows.at(-2)?.activeAds ?? 0); return `${delta > 0 ? '+' : ''}${delta}`; }
function mixColour(index: number): string { return ['#34d399', '#7c9aff', '#fbbf24', '#c4a5fa', '#f87171'][index % 5] ?? '#34d399'; }

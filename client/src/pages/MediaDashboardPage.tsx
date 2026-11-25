import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { MediaFilter, Overview } from '../types/media';
import { CampaignSection } from '../features/media/components/CampaignSection';
import { EmptyState, ErrorState } from '../features/media/components/StateCard';
import { LoadingSkeleton } from '../features/media/components/LoadingSkeleton';
import { MediaPeriodFilters } from '../features/media/components/MediaPeriodFilters';
import { MediaConsumerAlignment } from '../features/media/components/MediaConsumerAlignment';
import { OverviewCards } from '../features/media/components/OverviewCards';
import { Ga4Channels } from '../features/media/components/Ga4Channels';
import { PlatformComparisonTable } from '../features/media/components/PlatformComparisonTable';
import { useBrands, useGa4V4, useMediaHistory, useOverview, usePeriods, usePlatforms, useSegments } from '../features/media/hooks/use-media-data';
import { formatNumber } from '../features/media/utils/formatters';
import { TblReadsStrip } from '../features/reads/TblReadsStrip';
import { SectionAnatomy } from '../components/v2/Reporting';
import { CompetitionDropdown, ContextualCompetitionPanel, useContextualCompetition } from '../features/competition/components/ContextualCompetition';
import { UnionCoopMediaView } from './UnionCoopMediaView';
import '../styles/reference-media.css';
import '../styles/media-ceo.css';
// Import last to keep Media filters aligned with the shared neutral palette.
import '../styles/media-palette.css';

export function MediaDashboardPage() {
  const [params,setParams]=useSearchParams();
  const union=params.get('client')==='union-coop';
  const selectClient=(value:string)=>{
    const next=new URLSearchParams(params);
    for(const field of ['brand','segment','competition'])next.delete(field);
    if(value==='union-coop')next.set('client','union-coop');else next.delete('client');
    setParams(next);
  };
  return <><div className="v2-media-client-picker"><label>Client <select aria-label="Media client" value={union?'union-coop':'rivoli-shop'} onChange={e=>selectClient(e.target.value)}><option value="rivoli-shop">Rivoli</option><option value="union-coop">Union Coop</option></select></label></div>{union?<UnionCoopMediaView/>:<RivoliMediaPage/>}</>;
}
function RivoliMediaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Media compares Rivoli's own reporting with the approved EDIT competitor.
  // Do not infer a competitor from the Creative tab or a Union Coop brand.
  const competitionContext = useContextualCompetition('rivoli-shop',
    searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
    searchParams.get('month') ? Number(searchParams.get('month')) : undefined,
    searchParams.get('competition') || undefined);
  const periods = usePeriods();
  const filter = useMemo<MediaFilter>(() => ({
    year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
    month: searchParams.get('month') ? Number(searchParams.get('month')) : undefined,
    segment: parseSelections(searchParams.get('segment')),
    brand: parseSelections(searchParams.get('brand')),
  }), [searchParams]);
  // Filter choices describe the imported year, not just the selected month's metrics.
  // GA4-only months (e.g. October) have no brand/segment performance rows.
  const optionYearFilter = useMemo<MediaFilter>(() => ({
    year: filter.year,
  }), [filter.year]);
  const segmentData = useSegments(optionYearFilter);
  const brandFilter = useMemo<MediaFilter>(() => ({
    ...optionYearFilter,
    segment: filter.segment,
  }), [optionYearFilter, filter.segment]);
  const brandData = useBrands(brandFilter);
  const segments = useMemo(() => segmentData.data?.segments ?? [], [segmentData.data]);
  const brands = useMemo(() => brandData.data?.brands ?? [], [brandData.data]);

  useEffect(() => {
    if (!periods.data || searchParams.has('year')) return;
    const latestYear = periods.data.years[0];
    if (!latestYear) return;
    const latestComplete = [...latestYear.months].reverse().find((month) => !month.partial) ?? latestYear.months.at(-1);
    const next = new URLSearchParams({ year: String(latestYear.year) });
    if (latestComplete) next.set('month', String(latestComplete.month));
    setSearchParams(next, { replace: true });
  }, [periods.data, searchParams, setSearchParams]);

  useEffect(() => {
    if (!filter.segment?.length || segmentData.isLoading || !segmentData.data) return;
    const available = new Set(segments.map((row) => row.label));
    const valid = filter.segment.filter((value) => available.has(value));
    if (valid.length === filter.segment.length) return;
    setSearchParams(toSearchParams({ ...filter, segment: valid.length ? valid : undefined }), { replace: true });
  }, [filter, segmentData.data, segmentData.isLoading, segments, setSearchParams]);

  useEffect(() => {
    if (!filter.brand?.length || brandData.isLoading || !brandData.data) return;
    const available = new Set(brands.map((row) => row.label));
    const valid = filter.brand.filter((value) => available.has(value));
    if (valid.length === filter.brand.length) return;
    setSearchParams(toSearchParams({ ...filter, brand: valid.length ? valid : undefined }), { replace: true });
  }, [brandData.data, brandData.isLoading, brands, filter, setSearchParams]);

  const overview = useOverview(filter);
  const platforms = usePlatforms(filter);
  const history=useMediaHistory(filter);
  // Fetch the full year once: selected-month tables and historic charts share the same verified source.
  const ga4=useGa4V4({year:filter.year});
  const onFilterChange = (year?: number, month?: number) => {
    setSearchParams(toSearchParams(year === filter.year ? { ...filter, year, month } : { year, month }));
  };
  const onSegmentChange = (segment?: string[]) => {
    setSearchParams(toSearchParams({ ...filter, segment }));
  };
  const onBrandChange = (brand?: string[]) => {
    setSearchParams(toSearchParams({ ...filter, brand }));
  };


  if (periods.isError) return <section className="reference-media-page"><ErrorState message="Reporting periods could not be loaded. Confirm the API is running." /></section>;

  return <section className="reference-media-page">
    <div className="reference-media-heading">
      <div className="v2-client-heading"><div><p className="v2-section-definition">Client: Rivoli</p><h2>Media Performance <span className="reference-badge media-coverage-badge">PARTIAL SOURCE COVERAGE</span> <span className="media-depth-badge">Data depth: Partial</span></h2></div></div>
      <div className="reference-media-controls"><div className="reference-media-toolbar"><div className="media-reporting-filters">{periods.data ? <MediaPeriodFilters
        periods={periods.data}
        year={filter.year}
        month={filter.month}
        segment={filter.segment}
        brand={filter.brand}
        segments={segments}
        brands={brands}
        segmentsLoading={segmentData.isLoading}
        brandsLoading={brandData.isLoading}
        onChange={onFilterChange}
        onSegmentChange={onSegmentChange}
        onBrandChange={onBrandChange}
      /> : <LoadingSkeleton rows={2} />}</div><div className="media-compare-control"><CompetitionDropdown context={competitionContext} /></div></div>
      {filter.segment?.length || filter.brand?.length ? <div className="media-filter-selection-summary" aria-live="polite">
        {filter.segment?.length ? <div><strong>Segment:</strong> {filter.segment.map(displayFilterLabel).join(', ')}</div> : null}
        {filter.brand?.length ? <div><strong>Brand:</strong> {filter.brand.map(displayFilterLabel).join(', ')}</div> : null}
      </div> : null}</div>
    </div>
    <TblReadsStrip client="Rivoli" section="Media" year={filter.year} month={filter.month ?? 0} />
    <SectionAnatomy number={1} label="Spend and return" question="What went in, what came out" definition="Platform spend (all ad accounts) beside site revenue. Coverage, not ROAS." client="Rivoli" readSection="Media" year={filter.year} month={filter.month} source="Google Ads + Meta workbook exports; reconciled site import. Source coverage must be checked per month.">
      <MediaConsumerAlignment year={filter.year} month={filter.month} overview={overview.data} history={history.data} ga4={ga4.data} scopedSelection={Boolean(filter.segment?.length || filter.brand?.length)} />
      {overview.data ? <AttributionNote data={overview.data} history={history.data} month={filter.month}/> : null}
    </SectionAnatomy>
    <SectionAnatomy number={2} label="Acquisition cost" question="What a customer costs" definition="Spend ÷ first-time site purchasers. Platform-claimed purchases shown separately, labelled." client="Rivoli" readSection="Media" year={filter.year} month={filter.month}>
      {overview.isLoading ? <LoadingSkeleton rows={3} /> : overview.isError ? <ErrorState/> : overview.data ? <OverviewCards data={overview.data} history={history.data} selectedMonth={filter.month} ga4={ga4.data} scopedSelection={Boolean(filter.segment?.length||filter.brand?.length)}/> : <EmptyState/>}
      {platforms.isLoading ? <div className="reference-card reference-mt"><LoadingSkeleton /></div> : platforms.isError ? <ErrorState/> : platforms.data ? <PlatformComparisonTable data={platforms.data}/> : null}
      <p className="media-ceo-source-note">Google interaction rate and Meta link CTR are separate definitions. No cross-platform rate is combined or used as ROAS.</p>
    </SectionAnatomy>
    <SectionAnatomy number={3} label="Channels" question="Where traffic and money come from" definition="Site sessions and revenue by channel, from the reconciled GA4 import." client="Rivoli" readSection="Media" year={filter.year} month={filter.month}>
      <Ga4Channels data={ga4.data} year={filter.year} month={filter.month} />
    </SectionAnatomy>
    <SectionAnatomy number={4} label="Campaigns" question="What is working hardest, per objective" definition="Cost per reported result inside each objective. Objectives never ranked against each other. No recommendations." client="Rivoli" readSection="Media" year={filter.year} month={filter.month}>
      <CampaignSection filter={filter}/>
    </SectionAnatomy>
    <SectionAnatomy number={5} label="Competition" question="What rivals are running" definition="Public ad activity from Meta Ad Library and Google Transparency Center. Activity, not spend." client="Rivoli" readSection="Media" year={filter.year} month={filter.month}>
      {competitionContext.selectedCompetitor
        ? <ContextualCompetitionPanel context={competitionContext} view="media" />
        : <p className="media-competition-prompt">Compare against EDIT by Ahmed Seddiqi using the selector above to view its Meta and Google capture data. The competitor capture date is independent of the Media reporting month.</p>}
    </SectionAnatomy>
    {overview.data ? <ScoreMethod data={overview.data}/> : null}
  </section>;
}

function toSearchParams(filter: MediaFilter): URLSearchParams {
  const next = new URLSearchParams();
  if (filter.year) next.set('year', String(filter.year));
  if (filter.year && filter.month) next.set('month', String(filter.month));
  if (filter.segment?.length) next.set('segment', filter.segment.join(','));
  if (filter.brand?.length) next.set('brand', filter.brand.join(','));
  return next;
}

function parseSelections(value: string | null): string[] | undefined {
  if (!value) return undefined;
  const selections = [...new Set(value.split(',').map((entry) => entry.trim()).filter(Boolean))];
  return selections.length ? selections : undefined;
}

function displayFilterLabel(value: string): string {
  return /^corporate\s*\/\s*multi(?:[-\s].*)?$/i.test(value.trim()) ? 'Corporate' : value;
}

function AttributionNote({ data, history, month }: { data: Overview; history?: import('../types/media').MediaMonthlyHistory; month?: number }) {
  const selected = month ? history?.months.find((row)=>row.month===month) : undefined;
  if (month && (!selected || selected.platformClaims===null || selected.sitePurchases===null)) return <div className="reference-note media-attribution-note"><b>Attribution:</b> n/a. Matched platform claims and reconciled site-purchase rows have not both been imported for this month.</div>;
  const { platformClaims, sitePurchases } = data.metrics;
  return <div className="reference-note media-attribution-note"><b>Attribution:</b> Platform-reported conversions {formatNumber(platformClaims.value)} vs {formatNumber(sitePurchases)} site purchases in this selection; overlapping credit is possible. Revenue coverage is not ROAS.</div>;
}

function ScoreMethod({ data }: { data: Overview }) {
  return <details className="reference-method">
    <summary>Unscored · baselines pending</summary>
    <p><b>{data.metrics.scoreLabel}</b></p>
    <p>No numeric Media score, benchmark bar, or performance colour is produced until signed baselines are supplied. Valid underlying metrics remain visible and do not feed an overall score.</p>
  </details>;
}


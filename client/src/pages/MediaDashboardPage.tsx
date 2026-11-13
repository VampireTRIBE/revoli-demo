import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { MediaFilter, Overview } from '../types/media';
import { CampaignSection } from '../features/media/components/CampaignSection';
import { EmptyState, ErrorState } from '../features/media/components/StateCard';
import { LoadingSkeleton } from '../features/media/components/LoadingSkeleton';
import { MediaPeriodFilters } from '../features/media/components/MediaPeriodFilters';
import { MediaConsumerAlignment } from '../features/media/components/MediaConsumerAlignment';
import { OverviewCards } from '../features/media/components/OverviewCards';
import { PlatformComparisonTable } from '../features/media/components/PlatformComparisonTable';
import { useBrands, useOverview, usePeriods, usePlatforms, useSegments } from '../features/media/hooks/use-media-data';
import { formatNumber } from '../features/media/utils/formatters';
import { CompetitionDropdown, ContextualCompetitionPanel, useContextualCompetition } from '../features/competition/components/ContextualCompetition';
import { TblReadsStrip } from '../features/reads/TblReadsStrip';
import '../styles/reference-media.css';
import '../styles/media-ceo.css';
// Import last so nested Competition and filter styles cannot restore the old blue theme.
import '../styles/media-palette.css';

export function MediaDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const periods = usePeriods();
  const filter = useMemo<MediaFilter>(() => ({
    year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
    month: searchParams.get('month') ? Number(searchParams.get('month')) : undefined,
    segment: parseSelections(searchParams.get('segment')),
    brand: parseSelections(searchParams.get('brand')),
  }), [searchParams]);
  const periodFilter = useMemo<MediaFilter>(() => ({
    year: filter.year,
    month: filter.month,
  }), [filter.year, filter.month]);
  const segmentData = useSegments(periodFilter);
  const brandFilter = useMemo<MediaFilter>(() => ({
    ...periodFilter,
    segment: filter.segment,
  }), [periodFilter, filter.segment]);
  const brandData = useBrands(brandFilter);
  const segments = useMemo(() => segmentData.data?.segments ?? [], [segmentData.data]);
  const brands = useMemo(() => brandData.data?.brands ?? [], [brandData.data]);
  const competitionContext = useContextualCompetition('rivoli-shop', filter.year, filter.month, searchParams.get('competition') || 'edit-by-ahmed-seddiqi');

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
  const onFilterChange = (year?: number, month?: number) => {
    setSearchParams(toSearchParams({ year, month }));
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
      <h2>Media Performance <span className="reference-badge media-coverage-badge">PARTIAL SOURCE COVERAGE</span> <span className="media-depth-badge">Data depth: Partial</span></h2>
      <div className="reference-media-controls"><div className="reference-media-toolbar">{periods.data ? <MediaPeriodFilters
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
      /> : <LoadingSkeleton rows={2} />}<CompetitionDropdown context={competitionContext} /></div>
      {filter.segment?.length || filter.brand?.length ? <div className="media-filter-selection-summary" aria-live="polite">
        {filter.segment?.length ? <div><strong>Segment:</strong> {filter.segment.map(displayFilterLabel).join(', ')}</div> : null}
        {filter.brand?.length ? <div><strong>Brand:</strong> {filter.brand.map(displayFilterLabel).join(', ')}</div> : null}
      </div> : null}</div>
    </div>
    <TblReadsStrip client="Rivoli" section="Media" year={filter.year} month={filter.month ?? 0} />
    <div className="media-ceo-slot" aria-label="Slot 1: What went in, what came out">
      <div className="media-ceo-slot-header"><span>01</span><h3>What went in, what came out</h3></div>
      <MediaConsumerAlignment year={filter.year} overview={overview.data} scopedSelection={Boolean(filter.segment?.length || filter.brand?.length)} />
      {overview.data ? <AttributionNote data={overview.data}/> : null}
    </div>
    <div className="media-ceo-slot" aria-label="Slot 2: What a customer costs">
      <div className="media-ceo-slot-header"><span>02</span><h3>What a customer costs</h3></div>
      {overview.isLoading ? <LoadingSkeleton rows={3} /> : overview.isError ? <ErrorState/> : overview.data ? <OverviewCards data={overview.data}/> : <EmptyState/>}
      {platforms.isLoading ? <div className="reference-card reference-mt"><LoadingSkeleton /></div> : platforms.isError ? <ErrorState/> : platforms.data ? <PlatformComparisonTable data={platforms.data}/> : null}
      <p className="media-ceo-source-note">Google interaction rate and Meta link CTR are separate definitions. No cross-platform rate is combined or used as ROAS.</p>
    </div>
    <div className="media-ceo-slot" aria-label="Slot 3: Where traffic and money come from">
      <div className="media-ceo-slot-header"><span>03</span><h3>Where traffic and money come from</h3></div>
      <section className="reference-card media-awaiting"><h3>GA4 channel revenue · AWAITING APPROVED IMPORT</h3>
        <p>The required Rivoli-Consumer-GA4-Import-v4.xlsx (September and October, 17-channel reconciliation) is not present. Paid vs organic sessions and revenue, Unassigned refunds, and AI Assistant traffic are n/a until the approved workbook arrives.</p>
        <p><b>Data owner:</b> GA4 team. Existing Consumer data and Media spending are not substituted for channel revenue.</p>
      </section>
    </div>
    <div className="media-ceo-slot" aria-label="Slot 4: What worked, what to stop">
      <div className="media-ceo-slot-header"><span>04</span><h3>What worked, what to stop</h3></div>
      <CampaignSection filter={filter}/>
    </div>
    <div className="media-ceo-slot" aria-label="Slot 5: The competition">
      <div className="media-ceo-slot-header"><span>05</span><h3>The competition</h3></div>
      <ContextualCompetitionPanel context={competitionContext} view="media" />
    </div>
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

function AttributionNote({ data }: { data: Overview }) {
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

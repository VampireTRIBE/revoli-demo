import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { MediaFilter, Overview } from '../types/media';
import { CampaignSection } from '../features/media/components/CampaignSection';
import { EmptyState, ErrorState } from '../features/media/components/StateCard';
import { LoadingSkeleton } from '../features/media/components/LoadingSkeleton';
import { MediaPeriodFilters } from '../features/media/components/MediaPeriodFilters';
import { OverviewCards } from '../features/media/components/OverviewCards';
import { PlatformComparisonTable } from '../features/media/components/PlatformComparisonTable';
import { useBrands, useOverview, usePeriods, usePlatforms, useSegments } from '../features/media/hooks/use-media-data';
import { formatNumber } from '../features/media/utils/formatters';
import { CompetitionDropdown, ContextualCompetitionPanel, useContextualCompetition } from '../features/competition/components/ContextualCompetition';
import '../styles/reference-media.css';

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
  const competitionContext = useContextualCompetition('rivoli-shop', filter.year, filter.month, searchParams.get('competition') || undefined);

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
      <h2>Media Performance <span className="reference-badge live">IMPORTED &middot; META + GOOGLE ADS</span></h2>
      <div className="reference-media-toolbar">{periods.data ? <MediaPeriodFilters
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
    </div>
    {filter.segment?.length || filter.brand?.length ? <div className="media-filter-selection-summary" aria-live="polite">
      {filter.segment?.length ? <div><strong>Segment:</strong> {filter.segment.map(displayFilterLabel).join(', ')}</div> : null}
      {filter.brand?.length ? <div><strong>Brand:</strong> {filter.brand.map(displayFilterLabel).join(', ')}</div> : null}
    </div> : null}
    <ContextualCompetitionPanel context={competitionContext} view="media" />

    {overview.isLoading ? <div className="reference-media-grid four">{Array.from({ length: 4 }, (_, index) => <div className="reference-card" key={index}><LoadingSkeleton rows={3} /></div>)}</div> : overview.isError ? <ErrorState /> : overview.data ? <OverviewCards data={overview.data} /> : <EmptyState />}
    {platforms.isLoading ? <div className="reference-card reference-mt"><LoadingSkeleton /></div> : platforms.isError ? <ErrorState /> : platforms.data ? <PlatformComparisonTable data={platforms.data} /> : null}
    <CampaignSection filter={filter} />
    {overview.data ? <AttributionNote data={overview.data} /> : null}
    {overview.data ? <ScoreMethod data={overview.data} /> : null}
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
  const metrics = data.metrics;
  const comparison = metrics.platformClaims.value != null && metrics.platformClaims.value > metrics.sitePurchases
    ? 'exceed'
    : 'do not equal';

  return <div className="reference-note reference-mt">
    <b>Attribution caveat:</b> platform-reported conversions ({formatNumber(metrics.platformClaims.value)}) {comparison} actual site purchases ({formatNumber(metrics.sitePurchases)}) in the selected window &mdash; platforms may claim overlapping credit. Revenue coverage uses site revenue divided by advertising spend and is not platform ROAS. Campaign and platform ROAS remain N/A when matching conversion value is not supplied. &quot;iCAC&quot; (incremental CAC) requires geo-holdout or spend-pause testing and remains a phase-2 item.
    {data.metadata.warnings.length ? <><br /><b>Source check:</b> {data.metadata.warnings.length} workbook control difference{data.metadata.warnings.length === 1 ? '' : 's'} detected. Values remain calculated from the detailed monthly sheets.</> : null}
  </div>;
}

function ScoreMethod({ data }: { data: Overview }) {
  return <details className="reference-method" open>
    <summary>How this score is computed</summary>
    <p><b>{data.metrics.scoreLabel}</b></p>
    <p>No numeric Media score, benchmark bar, or performance colour is produced until signed baselines are supplied. Valid underlying metrics remain visible and do not feed an overall score.</p>
  </details>;
}

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
import { formatNumber, formatPercent, formatRatio } from '../features/media/utils/formatters';
import { CompetitionDropdown, ContextualCompetitionPanel, useContextualCompetition } from '../features/competition/components/ContextualCompetition';
import '../styles/reference-media.css';

export function MediaDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const periods = usePeriods();
  const filter = useMemo<MediaFilter>(() => ({
    year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
    month: searchParams.get('month') ? Number(searchParams.get('month')) : undefined,
    segment: searchParams.get('segment') || undefined,
    brand: searchParams.get('brand') || undefined,
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
    if (!filter.segment || segmentData.isLoading || !segmentData.data || segments.some((row) => row.label === filter.segment)) return;
    setSearchParams(toSearchParams({ ...filter, segment: undefined, brand: undefined }), { replace: true });
  }, [filter, segmentData.data, segmentData.isLoading, segments, setSearchParams]);

  useEffect(() => {
    if (!filter.brand || brandData.isLoading || !brandData.data || brands.some((row) => row.label === filter.brand)) return;
    setSearchParams(toSearchParams({ ...filter, brand: undefined }), { replace: true });
  }, [brandData.data, brandData.isLoading, brands, filter, setSearchParams]);

  const overview = useOverview(filter);
  const platforms = usePlatforms(filter);
  const onFilterChange = (year?: number, month?: number) => {
    setSearchParams(toSearchParams({ year, month }));
  };
  const onSegmentChange = (segment?: string) => {
    setSearchParams(toSearchParams({ year: filter.year, month: filter.month, segment }));
  };
  const onBrandChange = (brand?: string) => {
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
  if (filter.segment) next.set('segment', filter.segment);
  if (filter.brand) next.set('brand', filter.brand);
  return next;
}

function AttributionNote({ data }: { data: Overview }) {
  const metrics = data.metrics;
  const comparison = metrics.platformClaims.value != null && metrics.platformClaims.value > metrics.sitePurchases
    ? 'exceed'
    : 'do not equal';

  return <div className="reference-note reference-mt">
    <b>Attribution caveat:</b> platform-reported conversions ({formatNumber(metrics.platformClaims.value)}) {comparison} actual site purchases ({formatNumber(metrics.sitePurchases)}) in the selected window &mdash; platforms may claim overlapping credit. Treat platform performance as directional. Campaign ROAS is the mapped brand/segment revenue-coverage return, not campaign-attributed revenue, so campaigns in the same group can share a value. &quot;iCAC&quot; (incremental CAC) requires geo-holdout or spend-pause testing and remains a phase-2 item.
    {data.metadata.warnings.length ? <><br /><b>Source check:</b> {data.metadata.warnings.length} workbook control difference{data.metadata.warnings.length === 1 ? '' : 's'} detected. Values remain calculated from the detailed monthly sheets.</> : null}
  </div>;
}

function ScoreMethod({ data }: { data: Overview }) {
  const metrics = data.metrics;

  return <details className="reference-method" open>
    <summary>How this score is computed</summary>
    <div className="reference-table-wrap reference-mobile-table reference-score-table">
      <table>
        <thead><tr><th>Metric</th><th className="num">Value</th><th className="num">Benchmark (0 &rarr; 100)</th><th className="num">Weight</th><th className="num">Score</th></tr></thead>
        <tbody>
          <tr><td>Blended ROAS</td><td className="num">{formatRatio(metrics.directionalReturn.value)}</td><td className="num">1.00x &rarr; 4.00x</td><td className="num">40%</td><td className={`num reference-method-score ${scoreTone(metrics.directionalReturn.benchmarkScore)}`}>{metrics.directionalReturn.benchmarkScore ?? 'N/A'}</td></tr>
          <tr><td>CAC &divide; AOV</td><td className="num">{formatPercent(metrics.cacAovRatio.value, 0)}</td><td className="num">100% &rarr; 30%</td><td className="num">30%</td><td className={`num reference-method-score ${scoreTone(metrics.cacAovRatio.benchmarkScore)}`}>{metrics.cacAovRatio.benchmarkScore ?? 'N/A'}</td></tr>
          <tr><td>Blended CTR</td><td className="num">{formatPercent(metrics.blendedCtr.value, 2)}</td><td className="num">0.50% &rarr; 2.00%</td><td className="num">30%</td><td className={`num reference-method-score ${scoreTone(metrics.blendedCtr.benchmarkScore)}`}>{metrics.blendedCtr.benchmarkScore ?? 'N/A'}</td></tr>
        </tbody>
      </table>
    </div>
    <p>Score is linear between the two anchors, clamped 0&ndash;100. Anchors follow published e-commerce / Core Web Vitals benchmarks.</p>
  </details>;
}

function scoreTone(score?: number | null): string {
  if (score == null || score < 50) return 'bad';
  return score >= 70 ? 'good' : 'warn';
}

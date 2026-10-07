import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CreativeFilters } from '../features/creative/components/CreativeFilters';
import { CreativeGallery } from '../features/creative/components/CreativeGallery';
import { CreativeMetricCard } from '../features/creative/components/CreativeMetricCard';
import { PaidCreativeGallery } from '../features/creative/components/PaidCreativeGallery';
import { UnavailableCreativeSection } from '../features/creative/components/UnavailableCreativeSection';
import { useCreativeDashboard, useCreativeOptions } from '../features/creative/hooks/use-creative-data';
import { CompetitionDropdown, ContextualCompetitionPanel, useContextualCompetition } from '../features/competition/components/ContextualCompetition';
import type { CreativeDashboard } from '../types/creative';
import '../styles/reference-creative.css';

type MainTab = 'organic' | 'paid';

export function CreativeDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const options = useCreativeOptions();
  const [mainTab, setMainTab] = useState<MainTab>('organic');
  const filter = useMemo(() => ({
    year: numberParam(searchParams.get('year')),
    month: numberParam(searchParams.get('month')),
    brand: searchParams.get('brand') || undefined,
  }), [searchParams]);
  const competitionContext = useContextualCompetition(creativeCompetitionClient(filter.brand), filter.year, filter.month, searchParams.get('competition') || undefined);

  useEffect(() => {
    const defaults = options.data?.defaultSelection;
    if (!defaults || (filter.year && filter.month !== undefined && filter.brand)) return;
    setSearchParams({ year: String(defaults.year), month: String(defaults.month), brand: defaults.brand }, { replace: true });
  }, [filter.brand, filter.month, filter.year, options.data, setSearchParams]);

  const dashboard = useCreativeDashboard(filter);
  const onFilterChange = (next: { year?: number; month?: number; brand?: string }) => {
    const year = next.year ?? filter.year;
    const availableMonths = options.data?.years.find((entry) => entry.year === year)?.months ?? [];
    const month = next.month !== undefined && availableMonths.some((entry) => entry.month === next.month)
      ? next.month
      : availableMonths.filter((entry) => !entry.partial).at(-1)?.month ?? availableMonths.at(-1)?.month;
    setSearchParams({ year: String(year ?? ''), month: String(month ?? ''), brand: next.brand ?? filter.brand ?? '' });
  };
  const onMainTabChange = (nextTab: MainTab) => {
    setMainTab(nextTab);
    const current = dashboard.data;
    if (!options.data || !current) return;
    if (nextTab === 'paid' && !current.paid.meta.available) {
      const paidBrand = options.data.brands.find((entry) => entry.paidPostLevelAvailable);
      const paidYear = options.data.years.find((entry) => entry.months.some((month) => month.month === 0));
      if (paidBrand && paidYear) {
        setSearchParams({ year: String(paidYear.year), month: '0', brand: paidBrand.id });
      }
    }
    if (nextTab === 'organic' && !current.organic.available && !current.accountLevel.available) {
      const organicBrand = options.data.brands.find((entry) => entry.postLevelAvailable);
      const defaults = options.data.defaultSelection;
      if (organicBrand && defaults) {
        setSearchParams({ year: String(defaults.year), month: String(defaults.month), brand: organicBrand.id });
      }
    }
  };

  if (options.isError) return <section className="creative-page"><div className="creative-error">Creative source options could not be loaded. Confirm the API is running.</div></section>;

  return <section className="creative-page">
    <div className="creative-heading">
      <h2>Creative <span className="reference-badge live">UPLOADED DATA</span></h2>
      <div className="creative-toolbar">{options.data ? <CreativeFilters options={options.data} {...filter} onChange={onFilterChange} /> : <div className="creative-loading">Loading filters...</div>}<CompetitionDropdown context={competitionContext} /></div>
    </div>
    <ContextualCompetitionPanel context={competitionContext} view="creative" />
    {dashboard.isLoading || !dashboard.data ? <div className="creative-loading">Loading organic and paid creative performance...</div> : dashboard.isError ? <div className="creative-error">Creative data could not be loaded.</div> : <>
      <CreativeSummary data={dashboard.data} />
      <div className="creative-subtabs creative-main-tabs" role="tablist" aria-label="Creative data type">
        <button type="button" className={mainTab === 'organic' ? 'active' : ''} onClick={() => onMainTabChange('organic')}>Organic ({dashboard.data.brand.label})</button>
        <button type="button" className={mainTab === 'paid' ? 'active' : ''} onClick={() => onMainTabChange('paid')}>Paid (Meta + Google)</button>
      </div>
      {mainTab === 'organic' ? <OrganicPanel data={dashboard.data} /> : <PaidPanel data={dashboard.data} />}
      <OverallMethod data={dashboard.data} />
    </>}
  </section>;
}

function CreativeSummary({ data }: { data: CreativeDashboard }) {
  return <>
    <div className="creative-verdict"><b>Two buckets, one lens.</b> Creative is organised into Organic and Paid views. Each bucket uses only the selected Brand&apos;s compatible source records. Missing components remain N/A and are never replaced with data from another account.</div>
    <div className="creative-grid two creative-mt">
      <div className="creative-summary-cell organic"><div className="title">Organic + boosted combined &middot; {data.brand.label}</div><div className="score">Provisional</div><div className="detail">Instagram posts published in {data.periodLabel}{data.partial ? ' (partial)' : ''} &middot; no composite score</div></div>
      <div className="creative-summary-cell paid"><div className="title">Paid &middot; {data.brand.label}</div><div className="score">N/A</div><div className="detail">{data.paid.meta.available ? `${data.paid.meta.detailRecordCount} detailed Meta records · incomplete score` : 'Meta score · Google shown separately'}</div></div>
    </div>
  </>;
}

function OrganicPanel({ data }: { data: CreativeDashboard }) {
  if (!data.organic.available) return <>
    <div className="creative-note accent"><b>Account-level source data.</b> {data.brand.label} supplies daily account observations and whole-export summaries for {data.periodLabel}. These values do not create post records, post rankings, or a Creative score.</div>
    {data.accountLevel.available ? <AccountLevelSection data={data} /> : <div className="creative-error">{data.accountLevel.message ?? data.organic.availabilityMessage}</div>}
    <div className="creative-note creative-mt"><b>Post-level limitation:</b> {data.organic.availabilityMessage}</div>
    <div className="creative-grid three creative-mt">
      <CreativeMetricCard label="Organic creative score" value="N/A" detail="Post-level score inputs are not available." unavailable />
      <CreativeMetricCard label="Attention · 50%" value="N/A" detail="Compatible post reach, views, and watch time are not available." unavailable />
      <CreativeMetricCard label="Active engagement · 50%" value="N/A" detail="Account content interactions are not Shares + Saves + Comments by post." unavailable />
    </div>
    <UnavailableCreativeSection title="Posts, ranked by active engagement rate" message="Data not available. The supplied Souq files contain account-level daily metrics, not individual posts, captions, links, or images." />
    <details className="creative-method"><summary>How the organic score is computed</summary><p>N/A for this Brand. The existing post-level formula is unchanged and is not run against account summaries, daily Reach, Viewers, or total content interactions.</p></details>
  </>;
  const scoringDisabled = data.scoringMode === 'disabled';
  return <>
    <div className="creative-note accent"><b>{data.organic.label}.</b> The exports do not establish a clean organic/paid split. Results describe Posts and Reels published during {data.periodLabel}{data.partial ? ', an incomplete source period' : ''}; they do not claim every engagement occurred during that month.</div>
    <div className="creative-paid-source-grid creative-mt" aria-label="Available organic source metrics">
      <CreativeSourceMetric label="Eligible posts" value={formatNumber(data.organic.eligiblePostCount)} detail="Posts and Reels with positive reach" />
      <CreativeSourceMetric label="Summed post reach" value={formatNumber(data.organic.summedPostReach)} detail="Not unique monthly audience" />
      <CreativeSourceMetric label="Post views" value={formatNumber(data.organic.totalViews)} detail="Matching eligible records" />
      <CreativeSourceMetric label="Active actions" value={formatNumber(data.organic.activeActions)} detail="Shares + saves + comments" />
      <CreativeSourceMetric label="Frequency" value={formatRatio(data.organic.frequency)} detail="Views / matching post reach" />
      <CreativeSourceMetric label="Active engagement" value={formatPercent(data.organic.activeEngagementRate, 2)} detail="Actions / matching post reach" />
      <CreativeSourceMetric label="Reel watch-time coverage" value={`${data.organic.watchTimeCoverage.populatedReels} / ${data.organic.watchTimeCoverage.totalReels}`} detail="Populated Reels / eligible Reels" />
    </div>
    <div className="creative-grid three creative-mt">
      <CreativeMetricCard label="Organic creative score" value="Provisional" detail={`Composite score removed. ${data.organic.eligiblePostCount} posts · ${data.periodLabel}; component cards remain for reference.`} />
      <CreativeMetricCard label="Attention · 50%" value={scoringDisabled ? 'Score not available' : String(data.organic.score.attention ?? 'N/A')} detail={`${formatRatio(data.organic.frequency)} views ÷ reach · watch time ${data.organic.watchTimeCoverage.populatedReels}/${data.organic.watchTimeCoverage.totalReels} reels`} score={data.organic.score.attention} unavailable={scoringDisabled} />
      <CreativeMetricCard label="Active engagement · 50%" value={scoringDisabled ? 'Score not available' : String(data.organic.score.activeEngagement ?? 'N/A')} detail={`${formatPercent(data.organic.activeEngagementRate, 2)} of summed post reach · shares+saves+comments`} score={data.organic.score.activeEngagement} unavailable={scoringDisabled} />
    </div>
    <PreparedCreativeInsights data={data} />
    <div className="creative-card creative-mt"><div className="creative-section-heading"><h3>Posts, ranked by active engagement rate</h3><span>Ranking floor: reach &ge; 500</span></div><CreativeGallery posts={data.organic.posts} /></div>
    <details className="creative-method">
      <summary>How the organic score is computed</summary>
      <div className="creative-table-wrap"><table><thead><tr><th>Component</th><th className="num">Value</th><th className="num">Benchmark (0 → 100)</th><th className="num">Weight</th><th className="num">Score</th></tr></thead><tbody>
        <tr><td>Attention — views ÷ reach (images and reel fallback) or reel average watch time, reach-weighted</td><td className="num">{formatRatio(data.organic.frequency)} frequency</td><td className="num">1.00x → 2.00x · 2.0s → 8.0s</td><td className="num">50%</td><td className="num method-score">{data.organic.score.attention ?? 'N/A'}</td></tr>
        <tr><td>Active engagement — (shares+saves+comments) ÷ summed post reach</td><td className="num">{formatPercent(data.organic.activeEngagementRate, 2)}</td><td className="num">0.50% → 5.00%</td><td className="num">50%</td><td className="num method-score">{data.organic.score.activeEngagement ?? 'N/A'}</td></tr>
      </tbody></table></div>
      <p>The single Organic Creative score has been removed. The Attention and Active engagement cards remain provisional reference components. Likes are passive and excluded. Posts with zero or missing reach are excluded from reach-based calculations. Rankings include only records marked eligible in the supplied workbook (reach &ge; 500). Only {data.organic.watchTimeCoverage.populatedReels} of {data.organic.watchTimeCoverage.totalReels} Reels have watch time; the HTML reference frequency fallback is used for other Reels only when reference scoring is enabled.</p>
    </details>
  </>;
}

function PreparedCreativeInsights({ data }: { data: CreativeDashboard }) {
  const insights = data.organic.preparedInsights;
  if (!insights.available || !insights.typical || !insights.best) {
    return <UnavailableCreativeSection title="Typical post, Best and Why it worked" message={insights.message ?? 'Data not available.'} />;
  }
  const typical = insights.typical;
  const best = insights.best;
  const trend = insights.trend.map((row) => ({
    month: new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(row.year, row.month - 1, 1))),
    engagement: row.medianActiveEngagementRate * 100,
    frequency: row.medianFrequency,
  }));
  return <>
    <div className="creative-grid two creative-mt" aria-label="Typical and best post comparison">
      <article className="creative-card creative-typical-best">
        <span>Typical post</span><strong>{formatPercent(typical.medianActiveEngagementRate, 2)}</strong>
        <small>Monthly median active engagement · {formatRatio(typical.medianFrequency)} median frequency</small>
      </article>
      <article className="creative-card creative-typical-best best">
        <span>Best</span><strong>{formatPercent(best.activeEngagementRate, 2)}</strong>
        <small>Rank {best.rank} monthly top post · {formatRatio(best.frequency)} frequency · {formatNumber(best.reach)} reach</small>
      </article>
    </div>
    <section className="creative-card creative-mt creative-why-section">
      <div className="creative-section-heading"><div><h3>Why it worked</h3><p>Prepared monthly Top 3 from the supplied Union Coop workbook.</p></div><span>{data.periodLabel}</span></div>
      <div className="creative-table-wrap"><table><thead><tr><th>Rank</th><th>Post</th><th>Format/type</th><th>Language</th><th>Day</th><th>Time slot</th><th>Giveaway</th><th className="num">Reach</th><th className="num">Active engagement</th><th className="num">Frequency</th></tr></thead><tbody>
        {insights.topPosts.map((post) => <tr key={post.postId}>
          <td>#{post.rank}</td>
          <td>{post.postUrl ? <a href={post.postUrl} target="_blank" rel="noopener noreferrer">{compactLabel(post.caption ?? post.postId)}</a> : compactLabel(post.caption ?? post.postId)}</td>
          <td>{post.postType}</td><td>{post.language}</td><td>{post.day}</td><td>{post.timeSlot}</td>
          <td>{post.giveaway ? <span className="creative-giveaway-inline">Giveaway</span> : '—'}</td>
          <td className="num">{formatNumber(post.reach)}</td><td className="num">{formatPercent(post.activeEngagementRate, 2)}</td><td className="num">{formatRatio(post.frequency)}</td>
        </tr>)}
      </tbody></table></div>
      <p className="creative-source-note">Values, ranks, factors, and Giveaway flags are displayed directly from {insights.sourceFile}. {insights.unmatchedPostIds.length ? `${insights.unmatchedPostIds.length} Top 3 Post ID(s) did not match a verified source link or image.` : 'All selected Top 3 Post IDs matched the verified post export.'}</p>
    </section>
    <section className="creative-card creative-mt creative-trend-section">
      <div className="creative-section-heading"><div><h3>Monthly trends</h3><p>Prepared monthly medians; missing months are not interpolated.</p></div><span>Active engagement % and frequency x</span></div>
      <div className="creative-trend-chart" role="img" aria-label="Monthly median active engagement and median frequency">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trend} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="month" stroke="var(--muted)" />
            <YAxis yAxisId="engagement" tickFormatter={(value) => `${value}%`} stroke="var(--blue)" />
            <YAxis yAxisId="frequency" orientation="right" tickFormatter={(value) => `${value}x`} stroke="var(--teal)" />
            <Tooltip formatter={(value, name) => name === 'Median active engagement' ? `${Number(value).toFixed(2)}%` : `${Number(value).toFixed(2)}x`} />
            <Legend />
            <Line yAxisId="engagement" type="monotone" dataKey="engagement" name="Median active engagement" stroke="var(--blue)" strokeWidth={3} dot={{ r: 3 }} />
            <Line yAxisId="frequency" type="monotone" dataKey="frequency" name="Median frequency" stroke="var(--teal)" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="creative-trend-foot"><span>{typical.giveawayPosts} Giveaway post{typical.giveawayPosts === 1 ? '' : 's'} in {data.periodLabel}</span><span>{formatPercent(typical.giveawayActionShare, 2)} of monthly actions from Giveaway posts</span></div>
    </section>
  </>;
}

function PaidPanel({ data }: { data: CreativeDashboard }) {
  return <>
    <div className="creative-subtabs" role="tablist" aria-label="Paid Creative platform">
      <button type="button" className="active" role="tab" aria-selected="true">Meta ads</button>
    </div>
    {data.paid.meta.available ? <MetaPaid data={data} /> : <MetaUnavailable message={data.paid.meta.message} />}
  </>;
}

function AccountLevelSection({ data }: { data: CreativeDashboard }) {
  return <section className="creative-card creative-account-section creative-mt">
    <div className="creative-account-heading"><div><h3>Account-level Creative support</h3><p>Daily metrics are filtered by the selected period. Reach and Viewers use daily average and peak rather than a summed audience.</p></div><span>{data.brand.label}</span></div>
    <div className="creative-paid-source-grid">
      {data.accountLevel.dailyMetrics.map((metric) => <CreativeSourceMetric
        key={`${metric.platform}:${metric.metric}`}
        label={`${displayPlatform(metric.platform)} · ${metric.label}`}
        value={formatAccountMetric(metric.value, metric.aggregation)}
        detail={metric.aggregation === 'daily-average-and-peak'
          ? `Peak ${formatNumber(metric.peak)} · ${metric.observedDays} observed days`
          : `${metric.observedDays} observed days · ${formatShortDate(metric.periodStart)} to ${formatShortDate(metric.periodEnd)}`}
      />)}
      {!data.accountLevel.dailyMetrics.length ? <div className="creative-account-empty">No daily account observations exist for this selected month.</div> : null}
    </div>
    {data.accountLevel.wholePeriodSummaries.length ? <details className="creative-method creative-account-summaries">
      <summary>Whole-export format and audience summaries</summary>
      <p>These tables are not filtered by Month because their source files contain no monthly breakdown or reporting date.</p>
      <div className="creative-account-summary-grid">{data.accountLevel.wholePeriodSummaries.map((section) => <article key={`${section.sourceFile}:${section.title}`}>
        <div><h4>{displayPlatform(section.platform)} · {section.title}</h4><small>{section.reportingScope}</small></div>
        <div className="creative-table-wrap"><table><thead><tr><th>Label</th>{section.columns.map((column) => <th className="num" key={column}>{column}</th>)}</tr></thead><tbody>
          {section.rows.map((row) => <tr key={row.label}><td>{row.label}</td>{row.values.map((value, index) => <td className="num" key={`${row.label}:${section.columns[index] ?? index}`}>{formatSummaryValue(value, section.title)}</td>)}</tr>)}
        </tbody></table></div>
      </article>)}</div>
    </details> : null}
  </section>;
}

function MetaPaid({ data }: { data: CreativeDashboard }) {
  const paid = data.paid.meta;
  const account = paid.accountSummary;
  const scoringDisabled = data.scoringMode === 'disabled';
  return <>
    <div className="creative-note accent"><b>Paid Meta subset for {data.brand.label}.</b> {paid.coverageLabel}. Metrics cover {paid.reportingPeriodLabel}; they are not assigned to the posts&apos; publication month. {paid.audit.identityRule}</div>
    <div className="creative-paid-source-grid creative-mt" aria-label="Available paid source metrics">
      <CreativeSourceMetric label="Paid posts" value={formatNumber(account.paidPostCount)} detail={`${paid.detailRecordCount} have ad-level detail`} />
      <CreativeSourceMetric label="Paid spend" value={formatAed(paid.totalSpendAed)} detail={`${paid.detailRecordCount}-record detail subset`} />
      <CreativeSourceMetric label="Paid clicks" value={formatNumber(paid.totalPaidClicks)} detail={`${paid.detailRecordCount}-record detail subset`} />
      <CreativeSourceMetric label="Account paid impressions" value={formatNumber(account.paidImpressions)} detail="12-post account summary" />
      <CreativeSourceMetric label="Account paid reach" value={formatNumber(account.paidReach)} detail="12-post account summary" />
      <CreativeSourceMetric label="Paid frequency" value={formatRatio(account.frequency)} detail="Account impressions / account reach" />
      <CreativeSourceMetric label="Paid likes" value={formatNumber(account.paidLikes)} detail="Passive; excluded from earned actions" />
      <CreativeSourceMetric label="Paid comments" value={formatNumber(account.paidComments)} detail="Account summary; shares and saves missing" />
      <CreativeSourceMetric label="Average paid likes / post" value={formatNumber(account.averageLikesPerPaidPost)} detail="Supplied average-performance value" />
      <CreativeSourceMetric label="Average paid comments / post" value={formatNumber(account.averageCommentsPerPaidPost)} detail="Supplied average-performance value" />
      <CreativeSourceMetric label="Measured comment rate" value={formatPercent(account.measuredCommentRate, 4)} detail="Comments / account paid reach" />
      <CreativeSourceMetric label="Source engagement rate" value={formatSourcePercent(account.suppliedEngagementRatePercent)} detail="Supplied column; definition not provided" />
    </div>
    {account.paidReachConflict ? <div className="creative-note creative-mt"><b>Paid reach source check.</b> The selected posts-summary row reports {formatNumber(account.paidReach)}, while performance-statistics reports {formatNumber(account.performancePaidReachControl)}. The dashboard keeps posts-summary as the configured basis and does not combine the conflicting totals or choose the larger value.</div> : null}
    <div className="creative-grid four creative-mt">
      <CreativeMetricCard label="Paid creative score" value="N/A" detail="Paid earned actions are missing, so the complete score cannot be calculated." unavailable />
      <CreativeMetricCard
        label="Attention · 50%"
        value={scoringDisabled ? 'Score not available' : String(paid.score.attention ?? 'N/A')}
        detail={`CTR ${formatPercent(paid.paidCtr, 3)} · ${formatNumber(paid.totalPaidClicks)} paid clicks / ${formatNumber(paid.totalPaidImpressions)} impressions · ThruPlay N/A`}
        score={paid.score.attention}
        unavailable={scoringDisabled}
      />
      <CreativeMetricCard label="Active engagement · 50%" value="N/A" detail={`Measured comments / reach is ${formatPercent(account.measuredCommentRate, 4)}. Paid shares and saves are not supplied, so the complete earned-action rate cannot be calculated.`} unavailable />
      <CreativeMetricCard label="Earned actions" value="N/A" detail={`${formatNumber(account.paidComments)} paid comments are measured. Paid shares and saves are required but unavailable.`} unavailable />
    </div>
    <div className="creative-card creative-mt"><h3>Video creatives ranked by budget</h3><PaidCreativeGallery records={paid.videos} /></div>
    <div className="creative-card creative-mt"><h3>Static creatives ranked by budget</h3><PaidCreativeGallery records={paid.statics} /></div>
    <details className="creative-method">
      <summary>Full ad-level detail</summary>
      <div className="creative-table-wrap"><table className="creative-paid-table"><thead><tr><th>Post</th><th>Type</th><th className="num">Spend</th><th className="num">CTR</th><th className="num">Paid clicks</th><th className="num">Paid impressions</th><th className="num">Paid reach</th><th className="num">Paid comments</th></tr></thead><tbody>
        {paid.records.map((record) => <tr key={record.postId}><td title={record.caption ?? record.postId}>{compactLabel(record.caption ?? record.postId)}</td><td>{record.postType}</td><td className="num">{formatAed(record.spendAed)}</td><td className="num">{formatPercent(record.paidClicks != null && record.paidImpressions ? record.paidClicks / record.paidImpressions : null, 3)}</td><td className="num">{formatNumber(record.paidClicks)}</td><td className="num">{formatNumber(record.paidImpressions)}</td><td className="num">{formatNumber(record.paidReach)}</td><td className="num">{formatNumber(record.paidComments)}</td></tr>)}
      </tbody></table></div>
      <p>This table contains {paid.detailRecordCount} records while the supplied summary reports {paid.accountPaidPostCount ?? 'N/A'} paid posts. It is a partial detail extract and is not extrapolated.</p>
    </details>
    <details className="creative-method">
      <summary>How the paid score is computed</summary>
      <div className="creative-table-wrap"><table><thead><tr><th>Component</th><th className="num">Value</th><th className="num">Benchmark (0 → 100)</th><th className="num">Weight</th><th className="num">Score</th></tr></thead><tbody>
        <tr><td>Attention after exposure — paid CTR, with the reference CTR-only fallback because ThruPlay is unavailable</td><td className="num">{formatPercent(paid.paidCtr, 3)}</td><td className="num">0.50% → 2.50%</td><td className="num">50%</td><td className="num method-score">{paid.score.attention ?? 'N/A'}</td></tr>
        <tr><td>Active engagement — earned shares+saves+comments ÷ paid reach</td><td className="num">N/A</td><td className="num">0.02% → 0.20%</td><td className="num">50%</td><td className="num method-score">N/A</td></tr>
      </tbody></table></div>
      <p>Paid CTR uses matching detail totals: {formatNumber(paid.totalPaidClicks)} paid clicks ÷ {formatNumber(paid.totalPaidImpressions)} paid impressions = {formatPercent(paid.paidCtr, 3)}. The account summary separately supplies {formatNumber(account.paidImpressions)} impressions, {formatNumber(account.paidReach)} reach, {formatNumber(account.paidLikes)} likes, {formatNumber(account.paidComments)} comments, and a {formatSourcePercent(account.suppliedEngagementRatePercent)} engagement-rate column. Its definition is not supplied, so it is displayed but not substituted into the reference score. The complete Paid Creative score remains N/A because shares and saves are unavailable; the attention component is not reweighted.</p>
    </details>
  </>;
}

function CreativeSourceMetric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="creative-card creative-paid-source"><span>{label}</span><strong>{value}</strong>{detail ? <small>{detail}</small> : null}</div>;
}

function MetaUnavailable({ message }: { message: string }) {
  return <>
    <div className="creative-grid four">
      {['Paid creative score', 'Attention · 50%', 'Active engagement · 50%', 'Earned actions'].map((label) => <CreativeMetricCard key={label} label={label} value="Data not available" detail={message} unavailable />)}
    </div>
    <UnavailableCreativeSection title="Video creatives ranked by budget" message={message} />
    <UnavailableCreativeSection title="Static creatives ranked by budget" message={message} />
    <details className="creative-method"><summary>Full ad-level detail</summary><p>Data not available. No paid ad-level rows are present in the supplied files.</p></details>
    <details className="creative-method"><summary>How the paid score is computed</summary><p>Data not available. Paid methodology values remain blank until the required paid inputs exist.</p></details>
  </>;
}

function OverallMethod({ data }: { data: CreativeDashboard }) {
  return <details className="creative-method creative-overall-method">
    <summary>How this score is computed</summary>
    <p>The Creative vertical requires independently supported Organic and Paid scores. This dataset supports only Organic + boosted combined post performance, so the overall Creative score remains unavailable. Scoring mode is <b>{data.scoringMode}</b>.</p>
    <p><b>Organic source selection:</b> {data.sourceAudit.sourceSelectionRule} {data.sourceAudit.conflictingPostCount} Post IDs contain conflicting values and are reported without double-counting.</p>
    {data.paid.meta.available ? <p><b>Paid source coverage:</b> {data.paid.meta.coverageLabel}. Paid metrics are kept under {data.brand.label} and are not combined with another Brand or reporting grain.</p> : null}
  </details>;
}

function numberParam(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatPercent(value: number | null, digits: number): string {
  return value == null ? 'N/A' : `${(value * 100).toFixed(digits)}%`;
}

function formatSourcePercent(value: number | null): string {
  return value == null ? 'N/A' : `${value.toFixed(2)}%`;
}

function formatRatio(value: number | null): string {
  return value == null ? 'N/A' : `${value.toFixed(2)}x`;
}

function formatNumber(value: number | null): string {
  return value == null ? 'N/A' : value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatAed(value: number | null): string {
  return value == null ? 'N/A' : `AED ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAccountMetric(value: number | null, aggregation: 'sum' | 'daily-average-and-peak'): string {
  if (value == null) return 'N/A';
  return value.toLocaleString('en-US', { maximumFractionDigits: aggregation === 'daily-average-and-peak' ? 1 : 0 });
}

function formatSummaryValue(value: number | null, title: string): string {
  if (value == null) return 'N/A';
  const percentageSection = /audience|countries|cities|gender/i.test(title);
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })}${percentageSection ? '%' : ''}`;
}

function formatShortDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)) : 'N/A';
}

function displayPlatform(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function creativeCompetitionClient(brand?: string): string {
  if (brand === 'union-coop') return 'union-coop';
  if (brand === 'souq-al-bahar') return 'souq-al-bahar';
  if (brand === 'souq-al-jubair') return 'souq-al-jubair';
  return brand ?? 'union-coop';
}

function compactLabel(value: string): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > 46 ? `${clean.slice(0, 45)}…` : clean;
}

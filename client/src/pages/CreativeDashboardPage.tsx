import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CreativeFilters } from '../features/creative/components/CreativeFilters';
import { CreativeGalleryBands } from '../features/creative/components/CreativeGallery';
import { CreativeMetricCard } from '../features/creative/components/CreativeMetricCard';
import { PaidCreativeGallery } from '../features/creative/components/PaidCreativeGallery';
import { UnavailableCreativeSection } from '../features/creative/components/UnavailableCreativeSection';
import { useCreativeDashboard, useCreativeOptions } from '../features/creative/hooks/use-creative-data';
import { CompetitionDropdown, ContextualCompetitionPanel, useContextualCompetition } from '../features/competition/components/ContextualCompetition';
import { TblReadsStrip } from '../features/reads/TblReadsStrip';
import { CleoMarketPanel } from '../features/creative/cleo/CleoMarketPanel';
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
  const onMainTabChange = (nextTab: MainTab) => setMainTab(nextTab);

  if (options.isError) return <section className="creative-page"><div className="creative-error">Creative source options could not be loaded. Confirm the API is running.</div></section>;

  return <section className="creative-page">
    <div className="creative-heading">
      <h2>Creative <span className="reference-badge live">UPLOADED DATA</span></h2>
      <div className="creative-toolbar">{options.data ? <CreativeFilters options={options.data} {...filter} onChange={onFilterChange} /> : <div className="creative-loading">Loading filters...</div>}<CompetitionDropdown context={competitionContext} /></div>
    </div>
    <TblReadsStrip client={creativeReadsClient(filter.brand)} section="Creative" year={filter.year} month={filter.month} />
    {dashboard.isLoading || !dashboard.data ? <div className="creative-loading">Loading organic and paid creative performance...</div> : dashboard.isError ? <div className="creative-error">Creative data could not be loaded.</div> : <>
      <CreativeSummary data={dashboard.data} />
      <div className="creative-subtabs creative-main-tabs" role="tablist" aria-label="Creative data type">
        <button type="button" className={mainTab === 'organic' ? 'active' : ''} onClick={() => onMainTabChange('organic')}>Organic ({dashboard.data.brand.label})</button>
        <button type="button" className={mainTab === 'paid' ? 'active' : ''} onClick={() => onMainTabChange('paid')}>Paid (Meta + Google)</button>
      </div>
      {mainTab === 'organic' ? <OrganicPanel data={dashboard.data} /> : <PaidPanel data={dashboard.data} />}
      <OverallMethod data={dashboard.data} />
      <section className="creative-competition-strip creative-mt"><div className="creative-section-heading"><h3>Competition · Meta Ad Library</h3><span>Activity, not spend</span></div>
        {!competitionContext.selectedCompetitor ? <p>Choose an approved competitor from the Competition selector above. If its capture is absent, no competitor measurements are shown.</p> : null}
        <ContextualCompetitionPanel context={competitionContext} view="creative" />
      </section>
      {dashboard.data.brand.id === 'union-coop' ? <CleoMarketPanel /> : null}
    </>}
  </section>;
}

function DataDepth({ data }: { data: CreativeDashboard }) {
  const brand = data.brand.id;
  const depth = brand === 'union-coop' ? 3 : brand === 'pocari-sweat' ? 2 : 1;
  const detail = ['souq-al-haraj', 'souq-al-jubail'].includes(brand)
    ? 'Awaiting the verified Souqs Creative Import v2 before per-post Level 2 can be claimed.'
    : undefined;
  return <span className="creative-depth" title={detail}>Data depth: Level {depth} of 3{detail ? ' · awaiting import' : ''}</span>;
}
function CreativeSummary({ data }: { data: CreativeDashboard }) {
  return <>
    <div className="creative-verdict"><b>Four slots. One verified source per metric.</b> Each page displays Output &amp; Effort, Attention, Engagement, and What worked and why. Missing imported values remain n/a with reasons. Nothing in Creative is scored before baselines are signed.</div>
    <div className="creative-summary-head creative-mt"><div><strong>{data.brand.label}</strong><span>{data.periodLabel}</span></div><DataDepth data={data} /></div>
    <div className="creative-note creative-mt">Unscored - baselines pending. Organic / boosted and Paid Meta measurements remain separate. {data.partial ? 'The selected source period is partial.' : ''}</div>
  </>;
}
function CreativeSlot({ number, title, subtitle, children }: { number: number; title: string; subtitle: string; children: ReactNode }) {
  return <section className="creative-slot creative-mt" aria-label={`Slot ${number}: ${title}`}>
    <header className="creative-slot-header"><span>0{number}</span><div><h3>{title}</h3><p>{subtitle}</p></div></header>
    {children}
  </section>;
}
function OrganicPanel({ data }: { data: CreativeDashboard }) {
  const [platform, setPlatform] = useState<'facebook' | 'instagram'>('facebook');
  const hasPosts = data.organic.available;
  const posts = data.organic.posts;
  const postCount = posts.filter((row) => row.postType.toLowerCase() === 'post').length;
  const reelCount = posts.filter((row) => row.postType.toLowerCase() === 'reel').length;
  const insights = data.organic.preparedInsights;
  const typical = insights.typical;
  const top3 = insights.topPosts.slice(0, 3);
  const giveaway = insights.cuts.find((row) => row.cut.toLowerCase() === 'giveaway' && row.value.toLowerCase() === 'giveaway');
  const nonGiveaway = insights.cuts.find((row) => row.cut.toLowerCase() === 'giveaway' && row.value.toLowerCase().includes('non'));
  const follows = insights.cuts.find((row) => row.cut.toLowerCase() === 'follows');
  const isSouq = data.brand.id.startsWith('souq-');
  const reason = isSouq
    ? 'AWAITING: The approved Souqs-Creative-Import.xlsx v2 is not supplied. Legacy account exports cannot be reassigned to the approved brand identities.'
    : data.brand.id === 'pocari-sweat'
      ? 'AWAITING: Full paid ad-level export and approved post-level Creative analysis (owner: TBL to confirm).'
      : (data.organic.availabilityMessage ?? 'No approved post-level import for this brand and period.');
  const rawReason = data.brand.id === 'union-coop' ? 'Not supplied by the prepared Union Coop workbook. Stories/output ratio cannot be verified.' : reason;
  return <>
    <CreativeSlot number={1} title="Output & Effort" subtitle="Published content and effort against measured return. Never estimate missing Stories.">
      <div className="creative-paid-source-grid">
        <CreativeSourceMetric label="Posts with eligible reach" value={hasPosts ? formatNumber(postCount) : 'n/a'} detail={hasPosts ? 'Eligible per-post records only; not an all-published total' : reason} />
        <CreativeSourceMetric label="Reels with eligible reach" value={hasPosts ? formatNumber(reelCount) : 'n/a'} detail={hasPosts ? 'Eligible per-post records only; not an all-published total' : reason} />
        <CreativeSourceMetric label="Stories published" value="n/a" detail={rawReason} />
        <CreativeSourceMetric label="Effort versus return" value="n/a" detail={rawReason} />
      </div>
    </CreativeSlot>
    <CreativeSlot number={2} title="Attention" subtitle="Reach, views, frequency and account-level trends. Platforms are never combined.">
      {hasPosts ? <>
        <div className="creative-paid-source-grid">
          <CreativeSourceMetric label="Summed post reach" value={formatNumber(data.organic.summedPostReach)} detail="Not unique monthly audience" />
          <CreativeSourceMetric label="Post views" value={formatNumber(data.organic.totalViews)} detail="Eligible source records" />
          <CreativeSourceMetric label="Frequency" value={formatRatio(data.organic.frequency)} detail={`${formatNumber(data.organic.totalViews)} views / ${formatNumber(data.organic.summedPostReach)} matching reach`} />
          <CreativeSourceMetric label="Watch-time coverage" value={`${data.organic.watchTimeCoverage.populatedReels} / ${data.organic.watchTimeCoverage.totalReels}`} detail="Reels with supplied watch time / eligible Reels" />
        </div>
        {follows?.posts != null ? <p className="creative-support">{formatNumber(follows.posts)} follows attributed to posts (supplied Creative Cuts).</p> : <p className="creative-support">Follows: n/a (no compatible imported follows cut for the selected period).</p>}
        <PreparedTrend data={data} metric="frequency" />
      </> : <>
        {data.accountLevel.available ? <><div className="creative-subtabs" role="group" aria-label="Account-level platform"><button type="button" className={platform === 'facebook' ? 'active' : ''} onClick={() => setPlatform('facebook')}>Facebook</button><button type="button" className={platform === 'instagram' ? 'active' : ''} onClick={() => setPlatform('instagram')}>Instagram</button></div><AccountLevelSection data={data} platform={platform} /></> : <div className="creative-awaiting">{reason}</div>}
        <p className="creative-support">Frequency: n/a. Account daily observations cannot be turned into per-post frequency.</p>
      </>}
    </CreativeSlot>
    <CreativeSlot number={3} title="Engagement, honestly" subtitle="Median versus best, earned versus rented engagement, and an action mix that is actually supplied.">
      {hasPosts ? <>
        <div className="creative-grid three">
          <CreativeSourceMetric label="Typical · median active engagement" value={typical ? formatPercent(typical.medianActiveEngagementRate, 2) : 'n/a'} detail={typical ? `${formatNumber(typical.eligiblePosts)} eligible posts · monthly prepared benchmark` : 'n/a (monthly prepared benchmark not supplied)'} />
          <CreativeSourceMetric label="Best · post engagement" value={top3[0] ? formatPercent(top3[0].activeEngagementRate, 2) : 'n/a'} detail={top3[0] ? `${formatNumber(top3[0].activeActions)} actions / ${formatNumber(top3[0].reach)} reach` : 'n/a (approved top-three for this month not supplied)'} />
          <CreativeSourceMetric label="Active engagement" value={formatPercent(data.organic.activeEngagementRate, 2)} detail={`${formatNumber(data.organic.activeActions)} actions / ${formatNumber(data.organic.summedPostReach)} matched reach`} />
        </div>
        <div className="creative-grid two creative-mt">
          <CreativeSourceMetric label="Earned vs rented · giveaway actions" value={giveaway?.shareOfTotalActions != null ? formatPercent(giveaway.shareOfTotalActions, 1) : 'n/a'} detail={giveaway?.posts != null ? `${formatNumber(giveaway.posts)} giveaway posts · approved Creative Cuts` : 'No giveaway action-share cut for this selected period'} />
          <CreativeSourceMetric label="Non-giveaway median" value={nonGiveaway?.medianActiveEngagementRate != null ? formatPercent(nonGiveaway.medianActiveEngagementRate, 2) : 'n/a'} detail={nonGiveaway?.posts != null ? `${formatNumber(nonGiveaway.posts)} non-giveaway posts · approved Creative Cuts` : 'No non-giveaway cut for this selected period'} />
        </div>
        {insights.cuts.filter((row) => row.cut === 'Action mix').length ? <div className="creative-card creative-mt"><h3>Action mix · supplied cut</h3><div className="creative-action-list">{insights.cuts.filter((row) => row.cut === 'Action mix').map((row) => <div key={row.value}><span>{row.value}</span><b>{row.shareOfTotalActions != null ? formatPercent(row.shareOfTotalActions, 1) : 'n/a (share unavailable)'}</b></div>)}</div></div> : <div className="creative-awaiting creative-mt">Action mix: n/a. Compatible action-share cuts are not supplied for this period.</div>}
        <PreparedTrend data={data} metric="engagement" />
      </> : <div className="creative-awaiting">{reason} Paid shares and saves remain n/a for Pocari; no Facebook/Instagram metrics are mixed.</div>}
    </CreativeSlot>
    <CreativeSlot number={4} title="What worked and why" subtitle="CEO view: the imported Top 3 and band summary. Full details are available on demand.">
      {hasPosts ? <>
        {top3.length ? <div className="creative-top-three">{top3.map((post) => <article className="creative-card creative-top-card" key={`${post.postId}:${post.rank}`}>
          <div className="creative-top-image">{post.imageUrl ? <img src={post.imageUrl} alt={`Imported creative ${post.postId}`} loading="lazy" /> : <div>Thumbnail awaiting verified monthly asset</div>}</div>
          <div className="creative-top-meta"><span>#{post.rank} · {post.postType} · {post.date}</span><strong>{formatPercent(post.activeEngagementRate, 2)}</strong><small>{formatNumber(post.activeActions)} actions / {formatNumber(post.reach)} reach</small><p>{post.theme !== 'Untagged' ? `Tagged theme: ${post.theme}. ` : ''}{post.language} · {post.day} · {post.timeSlot}{post.giveaway ? ' · Giveaway' : ''}</p><p className="creative-pending-line">Why-it-worked explanation awaiting approved analyst text. Source factors are listed above.</p>{post.postUrl ? <a href={post.postUrl} target="_blank" rel="noopener noreferrer">View source post</a> : null}</div>
        </article>)}</div> : <div className="creative-awaiting">Monthly Top 3: n/a (prepared monthly ranking not supplied for this period).</div>}
        <div className="creative-card creative-mt"><div className="creative-section-heading"><h3>Top / Core / Low bands</h3><span>Imported band classification</span></div><div className="creative-band-summary">{(['Top','Core','Low'] as const).map((band) => <div key={band}><strong>{band}</strong><span>{formatNumber(posts.filter((post) => post.band === band).length)} posts</span></div>)}</div></div>
        <details className="creative-method"><summary>See all posts · full Top / Core / Low grid</summary><CreativeGalleryBands posts={posts} /></details>
        <details className="creative-method"><summary>See all Creative Cuts</summary><CreativeCuts data={data} /></details>
      </> : <div className="creative-awaiting">AWAITING · {reason} Top 3, approved why-it-worked notes and bands cannot be inferred from account data.</div>}
    </CreativeSlot>
  </>;
}
function PreparedTrend({ data, metric }: { data: CreativeDashboard; metric: 'engagement' | 'frequency' }) {
  const rows = data.organic.preparedInsights.trend.filter((row) => row.year === data.filter.year && row.month >= 1 && row.month <= 12);
  if (!rows.length) return <p className="creative-support">Monthly {metric} trend: n/a (no prepared monthly benchmark data).</p>;
  const points = rows.map((row) => ({ month: new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(row.year, row.month - 1, 1))), value: metric === 'engagement' ? row.medianActiveEngagementRate * 100 : row.medianFrequency }));
  return <section className="creative-card creative-mt creative-trend-section"><div className="creative-section-heading"><h3>{metric === 'engagement' ? 'Monthly median active engagement' : 'Monthly median frequency'}</h3><span>{metric === 'engagement' ? 'Percent' : 'Views / reach'} · Jan {data.filter.year} onward</span></div><div className="creative-trend-chart" role="img" aria-label={`Monthly ${metric} trend, single axis`}>
    <ResponsiveContainer width="100%" height={210}><LineChart data={points} margin={{ top: 12, right: 22, left: 2, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--line)" /><XAxis dataKey="month" stroke="var(--muted)" /><YAxis stroke="var(--muted)" width={42} tickFormatter={(value: number) => metric === 'engagement' ? `${value}%` : `${value}x`} /><Tooltip formatter={(value) => `${Number(value).toFixed(2)}${metric === 'engagement' ? '%' : 'x'}`} /><Line dataKey="value" type="linear" stroke="var(--ink)" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} /></LineChart></ResponsiveContainer>
  </div><p className="creative-source-note">Source: Monthly Benchmarks. Missing months are not interpolated; the series has one y-axis.</p></section>;
}
function CreativeCuts({ data }: { data: CreativeDashboard }) {
  const cuts = data.organic.preparedInsights.cuts;
  if (!cuts.length) return <UnavailableCreativeSection title="Creative Cuts" message="Data not available for the selected period." />;
  const groups = ['Language', 'Format', 'Time slot', 'Giveaway', 'Action mix', 'Follows'];
  return <section className="creative-card creative-mt"><div className="creative-section-heading"><div><h3>Creative Cuts</h3><p>Values imported from the approved prepared workbook, not regenerated.</p></div><span>{data.periodLabel}</span></div><div className="creative-cuts-grid">{groups.map((group) => <article key={group}><h4>{group}</h4>{cuts.filter((cut) => cut.cut === group).map((cut) => <div className="creative-cut-row" key={`${cut.cut}:${cut.value}`}><span>{cut.value}</span><strong>{cut.medianActiveEngagementRate != null ? formatPercent(cut.medianActiveEngagementRate, 2) : cut.shareOfTotalActions != null ? formatPercent(cut.shareOfTotalActions, 1) : formatNumber(cut.posts)}</strong><small>{cut.posts != null && cut.medianActiveEngagementRate != null ? `${formatNumber(cut.posts)} posts` : cut.shareOfTotalActions != null ? 'share of actions' : 'supplied value'}</small></div>)}</article>)}</div></section>;
}

function PaidPanel({ data }: { data: CreativeDashboard }) {
  return <>
    <div className="creative-subtabs" role="tablist" aria-label="Paid Creative platform">
      <button type="button" className="active" role="tab" aria-selected="true">Meta ads</button>
    </div>
    {data.paid.meta.available ? <MetaPaid data={data} /> : <MetaUnavailable message={data.paid.meta.message} />}
  </>;
}

function AccountLevelSection({ data, platform }: { data: CreativeDashboard; platform: 'facebook' | 'instagram' }) {
  return <section className="creative-card creative-account-section creative-mt">
    <div className="creative-account-heading"><div><h3>Account-level Creative support</h3><p>Daily metrics are filtered by the selected period. Reach and Viewers use daily average and peak rather than a summed audience.</p></div><span>{data.brand.label}</span></div>
    <div className="creative-paid-source-grid">
      {data.accountLevel.dailyMetrics.filter((metric) => metric.platform === platform).map((metric) => <CreativeSourceMetric
        key={`${metric.platform}:${metric.metric}`}
        label={`${displayPlatform(metric.platform)} · ${metric.label}`}
        value={formatAccountMetric(metric.value, metric.aggregation)}
        detail={metric.aggregation === 'daily-average-and-peak'
          ? `Peak ${formatNumber(metric.peak)} · ${metric.observedDays} observed days`
          : `${metric.observedDays} observed days · ${formatShortDate(metric.periodStart)} to ${formatShortDate(metric.periodEnd)}`}
      />)}
      {!data.accountLevel.dailyMetrics.some((metric) => metric.platform === platform) ? <div className="creative-account-empty">No daily account observations exist for this selected month.</div> : null}
    </div>
    {data.accountLevel.wholePeriodSummaries.some((section) => section.platform === platform) ? <details className="creative-method creative-account-summaries">
      <summary>Whole-export format and audience summaries</summary>
      <p>These tables are not filtered by Month because their source files contain no monthly breakdown or reporting date.</p>
      <div className="creative-account-summary-grid">{data.accountLevel.wholePeriodSummaries.filter((section) => section.platform === platform).map((section) => <article key={`${section.sourceFile}:${section.title}`}>
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
    <div className="creative-grid three creative-mt">
      <CreativeMetricCard label="Paid CTR" value={formatPercent(paid.paidCtr, 3)} detail={`${formatNumber(paid.totalPaidClicks)} paid clicks / ${formatNumber(paid.totalPaidImpressions)} paid impressions`} />
      <CreativeMetricCard label="Paid active engagement" value="N/A" detail={`Measured comments / reach is ${formatPercent(account.measuredCommentRate, 4)}. Paid shares and saves are not supplied.`} unavailable />
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
      <summary>How the paid metrics are computed</summary>
      <div className="creative-table-wrap"><table><thead><tr><th>Metric</th><th className="num">Value</th><th>Formula / availability</th></tr></thead><tbody>
        <tr><td>Paid CTR</td><td className="num">{formatPercent(paid.paidCtr, 3)}</td><td>Matching paid clicks / paid impressions</td></tr>
        <tr><td>Active engagement</td><td className="num">N/A</td><td>Paid shares and saves are not supplied</td></tr>
      </tbody></table></div>
      <p>Paid CTR uses matching detail totals: {formatNumber(paid.totalPaidClicks)} paid clicks / {formatNumber(paid.totalPaidImpressions)} paid impressions = {formatPercent(paid.paidCtr, 3)}. The account summary separately supplies {formatNumber(account.paidImpressions)} impressions, {formatNumber(account.paidReach)} reach, {formatNumber(account.paidLikes)} likes, {formatNumber(account.paidComments)} comments, and a {formatSourcePercent(account.suppliedEngagementRatePercent)} engagement-rate column. Its definition is not supplied, so it is displayed only as a source value. No Paid Creative score is generated.</p>
    </details>
  </>;
}

function CreativeSourceMetric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="creative-card creative-paid-source"><span>{label}</span><strong>{value}</strong>{detail ? <small>{detail}</small> : null}</div>;
}

function MetaUnavailable({ message }: { message: string }) {
  return <>
    <div className="creative-grid four">
      {['Paid CTR', 'Paid active engagement', 'Earned actions'].map((label) => <CreativeMetricCard key={label} label={label} value="Data not available" detail={message} unavailable />)}
    </div>
    <UnavailableCreativeSection title="Video creatives ranked by budget" message={message} />
    <UnavailableCreativeSection title="Static creatives ranked by budget" message={message} />
    <details className="creative-method"><summary>Full ad-level detail</summary><p>Data not available. No paid ad-level rows are present in the supplied files.</p></details>
    <details className="creative-method"><summary>How the paid metrics are computed</summary><p>Data not available. Required paid inputs are not supplied for this Brand and period.</p></details>
  </>;
}

function OverallMethod({ data }: { data: CreativeDashboard }) {
  return <details className="creative-method creative-overall-method">
    <summary>Data coverage and calculation notes</summary>
    <p>No composite Creative score or 0-100 component scores are generated. Organic and Paid display only compatible raw metrics from their respective sources.</p>
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

function creativeReadsClient(brand?: string): string {
  return brand === 'union-coop' ? 'Union Coop' : brand === 'pocari-sweat' ? 'Pocari Sweat' : brand === 'souq-al-bahar' ? 'Souq Al Bahar' : brand === 'souq-al-jubair' ? 'Souq Al Jubair' : brand === 'souq-al-haraj' ? 'Souq Al Haraj' : brand === 'souq-al-jubail' ? 'Souq Al Jubail' : 'Union Coop';
}

function compactLabel(value: string): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > 46 ? `${clean.slice(0, 45)}…` : clean;
}


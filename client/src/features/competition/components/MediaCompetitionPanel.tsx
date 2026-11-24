import { useEffect, useMemo, useRef, useState } from 'react';
import type { CompetitionDashboard } from '../../../types/competition';
import { competitionAssetUrl } from '../services/competition-api';
import { CompetitionSourceLabel } from './CompetitionSourceLabel';
import { CompetitionChannelChip } from './CompetitionChannelChip';
import { CountUpValue } from '../../../components/v2/CountUpValue';
import './media-competition-wall.css';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}
const number = (value: number | null) => value == null ? 'n/a' : value.toLocaleString('en-US');

export function MediaCompetitionPanel({ data }: { data: CompetitionDashboard }) {
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState('');
  const [platform, setPlatform] = useState('');
  const [format, setFormat] = useState('');
  const [startDate, setStartDate] = useState('');
  const [campaignPlatform, setCampaignPlatform] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);
  const registerDialogRef = useRef<HTMLDialogElement>(null);
  const registerTriggerRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // A modal makes the full register visible immediately when the gallery tile
  // is pressed. The old <details> was below the timeline, out of the viewport.
  useEffect(() => {
    const dialog = registerDialogRef.current;
    if (!dialog) return;
    if (registerOpen && !dialog.open) dialog.showModal();
    if (!registerOpen && dialog.open) dialog.close();
  }, [registerOpen]);

  const openRegister = () => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : registerTriggerRef.current;
    setRegisterOpen(true);
  };
  const closeRegister = () => {
    setRegisterOpen(false);
    previousFocusRef.current?.focus();
  };
  const current = data.activity.historicalTrend?.at(-1);
  const previous = data.activity.historicalTrend?.at(-2);
  const hasHistory = Boolean(current && previous);
  const age = data.channel === 'Google' ? [] : [
    { label: '0–30 days', count: data.observations.filter((ad) => ad.calculatedDaysRunning <= 30).length },
    { label: '31–90 days', count: data.observations.filter((ad) => ad.calculatedDaysRunning > 30 && ad.calculatedDaysRunning <= 90).length },
    { label: '90+ days', count: data.observations.filter((ad) => ad.calculatedDaysRunning > 90).length },
  ];
  const launchWaves = useMemo((): Array<[string, number]> => {
    const days = new Map<string, number>();
    for (const ad of data.observations) {
      if (ad.startDateAvailable === false) continue;
      days.set(ad.startDate,(days.get(ad.startDate)??0)+1);
    }
    return [...days.entries()].sort(([a],[b])=>a.localeCompare(b));
  }, [data.observations]);
  const options = (values: Array<string | null | undefined>) => [...new Set(values.filter((value): value is string => Boolean(value)))].sort();
  const filtered = data.observations.filter((ad) => {
    const query = search.trim().toLowerCase();
    return (!query || `${ad.libraryId} ${ad.featuredBrandProduct ?? ''} ${ad.theme ?? ''} ${ad.adText ?? ''} ${ad.payerVerified ?? ''} ${ad.screenshotRef ?? ''}`.toLowerCase().includes(query))
      && (!theme || ad.theme === theme)
      && (!platform || ad.platforms.includes(platform))
      && (!format || ad.format === format)
      && (!startDate || ad.startDate === startDate)
      && (!campaignPlatform || ad.campaignPlatform === campaignPlatform);
  });
  const group = data.gallery.reduce<Record<number, typeof data.gallery>>((result, ad) => {
    (result[ad.row] ??= []).push(ad);
    return result;
  }, {});
  const maxAge = Math.max(1, ...age.map((entry) => entry.count));
  const maxTheme = Math.max(1, ...data.themeMix.map((entry) => entry.count));
  const campaignCount = data.campaignPlatformMix.reduce((sum, entry) => sum + entry.count, 0);
  const supplierTheme = data.channel === 'Meta' ? data.themeMix.find((entry) => /^supplier[ -]?(?:brand|funded)/i.test(entry.label)) : undefined;
  return <div className="media-competition-v2">
    <div className="media-comp-kpis" aria-label={`${data.competitor.label} ${data.channel} competitor capture statistics`}>
      {data.channel === 'Google' ? <>
        <article className="media-comp-card"><CompetitionChannelChip channel={data.channel}/><span>Ads reported by Google</span><strong>{data.sample?.reported != null ? `~${number(data.sample.reported)}` : 'n/a'}</strong><small>Reported population, not individually logged records</small><CompetitionSourceLabel value={data.sourceLabel}/></article>
        <article className="media-comp-card"><CompetitionChannelChip channel={data.channel}/><span>Creatives logged</span><strong><CountUpValue value={number(data.sample?.logged ?? null)}/></strong><small>Analyst-captured sample, not a complete census</small><CompetitionSourceLabel value={data.sourceLabel}/></article>
        <article className="media-comp-card"><CompetitionChannelChip channel={data.channel}/><span>Formats in sample</span><strong>{data.formatMix.length}</strong><small>Search, Local/Maps, Shopping and Display</small><CompetitionSourceLabel value={data.sourceLabel}/></article>
        <article className="media-comp-card"><CompetitionChannelChip channel={data.channel}/><span>Verified payer records</span><strong>{number(data.observations.filter((ad)=>Boolean(ad.payerVerified)).length)}</strong><small>Names copied from the capture; no spend inferred</small><CompetitionSourceLabel value={data.sourceLabel}/></article>
      </> : <>
        <article className="media-comp-card"><CompetitionChannelChip channel={data.channel}/><span>Active ads at capture</span><strong><CountUpValue value={number(data.activity.activeAds)}/></strong><small>{hasHistory ? `${number(previous!.activeAds)} on ${formatDate(previous!.captureDate)} · net ${data.activity.netActiveChange != null && data.activity.netActiveChange > 0 ? '+' : ''}${number(data.activity.netActiveChange)}` : 'First available capture'}</small><CompetitionSourceLabel value={data.sourceLabel}/></article>
        <article className="media-comp-card"><CompetitionChannelChip channel={data.channel}/><span>Started since last capture</span><strong><CountUpValue value={number(data.launches.sincePreviousCapture)}/></strong><small>{data.launches.sincePreviousCapture == null ? 'n/a (no approved launch comparison)' : 'Analyst-marked launches, not net active change'}</small><CompetitionSourceLabel value={data.sourceLabel}/></article>
        <article className="media-comp-card"><CompetitionChannelChip channel={data.channel}/><span>Average days running</span><strong><CountUpValue value={data.activity.averageDaysRunning == null ? 'n/a' : data.activity.averageDaysRunning.toFixed(1)}/></strong><small>Active Library IDs only</small><CompetitionSourceLabel value={data.sourceLabel}/></article>
        <article className="media-comp-card"><CompetitionChannelChip channel={data.channel}/><span>Longest running</span><strong>{data.longestRunning.length ? Math.max(...data.longestRunning.map((ad) => ad.calculatedDaysRunning)) : 'n/a'} <small>days</small></strong><small>Activity/longevity only, not performance</small><CompetitionSourceLabel value={data.sourceLabel}/></article>
      </>}
    </div>
    {supplierTheme ? <div className="v2-competition-supplier" role="note"><CompetitionChannelChip channel={data.channel}/><strong>{supplierTheme.count.toLocaleString('en-US')}</strong> ads tagged <b>{supplierTheme.label}</b> in the analyst's Theme Mix. This is a source classification, not a verified measure of competitor spend.</div> : null}
    {data.channel === 'Google' ? <section className="media-comp-google-formats" aria-label="Google format breakdown in sample"><CompetitionChannelChip channel={data.channel}/>
      <div className="media-comp-wall-header"><h3>Google formats · logged sample</h3><p>Counts are drawn from the 30 captured creatives only. They are not population estimates.</p></div>
      <div className="media-comp-google-format-grid">{['Search','Local/Maps','Shopping','Display'].map((label) => {
        const count=data.formatMix.find((group)=>group.label===label)?.count ?? 0;
        return <article key={label} className="media-comp-card"><span>{label}</span><strong><CountUpValue value={String(count)}/></strong><small>creatives in captured sample</small></article>;
      })}</div>
      <div className="media-comp-google-payers"><strong>Verified payers in the sample</strong><div>{[...new Set(data.observations.map((ad)=>ad.payerVerified).filter((payer):payer is string=>Boolean(payer)))].map((payer)=><span key={payer}>{payer}: {data.observations.filter((ad)=>ad.payerVerified===payer).length}</span>)}</div></div>
      <CompetitionSourceLabel value={data.sourceLabel}/>
    </section> : null}
    {data.channel === 'Google' && data.sample?.sampleOnly ? <div className="v2-search-await"><span className="v2-awaiting-dot"/><span>Google capture is a logged sample{data.sample.reported != null ? `: ${data.sample.logged} logged from ${data.sample.reported} reported` : `: ${data.sample.logged} logged, reported population unverified`}. Sample statistics are not population metrics.</span></div> : null}
    <div className="media-comp-split">
      <section className="media-comp-card"><CompetitionChannelChip channel={data.channel}/><h3>History · {data.channel === 'Google' ? 'logged creatives by capture' : 'active ads by capture'}</h3>{data.activity.historicalTrend?.length ? <div className="media-comp-history">{data.activity.historicalTrend.map((entry) => <div key={entry.captureDate}><span>{formatDate(entry.captureDate)}</span><b>{entry.activeAds} {data.channel === 'Google' ? 'logged' : 'ads'}</b><div className="media-comp-bar"><i style={{width: `${100 * entry.activeAds / Math.max(1,...(data.activity.historicalTrend ?? []).map((row) => row.activeAds))}%`}}/></div></div>)}</div> : <p className="media-comp-muted">Historical comparison requires a second capture.</p>}<CompetitionSourceLabel value={data.sourceLabel}/></section>
      {data.channel === 'Meta' ? <section className="media-comp-card"><CompetitionChannelChip channel={data.channel}/><h3>Age profile</h3><div className="media-comp-history">{age.map((entry) => <div key={entry.label}><span>{entry.label}</span><b>{entry.count} ads</b><div className="media-comp-bar"><i style={{width:`${entry.count / maxAge * 100}%`}} /></div></div>)}</div><CompetitionSourceLabel value={data.sourceLabel}/></section> : <section className="media-comp-card"><CompetitionChannelChip channel={data.channel}/><h3>Capture scope</h3><p>{data.sample?.reported == null ? `${data.sample?.logged ?? 0} logged records (sample). Reported total: n/a (not verified in import).` : `${data.sample.reported} reported by Google; ${data.sample.logged} logged in sample.`}</p><CompetitionSourceLabel value={data.sourceLabel}/></section>}
    </div>
    {data.gallery.length ? <section className="media-comp-wall" aria-label="The competitor's wall"><CompetitionChannelChip channel={data.channel}/>
      <div className="media-comp-wall-header"><h3>The competitor's wall</h3><p>Analyst's selection of {data.gallery.length} from {number(data.activity.activeAds)} active ads. {data.sourceLabel} Performance is not knowable.</p></div>
      {[1,2,3,4].map((rowNumber) => <div className="media-comp-wall-row" key={rowNumber}>
        <h4>{group[rowNumber]?.[0]?.title ?? `Gallery row ${rowNumber}`} <small>{group[rowNumber]?.length ?? 0} ads</small></h4>
        <div className="media-comp-wall-grid">{(group[rowNumber] ?? []).map((entry) => <article className="media-comp-wall-item" key={entry.libraryId}><CompetitionChannelChip channel={data.channel}/>
          <img src={competitionAssetUrl(entry.assetUrl)} alt={`${entry.caption}, ${entry.chip}`} loading="lazy" />
          <div><h5>{entry.caption}</h5><p>{formatDate(entry.startDate)} · {entry.daysRunning} days · {entry.metaLine}</p><span className="media-comp-chip">{entry.chip}</span><small>Library ID: {entry.libraryId}</small></div>
        </article>)}{rowNumber === 4 ? <button ref={registerTriggerRef} type="button" className="media-comp-wall-tile" aria-haspopup="dialog" aria-controls="media-comp-register-dialog" onClick={openRegister}>
          <b>See all {data.observations.length} ads</b><span>Explore the entire source register</span>
        </button> : null}</div>
      </div>)}
      <CompetitionSourceLabel value={data.sourceLabel}/>
    </section> : <div className="v2-gallery-awaiting" role="status">AWAITING · Competitor wall: approved analyst-selected thumbnails are not supplied for this {data.channel} capture. Owner: TBL. {data.sourceLabel}</div>}
    <div className="media-comp-split">
      <section className="media-comp-card"><CompetitionChannelChip channel={data.channel}/><h3>Launch timeline</h3><p>Month of ad start in the selected register, not measured performance.</p>{launchWaves.length ? <div className="media-comp-history">{launchWaves.map(([month, count]) => <div key={month}><span>{month}</span><b>{count} ads</b></div>)}</div> : <p className="v2-gallery-awaiting">n/a: Per-ad start dates were not captured for the Google sample. No launch-wave timing is inferred.</p>}<CompetitionSourceLabel value={data.sourceLabel}/></section>
      <section className="media-comp-card"><CompetitionChannelChip channel={data.channel}/><h3>Theme mix</h3>{campaignCount ? <p className="media-comp-campaign-tag">Campaign platform · {data.campaignPlatformMix.map((row)=>`${row.label}: ${row.count}`).join(" · ")} of {data.observations.length} ads</p> : <p className="media-comp-muted">Campaign platform: n/a (not supplied for this capture)</p>}
      <div className="media-comp-history">{data.themeMix.map((entry) => <div key={entry.label}><span>{entry.label}</span><b>{entry.count} ads</b><div className="media-comp-bar"><i style={{width:`${entry.count/maxTheme*100}%`}}/></div></div>)}</div><CompetitionSourceLabel value={data.sourceLabel}/></section>
    </div>
    <button type="button" className="media-comp-register-open" onClick={openRegister} aria-haspopup="dialog" aria-controls="media-comp-register-dialog">
      Browse full register ({data.observations.length} ads)
    </button>
    <dialog
      id="media-comp-register-dialog"
      ref={registerDialogRef}
      className="media-comp-register-dialog"
      aria-labelledby="media-comp-register-title"
      onClose={closeRegister}
      onClick={(event) => { if (event.target === event.currentTarget) closeRegister(); }}
    >
      <div className="media-comp-register-content">
        <div className="media-comp-register-heading"><CompetitionChannelChip channel={data.channel}/>
          <div>
            <h2 id="media-comp-register-title">{data.competitor.label} · {data.channel} register · {data.observations.length} logged ads</h2>
            <p>Captured {data.capture.date ? formatDate(data.capture.date) : 'n/a'} · {data.sourceLabel}</p>
          </div>
          <button type="button" className="media-comp-register-close" onClick={closeRegister} aria-label="Close full ad register">Close ×</button>
        </div>
      <div className="media-comp-register-controls">
        <label>Search <input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="Creative copy, payer, Library ID or theme" /></label>
        <label>Theme <select value={theme} onChange={(event)=>setTheme(event.target.value)}><option value="">All themes</option>{options(data.observations.map((ad)=>ad.theme)).map((value)=><option key={value}>{value}</option>)}</select></label>
        <label>Format <select value={format} onChange={(event)=>setFormat(event.target.value)}><option value="">All formats</option>{options(data.observations.map((ad)=>ad.format)).map((value)=><option key={value}>{value}</option>)}</select></label>
        <label>{data.channel === 'Google' ? 'Surface' : 'Platform'} <select value={platform} onChange={(event)=>setPlatform(event.target.value)}><option value="">All platforms</option>{[...new Set(data.observations.map((ad)=>ad.platforms))].filter(Boolean).map((value)=><option key={value}>{value}</option>)}</select></label>
        <label>Start date <select value={startDate} onChange={(event)=>setStartDate(event.target.value)}><option value="">All dates</option>{options(data.observations.filter((ad) => ad.startDateAvailable !== false).map((ad)=>ad.startDate)).map((value)=><option key={value}>{value}</option>)}</select></label>
        <label>Campaign platform <select value={campaignPlatform} onChange={(event)=>setCampaignPlatform(event.target.value)}><option value="">All campaigns</option>{options(data.observations.map((ad)=>ad.campaignPlatform)).map((value)=><option key={value}>{value}</option>)}</select></label>
      </div><p>{filtered.length} matching ads from {data.observations.length} registered</p>
      <div className="media-comp-table-scroll"><table><thead><tr><th>Library ID</th><th>Start date</th><th>Days</th><th>Theme</th><th>Format</th><th>Platforms</th><th>Campaign platform</th><th>Verified payer</th><th>Creative/copy</th><th>Capture ref</th><th>Destination</th></tr></thead><tbody>{filtered.map((ad)=><tr key={ad.libraryId}><td>{ad.libraryId.startsWith('not-captured-') ? '(not captured)' : ad.libraryId}</td><td>{ad.startDateAvailable === false ? 'n/a' : formatDate(ad.startDate)}</td><td>{ad.startDateAvailable === false ? 'n/a' : ad.calculatedDaysRunning}</td><td>{ad.theme ?? 'n/a'}</td><td>{ad.format}</td><td>{ad.platforms}</td><td>{ad.campaignPlatform ?? 'n/a'}</td><td>{ad.payerVerified ?? 'n/a (not supplied)'}</td><td>{ad.adText ?? ad.featuredBrandProduct ?? 'n/a (not captured)'}</td><td>{ad.screenshotRef ?? 'n/a'}</td><td>{ad.clickDestination ?? 'n/a'}</td></tr>)}</tbody></table></div><CompetitionSourceLabel value={data.sourceLabel}/>
      </div>
    </dialog>
  </div>;
}

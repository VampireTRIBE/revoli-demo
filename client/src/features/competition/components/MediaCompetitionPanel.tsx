import { useEffect, useMemo, useRef, useState } from 'react';
import type { CompetitionDashboard } from '../../../types/competition';
import { competitionAssetUrl } from '../services/competition-api';
import { CompetitionSourceLabel } from './CompetitionSourceLabel';
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
  const age = [
    { label: '0–30 days', count: data.observations.filter((ad) => ad.calculatedDaysRunning <= 30).length },
    { label: '31–90 days', count: data.observations.filter((ad) => ad.calculatedDaysRunning > 30 && ad.calculatedDaysRunning <= 90).length },
    { label: '90+ days', count: data.observations.filter((ad) => ad.calculatedDaysRunning > 90).length },
  ];
  const launchWaves = useMemo((): Array<[string, number]> => {
    if (data.launches.sincePreviousCapture != null) {
      // The dates and three waves are specified by the analyst's Delta vs Capture 1 sheet.
      // Counts are always derived from the register's approved new-since-capture flags.
      const waves = [
        { label: '27–28 Oct · brand films and jewellery', dates: ['2026-10-27', '2026-10-28'] },
        { label: '30 Oct · GUESS, Gc and Movado', dates: ['2026-10-30'] },
        { label: '2 Nov · Diwali and product launches', dates: ['2026-11-02'] },
      ];
      return waves.map((wave): [string, number] => [wave.label, data.observations.filter((ad) => ad.newSincePreviousCapture && wave.dates.includes(ad.startDate)).length]);
    }
    const months = new Map<string, number>();
    for (const ad of data.observations) {
      const key = ad.startDate.slice(0, 7);
      months.set(key, (months.get(key) ?? 0) + 1);
    }
    return [...months.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [data.observations, data.launches.sincePreviousCapture]);
  const options = (values: Array<string | null | undefined>) => [...new Set(values.filter((value): value is string => Boolean(value)))].sort();
  const filtered = data.observations.filter((ad) => {
    const query = search.trim().toLowerCase();
    return (!query || `${ad.libraryId} ${ad.featuredBrandProduct ?? ''} ${ad.theme ?? ''}`.toLowerCase().includes(query))
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
  return <div className="media-competition-v2">
    <div className="media-comp-kpis" aria-label="EDIT competitor capture statistics">
      <article className="media-comp-card"><span>Active ads at capture</span><strong>{number(data.activity.activeAds)}</strong><small>{hasHistory ? `${number(previous!.activeAds)} on ${formatDate(previous!.captureDate)} · net ${data.activity.netActiveChange != null && data.activity.netActiveChange > 0 ? '+' : ''}${number(data.activity.netActiveChange)}` : 'First available capture'}</small><CompetitionSourceLabel value={data.sourceLabel} /></article>
      <article className="media-comp-card"><span>Started since last capture</span><strong>{number(data.launches.sincePreviousCapture)}</strong><small>{data.launches.sincePreviousCapture == null ? 'n/a (no approved launch comparison)' : 'Analyst-marked launches, not net active change'}</small><CompetitionSourceLabel value={data.sourceLabel} /></article>
      <article className="media-comp-card"><span>Average days running</span><strong>{data.activity.averageDaysRunning == null ? 'n/a' : data.activity.averageDaysRunning.toFixed(1)}</strong><small>Active Library IDs only</small><CompetitionSourceLabel value={data.sourceLabel} /></article>
      <article className="media-comp-card"><span>Longest running</span><strong>{data.longestRunning.length ? Math.max(...data.longestRunning.map((ad) => ad.calculatedDaysRunning)) : 'n/a'} <small>days</small></strong><small>Longevity is an activity signal, not performance</small><CompetitionSourceLabel value={data.sourceLabel} /></article>
    </div>
    <div className="media-comp-split">
      <section className="media-comp-card"><h3>History · active ads by capture</h3>{data.activity.historicalTrend?.length ? <div className="media-comp-history">{data.activity.historicalTrend.map((entry) => <div key={entry.captureDate}><span>{formatDate(entry.captureDate)}</span><b>{entry.activeAds} ads</b><div className="media-comp-bar"><i style={{width: `${100 * entry.activeAds / Math.max(1,...(data.activity.historicalTrend ?? []).map((row) => row.activeAds))}%`}}/></div></div>)}</div> : <p className="media-comp-muted">Historical comparison requires a second capture.</p>}<CompetitionSourceLabel value={data.sourceLabel}/></section>
      <section className="media-comp-card"><h3>Age profile</h3><div className="media-comp-history">{age.map((entry) => <div key={entry.label}><span>{entry.label}</span><b>{entry.count} ads</b><div className="media-comp-bar"><i style={{width:`${entry.count / maxAge * 100}%`}} /></div></div>)}</div><CompetitionSourceLabel value={data.sourceLabel}/></section>
    </div>
    {data.gallery.length ? <section className="media-comp-wall" aria-label="The competitor's wall">
      <div className="media-comp-wall-header"><h3>The competitor's wall</h3><p>Analyst's selection of {data.gallery.length} from {number(data.activity.activeAds)} active ads. Source: Meta Ad Library. Activity, not spend - performance is not knowable.</p></div>
      {[1,2,3,4].map((rowNumber) => <div className="media-comp-wall-row" key={rowNumber}>
        <h4>{group[rowNumber]?.[0]?.title ?? `Gallery row ${rowNumber}`} <small>{group[rowNumber]?.length ?? 0} ads</small></h4>
        <div className="media-comp-wall-grid">{(group[rowNumber] ?? []).map((entry) => <article className="media-comp-wall-item" key={entry.libraryId}>
          <img src={competitionAssetUrl(entry.assetUrl)} alt={`${entry.caption}, ${entry.chip}`} loading="lazy" />
          <div><h5>{entry.caption}</h5><p>{formatDate(entry.startDate)} · {entry.daysRunning} days · {entry.metaLine}</p><span className="media-comp-chip">{entry.chip}</span><small>Library ID: {entry.libraryId}</small></div>
        </article>)}{rowNumber === 4 ? <button ref={registerTriggerRef} type="button" className="media-comp-wall-tile" aria-haspopup="dialog" aria-controls="media-comp-register-dialog" onClick={openRegister}>
          <b>See all {data.observations.length} ads</b><span>Explore the entire source register</span>
        </button> : null}</div>
      </div>)}
      <CompetitionSourceLabel value={data.sourceLabel}/>
    </section> : <section className="media-comp-card"><h3>The competitor's wall</h3><p>Gallery n/a: no approved analyst-selected thumbnails for this capture.</p><CompetitionSourceLabel value={data.sourceLabel}/></section>}
    <div className="media-comp-split">
      <section className="media-comp-card"><h3>Launch timeline</h3><p>Month of ad start in the selected register, not measured performance.</p><div className="media-comp-history">{launchWaves.map(([month, count]) => <div key={month}><span>{month}</span><b>{count} ads</b></div>)}</div><CompetitionSourceLabel value={data.sourceLabel}/></section>
      <section className="media-comp-card"><h3>Theme mix</h3>{campaignCount ? <p className="media-comp-campaign-tag">Campaign platform · {data.campaignPlatformMix.map((row)=>`${row.label}: ${row.count}`).join(" · ")} of {data.observations.length} ads</p> : <p className="media-comp-muted">Campaign platform: n/a (not supplied for this capture)</p>}
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
        <div className="media-comp-register-heading">
          <div>
            <h2 id="media-comp-register-title">EDIT ad register · {data.observations.length} ads</h2>
            <p>Captured {data.capture.date ? formatDate(data.capture.date) : 'n/a'} · Source: Meta Ad Library. Activity, not spend.</p>
          </div>
          <button type="button" className="media-comp-register-close" onClick={closeRegister} aria-label="Close full ad register">Close ×</button>
        </div>
      <div className="media-comp-register-controls">
        <label>Search <input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="Library ID, brand or theme" /></label>
        <label>Theme <select value={theme} onChange={(event)=>setTheme(event.target.value)}><option value="">All themes</option>{options(data.observations.map((ad)=>ad.theme)).map((value)=><option key={value}>{value}</option>)}</select></label>
        <label>Format <select value={format} onChange={(event)=>setFormat(event.target.value)}><option value="">All formats</option>{options(data.observations.map((ad)=>ad.format)).map((value)=><option key={value}>{value}</option>)}</select></label>
        <label>Platform <select value={platform} onChange={(event)=>setPlatform(event.target.value)}><option value="">All platforms</option>{['FB','IG','MS','TH'].map((value)=><option key={value}>{value}</option>)}</select></label>
        <label>Start date <select value={startDate} onChange={(event)=>setStartDate(event.target.value)}><option value="">All dates</option>{options(data.observations.map((ad)=>ad.startDate)).map((value)=><option key={value}>{value}</option>)}</select></label>
        <label>Campaign platform <select value={campaignPlatform} onChange={(event)=>setCampaignPlatform(event.target.value)}><option value="">All campaigns</option>{options(data.observations.map((ad)=>ad.campaignPlatform)).map((value)=><option key={value}>{value}</option>)}</select></label>
      </div><p>{filtered.length} matching ads from {data.observations.length} registered</p>
      <div className="media-comp-table-scroll"><table><thead><tr><th>Library ID</th><th>Start date</th><th>Days</th><th>Theme</th><th>Format</th><th>Platforms</th><th>Campaign platform</th><th>Featured brand/product</th></tr></thead><tbody>{filtered.map((ad)=><tr key={ad.libraryId}><td>{ad.libraryId}</td><td>{formatDate(ad.startDate)}</td><td>{ad.calculatedDaysRunning}</td><td>{ad.theme ?? 'n/a'}</td><td>{ad.format}</td><td>{ad.platforms}</td><td>{ad.campaignPlatform ?? 'n/a'}</td><td>{ad.featuredBrandProduct ?? 'n/a'}</td></tr>)}</tbody></table></div><CompetitionSourceLabel value={data.sourceLabel}/>
      </div>
    </dialog>
  </div>;
}

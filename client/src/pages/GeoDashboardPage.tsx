import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowUpRight, CalendarDays, ChartNoAxesCombined, Database, FileSpreadsheet, Globe2, Info, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { http } from '../api/http';
import type { CleoSnapshot, CleoTopic, CleoQuestion } from '../features/creative/cleo/cleo-types';

/** Generative Engine Optimization: imported, unscored CLEO observations. */
const SOURCE = 'Source: CLEO - single-source, not independently verifiable.';
const integer = (value: number) => value.toLocaleString('en-US');
const pct = (value: number) => `${value}%`;
const position = (value: number | null) => value === null ? 'n/a (not cited)' : value.toFixed(1);
const barWidth = (value: number) => `${Math.min(100, Math.max(0, value))}%`;
const captureLabel = (value: string) => {
  const parts = value.split('-').map(Number);
  return parts.length === 3 && parts.every(Number.isFinite)
    ? new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : value;
};

function SourceNote({ window, capture }: { window: string; capture: string }) {
  return <div className="geo-source"><span>{SOURCE}</span><span>{window} · Capture {captureLabel(capture)}</span></div>;
}
function SectionHead({ title, note, index }: { title: string; note: string; index?: string }) {
  return <div className="geo-panel-heading"><div>{index ? <span className="geo-section-index">{index}</span> : null}<h3>{title}</h3></div><p>{note}</p></div>;
}
function Kpi({ label, value, detail, supporting, window, capture, variant }: {
  label: string; value: string; detail: string; supporting?: string; window: string; capture: string; variant?: 'accent' | 'regular';
}) {
  return <article className={`geo-kpi ${variant === 'accent' ? 'geo-kpi-feature' : ''}`}>
    <div className="geo-kpi-head"><span>{label}</span><span className="geo-kpi-window">{window}</span></div>
    <strong>{value}</strong><p>{detail}</p>{supporting ? <div className="geo-kpi-support">{supporting}</div> : null}
    <SourceNote window={window} capture={capture} />
  </article>;
}
const voiceBrands: Array<{ key: keyof CleoTopic['shares']; label: string; className: string }> = [
  { key: 'unionCoop', label: 'Union Coop', className: 'geo-swatch-uc' },
  { key: 'carrefour', label: 'Carrefour', className: 'geo-swatch-carrefour' },
  { key: 'lulu', label: 'LuLu', className: 'geo-swatch-lulu' },
];
function VoiceRows({ topic }: { topic: CleoTopic }) {
  return <div className="geo-voice-rows">
    {voiceBrands.map(({ key, label, className }) => <div className="geo-voice-row" key={key}>
      <span className="geo-voice-brand"><i className={className} />{label}</span>
      <div className="geo-meter" aria-label={`${label} ${topic.shares[key]} percent`}><span className={className} style={{ width: barWidth(topic.shares[key]) }} /></div>
      <b>{pct(topic.shares[key])}</b>
    </div>)}
  </div>;
}
function TopicTable({ data }: { data: CleoSnapshot }) {
  const [selected, setSelected] = useState(data.allTopics.topic);
  const activeTopic = data.topics.some((entry) => entry.topic === selected) ? selected : data.allTopics.topic;
  const topic = data.topics.find((entry) => entry.topic === activeTopic) ?? data.allTopics;
  return <section className="geo-panel geo-voice-panel" aria-labelledby="geo-voice-title">
    <SectionHead title="Share of AI voice" note="Brand mentions in AI-generated grocery answers · 28 days" index="01" />
    <div className="geo-panel-toolbar"><label htmlFor="geo-topic-filter">Topic</label>
      <select id="geo-topic-filter" value={activeTopic} onChange={(event) => setSelected(event.target.value)}>
        {data.topics.map((entry) => <option key={entry.topic} value={entry.topic}>{entry.topic}</option>)}
      </select>
    </div>
    <div className="geo-voice-layout"><div className="geo-voice-key"><strong>{integer(topic.answers)}</strong><span>AI answers analysed</span><p>{topic.leader || 'No analyst leader finding supplied'}</p></div><VoiceRows topic={topic} /></div>
    <div className="geo-table-scroll"><table className="geo-table geo-topics-table"><thead><tr><th>Topic</th><th>Answers</th><th>Union Coop</th><th>Carrefour</th><th>LuLu</th><th>Spinneys</th><th>Waitrose</th><th>Other</th></tr></thead>
      <tbody>{data.topics.filter((entry) => entry.topic.toUpperCase() !== 'ALL TOPICS').map((entry) => <tr key={entry.topic}>
        <th scope="row">{entry.topic}</th><td>{integer(entry.answers)}</td><td className="geo-emphasis">{pct(entry.shares.unionCoop)}</td>
        <td>{pct(entry.shares.carrefour)}</td><td>{pct(entry.shares.lulu)}</td><td>{pct(entry.shares.spinneys)}</td><td>{pct(entry.shares.waitrose)}</td><td>{entry.otherDisplay}</td>
      </tr>)}</tbody></table></div>
    <SourceNote window={data.windowLabels.topics} capture={data.captureDate} />
  </section>;
}
function FunnelPanel({ data }: { data: CleoSnapshot }) {
  return <section className="geo-panel" aria-label="Visibility funnel"><SectionHead title="Visibility funnel" note="Latest-week answers · percentages are of analyzed answers" index="02" />
    <div className="geo-funnel-list">{data.funnel.map((stage, index) => {
      const value = Number.parseFloat(stage.shareDisplay);
      return <div className="geo-funnel-row" key={stage.stage}>
        <div className="geo-funnel-head"><span><i>{String(index + 1).padStart(2, '0')}</i>{stage.stage}</span><b>{integer(stage.count)} <small>{stage.shareDisplay}</small></b></div>
        <div className="geo-funnel-meter"><span style={{ width: barWidth(Number.isFinite(value) ? value : 0) }} /></div>
      </div>;
    })}</div>
    {data.funnelSupport ? <p className="geo-context-line">{data.funnelSupport}</p> : null}
    <SourceNote window={data.windowLabels.funnel} capture={data.captureDate} />
  </section>;
}
function PositionPanel({ data }: { data: CleoSnapshot }) {
  return <section className="geo-panel" aria-label="Position by AI engine"><SectionHead title="Position by AI engine" note="Average citation position · lower means earlier citation" index="03" />
    <div className="geo-table-scroll"><table className="geo-table"><thead><tr><th>Brand</th><th>Google AIO</th><th>Perplexity</th><th>Claude</th><th>ChatGPT Search</th></tr></thead>
      <tbody>{data.positions.map((entry) => <tr key={entry.brand} className={/union coop|your brand/i.test(entry.brand) ? 'geo-highlight-row' : undefined}>
        <th scope="row">{entry.brand}</th><td>{position(entry.googleAio)}</td><td>{position(entry.perplexity)}</td><td>{position(entry.claude)}</td><td>{position(entry.chatgptSearch)}</td>
      </tr>)}</tbody></table></div>
    {data.engineSupport ? <p className="geo-context-line">{data.engineSupport}</p> : null}
    <SourceNote window={data.windowLabels.positions} capture={data.captureDate} />
  </section>;
}
function CitationPanel({ data }: { data: CleoSnapshot }) {
  const recommended = data.funnel.find((entry) => /recommended/i.test(entry.stage));
  return <section className="geo-panel" aria-label="Citation domains"><SectionHead title="Citations & recommendations" note="Distinct windows. Figures are not directly comparable." index="04" />
    <div className="geo-citation-overview"><div><strong>{data.domains.find((entry) => /unioncoop\.ae/i.test(entry.domain))?.shareDisplay ?? 'n/a'}</strong><span>unioncoop.ae share of citations · {data.windowLabels.domains}</span></div>
      <div><strong>{recommended?.shareDisplay ?? 'n/a'}</strong><span>AI answers recommending Union Coop · {data.windowLabels.funnel}</span></div></div>
    <div className="geo-table-scroll"><table className="geo-table"><thead><tr><th>Rank / domain</th><th>Citations</th><th>Share</th><th>Trend</th></tr></thead><tbody>{data.domains.map((entry) => <tr key={entry.domain}>
      <th scope="row"><span className="geo-rank">#{entry.rank}</span>{entry.domain}</th><td>{integer(entry.citations)}</td><td>{entry.shareDisplay}</td><td>{entry.trendDisplay}</td>
    </tr>)}</tbody></table></div>
    <SourceNote window={`${data.windowLabels.domains} citations; ${data.windowLabels.funnel} recommendations`} capture={data.captureDate} />
  </section>;
}
function QuestionsPanel({ data }: { data: CleoSnapshot }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'cited' | 'not-cited'>('all');
  const [expanded, setExpanded] = useState(false);
  const filtered = useMemo(() => data.questions.filter((entry) => {
    const matchesFilter = filter === 'all' || (filter === 'cited' ? entry.unionCoopCitations > 0 : entry.unionCoopCitations === 0);
    const matchesSearch = `${entry.question} ${entry.competitor ?? ''} ${entry.result}`.toLowerCase().includes(search.toLowerCase().trim());
    return matchesFilter && matchesSearch;
  }), [data.questions, filter, search]);
  const rows = expanded ? filtered : filtered.slice(0, 6);
  return <section className="geo-panel geo-questions" aria-label="Questions people ask AI"><SectionHead title="Questions people ask AI" note={`${data.questions.length} imported questions, ${data.windowLabels.questions} · approved captured evidence`} index="05" />
    <div className="geo-question-controls"><label className="geo-search"><Search size={16} aria-hidden="true" /><span className="geo-sr-only">Search questions</span><input aria-label="Search AI questions" type="search" value={search} placeholder="Search questions or competitors" onChange={(event) => { setSearch(event.target.value); setExpanded(false); }} /></label>
      <div className="geo-filter-tabs" role="group" aria-label="Filter questions by Union Coop citations">{([['all', 'All questions'], ['cited', 'Union Coop cited'], ['not-cited', 'Not cited']] as const).map(([value, label]) => <button type="button" className={filter === value ? 'active' : ''} aria-pressed={filter === value} key={value} onClick={() => { setFilter(value); setExpanded(false); }}>{label}</button>)}</div></div>
    {data.questionSummary ? <p className="geo-summary-note"><Info size={14} aria-hidden="true" />{data.questionSummary}</p> : null}
    <div className="geo-table-scroll"><table className="geo-table geo-questions-table"><thead><tr><th>Market question</th><th>UC position</th><th>Top competitor</th><th>Their position</th><th>UC citations</th><th>Result</th></tr></thead><tbody>{rows.map((entry: CleoQuestion, index) => <tr key={`${entry.question}-${index}`}>
      <td>{entry.question}</td><td>{entry.unionCoopPosition}</td><td>{entry.competitor ?? 'n/a (none supplied)'}</td><td>{entry.competitorPosition ?? 'n/a'}</td><td>{integer(entry.unionCoopCitations)} / {integer(entry.totalCitations)}</td><td><span className="geo-result">{entry.result}</span></td>
    </tr>)}</tbody></table></div>
    {filtered.length === 0 ? <p className="geo-no-results">No imported questions match this filter.</p> : null}
    <div className="geo-table-footer"><span>Showing {rows.length} of {filtered.length} matching questions</span>{filtered.length > 6 ? <button type="button" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show fewer' : `See all ${filtered.length} questions`}</button> : null}</div>
    <SourceNote window={data.windowLabels.questions} capture={data.captureDate} />
  </section>;
}
function LanguagePanel({ data }: { data: CleoSnapshot }) {
  const max = Math.max(...data.language.map((row) => row.searches), 1);
  return <section className="geo-panel" aria-label="Language of the market"><SectionHead title="Language of the market" note="Phrases occurring in AI searches, not predicted search demand" index="06" />
    <div className="geo-language-list">{data.language.map((entry) => <div className="geo-language-row" key={entry.phrase}>
      <div><strong>{entry.phrase}</strong><small>{integer(entry.distinctQuestions)} distinct questions</small></div>
      <div className="geo-language-meter"><span style={{ width: barWidth((entry.searches / max) * 100) }} /></div><b>{integer(entry.searches)}</b>
    </div>)}</div><SourceNote window={data.windowLabels.language} capture={data.captureDate} />
  </section>;
}

export function GeoDashboardPage() {
  const [captureDate, setCaptureDate] = useState('');
  const query = useQuery({
    queryKey: ['geo', 'union-coop', captureDate],
    queryFn: async () => (await http.get<{ data: CleoSnapshot }>('/creative/cleo', { params: { brand: 'union-coop', ...(captureDate ? { captureDate } : {}) } })).data.data,
    staleTime: 120_000,
  });
  const data = query.data;
  const recommended = data?.funnel.find((entry) => /recommended/i.test(entry.stage));
  const answered = data?.funnel.find((entry) => /AI answers analysed/i.test(entry.stage));
  const unionDomain = data?.domains.find((entry) => /unioncoop\.ae/i.test(entry.domain));
  const citedQuestions = data?.questions.filter((entry) => entry.unionCoopCitations > 0).length;
  return <div className="geo-page">
    <header className="geo-page-header">
      <div><div className="geo-eyebrow"><Globe2 size={15} aria-hidden="true" /> GENERATIVE ENGINE OPTIMIZATION <span>GEO · IMPORTED DATA</span></div>
        <h1>AI search visibility<span className="geo-title-dot">.</span></h1>
        <p>Where Union Coop appears, gets cited and is recommended across AI-generated grocery answers in the UAE.</p>
      </div>
      <div className="geo-page-actions"><label><span>Brand</span><select aria-label="GEO brand" value="union-coop" disabled><option value="union-coop">Union Coop</option></select></label>
        <label><span>Capture</span><select aria-label="GEO capture date" value={captureDate || data?.captureDate || ''} onChange={(event) => setCaptureDate(event.target.value)} disabled={!data || data.availableCaptures.length <= 1}>
          {data ? data.availableCaptures.map((item) => <option key={item} value={item}>{captureLabel(item)}</option>) : <option value="">Loading capture</option>}
        </select></label></div>
    </header>
    {query.isLoading ? <div className="geo-status" role="status"><Database size={22} />Loading approved CLEO workbook data...</div>
      : query.isError || !data ? <div className="geo-status geo-error" role="alert"><AlertCircle size={24} /><div><strong>GEO import unavailable</strong><p>The GEO view uses the backend CLEO import. Check <code>spreadsheets data/creative-tab/UnionCoop-CLEO-Market-Import.xlsx</code> and the server's /api/v1/creative/cleo endpoint.</p><button onClick={() => void query.refetch()} type="button">Try again</button></div></div>
      : <>
        <div className="geo-capture-strip"><div><span className="geo-live-dot" />VERIFIED IMPORT STRUCTURE <span className="geo-muted">/</span> CLEO CAPTURE #{data.availableCaptures.length} <span className="geo-muted">/</span> <CalendarDays size={14} aria-hidden="true" /> {captureLabel(data.captureDate)}</div><span>Not a composite GEO score</span></div>
        <div className="geo-kpi-grid">
          <Kpi label="Share of AI voice" value={pct(data.allTopics.shares.unionCoop)} detail={`${integer(data.allTopics.answers)} AI answers analyzed`} supporting={`Carrefour ${pct(data.allTopics.shares.carrefour)} · LuLu ${pct(data.allTopics.shares.lulu)}`} window={data.windowLabels.topics} capture={data.captureDate} variant="accent" />
          <Kpi label="Recommended in answers" value={recommended?.shareDisplay ?? 'n/a'} detail={`${recommended ? integer(recommended.count) : 'n/a'} of ${answered ? integer(answered.count) : 'n/a'} analyzed answers`} supporting="Latest-week visibility funnel" window={data.windowLabels.funnel} capture={data.captureDate} />
          <Kpi label="Union Coop domain citations" value={unionDomain ? integer(unionDomain.citations) : 'n/a'} detail={unionDomain ? `Rank #${unionDomain.rank} · ${unionDomain.shareDisplay} of citations` : 'Union Coop domain not supplied'} supporting={unionDomain ? `Period trend ${unionDomain.trendDisplay}` : 'Unavailable'} window={data.windowLabels.domains} capture={data.captureDate} />
          <Kpi label="Cited tracked questions" value={`${citedQuestions ?? 0} / ${data.questions.length}`} detail="Questions where Union Coop is cited" supporting="Appearances are not wins · separate 30-day question set" window={data.windowLabels.questions} capture={data.captureDate} />
        </div>
        <div className="geo-explainer"><span><Info size={17} aria-hidden="true" /></span><p><strong>How to read this dashboard.</strong> All values come from TBL's approved CLEO export. Windows vary by panel (7, 28, 30, and 90 days). Do not compare unrelated windows or interpret this data as a scored marketing KPI.</p><Link to="/creative?brand=union-coop">Open Creative <ArrowUpRight size={14} /></Link></div>
        <div className="geo-panels geo-primary-panels"><TopicTable data={data} /><FunnelPanel data={data} /></div>
        <div className="geo-panels geo-secondary-panels"><PositionPanel data={data} /><CitationPanel data={data} /></div>
        <QuestionsPanel data={data} />
        <LanguagePanel data={data} />
        <footer className="geo-page-footer"><div><ChartNoAxesCombined size={18} aria-hidden="true" /><strong>Source-controlled GEO context</strong><span>Unscored · Union Coop only · monthly TBL workbook import</span></div>
          <p><FileSpreadsheet size={14} aria-hidden="true" /> {data.sourceFile}</p><p>{SOURCE}</p>
          <p>No GEO score, placeholder Sentiment values, editorial threat labels or unverified uplift estimates. Like-for-like comparisons require a later approved capture.</p>
        </footer>
      </>}
  </div>;
}

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { http } from '../../../api/http';
import type { CleoSnapshot } from './cleo-types';
import './cleo-market.css';

const SOURCE = 'Source: CLEO - single-source, not independently verifiable.';
const number = (value: number) => value.toLocaleString('en-US');
const display = (value: number | null) => value === null ? 'n/a (not cited)' : value.toFixed(1);

function SourceLine({ window, capture }: { window: string; capture: string }) {
  return <p className="cleo-source">{SOURCE}<span>{window} · Captured {capture}</span></p>;
}
function Stat({ label, value, detail, window, capture }: { label: string; value: string; detail: string; window: string; capture: string }) {
  return <article className="cleo-card"><div className="cleo-overline">{label}</div><strong className="cleo-number">{value}</strong><p>{detail}</p><SourceLine window={window} capture={capture} /></article>;
}
function Heading({ title, caption }: { title: string; caption?: string }) {
  return <div className="cleo-card-heading"><h4>{title}</h4>{caption ? <span>{caption}</span> : null}</div>;
}
export function CleoMarketPanel() {
  const [captureDate, setCaptureDate] = useState<string>();
  const query = useQuery({
    queryKey: ['creative', 'cleo', captureDate],
    queryFn: async () => (await http.get<{ data: CleoSnapshot }>('/creative/cleo', { params: { brand: 'union-coop', ...(captureDate ? { captureDate } : {}) } })).data.data,
    staleTime: 120000,
  });
  const data = query.data;
  return <section className="cleo-market" aria-label="What the market is asking">
    <header className="cleo-heading"><div><div className="cleo-eyebrow">UNSCORED CONTEXT · UNION COOP ONLY</div><h3>What the market is asking</h3><p>AI-generated answers about UAE groceries. These are single-source visibility observations, not a performance score.</p></div>
      {data && <label className="cleo-capture"><span>Monthly capture</span><select aria-label="CLEO capture date" value={captureDate ?? data.captureDate} onChange={(e) => setCaptureDate(e.target.value)}>{data.availableCaptures.map((date) => <option key={date} value={date}>{date}</option>)}</select></label>}
    </header>
    {query.isLoading ? <div className="cleo-awaiting">Loading the approved CLEO import...</div> : query.isError || !data ? <div className="cleo-awaiting">AWAITING CLEO import. Check the Creative tab data folder and the backend import endpoint.</div> : <>
      <div className="cleo-stats">
        <Stat label="Share of AI voice" value={`${data.allTopics.shares.unionCoop}%`} detail={`${number(data.allTopics.answers)} answers · Carrefour ${data.allTopics.shares.carrefour}% · LuLu ${data.allTopics.shares.lulu}%`} window={data.windowLabels.topics} capture={data.captureDate} />
        <Stat label="Cooperative supermarkets" value={`${data.topics.find((row) => row.topic === 'Cooperative supermarkets')?.shares.unionCoop ?? 'n/a'}%`} detail={(() => { const row = data.topics.find((r) => r.topic === 'Cooperative supermarkets'); return row ? `${row.answers} answers · ${row.leader}` : 'Category not supplied'; })()} window={data.windowLabels.topics} capture={data.captureDate} />
        <Stat label="AI visibility · recommended" value={data.funnel.find((row) => /recommended/i.test(row.stage))?.shareDisplay ?? 'n/a'} detail={`${data.funnel[0] ? number(data.funnel[0].count) : 'n/a'} answers analysed · ${(() => { const row = data.funnel.find((entry) => /recommended/i.test(entry.stage)); return row ? number(row.count) : 'n/a'; })()} recommendations`} window={data.windowLabels.funnel} capture={data.captureDate} />
        <Stat label="Own domain rank · citation share" value={data.domains[0] ? `#${data.domains[0].rank} · ${data.domains[0].shareDisplay}` : 'n/a'} detail={data.domains[0] ? `${number(data.domains[0].citations)} citations · trend ${data.domains[0].trendDisplay} · recommended ${data.funnel.find((row) => /recommended/i.test(row.stage))?.shareDisplay ?? 'n/a'} (latest week)` : 'Not supplied'} window={`${data.windowLabels.domains}; recommendation: ${data.windowLabels.funnel}`} capture={data.captureDate} />
      </div>
      <article className="cleo-card cleo-wide"><Heading title="AI voice by category" caption={`${data.windowLabels.topics} · ${data.allTopics.answers} all-topic answers`} /><div className="cleo-scroll"><table><thead><tr><th>Topic</th><th>Answers</th><th>Union Coop</th><th>Carrefour</th><th>LuLu</th><th>Spinneys</th><th>Waitrose</th><th>Other</th><th>Leader</th></tr></thead><tbody>{data.topics.map((row) => <tr key={row.topic}><th>{row.topic}</th><td>{number(row.answers)}</td><td>{row.shares.unionCoop}%</td><td>{row.shares.carrefour}%</td><td>{row.shares.lulu}%</td><td>{row.shares.spinneys}%</td><td>{row.shares.waitrose}%</td><td>{row.otherDisplay}</td><td>{row.leader}</td></tr>)}</tbody></table></div><SourceLine window={data.windowLabels.topics} capture={data.captureDate} /></article>
      <div className="cleo-bottom-grid">
        <article className="cleo-card"><Heading title="Visibility funnel" caption={data.windowLabels.funnel} /><div className="cleo-stage-list">{data.funnel.map((row) => <div key={row.stage}><span>{row.stage}</span><b>{number(row.count)} <small>({row.shareDisplay})</small></b></div>)}</div><SourceLine window={data.windowLabels.funnel} capture={data.captureDate} /></article>
        <article className="cleo-card"><Heading title="Citations and recommendations" caption="Different source windows" /><div className="cleo-stage-list">{data.domains.slice(0, 3).map((row) => <div key={row.domain}><span>#{row.rank} {row.domain}</span><b>{number(row.citations)} · {row.shareDisplay}</b></div>)}</div>{data.funnelSupport && <p className="cleo-context">{data.funnelSupport}</p>}<SourceLine window={`${data.windowLabels.domains} citations; ${data.windowLabels.funnel} recommendations`} capture={data.captureDate} /></article>
      </div>
      <article className="cleo-card cleo-wide"><Heading title="Questions people ask AI" caption={`${data.questions.length} imported questions · ${data.windowLabels.questions}`} /><p className="cleo-context">{data.questionSummary || 'Summary unavailable; individual source rows only.'}</p><div className="cleo-scroll"><table><thead><tr><th>Question</th><th>Union Coop position</th><th>Top cited competitor</th><th>Competitor position</th><th>Union Coop citations</th><th>Result</th></tr></thead><tbody>{data.questions.map((row, index) => <tr key={`${row.question}-${index}`}><td className="cleo-question">{row.question}</td><td>{row.unionCoopPosition}</td><td>{row.competitor ?? 'n/a (none cited)'}</td><td>{row.competitorPosition ?? 'n/a (none cited)'}</td><td>{number(row.unionCoopCitations)} / {number(row.totalCitations)}</td><td>{row.result}</td></tr>)}</tbody></table></div><SourceLine window={data.windowLabels.questions} capture={data.captureDate} /></article>
      <div className="cleo-bottom-grid">
        <article className="cleo-card"><Heading title="Position by AI engine" caption={`${data.windowLabels.positions} · lower is better`} /><div className="cleo-scroll"><table><thead><tr><th>Brand</th><th>Google AIO</th><th>Perplexity</th><th>Claude</th><th>ChatGPT Search</th></tr></thead><tbody>{data.positions.map((row) => <tr key={row.brand}><th>{row.brand}</th><td>{display(row.googleAio)}</td><td>{display(row.perplexity)}</td><td>{display(row.claude)}</td><td>{display(row.chatgptSearch)}</td></tr>)}</tbody></table></div>{data.engineSupport && <p className="cleo-context">{data.engineSupport}</p>}<SourceLine window={data.windowLabels.positions} capture={data.captureDate} /></article>
        <article className="cleo-card"><Heading title="Language of the market" caption={`${data.windowLabels.language} · AI search terms`} /><div className="cleo-phrases">{data.language.map((row) => <div key={row.phrase}><span>{row.phrase}</span><b>{number(row.searches)}</b><small>{number(row.distinctQuestions)} distinct questions</small></div>)}</div><SourceLine window={data.windowLabels.language} capture={data.captureDate} /></article>
      </div>
      <footer className="cleo-footer"><strong>Import: {data.sourceFile}</strong><span>Capture {data.captureDate}. No composite GEO score, Sentiment or editorial threat ratings. Like-for-like deltas only after a second verified capture.</span><p>{data.caveats.join(' ')}</p></footer>
    </>}
  </section>;
}

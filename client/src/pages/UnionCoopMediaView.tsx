import { useSearchParams } from 'react-router-dom';
import { useUnionCoop } from '../features/media/hooks/use-media-data';
import { UnionCoopSpendSummary, UnionCoopReach, UnionCoopBursts } from '../features/media/components/UnionCoopMediaSections';
import { CompetitionDropdown, ContextualCompetitionPanel, useContextualCompetition } from '../features/competition/components/ContextualCompetition';
import { AwaitingLine, SectionAnatomy } from '../components/v2/Reporting';
import { UnionCoopCompetitionOverview } from '../features/media/components/UnionCoopCompetitionOverview';
import { TblReadsStrip } from '../features/reads/TblReadsStrip';
export function UnionCoopMediaView() {
  const [params,setParams]=useSearchParams();
  const year=Number(params.get('year'))||2026;
  const month=Number(params.get('month'))||10;
  const data=useUnionCoop({year,month});
  const competitionContext=useContextualCompetition('union-coop',year,month);
  const update=(key:string,value:string)=>{const next=new URLSearchParams(params);next.set('client','union-coop');next.set(key,value);setParams(next);};
  const section={client:'Union Coop',readSection:'Media' as const,year,month};
  return <section className="reference-media-page v2-union-media">
    <div className="reference-media-heading"><div className="v2-client-heading"><h2>Union Coop · Media</h2></div><div className="v2-coop-reporting-controls"><label>Year <input type="number" min={2020} max={2099} value={year} onChange={e=>{if(e.target.value.length===4)update('year',e.target.value)}}/></label><label>Month <select value={month} onChange={e=>update('month',e.target.value)}>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{new Date(Date.UTC(year,i,1)).toLocaleString('en',{month:'long',timeZone:'UTC'})}</option>)}</select></label><div className="media-compare-control"><CompetitionDropdown context={competitionContext}/></div></div></div>
    <TblReadsStrip client="Union Coop" section="Media" year={year} month={month}/>
    <p className="v2-section-definition">Paid and organic are never blended. Public views may include both until platform ad reports reconcile.</p>
    {data.isError?<AwaitingLine source="Union Coop Media source could not be loaded. Check the API and workbook schema." owner="Media team"/>:null}
    <SectionAnatomy {...section} number={1} label="Spend and return" question="What went in, what it delivered" definition="Platform spend and public delivery by approved burst. Paid and organic are separate sources."><UnionCoopSpendSummary data={data.data}/><AwaitingLine source="Site traffic and sales return connects when unioncoop.ae analytics is supplied." owner="Client digital team"/></SectionAnatomy>
    <SectionAnatomy {...section} number={2} label="Paid beside organic" question="The separation, standing – not a one-time answer" definition="Daily page reach is separate from post-level organic reach. Paid confirmation is imported."><UnionCoopReach data={data.data}/></SectionAnatomy>
    <SectionAnatomy {...section} number={3} label="Bursts" question="Each boost accounted for · boosted posts marked in the content register" definition="Imported burst register, spend and known public delivery; no conversion estimates."><UnionCoopBursts data={data.data}/></SectionAnatomy>
    <SectionAnatomy {...section} number={4} label="Competition" question="What rivals are running" definition="Meta Ad Library · activity, not spend.">{competitionContext.selectedCompetitor?<ContextualCompetitionPanel context={competitionContext} view="media"/>:<UnionCoopCompetitionOverview year={year} month={month}/>}</SectionAnatomy>
  </section>;
}

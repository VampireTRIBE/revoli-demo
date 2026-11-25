import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GeoDashboardPage } from './GeoDashboardPage';
import '../styles/bizcom-v2.css';

/** Search is the single client-facing home for classic and AI search. */
export function SearchDashboardPage() {
  const [params, setParams] = useSearchParams();
  useEffect(() => {if(!params.has('competition'))return;const next=new URLSearchParams(params);next.delete('competition');setParams(next,{replace:true});},[params,setParams]);
  const panel = params.get('panel') === 'ai' ? 'ai' : 'classic';
  return <section className="v2-search-page" aria-label="Search reporting">
    <div className="v2-search-head"><div><span className="v2-eyebrow">Search intelligence</span><h2>Search</h2><p>Classic search and AI search are separate sources and measurement systems.</p></div><span className="v2-unscored">UNSCORED · BASELINES PENDING</span></div>
    <div className="v2-search-tabs" role="tablist" aria-label="Search data source">
      <button role="tab" aria-selected={panel === 'classic'} className={panel === 'classic' ? 'selected' : ''} onClick={() => setParams({panel:'classic'})}>Classic search</button>
      <button role="tab" aria-selected={panel === 'ai'} className={panel === 'ai' ? 'selected' : ''} onClick={() => setParams({panel:'ai'})}>AI search</button>
    </div>
    {panel === 'classic' ? <div role="tabpanel" className="v2-search-await"><span className="v2-awaiting-dot"/><span><b>AWAITING</b> Classic search source workbook and approved definitions have not been supplied. Owner: TBL / Search team.</span></div>
      : <div role="tabpanel" className="v2-search-ai"><div className="v2-competition-source">AI SEARCH · Union Coop · CLEO imported observations · unscored context</div><GeoDashboardPage /></div>}
  </section>;
}

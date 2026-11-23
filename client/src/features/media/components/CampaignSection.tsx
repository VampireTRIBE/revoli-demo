import { useEffect, useMemo, useRef, useState } from 'react';
import type { Campaign, MediaFilter } from '../../../types/media';
import { useCampaigns } from '../hooks/use-media-data';
import { formatAED, formatCampaignName, formatNumber, formatPercent } from '../utils/formatters';
import { AwaitingLine } from '../../../components/v2/Reporting';
import { EmptyState, ErrorState } from './StateCard';
import { LoadingSkeleton } from './LoadingSkeleton';

type Objective = 'Conversion' | 'Traffic' | 'Awareness' | 'Not supplied';
/** No objective is inferred from the campaign's outcome: it must be documented by the imported type. */
function objective(row: Campaign): Objective {
  const field = `${row.campaignType} ${row.stage}`.toLowerCase();
  if (/conversions?|purchase(s)?|sales|acquisition/.test(field)) return 'Conversion';
  if (/traffic|visits|clicks|landing page/.test(field)) return 'Traffic';
  if (/awareness|views|reach|impressions|video views/.test(field)) return 'Awareness';
  return 'Not supplied';
}
function cost(row:Campaign, category:Objective): number | null {
  if(category==='Conversion') return row.claims!=null&&row.claims>0 ? row.spend/row.claims : null;
  if(category==='Traffic') {
    const actions = row.platform==='Google Ads'?row.interactions:row.clicks;
    return actions!=null&&actions>0 ? row.spend/actions : null;
  }
  if(category==='Awareness') return row.impressions!=null&&row.impressions>0?1000*row.spend/row.impressions:null;
  return null;
}
const objectiveResult = (category:Objective) => category==='Conversion'?'Reported conversions':category==='Traffic'?'Reported traffic actions':category==='Awareness'?'Reported impressions':'Result n/a';
const objectiveCost = (category:Objective) => category==='Conversion'?'Cost / reported conversion':category==='Traffic'?'Cost / reported traffic action':category==='Awareness'?'Cost / 1,000 impressions':'Cost / result n/a';
function Table({rows}:{rows:Campaign[]}) {
  return <div className="reference-table-wrap reference-mobile-table reference-campaign-table"><table><thead><tr><th>Campaign</th><th>Objective</th><th className="num">Spend</th><th className="num">Source result</th><th className="num">Cost / result</th><th className="num">CTR as reported</th></tr></thead><tbody>{rows.map((row,index)=>{
    const category=objective(row),unit=cost(row,category);
    const actions=category==='Conversion'?row.claims:category==='Traffic'?(row.platform==='Google Ads'?row.interactions:row.clicks):category==='Awareness'?row.impressions:null;
    return <tr key={`${row.platform}-${row.campaign}-${index}`}>
      <td title={row.campaign}><span className="v2-campaign-name">{formatCampaignName(row.campaign)}</span><small>Thumbnail awaiting approved image import</small></td>
      <td><span className="v2-objective">{category}</span></td>
      <td className="num">{formatAED(row.spend)}</td>
      <td className="num" title={objectiveResult(category)}>{actions==null?'n/a':formatNumber(actions)}</td>
      <td className="num" title={objectiveCost(category)}>{unit==null?'n/a':formatAED(unit)}</td>
      <td className="num">{formatPercent(row.ctr,2)}<small className="reference-rate-label">{row.ctrLabel}</small></td>
    </tr>;
  })}</tbody></table></div>;
}

export function CampaignSection({ filter }: { filter: MediaFilter }) {
  const [platform,setPlatform]=useState<'Meta Ads'|'Google Ads'>('Meta Ads');
  const [objectiveFilter,setObjectiveFilter]=useState<Objective>('Conversion');
  const dialog=useRef<HTMLDialogElement>(null);
  const [search,setSearch]=useState('');
  const query=useCampaigns(filter,{platform,page:1,limit:1000,sort:'spend',order:'desc'});
  const availableQuery=useCampaigns(filter,{page:1,limit:1000,sort:'spend',order:'desc'});
  const platforms=useMemo(()=>new Set(availableQuery.data?.campaigns.map((item)=>item.platform)??[]),[availableQuery.data]);
  useEffect(()=>{if(availableQuery.isSuccess&&!platforms.has(platform)){
    if(platforms.has('Google Ads'))setPlatform('Google Ads');else if(platforms.has('Meta Ads'))setPlatform('Meta Ads');
  }},[availableQuery.isSuccess,platform,platforms]);
  const rows=query.data?.campaigns??[];
  const valid=rows.filter((row)=>objective(row)===objectiveFilter);
  const sortable=valid.filter((row)=>cost(row,objectiveFilter)!=null);
  const ordered=[...sortable].sort((a,b)=>(cost(a,objectiveFilter)??0)-(cost(b,objectiveFilter)??0));
  const best=ordered.slice(0,3);
  const bestKeys=new Set(best.map((r)=>`${r.platform}|${r.campaign}`));
  const worst=ordered.filter((r)=>!bestKeys.has(`${r.platform}|${r.campaign}`)).reverse().slice(0,3);
  const shown=[...best,...worst];
  const availableObjectives=useMemo(()=>new Set(rows.map(objective)),[rows]);
  useEffect(()=>{if(rows.length&&!availableObjectives.has(objectiveFilter))setObjectiveFilter(availableObjectives.has('Conversion')?'Conversion':availableObjectives.has('Traffic')?'Traffic':availableObjectives.has('Awareness')?'Awareness':'Not supplied');},[rows.length,availableObjectives,objectiveFilter]);
  const fullFiltered=rows.filter((r)=>`${r.campaign} ${r.platform} ${r.campaignType}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <section className="reference-card reference-mt reference-campaign-detail-card">
    <div className="reference-subtabs" aria-label="Campaign platform">
      <button type="button" className={`reference-subtab${platform==='Meta Ads'?' active':''}`} onClick={()=>setPlatform('Meta Ads')} disabled={!availableQuery.isLoading&&!platforms.has('Meta Ads')}>Meta</button>
      <button type="button" className={`reference-subtab${platform==='Google Ads'?' active':''}`} onClick={()=>setPlatform('Google Ads')} disabled={!availableQuery.isLoading&&!platforms.has('Google Ads')}>Google</button>
      <label className="v2-campaign-objective">Objective <select value={objectiveFilter} onChange={(e)=>setObjectiveFilter(e.target.value as Objective)}>{(['Conversion','Traffic','Awareness','Not supplied'] as const).map((value)=><option key={value} value={value}>{value}{availableObjectives.has(value)?'':' (no import)'}</option>)}</select></label>
    </div>
    {query.isLoading?<LoadingSkeleton/>:query.isError?<ErrorState message="Campaign data could not be loaded."/>:rows.length? <>
      {objectiveFilter==='Not supplied' ? <AwaitingLine source="Campaign objectives are not supplied for these imported rows. Ranking is disabled until approved objective labels arrive." owner="Media team"/> : <p className="v2-section-definition">Rankings are mechanical {objectiveCost(objectiveFilter).toLowerCase()} comparisons within {objectiveFilter.toLowerCase()} campaigns only. They are not recommendations.</p>}
      {shown.length>0?<div className="media-campaign-results"><b>Lowest reported cost ({objectiveFilter})</b><Table rows={best}/><b>Highest reported cost ({objectiveFilter})</b><Table rows={worst}/></div>
      : <AwaitingLine source={objectiveFilter==='Not supplied'?'Approved campaign Objective column required.':'No comparable result denominator for this objective and period.'} owner="Media team"/>}
      <button type="button" className="media-see-all" onClick={()=>dialog.current?.showModal()}>See all campaigns ({query.data?.pagination.total??rows.length})</button>
      <dialog ref={dialog} className="media-comp-register-dialog" aria-label="Complete campaign register" onClick={(e)=>{if(e.target===dialog.current)dialog.current?.close()}}>
        <div className="media-comp-register-content"><div className="media-comp-register-heading"><h2>All imported campaigns · {rows.length}</h2><button type="button" onClick={()=>dialog.current?.close()} aria-label="Close campaign register">Close ×</button></div>
          <label>Search <input type="search" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Find a campaign"/></label>
          <Table rows={fullFiltered}/>
        </div>
      </dialog>
    </> : <EmptyState message="No campaign rows available for this platform and period."/>}
    <p className="media-comp-muted">Editorial verdicts are imported only when explicitly signed. No analysis is generated.</p>
  </section>;
}

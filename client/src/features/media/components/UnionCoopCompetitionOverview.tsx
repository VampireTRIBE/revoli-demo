import { useState } from 'react';
import { useCompetitionDashboard, useCompetitionOptions } from '../../competition/hooks/use-competition-data';
import type { CompetitionDashboard } from '../../../types/competition';
import { competitionAssetUrl } from '../../competition/services/competition-api';
import { AwaitingLine } from '../../../components/v2/Reporting';
function CaptureSummary({data}:{data?:CompetitionDashboard}) {
  if(!data?.available)return <AwaitingLine source="Matching approved competition capture is unavailable." owner="TBL"/>;
  const longest=data.longestRunning.filter(row=>row.startDateAvailable!==false).reduce<number|null>((max,row)=>Math.max(max??0,row.calculatedDaysRunning),null);
  return <article className="v2-coop-capture"><h4>{data.competitor.label}</h4><p>{data.activity.activeAds??'n/a'} live ads · avg {data.activity.averageDaysRunning?.toFixed(1)??'n/a'} days running · oldest {longest??'n/a'} days · {data.capture.date}</p>{data.themeMix.map(row=><div className="v2-coop-theme" key={row.label}><span>{row.label}</span><i><b style={{width:`${Math.min(100,Math.max(0,row.percentage*100))}%`}}/></i><strong>{row.count}</strong></div>)}{data.signedHighlights?.map(line=><p className="v2-section-highlight" key={line}>💡 {line} <small>{data.capture.date} · signed</small></p>)}<p className="v2-section-source">{data.sourceLabel}</p></article>;
}
export function UnionCoopCompetitionOverview({year,month}:{year:number;month:number}) {
  const options=useCompetitionOptions('union-coop');
  const dates=Array.from(new Set((options.data?.years??[]).flatMap(y=>y.months.flatMap(m=>m.captureDates)))).sort().reverse();
  const [capture,setCapture]=useState('');
  const date=dates.includes(capture)?capture:dates[0];
  const carrefour=useCompetitionDashboard({year:date?Number(date.slice(0,4)):undefined,month,competitor:'carrefour-uae',channel:'Meta',captureDate:date});
  const lulu=useCompetitionDashboard({year:date?Number(date.slice(0,4)):undefined,month,competitor:'lulu-hypermarket',channel:'Meta',captureDate:date});
  return <div className="v2-coop-card"><div className="v2-competition-source">COMPETITOR VIEW · Union Coop · Carrefour UAE / LuLu Hypermarket · Meta Ad Library · activity, not spend</div><div className="v2-coop-capture-head"><label>Capture <select value={date??''} onChange={e=>setCapture(e.target.value)}>{dates.map(d=><option key={d}>{d}</option>)}</select></label><small>Independent of own reporting period {year}-{String(month).padStart(2,'0')}</small></div>{options.isLoading||carrefour.isLoading||lulu.isLoading?<p role="status">Loading captures…</p>:options.isError||carrefour.isError||lulu.isError?<AwaitingLine source="Competition capture request failed." owner="Tech team"/>:<div className="v2-coop-capture-grid"><CaptureSummary data={carrefour.data}/><CaptureSummary data={lulu.data}/></div>}<h4>The competitor’s wall</h4>{[carrefour.data,lulu.data].some(item=>Boolean(item?.screenshots.length))?<div className="v2-coop-wall">{[carrefour.data,lulu.data].flatMap(item=>(item?.screenshots??[]).map(image=><figure key={`${item?.competitor.id}:${image.ref}`}><img src={competitionAssetUrl(image.assetUrl)} alt={`${item?.competitor.label} · ${image.ref}`} loading="lazy"/><figcaption>{item?.competitor.label} · {image.ref}</figcaption></figure>))}</div>:<AwaitingLine source="Approved Carrefour / LuLu gallery thumbnails have not been supplied for this capture." owner="TBL"/>}<p className="v2-section-definition">Choose either competitor in Compare against to open its full register, launch waves and gallery.</p></div>;
}

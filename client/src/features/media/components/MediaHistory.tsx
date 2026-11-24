import { DeltaLine, SparkBars } from '../../../components/v2/Reporting';
import type { MediaMonthlyHistory } from '../../../types/media';

type Key = 'spend'|'itemRevenue'|'coverage'|'platformCostPerClaim'|'siteAov';
export function MediaHistory({history,month,keyName,asPoints=false}: {history?:MediaMonthlyHistory;month?:number;keyName:Key;asPoints?:boolean}) {
  if (!history || !month || month < 1 || month > 12) return null;
  const current = history.months.find((row)=>row.month===month);
  if (!current || current[keyName]===null) return null;
  const previous=history.months.find((row)=>row.year===current.year&&row.month===month-1);
  const currentValue=current[keyName];
  const prevValue=previous?.[keyName]??null;
  const canCompare=!current.partial&&Boolean(previous)&&!previous?.partial&&prevValue!==null;
  const series=Array.from({length:Math.min(month,8)},(_,i)=>{
    const period=month-Math.min(month,8)+i+1;
    const row=history.months.find((item)=>item.year===current.year&&item.month===period);
    return row?.[keyName]??null;
  });
  return <div className="v2-media-history">
    {canCompare&&currentValue!==null?<DeltaLine previous={asPoints?prevValue!*100:prevValue} current={asPoints?currentValue*100:currentValue} kind={asPoints?'points':'relative'} period={`${previous!.label} ${previous!.year}`}/>:null}
    <SparkBars values={series}/>
  </div>;
}

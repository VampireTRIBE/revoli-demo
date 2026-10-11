interface Props {
  label: string;
  value: string;
  detail: string;
  score?: number | null;
  unavailable?: boolean;
  trend?: number[];
  deltaLabel?: string;
}

export function CreativeMetricCard({ label, value, detail, score, unavailable = false, trend, deltaLabel }: Props) {
  const tone = score == null || score < 45 ? 'bad' : score >= 70 ? 'good' : 'warn';
  return <div className="creative-card creative-kpi">
    <div className="creative-kpi-label">{label}</div>
    <div className={`creative-kpi-value${unavailable ? ' unavailable' : ''}`}>{value}</div>
    <div className="creative-kpi-detail">{detail}</div>
    {trend && trend.length > 1 ? <div className="creative-mini-trend"><svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points={sparkline(trend)} /></svg>{deltaLabel ? <span>{deltaLabel}</span> : null}</div> : null}
    {score != null ? <div className={`creative-scorebar ${tone}`}><div className="creative-score-track"><span style={{ width: `${score}%` }} /></div><strong>{score}</strong></div> : null}
  </div>;
}

function sparkline(values: number[]): string {
  const min=Math.min(...values),max=Math.max(...values),range=max-min||1;
  return values.map((value,index)=>`${(index/(values.length-1))*100},${27-((value-min)/range)*23}`).join(' ');
}

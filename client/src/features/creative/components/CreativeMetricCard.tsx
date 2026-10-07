interface Props {
  label: string;
  value: string;
  detail: string;
  score?: number | null;
  unavailable?: boolean;
}

export function CreativeMetricCard({ label, value, detail, score, unavailable = false }: Props) {
  const tone = score == null || score < 45 ? 'bad' : score >= 70 ? 'good' : 'warn';
  return <div className="creative-card creative-kpi">
    <div className="creative-kpi-label">{label}</div>
    <div className={`creative-kpi-value${unavailable ? ' unavailable' : ''}`}>{value}</div>
    <div className="creative-kpi-detail">{detail}</div>
    {score != null ? <div className={`creative-scorebar ${tone}`}><div className="creative-score-track"><span style={{ width: `${score}%` }} /></div><strong>{score}</strong></div> : null}
  </div>;
}

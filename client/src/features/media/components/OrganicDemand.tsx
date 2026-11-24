import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OrganicData } from '../../../types/media';
import { formatNumber, formatPercent } from '../utils/formatters';
import { SectionCard } from './SectionCard';

export function OrganicDemand({ data }: { data: OrganicData }) {
  return <div className="dashboard-grid">
    <SectionCard title="Organic demand" eyebrow="Search demand baseline">
      <div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.trend} margin={{ left: 2, right: 8 }}>
        <CartesianGrid stroke="var(--v2-line)" vertical={false} /><XAxis dataKey="label" tick={{ fill: '#5A646E', fontSize: 10 }} tickFormatter={(value: string) => value.slice(0, 3)} /><YAxis tick={{ fill: '#5A646E', fontSize: 10 }} width={45} />
        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E2DE', borderRadius: 10 }} formatter={(value) => formatNumber(Number(value))} />
        <Line type="linear" connectNulls={false} dataKey="clicks" stroke="#141413" strokeWidth={2} dot={{r:2}} />
      </LineChart></ResponsiveContainer></div>
      <p className="section-note">Organic clicks and impressions are kept separate from paid-media calculations.</p>
    </SectionCard>
    <SectionCard title="Demand leaders" eyebrow="Brand and market">
      <div className="organic-split"><div><h3>Brands</h3>{data.byBrand.slice(0, 6).map((row) => <div className="leader-row" key={row.label}><span>{row.label}</span><b>{formatNumber(row.clicks)} clicks</b><small>{formatPercent(row.ctr)} CTR</small></div>)}</div><div><h3>Markets</h3>{data.byMarket.map((row) => <div className="leader-row" key={row.label}><span>{row.label}</span><b>{formatNumber(row.clicks)} clicks</b></div>)}</div></div>
    </SectionCard>
  </div>;
}

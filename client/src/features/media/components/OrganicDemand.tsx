import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OrganicData } from '../../../types/media';
import { formatNumber, formatPercent } from '../utils/formatters';
import { SectionCard } from './SectionCard';

export function OrganicDemand({ data }: { data: OrganicData }) {
  return <div className="dashboard-grid">
    <SectionCard title="Organic demand" eyebrow="Search demand baseline">
      <div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.trend} margin={{ left: 2, right: 8 }}>
        <defs><linearGradient id="organicFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5eead4" stopOpacity={0.35}/><stop offset="100%" stopColor="#5eead4" stopOpacity={0}/></linearGradient></defs>
        <CartesianGrid stroke="#232936" vertical={false} /><XAxis dataKey="label" tick={{ fill: '#8b94a7', fontSize: 10 }} tickFormatter={(value: string) => value.slice(0, 3)} /><YAxis tick={{ fill: '#8b94a7', fontSize: 10 }} width={45} />
        <Tooltip contentStyle={{ background: '#14171f', border: '1px solid #2d3443', borderRadius: 10 }} formatter={(value) => formatNumber(Number(value))} />
        <Area type="monotone" dataKey="clicks" stroke="#5eead4" fill="url(#organicFill)" strokeWidth={2} />
      </AreaChart></ResponsiveContainer></div>
      <p className="section-note">Organic clicks and impressions are kept separate from paid-media calculations.</p>
    </SectionCard>
    <SectionCard title="Demand leaders" eyebrow="Brand and market">
      <div className="organic-split"><div><h3>Brands</h3>{data.byBrand.slice(0, 6).map((row) => <div className="leader-row" key={row.label}><span>{row.label}</span><b>{formatNumber(row.clicks)} clicks</b><small>{formatPercent(row.ctr)} CTR</small></div>)}</div><div><h3>Markets</h3>{data.byMarket.map((row) => <div className="leader-row" key={row.label}><span>{row.label}</span><b>{formatNumber(row.clicks)} clicks</b></div>)}</div></div>
    </SectionCard>
  </div>;
}

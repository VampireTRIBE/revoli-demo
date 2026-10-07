import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ReconciliationData } from '../../../types/media';
import { formatNumber, formatPercent } from '../utils/formatters';
import { SectionCard } from './SectionCard';

export function ReconciliationSection({ data }: { data: ReconciliationData }) {
  return <div className="dashboard-grid">
    <SectionCard title="Attribution reconciliation" eyebrow="Claims diagnostic">
      <dl className="reconciliation-summary">
        <div><dt>Platform claimed</dt><dd>{formatNumber(data.summary.platformClaims)}</dd></div>
        <div><dt>Site purchases</dt><dd>{formatNumber(data.summary.sitePurchases)}</dd></div>
        <div><dt>Difference</dt><dd className={data.summary.claimsDifference >= 0 ? 'positive' : 'negative'}>{data.summary.claimsDifference >= 0 ? '+' : ''}{formatNumber(data.summary.claimsDifference)}</dd></div>
        <div><dt>Claims vs site</dt><dd>{formatPercent(data.summary.claimsVsSite)}</dd></div>
      </dl>
      <div className="claim-breakdown"><span>Google <b>{formatNumber(data.summary.googleClaims)}</b></span><span>Meta <b>{formatNumber(data.summary.metaClaims)}</b></span></div>
      <p className="section-note">Platform claims may overlap. This module does not present them as verified orders.</p>
    </SectionCard>
    <SectionCard title="Claims vs site trend" eyebrow="Monthly comparison">
      <div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.monthlyTrend} margin={{ left: 2, right: 8 }}>
        <CartesianGrid stroke="#232936" vertical={false} /><XAxis dataKey="label" tick={{ fill: '#8b94a7', fontSize: 10 }} tickFormatter={(value: string) => value.slice(0, 3)} /><YAxis tick={{ fill: '#8b94a7', fontSize: 10 }} width={42} />
        <Tooltip contentStyle={{ background: '#14171f', border: '1px solid #2d3443', borderRadius: 10 }} /><Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="platformClaims" name="Platform claims" stroke="#7c9aff" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="sitePurchases" name="Site purchases" stroke="#5eead4" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart></ResponsiveContainer></div>
    </SectionCard>
  </div>;
}

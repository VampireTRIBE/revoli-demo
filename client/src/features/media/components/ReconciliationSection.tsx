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
        <CartesianGrid stroke="var(--v2-line)" vertical={false} /><XAxis dataKey="label" tick={{ fill: '#5A646E', fontSize: 10 }} tickFormatter={(value: string) => value.slice(0, 3)} /><YAxis tick={{ fill: '#5A646E', fontSize: 10 }} width={42} />
        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E2DE', borderRadius: 10 }} /><Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="linear" connectNulls={false} dataKey="platformClaims" name="Platform claims" stroke="#141413" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="linear" connectNulls={false} dataKey="sitePurchases" name="Site purchases" stroke="#5A646E" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart></ResponsiveContainer></div>
    </SectionCard>
  </div>;
}

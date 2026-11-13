import { useQuery } from '@tanstack/react-query';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { http } from '../../../api/http';
import type { ConsumerDashboard } from '../../../types/consumer';
import type { Overview } from '../../../types/media';
import { formatAED, formatNumber, formatRatio } from '../utils/formatters';
import '../../../styles/reference-consumer.css';

async function loadConsumerAlignment(year: number): Promise<ConsumerDashboard> {
  return (await http.get<{ data: ConsumerDashboard }>('/consumer/dashboard', { params: { year, month: 0 } })).data.data;
}

export function MediaConsumerAlignment({ year, overview, scopedSelection = false }: { year?: number; overview?: Overview; scopedSelection?: boolean }) {
  const query = useQuery({ queryKey: ['consumer', 'media-alignment', year], queryFn: () => loadConsumerAlignment(year!), enabled: Boolean(year) });
  if (!year) return <div className="reference-card">Select a reporting year to see spend and purchasers.</div>;
  if (query.isLoading) return <div className="reference-card">Loading spend and purchaser alignment...</div>;
  if (query.isError || !query.data) return <div className="reference-card">Consumer alignment unavailable. Verify the Consumer API and imported workbook.</div>;
  const entriesByMonth = new Map(query.data.aligned.map((row) => [row.month, row]));
  const partialMonths = new Set(query.data.series.filter((row) => row.partial).map((row) => row.month));
  const included = year === 2026 ? Array.from({length:10},(_,index)=>index+1) : query.data.aligned.map((row)=>row.month);
  const rows = included.map((month) => {
    const record = entriesByMonth.get(month);
    return {
      month: new Intl.DateTimeFormat('en-US',{month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,1))),
      spend: record?.mediaSpendAed ?? null, ftp: record?.firstTimePurchasers ?? null, partial: partialMonths.has(month),
    };
  });
  return <section className="reference-card media-alignment-v2">
    <div className="media-inout-kpis">
      <article><span>Platform spend · selected period</span><strong>{overview ? formatAED(overview.metrics.totalSpend) : 'n/a'}</strong><small>Google + Meta workbook exports</small></article>
      <article><span>Reported site item revenue · selected period</span><strong>{overview ? formatAED(overview.metrics.siteRevenue) : 'n/a'}</strong><small>Reconciled site import, not GA4 net revenue; GA4 v4 pending</small></article>
      <article><span>Revenue coverage</span><strong>{overview ? formatRatio(overview.metrics.directionalReturn.value) : 'n/a'}</strong><small>Coverage, not ROAS</small></article>
    </div>
    <h3>Spend and first-time purchasers · {year}</h3>
    <p>Separate sources and separate axes. Missing spend months remain gaps, never zeros. No platform ROAS is inferred. {scopedSelection ? "This yearly chart is overall Rivoli context and does not inherit the selected brand or segment filter; the KPI row above follows the current Media selection." : null}</p>
    <div className="media-aligned-chart"><h4>Platform advertising spend · AED</h4>
      <ResponsiveContainer width="100%" height={170}><LineChart data={rows} margin={{left:8,right:14,top:8,bottom:2}}>
        <CartesianGrid stroke="#e6e7e8" vertical={false}/><XAxis dataKey="month" tick={{fontSize:11,fill:'#626a73'}}/><YAxis tick={{fontSize:10,fill:'#626a73'}} tickFormatter={(value:number)=>`${Math.round(value/1000)}K`}/><Tooltip formatter={(value, _key) => value == null ? 'n/a' : formatAED(Number(value))} />
        <Line dataKey="spend" type="linear" connectNulls={false} stroke="#30343a" strokeWidth={2} dot={{r:2}} isAnimationActive={false}/>
      </LineChart></ResponsiveContainer>
    </div>
    <div className="media-aligned-chart"><h4>First-time purchasers · site</h4>
      <ResponsiveContainer width="100%" height={170}><LineChart data={rows} margin={{left:8,right:14,top:8,bottom:2}}>
        <CartesianGrid stroke="#e6e7e8" vertical={false}/><XAxis dataKey="month" tick={{fontSize:11,fill:'#626a73'}}/><YAxis tick={{fontSize:10,fill:'#626a73'}} tickFormatter={(value:number)=>formatNumber(value)}/><Tooltip formatter={(value, _key) => value == null ? 'n/a' : formatNumber(Number(value))} />
        <Line dataKey="ftp" type="linear" connectNulls={false} stroke="#596677" strokeWidth={2} dot={{r:2}} isAnimationActive={false}/>
      </LineChart></ResponsiveContainer>
    </div>
    <p className="media-alignment-footnote">{rows.filter((row)=>row.spend==null).length} month(s) have unavailable spend; {rows.filter((row)=>row.ftp==null).length} lack purchaser figures; {rows.filter((row)=>row.partial).length} carry partial reporting status. The new GA4 v4 September/October channel import is not supplied.</p>
  </section>;
}

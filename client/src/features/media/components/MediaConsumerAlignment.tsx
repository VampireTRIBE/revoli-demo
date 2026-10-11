import { useQuery } from '@tanstack/react-query';
import { http } from '../../../api/http';
import type { ConsumerDashboard } from '../../../types/consumer';
import '../../../styles/reference-consumer.css';

async function loadConsumerAlignment(year: number): Promise<ConsumerDashboard> {
  return (await http.get<{ data: ConsumerDashboard }>('/consumer/dashboard', { params: { year, month: 0 } })).data.data;
}

export function MediaConsumerAlignment({ year }: { year?: number }) {
  const query = useQuery({
    queryKey: ['consumer', 'media-alignment', year],
    queryFn: () => loadConsumerAlignment(year!),
    enabled: Boolean(year),
  });

  if (!year) return null;
  if (query.isLoading) return <section className="consumer-panel reference-mt"><div className="consumer-unavailable">Loading Consumer alignment...</div></section>;
  if (query.isError || !query.data) return <section className="consumer-panel reference-mt"><div className="consumer-panel-heading"><div><h3>Aligned</h3><p>Media and Consumer data.</p></div><span>Data not available</span></div><div className="consumer-unavailable">Consumer alignment could not be loaded.</div></section>;

  return <div className="media-consumer-alignment reference-mt">
    <section className="consumer-panel"><div className="consumer-panel-heading"><div><h3>Aligned</h3><p>Monthly Media spend beside first-time purchaser intake. Separate sources; not one calculation.</p></div><span>Supported pair</span></div><div className="consumer-aligned">{query.data.aligned.map((row)=><div key={row.month}><b>{row.label.replace(` ${year}`,'')}</b><span>{row.mediaSpendAed==null?'Spend N/A':`AED ${row.mediaSpendAed.toLocaleString()}`}</span><span>{row.firstTimePurchasers.toLocaleString()} first-time purchasers</span></div>)}</div></section>
    <section className="consumer-panel"><div className="consumer-panel-heading"><div><h3>Aligned</h3><p>Media spend per channel beside purchases by first-touch channel.</p></div><span>Data not available</span></div><div className="consumer-unavailable">First-touch purchase-channel values are not supplied in the Consumer import.</div></section>
  </div>;
}

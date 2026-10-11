import { useQuery } from '@tanstack/react-query';
import { http } from '../../api/http';
import type { TblReadsResponse } from '../../types/reads';
import './tbl-reads.css';

interface Props { client: string; section: 'Media' | 'Creative' | 'Consumer' | 'Competition'; year?: number; month?: number; }

export function TblReadsStrip({ client, section, year, month }: Props) {
  const query = useQuery({
    queryKey: ['tbl-reads', client, section, year, month],
    queryFn: async () => (await http.get<{ data: TblReadsResponse }>('/reads', { params: { client, section, year, month } })).data.data,
    enabled: Boolean(client && year && month !== undefined),
  });
  if (!year || month === undefined) return null;
  return <section className="tbl-reads" aria-label="TBL reads this period">
    <div className="tbl-reads-heading"><h3>TBL reads this period</h3><span>{query.data?.period ?? 'Loading'}</span></div>
    {query.isError || query.data?.pending ? <p className="tbl-read-pending">TBL read pending</p> : query.isLoading ? <p className="tbl-read-pending">Loading TBL reads...</p> : <ul>{query.data?.reads.map((read) => <li key={read.order}><span>{read.bullet}</span><small>{read.linkedCard}</small></li>)}</ul>}
  </section>;
}

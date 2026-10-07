import type { CompetitionOptions } from '../../../types/competition';
import type { CompetitionFilter } from '../services/competition-api';

interface Props extends CompetitionFilter {
  options: CompetitionOptions;
  onChange: (next: CompetitionFilter) => void;
}

export function CompetitionFilters({ options, year, month, competitor, captureDate, onChange }: Props) {
  const months = options.years.find((entry) => entry.year === year)?.months ?? [];
  const selectedPeriod = months.find((entry) => entry.month === month);
  const captureDates = competitor ? selectedPeriod?.captureDatesByCompetitor[competitor] ?? [] : selectedPeriod?.captureDates ?? [];
  return <div className="competition-filters period-filters" aria-label="Competition capture filters">
    <label><span>Year</span><select value={year ?? ''} onChange={(event) => onChange({ year: Number(event.target.value), competitor })}>
      {options.years.map((entry) => <option key={entry.year} value={entry.year}>{entry.year}</option>)}
    </select></label>
    <label><span>Month</span><select value={month ?? ''} disabled={!year} onChange={(event) => onChange({ year, month: Number(event.target.value), competitor })}>
      {months.map((entry) => <option key={entry.month} value={entry.month}>{entry.label}</option>)}
    </select></label>
    <label><span>Competitor</span><select value={competitor ?? ''} onChange={(event) => onChange({ year, month, competitor: event.target.value })}>
      {options.competitors.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}{entry.dataReceived ? '' : ' — data not received'}</option>)}
    </select></label>
    {captureDates.length > 1 ? <label><span>Capture date</span><select value={captureDate ?? captureDates[0] ?? ''} onChange={(event) => onChange({ year, month, competitor, captureDate: event.target.value })}>
      {captureDates.map((date) => <option value={date} key={date}>{formatDate(date)}</option>)}
    </select></label> : null}
  </div>;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

import type { CreativeOptions } from '../../../types/creative';

interface Props {
  options: CreativeOptions;
  year?: number;
  month?: number;
  brand?: string;
  onChange: (filter: { year?: number; month?: number; brand?: string }) => void;
}

export function CreativeFilters({ options, year, month, brand, onChange }: Props) {
  const months = options.years.find((entry) => entry.year === year)?.months ?? [];
  return <div className="creative-filters period-filters" aria-label="Creative reporting filters">
    <label><span>Year</span><select value={year ?? ''} onChange={(event) => onChange({ year: Number(event.target.value), brand })}>
      {options.years.map((entry) => <option value={entry.year} key={entry.year}>{entry.year}</option>)}
    </select></label>
    <label><span>Month</span><select value={month ?? ''} disabled={!year} onChange={(event) => onChange({ year, month: Number(event.target.value), brand })}>
      {months.map((entry) => <option value={entry.month} key={entry.month}>{entry.label}{entry.partial ? ' (partial)' : ''}</option>)}
    </select></label>
    <label><span>Brand</span><select value={brand ?? ''} onChange={(event) => onChange({ year, month, brand: event.target.value })}>
      {options.brands.map((entry) => <option value={entry.id} key={entry.id}>{entry.label}</option>)}
    </select></label>
  </div>;
}

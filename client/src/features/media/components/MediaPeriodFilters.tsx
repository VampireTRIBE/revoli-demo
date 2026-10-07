import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { PerformanceRow, Periods } from '../../../types/media';
import './media-filter-dropdown.css';

interface Props {
  periods: Periods;
  year?: number;
  month?: number;
  segment?: string;
  brand?: string;
  segments: PerformanceRow[];
  brands: PerformanceRow[];
  segmentsLoading?: boolean;
  brandsLoading?: boolean;
  onChange: (year?: number, month?: number) => void;
  onSegmentChange: (segment?: string) => void;
  onBrandChange: (brand?: string) => void;
}

interface FilterOption {
  value: string;
  label: string;
}

export function MediaPeriodFilters({
  periods,
  year,
  month,
  segment,
  brand,
  segments,
  brands,
  segmentsLoading = false,
  brandsLoading = false,
  onChange,
  onSegmentChange,
  onBrandChange,
}: Props) {
  const months = periods.years.find((entry) => entry.year === year)?.months ?? [];
  const segmentOptions = segments.map((entry) => ({ value: entry.label, label: displayFilterLabel(entry.label) }));
  const brandOptions = brands.map((entry) => ({ value: entry.label, label: displayFilterLabel(entry.label) }));

  return (
    <div className="period-filters" aria-label="Media reporting filters">
      <label><span>Year</span><select value={year ?? ''} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : undefined, undefined)}>
        <option value="">All Years</option>
        {periods.years.map((entry) => <option value={entry.year} key={entry.year}>{entry.year}</option>)}
      </select></label>
      <label><span>Month</span><select value={month ?? ''} disabled={!year} onChange={(event) => onChange(year, event.target.value ? Number(event.target.value) : undefined)}>
        <option value="">All Months</option>
        {months.map((entry) => <option value={entry.month} key={entry.month}>{entry.label}{entry.partial ? ' (partial)' : ''}</option>)}
      </select></label>
      <FilterDropdown label="Segment" value={segment} options={segmentOptions} allLabel="All Segments" loadingLabel="Loading segments..." disabled={segmentsLoading} onChange={onSegmentChange} />
      <FilterDropdown label="Brand" value={brand} options={brandOptions} allLabel="All Brands" loadingLabel="Loading brands..." disabled={brandsLoading} onChange={onBrandChange} />
    </div>
  );
}

function FilterDropdown({ label, value, options, allLabel, loadingLabel, disabled, onChange }: {
  label: string;
  value?: string;
  options: FilterOption[];
  allLabel: string;
  loadingLabel: string;
  disabled: boolean;
  onChange: (value?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedLabel = value ? options.find((option) => option.value === value)?.label ?? displayFilterLabel(value) : allLabel;

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const select = (nextValue?: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') setOpen(false);
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }
  };

  return <div className="media-filter-field" ref={rootRef}>
    <span>{label}</span>
    <button type="button" className={`media-filter-trigger${open ? ' open' : ''}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={listboxId} disabled={disabled} onClick={() => setOpen((current) => !current)} onKeyDown={handleKeyDown}>
      <span>{disabled ? loadingLabel : selectedLabel}</span><i aria-hidden="true" />
    </button>
    {open && !disabled ? <div className="media-filter-menu" id={listboxId} role="listbox" aria-label={label}>
      <button type="button" role="option" aria-selected={!value} className={!value ? 'selected' : ''} onClick={() => select(undefined)}>{allLabel}</button>
      {options.map((option) => <button type="button" role="option" aria-selected={value === option.value} className={value === option.value ? 'selected' : ''} key={option.value} onClick={() => select(option.value)}>{option.label}</button>)}
    </div> : null}
  </div>;
}

function displayFilterLabel(value: string): string {
  return /^corporate\s*\/\s*multi(?:[-\s].*)?$/i.test(value.trim()) ? 'Corporate' : value;
}

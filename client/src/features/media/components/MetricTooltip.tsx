import { CircleHelp } from 'lucide-react';

export function MetricTooltip({ formula, definition }: { formula: string; definition: string }) {
  return (
    <span className="tooltip-wrap" tabIndex={0} aria-label={`${formula}. ${definition}`}>
      <CircleHelp size={14} aria-hidden="true" />
      <span className="tooltip" role="tooltip"><b>Formula</b>{formula}<b>Meaning</b>{definition}</span>
    </span>
  );
}

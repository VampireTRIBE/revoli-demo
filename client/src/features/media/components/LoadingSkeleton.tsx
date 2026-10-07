export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return <div className="skeleton-stack" aria-label="Loading data">{Array.from({ length: rows }, (_, index) => <div className="skeleton" key={index} />)}</div>;
}

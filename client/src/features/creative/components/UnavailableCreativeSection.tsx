export function UnavailableCreativeSection({ title, message }: { title: string; message: string }) {
  return <div className="creative-card creative-unavailable-section">
    <h3>{title}</h3>
    <div><strong>Data not available</strong><span>{message}</span></div>
  </div>;
}

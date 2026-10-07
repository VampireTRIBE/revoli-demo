interface Props { title: string; eyebrow?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }

export function SectionCard({ title, eyebrow, action, children, className = '' }: Props) {
  return (
    <section className={`section-card ${className}`}>
      <header className="section-head">
        <div>{eyebrow && <div className="section-eyebrow">{eyebrow}</div>}<h2>{title}</h2></div>
        {action}
      </header>
      {children}
    </section>
  );
}

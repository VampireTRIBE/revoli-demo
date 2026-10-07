import type { PaidCreativePost } from '../../../types/creative';

export function PaidCreativeGallery({ records }: { records: PaidCreativePost[] }) {
  if (!records.length) return <div className="creative-placeholder-panel">Data not available</div>;
  return <div className="creative-gallery">
    {records.map((record) => {
      const content = <article className="creative-post-card">
        <div className="creative-media">
          {record.imageUrl
            ? <img className="creative-image" src={record.imageUrl} alt={record.caption ?? record.postType} loading="lazy" />
            : <div className="creative-placeholder" aria-label="Image not available">Image not available</div>}
          <span className={`creative-type-badge ${record.postType.toLowerCase()}`}>{record.postType.toUpperCase()}</span>
        </div>
        <div className="creative-post-meta">
          <div className="creative-post-name" title={record.caption ?? record.postType}>{compact(record.caption) || record.postType}</div>
          <div className="creative-post-stat"><span>Spend</span><strong>{formatAed(record.spendAed)}</strong></div>
          <div className="creative-post-stat"><span>{formatNumber(record.paidClicks)} paid clicks</span><span>{formatPercent(rate(record))} CTR</span></div>
          <div className="creative-post-stat creative-date"><span>{formatDate(record.publishedAt)}</span><span>{formatNumber(record.paidImpressions)} impr.</span></div>
        </div>
      </article>;
      const url = safeUrl(record.postUrl);
      return url ? <a className="creative-post-link" href={url} target="_blank" rel="noopener noreferrer" key={record.postId}>{content}</a> : <div key={record.postId}>{content}</div>;
    })}
  </div>;
}

function compact(value: string | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function rate(record: PaidCreativePost): number | null {
  return record.paidClicks != null && record.paidImpressions != null && record.paidImpressions > 0
    ? record.paidClicks / record.paidImpressions
    : null;
}

function formatAed(value: number | null): string {
  return value == null ? 'N/A' : `AED ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber(value: number | null): string {
  return value == null ? 'N/A' : value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatPercent(value: number | null): string {
  return value == null ? 'N/A' : `${(value * 100).toFixed(3)}%`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

function safeUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

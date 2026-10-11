import type { CreativePost } from '../../../types/creative';

export function CreativeGallery({ posts }: { posts: CreativePost[] }) {
  return <div className="creative-gallery">
    {posts.map((post) => {
      const title = compactCaption(post.caption) || post.postType;
      const content = <article className="creative-post-card">
        <div className="creative-media">
          {post.imageUrl
            ? <img className="creative-image" src={post.imageUrl} alt={title} loading="lazy" />
            : <div className="creative-placeholder" aria-label="Image not available">Image not available</div>}
          <span className={`creative-type-badge ${post.postType.toLowerCase()}`}>{post.postType.toUpperCase()}</span>
          {post.giveaway ? <span className="creative-giveaway-badge">Giveaway</span> : null}
        </div>
        <div className="creative-post-meta">
          <div className="creative-post-name" title={post.caption ?? post.postType}>{title}</div>
          <div className="creative-post-stat"><span>Active eng</span><strong className={engagementTone(post.activeEngagementRate)}>{formatPercent(post.activeEngagementRate, 1)}</strong></div>
          <div className="creative-post-stat"><span>{formatNumber(post.reach)} reach</span><span>{attentionLabel(post)}</span></div>
          <div className="creative-post-stat creative-date"><span>{formatDate(post.publishedAt)}</span><span>{post.activeActions} actions</span></div>
        </div>
      </article>;
      return post.postUrl ? <a className="creative-post-link" href={post.postUrl} target="_blank" rel="noopener noreferrer" key={post.postId}>{content}</a> : <div key={post.postId}>{content}</div>;
    })}
  </div>;
}

export function CreativeGalleryBands({ posts }: { posts: CreativePost[] }) {
  const bands: Array<'Top' | 'Core' | 'Low'> = ['Top', 'Core', 'Low'];
  return <div className="creative-gallery-bands">
    {bands.map((band) => {
      const rows = posts.filter((post) => post.band === band);
      return <details className={`creative-gallery-band ${band.toLowerCase()}`} open={band === 'Top'} key={band}>
        <summary><span>{band}</span><small>{rows.length} post{rows.length === 1 ? '' : 's'} · supplied band vs monthly median</small></summary>
        {rows.length ? <CreativeGallery posts={rows} /> : <div className="creative-account-empty">No {band.toLowerCase()} posts in this period.</div>}
      </details>;
    })}
  </div>;
}

function compactCaption(value: string | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function engagementTone(value: number): string {
  return value >= 0.03 ? 'good' : value >= 0.01 ? 'warn' : 'bad';
}

function attentionLabel(post: CreativePost): string {
  if (post.attentionBasis === 'watch-time' && post.attentionValue != null) return `${post.attentionValue.toFixed(1)}s watch`;
  if (post.frequency != null) return `${post.frequency.toFixed(2)}x freq`;
  return 'Attention N/A';
}

function formatNumber(value: number | null): string {
  return value == null ? 'N/A' : value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatPercent(value: number | null, digits: number): string {
  return value == null ? 'N/A' : `${(value * 100).toFixed(digits)}%`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(value));
}

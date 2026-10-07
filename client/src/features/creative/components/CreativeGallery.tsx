import type { CSSProperties } from 'react';
import type { CreativePost } from '../../../types/creative';

const gradients = [
  ['#7c9aff', '#4c37c8'], ['#5eead4', '#0d9488'], ['#f97316', '#c2410c'], ['#f472b6', '#be185d'],
  ['#fbbf24', '#b45309'], ['#a78bfa', '#6d28d9'], ['#34d399', '#047857'], ['#38bdf8', '#0369a1'],
];

export function CreativeGallery({ posts }: { posts: CreativePost[] }) {
  return <div className="creative-gallery">
    {posts.map((post) => {
      const title = compactCaption(post.caption) || post.postType;
      const content = <article className="creative-post-card">
        <div className="creative-media">
          {post.imageUrl
            ? <img className="creative-image" src={post.imageUrl} alt={title} loading="lazy" />
            : <div className="creative-placeholder" style={placeholderStyle(post.postId)} aria-label="Creative image not supplied">{initials(title)}</div>}
          <span className={`creative-type-badge ${post.postType.toLowerCase()}`}>{post.postType.toUpperCase()}</span>
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

function placeholderStyle(id: string): CSSProperties {
  let hash = 0;
  for (const character of id) hash = ((hash * 31) + character.charCodeAt(0)) >>> 0;
  const gradient = gradients[hash % gradients.length] ?? gradients[0];
  return { background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` };
}

function compactCaption(value: string | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function initials(value: string): string {
  const words = value.replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean);
  return (words.at(-1) ?? '?').slice(0, 2).toUpperCase();
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

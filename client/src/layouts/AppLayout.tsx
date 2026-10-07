import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import type { MediaFilter } from '../types/media';
import { useOverview } from '../features/media/hooks/use-media-data';
import '../styles/header.css';

const scoreTabs = ['Tech', 'UI/UX', 'SEO'];

function GpLogo() {
  return <svg viewBox="0 0 200 200" role="img" aria-label="The GP Inc. logo">
    <rect width="200" height="200" fill="#1d2127" />
    <rect x="18" y="18" width="76" height="14" fill="#fff" />
    <rect x="18" y="18" width="14" height="130" fill="#fff" />
    <rect x="18" y="134" width="76" height="14" fill="#fff" />
    <rect x="80" y="134" width="14" height="48" fill="#fff" />
    <rect x="106" y="18" width="76" height="14" fill="#fff" />
    <rect x="168" y="18" width="14" height="130" fill="#fff" />
    <rect x="106" y="134" width="76" height="14" fill="#fff" />
    <rect x="106" y="134" width="14" height="48" fill="#fff" />
    <text x="107" y="114" fontFamily="Segoe UI, sans-serif" fontSize="35" fontWeight="800" fill="#fff">Inc.</text>
  </svg>;
}

export function AppLayout() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isCreative = location.pathname.startsWith('/creative');
  const creativeClient = ({ 'union-coop': 'Union Coop', 'souq-al-bahar': 'Souq Al Bahar', 'souq-al-jubair': 'Souq Al Jubair', 'pocari-sweat': 'Pocari Sweat' } as Record<string, string>)[searchParams.get('brand') ?? ''] ?? 'Union Coop';
  const mediaFilter = useMemo<MediaFilter>(() => isCreative ? {} : ({
    year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
    month: searchParams.get('month') ? Number(searchParams.get('month')) : undefined,
    segment: searchParams.get('segment') || undefined,
    brand: searchParams.get('brand') || undefined,
  }), [isCreative, searchParams]);
  const mediaOverview = useOverview(mediaFilter);
  const mediaScore = mediaOverview.data?.metrics.referenceMediaScore;
  const [openedAt] = useState(() => new Date().toLocaleString('en-US'));

  return <div className="app-shell reference-shell">
    <div className="reference-wrap">
      <header className="reference-top">
        <NavLink to="/media" className="reference-logo" aria-label="Open Media dashboard"><GpLogo /></NavLink>
        <div>
          <h1>The GP Inc. Bizcom Engine <span className="reference-badge live">PROOF OF CONCEPT</span></h1>
          <div className="reference-sub">Client: <strong>{isCreative ? creativeClient : 'Rivoli'}</strong> {isCreative ? 'Uploaded creative data' : 'Imported media data'} &middot; opened {openedAt}</div>
        </div>
      </header>

      <nav className="reference-tabs" aria-label="BizCom Engine modules">
        <button type="button" className="reference-tab" disabled>Overview</button>
        {scoreTabs.map((tab) => <button type="button" className="reference-tab" disabled key={tab}><span>{tab}</span><span className="reference-pill">&ndash;</span></button>)}
        <NavLink end to="/creative" className={({ isActive }) => `reference-tab${isActive ? ' active' : ''}`}><span>Creative</span><span className="reference-pill">N/A</span></NavLink>
        <NavLink end to="/media" className={({ isActive }) => `reference-tab${isActive ? ' active' : ''}`}><span>Media</span><span className="reference-pill" aria-label={mediaScore == null ? 'Media score loading' : `Media score ${mediaScore} out of 100`}>{mediaScore ?? '...'}</span></NavLink>
        <button type="button" className="reference-tab" disabled>Business</button>
      </nav>

      <main><Outlet /></main>
    </div>
  </div>;
}

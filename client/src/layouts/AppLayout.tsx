import { useState } from 'react';
import { NavLink, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import '../styles/header.css';



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
  const isGeo = location.pathname.startsWith('/search');
  const isConsumer = location.pathname.startsWith('/consumer');
  const creativeClient = ({ 'union-coop': 'Union Coop', 'souq-al-bahar': 'Souq Al Bahar', 'souq-al-jubair': 'Souq Al Jubair', 'souq-al-haraj': 'Souq Al Haraj', 'souq-al-jubail': 'Souq Al Jubail', 'pocari-sweat': 'Pocari Sweat' } as Record<string, string>)[searchParams.get('brand') ?? ''] ?? 'Union Coop';
  const requestedClient = searchParams.get('client');
  const consumerClient = requestedClient === 'union-coop' ? 'Union Coop' : 'Rivoli';
  const mediaClient = requestedClient === 'union-coop' ? 'Union Coop' : 'Rivoli';
  const displayedClient = isCreative ? creativeClient : isGeo ? 'Union Coop' : isConsumer ? consumerClient : mediaClient;
  const [openedAt] = useState(() => new Date().toLocaleString('en-US'));

  return <div className="app-shell reference-shell">
    <div className="reference-wrap">
      <header className="reference-top">
        <NavLink to="/media" className="reference-logo" aria-label="Open Media dashboard"><GpLogo /></NavLink>
        <div>
          <h1>The GP Inc. Bizcom Engine <span className="reference-badge live">PROOF OF CONCEPT</span></h1>
          <div className="reference-sub">Client: <strong>{displayedClient}</strong> {isCreative ? 'Uploaded creative data' : isGeo ? 'Imported CLEO market data' : isConsumer ? 'Imported consumer data' : 'Imported media data'} &middot; opened {openedAt}</div>
        </div>
      </header>

      <nav className="reference-tabs" aria-label="BizCom Engine modules">
        {[['Overview', '/overview'], ['Tech','/tech'], ['UI/UX','/ui-ux'], ['Search','/search'], ['Creative','/creative'], ['Media','/media'], ['Consumer','/consumer'], ['Business','/business']].map(([label, to]) =>
          <NavLink key={to} to={to} className={({isActive}) => `reference-tab${isActive ? ' active' : ''}`}><span>{label}</span></NavLink>)}
      </nav>

      <main><Outlet /></main>
    </div>
  </div>;
}

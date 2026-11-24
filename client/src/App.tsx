import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { MediaDashboardPage } from './pages/MediaDashboardPage';
import { MediaImportPage } from './pages/MediaImportPage';
import { CreativeDashboardPage } from './pages/CreativeDashboardPage';
import { CreativeErrorBoundary } from './components/CreativeErrorBoundary';
import { ConsumerDashboardPage } from './pages/ConsumerDashboardPage';
import { SearchDashboardPage } from './pages/SearchDashboardPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

export default function App() {
  return <Routes><Route element={<AppLayout />}>
    <Route index element={<Navigate to="/media" replace />} />
    <Route path="/overview" element={<PlaceholderPage heading="Overview"/>}/>
    <Route path="/tech" element={<PlaceholderPage heading="Tech"/>}/>
    <Route path="/ui-ux" element={<PlaceholderPage heading="UI/UX"/>}/>
    <Route path="/search" element={<SearchDashboardPage/>}/>
    <Route path="/seo" element={<Navigate to="/search?panel=classic" replace/>}/>
    <Route path="/geo" element={<Navigate to="/search?panel=ai" replace/>}/>
    <Route path="/media" element={<MediaDashboardPage/>}/>
    <Route path="/media/import" element={<MediaImportPage/>}/>
    <Route path="/creative" element={<CreativeErrorBoundary><CreativeDashboardPage /></CreativeErrorBoundary>}/>
    <Route path="/consumer" element={<ConsumerDashboardPage/>}/>
    <Route path="/business" element={<PlaceholderPage heading="Business"/>}/>
    <Route path="/competition" element={<Navigate to="/media?competition=edit-by-ahmed-seddiqi" replace/>}/>
    <Route path="*" element={<Navigate to="/media" replace/>}/>
  </Route></Routes>;
}

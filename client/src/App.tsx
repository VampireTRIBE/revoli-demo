import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { MediaDashboardPage } from './pages/MediaDashboardPage';
import { MediaImportPage } from './pages/MediaImportPage';
import { CreativeDashboardPage } from './pages/CreativeDashboardPage';

export default function App() {
  return <Routes><Route element={<AppLayout />}><Route index element={<Navigate to="/media" replace />} /><Route path="/media" element={<MediaDashboardPage />} /><Route path="/media/import" element={<MediaImportPage />} /><Route path="/creative" element={<CreativeDashboardPage />} /><Route path="/competition" element={<Navigate to="/media?competition=edit-by-ahmed-seddiqi" replace />} /><Route path="*" element={<Navigate to="/media" replace />} /></Route></Routes>;
}

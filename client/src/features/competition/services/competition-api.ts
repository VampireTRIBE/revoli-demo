import { http } from '../../../api/http';
import type { CompetitionDashboard, CompetitionOptions } from '../../../types/competition';

interface ApiResponse<T> { success: boolean; message: string; data: T }

export interface CompetitionFilter {
  year?: number;
  month?: number;
  competitor?: string;
  captureDate?: string;
}

export async function fetchCompetitionOptions(clientId?: string): Promise<CompetitionOptions> {
  const response = await http.get<ApiResponse<CompetitionOptions>>('/competition/options', { params: clientId ? { clientId } : undefined });
  return response.data.data;
}

export async function fetchCompetitionDashboard(filter: CompetitionFilter): Promise<CompetitionDashboard> {
  const response = await http.get<ApiResponse<CompetitionDashboard>>('/competition/dashboard', { params: filter });
  return response.data.data;
}

export function competitionAssetUrl(assetPath: string): string {
  return `${String(http.defaults.baseURL ?? '').replace(/\/$/, '')}${assetPath}`;
}

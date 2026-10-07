import { http } from '../../../api/http';
import type { CreativeDashboard, CreativeOptions } from '../../../types/creative';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function fetchCreativeOptions(): Promise<CreativeOptions> {
  const response = await http.get<ApiResponse<CreativeOptions>>('/creative/options');
  return response.data.data;
}

export async function fetchCreativeDashboard(filter: { year?: number; month?: number; brand?: string }): Promise<CreativeDashboard> {
  const response = await http.get<ApiResponse<CreativeDashboard>>('/creative/dashboard', { params: filter });
  return response.data.data;
}

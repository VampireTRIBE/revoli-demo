import { useQuery } from '@tanstack/react-query';
import { fetchCreativeDashboard, fetchCreativeOptions } from '../services/creative-api';

export function useCreativeOptions() {
  return useQuery({ queryKey: ['creative', 'options'], queryFn: fetchCreativeOptions });
}

export function useCreativeDashboard(filter: { year?: number; month?: number; brand?: string }) {
  return useQuery({
    queryKey: ['creative', 'dashboard', filter],
    queryFn: () => fetchCreativeDashboard(filter),
    enabled: Boolean(filter.year && filter.month !== undefined && filter.brand),
  });
}

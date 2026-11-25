import { useQuery } from '@tanstack/react-query';
import { fetchCompetitionDashboard, fetchCompetitionOptions, type CompetitionFilter } from '../services/competition-api';

export function useCompetitionOptions(clientId?: string, enabled = true) {
  return useQuery({ queryKey: ['competition', 'options', clientId], queryFn: () => fetchCompetitionOptions(clientId), enabled });
}

export function useCompetitionDashboard(filter: CompetitionFilter) {
  return useQuery({
    queryKey: ['competition', 'dashboard', filter],
    queryFn: () => fetchCompetitionDashboard(filter),
    enabled: Boolean(filter.year && filter.competitor),
  });
}

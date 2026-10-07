import { useQuery } from '@tanstack/react-query';
import { fetchCompetitionDashboard, fetchCompetitionOptions, type CompetitionFilter } from '../services/competition-api';

export function useCompetitionOptions(clientId?: string) {
  return useQuery({ queryKey: ['competition', 'options', clientId], queryFn: () => fetchCompetitionOptions(clientId) });
}

export function useCompetitionDashboard(filter: CompetitionFilter) {
  return useQuery({
    queryKey: ['competition', 'dashboard', filter],
    queryFn: () => fetchCompetitionDashboard(filter),
    enabled: Boolean(filter.year && filter.month && filter.competitor),
  });
}

import { useQuery } from '@tanstack/react-query';
import type { MediaFilter } from '../../../types/media';
import { mediaApi } from '../services/media-api';

export const usePeriods = () => useQuery({ queryKey: ['media', 'periods'], queryFn: mediaApi.periods, staleTime: 60_000 });
export const useOverview = (filter: MediaFilter) => useQuery({ queryKey: ['media', 'overview', filter], queryFn: () => mediaApi.overview(filter) });
export const usePlatforms = (filter: MediaFilter) => useQuery({ queryKey: ['media', 'platforms', filter], queryFn: () => mediaApi.platforms(filter) });
export const useCampaigns = (filter: MediaFilter, extras: Record<string, unknown>) => useQuery({ queryKey: ['media', 'campaigns', filter, extras], queryFn: () => mediaApi.campaigns(filter, extras) });
export const useBrands = (filter: MediaFilter) => useQuery({ queryKey: ['media', 'brands', filter], queryFn: () => mediaApi.brands(filter) });
export const useSegments = (filter: MediaFilter) => useQuery({ queryKey: ['media', 'segments', filter], queryFn: () => mediaApi.segments(filter) });
export const useReconciliation = (filter: MediaFilter) => useQuery({ queryKey: ['media', 'reconciliation', filter], queryFn: () => mediaApi.reconciliation(filter) });
export const useFunnel = (filter: MediaFilter) => useQuery({ queryKey: ['media', 'funnel', filter], queryFn: () => mediaApi.funnel(filter) });
export const useOrganic = (filter: MediaFilter) => useQuery({ queryKey: ['media', 'organic', filter], queryFn: () => mediaApi.organic(filter) });

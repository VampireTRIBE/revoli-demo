import { http } from '../../../api/http';
import type { ApiResponse, CampaignData, FunnelData, MediaFilter, OrganicData, Overview, PerformanceData, Periods, PlatformData, ReconciliationData } from '../../../types/media';

const params = (filter: MediaFilter) => ({
  ...(filter.year ? { year: filter.year } : {}),
  ...(filter.month ? { month: filter.month } : {}),
  ...(filter.segment ? { segment: filter.segment } : {}),
  ...(filter.brand ? { brand: filter.brand } : {}),
});
const get = async <T>(url: string, query?: Record<string, unknown>) => (await http.get<ApiResponse<T>>(url, { params: query })).data.data;

export const mediaApi = {
  periods: () => get<Periods>('/media/periods'),
  overview: (filter: MediaFilter) => get<Overview>('/media/overview', params(filter)),
  platforms: (filter: MediaFilter) => get<PlatformData>('/media/platforms', params(filter)),
  campaigns: (filter: MediaFilter, extras: Record<string, unknown>) => get<CampaignData>('/media/campaigns', { ...params(filter), ...extras }),
  brands: (filter: MediaFilter) => get<PerformanceData>('/media/brands', params(filter)),
  segments: (filter: MediaFilter) => get<PerformanceData>('/media/segments', params(filter)),
  reconciliation: (filter: MediaFilter) => get<ReconciliationData>('/media/reconciliation', params(filter)),
  funnel: (filter: MediaFilter) => get<FunnelData>('/media/funnel', params(filter)),
  organic: (filter: MediaFilter) => get<OrganicData>('/media/organic-demand', params(filter)),
  importPackage: async (file: File, replaceExisting: boolean) => {
    const form = new FormData();
    form.append('package', file);
    form.append('replaceExisting', String(replaceExisting));
    return (await http.post<ApiResponse<ImportResult>>('/media/import', form)).data.data;
  },
};

export interface ImportResult {
  batchId: string;
  status: string;
  detectedPeriods: { sourcePeriodLabel: string; isPartialPeriod: boolean }[];
  files: { originalName: string; detectedType: string; status: string; rowCount: number }[];
  warnings: string[];
  reconciliationChecks: { name: string; passed: boolean; difference: number }[];
  replacedPeriods: string[];
}

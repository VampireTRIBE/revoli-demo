import type { Campaign } from '../../../types/media';
export type Objective = 'Conversion' | 'Traffic' | 'Awareness' | 'Not supplied';
export type CampaignMeasure = 'conversions' | 'link clicks' | 'interactions' | 'views' | 'impressions';
export const objectives: Objective[] = ['Conversion', 'Traffic', 'Awareness', 'Not supplied'];
export function objective(row: Campaign): Objective {
  if (row.objective === 'Conversion' || row.objective === 'Traffic' || row.objective === 'Awareness') return row.objective;
  return 'Not supplied';
}
function validCount(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n) && n >= 0;
}
export function campaignResult(row: Campaign): { measure: CampaignMeasure; count: number | null; cost: number | null; label: string } | null {
  const category = objective(row);
  if (category === 'Not supplied') return null;
  const measure: CampaignMeasure = category === 'Conversion' ? 'conversions' : category === 'Traffic' ? (row.platform === 'Google Ads' ? 'interactions' : 'link clicks') : validCount(row.views) ? 'views' : 'impressions';
  const raw = measure === 'conversions' ? row.claims : measure === 'interactions' ? row.interactions : measure === 'link clicks' ? row.clicks : measure === 'views' ? row.views : row.impressions;
  const count = validCount(raw) ? raw : null;
  const multiplier = measure === 'views' || measure === 'impressions' ? 1000 : 1;
  const cost = count !== null && count > 0 && validCount(row.spend) ? row.spend * multiplier / count : null;
  const label = multiplier === 1000 ? `Cost / 1,000 ${measure}` : `Cost / ${measure === 'conversions' ? 'conversion' : measure === 'link clicks' ? 'link click' : 'interaction'}`;
  return { measure, count, cost: cost !== null && Number.isFinite(cost) ? cost : null, label };
}
export function groupCampaignRankings(rows: Campaign[], category: Objective) {
  const groups = new Map<string, { label: string; rows: { row: Campaign; cost: number }[] }>();
  const unranked: Campaign[] = [];
  for (const row of rows) {
    if (objective(row) !== category) continue;
    const result = campaignResult(row);
    if (!result || result.cost === null) { unranked.push(row); continue; }
    // Never compare different objectives, platforms, or result definitions.
    const key = `${row.platform}|${category}|${result.measure}`;
    const group = groups.get(key) ?? { label: `${row.platform} · ${result.label}`, rows: [] };
    group.rows.push({ row, cost: result.cost });
    groups.set(key, group);
  }
  return { ranked: [...groups.values()].map(group => ({ label: group.label, rows: group.rows.sort((a,b)=>a.cost-b.cost || a.row.campaign.localeCompare(b.row.campaign)).map(item=>item.row) })), unranked };
}

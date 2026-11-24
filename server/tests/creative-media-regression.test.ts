import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { getCreativeOptions, getCreativeDashboard, clearCreativeSourceCache } from '../src/modules/creative/services/creative.service.js';

/** Real workbook-backed tests: no mocked creative sources, no MongoDB required. */
describe('November 24 Creative and Media source regressions', () => {
  it('loads the actual Union Coop prepared workbook, including its eligible-post column', () => {
    clearCreativeSourceCache();
    const options = getCreativeOptions();
    expect(options.brands.some((brand) => brand.id === 'union-coop')).toBe(true);
    expect(options.defaultSelection).not.toBeNull();
    const august = getCreativeDashboard({ year: 2026, month: 8, brand: 'union-coop' });
    expect(august.organic.preparedInsights.typical?.eligiblePosts).toBe(52);
    expect(august.organic.preparedInsights.monthlyKpis.find((row) => row.month === 8)?.stories).toBe(219);
  });

  it('serves Creative options and dashboard over HTTP', async () => {
    const options = await request(app).get('/api/v1/creative/options').expect(200);
    expect(options.body.success).toBe(true);
    expect(options.body.data.defaultSelection.brand).toBe('union-coop');
    const dashboard = await request(app).get('/api/v1/creative/dashboard?year=2026&month=8&brand=union-coop').expect(200);
    expect(dashboard.body.success).toBe(true);
    expect(dashboard.body.data.organic.preparedInsights.available).toBe(true);
  });

  it('keeps monthly Google campaigns separate from year-only Meta campaign totals', async () => {
    const google = await request(app).get('/api/v1/media/campaigns?year=2026&month=8&platform=Google%20Ads&limit=1000').expect(200);
    expect(google.body.data.campaigns.length).toBeGreaterThan(0);
    expect(google.body.data.campaigns.every((row: { platform: string }) => row.platform === 'Google Ads')).toBe(true);

    const metaMonthly = await request(app).get('/api/v1/media/campaigns?year=2026&month=8&platform=Meta%20Ads&limit=1000').expect(200);
    expect(metaMonthly.body.data.campaigns).toHaveLength(0);

    const metaYear = await request(app).get('/api/v1/media/campaigns?year=2026&platform=Meta%20Ads&limit=1000').expect(200);
    expect(metaYear.body.data.campaigns.length).toBeGreaterThan(0);
    expect(metaYear.body.data.campaigns.every((row: { calculationBasis: string }) => row.calculationBasis?.includes('nine-month'))).toBe(true);
  });
});

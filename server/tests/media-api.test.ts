import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { sourceDataset } from '../src/modules/media/services/media-data.service.js';

describe('Media API', () => {
  it('returns dynamic periods and identifies the partial month', async () => {
    const response = await request(app).get('/api/v1/media/periods').expect(200);

    expect(response.body.success).toBe(true);
    const year = response.body.data.years.find((entry: { year: number }) => entry.year === 2026);
    expect(year.months).toHaveLength(9);
    expect(year.months.find((entry: { month: number }) => entry.month === 9)).toMatchObject({
      partial: true,
      startDate: '2026-09-01',
      endDate: '2026-09-10',
    });
  });

  it('returns source-calculated August overview metrics', async () => {
    const response = await request(app).get('/api/v1/media/overview?year=2026&month=8').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.metadata).toMatchObject({ year: 2026, month: 8, status: 'COMPLETE' });
    expect(response.body.data.metadata.warnings.length).toBeGreaterThan(0);
    expect(response.body.data.metrics.totalSpend).toBeGreaterThan(0);
    expect(response.body.data.metrics.referenceMediaScore).toBeNull();
    expect(response.body.data.metrics.scoreLabel).toBe('Unscored — baselines pending');
    expect(response.body.data.metrics.platformClaims.value).toBeGreaterThan(0);
    expect(response.body.data.metrics.directionalReturn.status).toBe('DIRECTIONAL');
    expect(response.body.data.metrics.paidTrafficActions).toBe(36_409);
    expect(response.body.data.metrics.paidImpressions).toBe(3_557_299);
    expect(response.body.data.metrics.blendedCtr.value).toBeCloseTo(36_409 / 3_557_299, 4);
    expect(response.body.data.metrics.blendedCtr.value * 100).toBeLessThan(3);
    expect(response.body.data.metrics.blendedCtr.definition).toContain('Google Interactions are excluded');
  });

  it('returns directional platform and campaign ROAS from the documented site-revenue coverage basis', async () => {
    const platformsResponse = await request(app).get('/api/v1/media/platforms?year=2026&month=8').expect(200);
    const platforms = platformsResponse.body.data.platforms;

    expect(platforms).toHaveLength(2);
    expect(platforms.every((row: { roas: number | null }) => Number.isFinite(row.roas))).toBe(true);
    expect(platforms.every((row: { roasStatus: string }) => row.roasStatus === 'DIRECTIONAL')).toBe(true);
    expect(platforms.every((row: { directionalRevenue: number | null }) => Number.isFinite(row.directionalRevenue))).toBe(true);
    expect(platforms.every((row: { roasBasis: string }) => row.roasBasis.includes('revenue coverage'))).toBe(true);

    const campaignsResponse = await request(app)
      .get('/api/v1/media/campaigns?year=2026&month=8&platform=Google%20Ads&page=1&limit=100')
      .expect(200);
    const campaigns = campaignsResponse.body.data.campaigns;
    const roasCampaigns = campaignsResponse.body.data.roasCampaigns;

    expect(campaigns.length).toBeGreaterThan(0);
    expect(campaigns.every((row: { roas: number | null }) => Number.isFinite(row.roas))).toBe(true);
    expect(campaigns.every((row: { roasStatus: string }) => row.roasStatus === 'DIRECTIONAL')).toBe(true);
    expect(campaigns.every((row: { directionalRevenue: number | null }) => Number.isFinite(row.directionalRevenue))).toBe(true);
    expect(roasCampaigns.length).toBeGreaterThan(0);
    expect(roasCampaigns.every((row: { spend: number; roas: number | null }) => row.spend > 300 && Number.isFinite(row.roas))).toBe(true);

    const yearlyCampaignsResponse = await request(app)
      .get('/api/v1/media/campaigns?year=2026&page=1&limit=100')
      .expect(200);
    expect(yearlyCampaignsResponse.body.data.roasCampaigns.length).toBeGreaterThan(0);

    const augustMetaResponse = await request(app)
      .get('/api/v1/media/campaigns?year=2026&month=8&platform=Meta%20Ads&page=1&limit=100')
      .expect(200);
    expect(augustMetaResponse.body.data.campaigns).toHaveLength(0);
  });

  it('applies the dependent Segment and Brand filters to all media calculations', async () => {
    const segmentsResponse = await request(app).get('/api/v1/media/segments?year=2026&month=8').expect(200);
    const selectedSegment = segmentsResponse.body.data.segments[0];

    expect(selectedSegment.label).toBeTruthy();

    const segmentQuery = new URLSearchParams({
      year: '2026',
      month: '8',
      segment: selectedSegment.label,
    }).toString();
    const brandsResponse = await request(app).get(`/api/v1/media/brands?${segmentQuery}`).expect(200);
    const selectedBrand = brandsResponse.body.data.brands[0];

    expect(selectedBrand.label).toBeTruthy();

    const filterQuery = new URLSearchParams({
      year: '2026',
      month: '8',
      segment: selectedSegment.label,
      brand: selectedBrand.label,
    }).toString();
    const [overviewResponse, platformsResponse, campaignsResponse, reconciliationResponse] = await Promise.all([
      request(app).get(`/api/v1/media/overview?${filterQuery}`).expect(200),
      request(app).get(`/api/v1/media/platforms?${filterQuery}`).expect(200),
      request(app).get(`/api/v1/media/campaigns?${filterQuery}&page=1&limit=100`).expect(200),
      request(app).get(`/api/v1/media/reconciliation?${filterQuery}`).expect(200),
    ]);

    const overview = overviewResponse.body.data;
    expect(overview.metadata).toMatchObject({
      year: 2026,
      month: 8,
      segment: selectedSegment.label,
      brand: selectedBrand.label,
    });
    expect(overview.metrics.totalSpend).toBeCloseTo(selectedBrand.totalSpend, 1);
    expect(overview.metrics.siteRevenue).toBeCloseTo(selectedBrand.siteRevenue, 1);

    const platformSpend = platformsResponse.body.data.platforms.reduce(
      (total: number, row: { spend: number | null }) => total + (row.spend ?? 0),
      0,
    );
    expect(platformSpend).toBeCloseTo(overview.metrics.totalSpend, 1);

    const campaigns = campaignsResponse.body.data.campaigns;
    expect(campaigns.length).toBeGreaterThan(0);
    expect(campaigns.every((row: { segment: string; brand: string }) =>
      row.segment === selectedSegment.label && row.brand === selectedBrand.label,
    )).toBe(true);
    expect(reconciliationResponse.body.data.checks.every((check: { passed: boolean }) => check.passed)).toBe(true);
  });

  it('calculates a documented ROAS basis for every spreadsheet-backed Segment and Brand', async () => {
    for (const period of sourceDataset().periods) {
      const query = `year=${period.year}&month=${period.month}`;
      const [segmentsResponse, brandsResponse] = await Promise.all([
        request(app).get(`/api/v1/media/segments?${query}`).expect(200),
        request(app).get(`/api/v1/media/brands?${query}`).expect(200),
      ]);
      const rows = [...segmentsResponse.body.data.segments, ...brandsResponse.body.data.brands];

      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((row: {
        directionalReturn: number | null;
        directionalReturnLevel: string;
        directionalReturnRevenue: number;
        directionalReturnSpend: number;
      }) =>
        Number.isFinite(row.directionalReturn) &&
        ['BRAND', 'SEGMENT', 'OVERALL'].includes(row.directionalReturnLevel) &&
        Number.isFinite(row.directionalReturnRevenue) &&
        row.directionalReturnSpend > 0,
      )).toBe(true);
    }

    const swissBrandsResponse = await request(app)
      .get('/api/v1/media/brands?year=2026&month=8&segment=Swiss')
      .expect(200);
    const certina = swissBrandsResponse.body.data.brands.find((row: { label: string }) => row.label === 'Certina');

    expect(certina).toMatchObject({
      totalSpend: 0,
      directionalReturnLevel: 'SEGMENT',
    });
    expect(certina.directionalReturn).toBeGreaterThan(0);

    const certinaOverview = await request(app)
      .get('/api/v1/media/overview?year=2026&month=8&segment=Swiss&brand=Certina')
      .expect(200);
    expect(certinaOverview.body.data.metrics.directionalReturn).toMatchObject({
      value: certina.directionalReturn,
      calculationLevel: 'SEGMENT',
      revenue: certina.directionalReturnRevenue,
      spend: certina.directionalReturnSpend,
    });

    const segmentsResponse = await request(app).get('/api/v1/media/segments?year=2026&month=8').expect(200);
    const microbrands = segmentsResponse.body.data.segments.find((row: { label: string }) => row.label === 'Microbrands');
    expect(microbrands).toMatchObject({
      totalSpend: 0,
      directionalReturnLevel: 'OVERALL',
    });
    expect(microbrands.directionalReturn).toBeGreaterThan(0);
  });

  it('returns source-backed zero activity when the stage summary reports zero spend', async () => {
    const response = await request(app).get('/api/v1/media/platforms?year=2026&month=9').expect(200);
    const meta = response.body.data.platforms.find((row: { platform: string }) => row.platform === 'Meta Ads');

    expect(meta).toMatchObject({
      spend: 0, impressions: 0, platformClaims: 0, ctr: null, claimedCac: null, roas: null,
    });
  });

  it('rejects a month without a year', async () => {
    const response = await request(app).get('/api/v1/media/overview?month=8').expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

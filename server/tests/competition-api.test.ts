import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { COMPETITION_SOURCE_LABEL } from '../src/modules/competition/config/competition.config.js';

describe('Competition API', () => {
  it('reproduces the validated EDIT capture totals without exposing restricted metrics', async () => {
    const response = await request(app)
      .get('/api/v1/competition/dashboard?year=2026&month=10&competitor=edit-by-ahmed-seddiqi')
      .expect(200);
    const data = response.body.data;

    expect(data.sourceLabel).toBe(COMPETITION_SOURCE_LABEL);
    expect(data.capture).toMatchObject({ date: '2026-10-01', firstCapture: true });
    expect(data.activity.activeAds).toBe(37);
    expect(data.activity.averageDaysRunning).toBeCloseTo(28.6, 1);
    expect(data.activity.historicalTrend).toBeNull();
    expect(data.activity.firstObservedAds).toBeNull();
    expect(data.launches.startedInSelectedMonth).toBe(0);
    expect(data.launches.startedOnSeptember28Or29).toBe(19);
    expect(data.longestRunning).toHaveLength(3);
    expect(data.longestRunning.every((row: { startDate: string; calculatedDaysRunning: number }) =>
      row.startDate === '2026-05-19' && row.calculatedDaysRunning === 135,
    )).toBe(true);
    const keys = collectKeys(data);
    expect(keys).not.toEqual(expect.arrayContaining(['impressions', 'spend', 'reach', 'ctr', 'roas', 'targeting']));
  });

  it('groups format, theme, and language while preserving raw detail labels', async () => {
    const response = await request(app)
      .get('/api/v1/competition/dashboard?year=2026&month=10&competitor=edit-by-ahmed-seddiqi')
      .expect(200);
    const data = response.body.data;

    expect(Object.fromEntries(data.formatMix.map((row: { label: string; count: number }) => [row.label, row.count]))).toEqual({
      Image: 22,
      'Catalog / carousel': 15,
    });
    expect(Object.fromEntries(data.themeMix.map((row: { label: string; count: number }) => [row.label, row.count]))).toEqual({
      Catalog: 15,
      'Offer code': 9,
      'Product spotlight': 7,
      Gifting: 6,
    });
    expect(data.languageMix).toEqual([{ label: 'English', count: 37, percentage: 1 }]);
    expect(data.observations.some((row: { format: string }) => row.format === 'Image (product tile)')).toBe(true);
    expect(data.observations.some((row: { theme: string }) => row.theme.startsWith('Offer code ('))).toBe(true);
  });

  it('validates every row, date calculation, and screenshot association', async () => {
    const response = await request(app)
      .get('/api/v1/competition/dashboard?year=2026&month=10&competitor=edit-by-ahmed-seddiqi')
      .expect(200);
    const data = response.body.data;

    expect(data.audit).toMatchObject({
      sourceRows: 37,
      acceptedRows: 37,
      malformedRows: 0,
      duplicateRows: 0,
      conflictingDuplicateRows: 0,
      daysRunningDiscrepancies: 0,
      verifiedScreenshotAssociations: 37,
      unverifiedScreenshotAssociations: 0,
    });
    expect(data.screenshots).toHaveLength(13);
    expect(data.screenshots.filter((item: { multiAd: boolean }) => item.multiAd)).toHaveLength(12);
    const asset = data.screenshots[0].assetUrl;
    await request(app).get(`/api/v1${asset}`).expect(200).expect('content-type', /image\/png/);
  });

  it('shows configured competitors with missing workbooks as Data not received', async () => {
    const options = await request(app).get('/api/v1/competition/options').expect(200);
    expect(options.body.data.competitors).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'edit-by-ahmed-seddiqi', dataReceived: true }),
      expect.objectContaining({ id: 'carrefour-uae', dataReceived: false }),
      expect.objectContaining({ id: 'lulu-hypermarket', dataReceived: false }),
    ]));

    const missing = await request(app)
      .get('/api/v1/competition/dashboard?year=2026&month=10&competitor=carrefour-uae')
      .expect(200);
    expect(missing.body.data).toMatchObject({ available: false, availabilityMessage: 'Data not received' });
    expect(missing.body.data.activity.activeAds).toBeNull();
  });
});

function collectKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  return Object.entries(value).flatMap(([key, child]) => [key.toLowerCase(), ...collectKeys(child)]);
}

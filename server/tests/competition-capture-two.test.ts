import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { clearCompetitionSourceCache } from '../src/modules/competition/services/competition.service.js';

describe('EDIT capture 2 (3 November 2026)', () => {
  it('keeps the October capture while reading the new workbook', async () => {
    clearCompetitionSourceCache();
    const october = (await request(app).get('/api/v1/competition/dashboard?year=2026&month=10&competitor=edit-by-ahmed-seddiqi').expect(200)).body.data;
    const november = (await request(app).get('/api/v1/competition/dashboard?year=2026&month=11&competitor=edit-by-ahmed-seddiqi').expect(200)).body.data;
    expect(october.activity.activeAds).toBe(37);
    expect(october.capture.date).toBe('2026-10-01');
    expect(november.capture.date).toBe('2026-11-03');
    expect(november.activity.activeAds).toBe(68);
    expect(november.activity.netActiveChange).toBe(31);
    expect(november.launches.sincePreviousCapture).toBe(36);
    expect(november.activity.averageDaysRunning).toBeCloseTo(39.9, 1);
    expect(november.longestRunning[0].calculatedDaysRunning).toBe(168);
    expect(november.activity.historicalTrend.map((entry: { activeAds: number }) => entry.activeAds)).toEqual([37,68]);
    expect(november.observations).toHaveLength(68);
    expect(new Set(november.observations.map((ad: { libraryId: string }) => ad.libraryId)).size).toBe(68);
    expect(november.observations.filter((ad: { newSincePreviousCapture?: boolean }) => ad.newSincePreviousCapture)).toHaveLength(36);
    expect(november.observations.filter((ad: { campaignPlatform?: string }) => ad.campaignPlatform)).toHaveLength(15);
    expect(november.audit).toMatchObject({ malformedRows: 0, duplicateRows: 0, daysRunningDiscrepancies: 0 });
  });

  it('joins all fifteen imported gallery thumbnails to unique Library IDs and secure assets', async () => {
    const data = (await request(app).get('/api/v1/competition/dashboard?year=2026&month=11&competitor=edit-by-ahmed-seddiqi').expect(200)).body.data;
    expect(data.gallery).toHaveLength(15);
    expect(data.gallery.reduce((memo: Record<number, number>, item: { row: number }) => ({ ...memo, [item.row]: (memo[item.row] ?? 0) + 1 }), {})).toEqual({1:4,2:4,3:4,4:3});
    const ids = new Set(data.observations.map((ad: { libraryId: string }) => ad.libraryId));
    for (const item of data.gallery as Array<{ libraryId: string; thumbnailFile: string; assetUrl: string }>) {
      expect(ids.has(item.libraryId)).toBe(true);
      expect(item.thumbnailFile).toMatch(/^r[1-4]_[a-z0-9_]+\.png$/);
      await request(app).get(`/api/v1${item.assetUrl}`).expect(200).expect('content-type', /image\/png/);
    }
    await request(app).get('/api/v1/competition/assets/edit-by-ahmed-seddiqi/2026-11-03/not-in-gallery.png').expect(404);
  });
});

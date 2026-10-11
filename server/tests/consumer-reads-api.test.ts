import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';

describe('Consumer and TBL Reads APIs', () => {
  it('imports the Rivoli Consumer monthly series and excludes partial September from all-period totals', async () => {
    const response = await request(app).get('/api/v1/consumer/dashboard?year=2026&month=0').expect(200);
    expect(response.body.data.cards).toMatchObject({ customerBase: 9786, newCustomerIntake: 9610 });
    expect(response.body.data.series).toHaveLength(9);
    expect(response.body.data.series.find((row: { month: number }) => row.month === 9)).toMatchObject({ firstTimePurchasers: 535, partial: true });
    expect(response.body.data.aligned).toHaveLength(8);
    expect(response.body.data.cards.visitorRetention).toBeNull();
    expect(response.body.data.cards.trueRepeatAndValue).toBeNull();
  });

  it('returns at most three authored reads and never generates missing periods', async () => {
    const supplied = await request(app).get('/api/v1/reads?client=Rivoli&section=Media&year=2026&month=0').expect(200);
    expect(supplied.body.data.reads).toHaveLength(3);
    expect(supplied.body.data.pending).toBe(false);
    const missing = await request(app).get('/api/v1/reads?client=Rivoli&section=Media&year=2026&month=8').expect(200);
    expect(missing.body.data).toMatchObject({ reads: [], pending: true, period: '2026-08' });
  });
});

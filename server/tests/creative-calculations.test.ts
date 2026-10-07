import { describe, expect, it } from 'vitest';
import { calculateOrganic, calculatePaidCreative, scoreOf } from '../src/modules/creative/calculations/creative-calculations.js';
import { parseCreativeSources, resolveCreativeSourceDirectory } from '../src/modules/creative/import/creative-source-parser.js';
import { getCreativeDashboard, getCreativeOptions } from '../src/modules/creative/services/creative.service.js';

describe('Creative source normalization and calculations', () => {
  it('selects one Instagram export and reports duplicate conflicts', () => {
    expect(resolveCreativeSourceDirectory().replaceAll('\\', '/')).toMatch(/spreadsheets data\/creative-tab$/);
    const dataset = parseCreativeSources();
    expect(dataset.posts).toHaveLength(1324);
    expect(new Set(dataset.posts.map((post) => post.postId)).size).toBe(1324);
    expect(dataset.audit.duplicateRecordCount).toBe(1324);
    expect(dataset.audit.conflictingPostCount).toBe(44);
    expect(dataset.audit.conflictFieldCounts.Views).toBe(44);
    expect(dataset.audit.conflictFieldCounts.Reach).toBe(41);
  });

  it('parses the five-record Pocari paid subset without mixing it into Organic data', () => {
    const dataset = parseCreativeSources();
    const result = calculatePaidCreative(dataset.paidPosts);
    expect(dataset.paidAudit).toMatchObject({
      sourceRows: 5,
      acceptedRows: 5,
      malformedRows: 0,
      accountPaidPostCount: 12,
    });
    expect(new Set(dataset.paidPosts.map((row) => row.brandId))).toEqual(new Set(['pocari-sweat']));
    expect(result.detailRecordCount).toBe(5);
    expect(result.totalPaidClicks).toBe(4487);
    expect(result.totalPaidImpressions).toBe(4586510);
    expect(result.totalPaidReach).toBe(2814875);
    expect(result.totalSpendAed).toBeCloseTo(10497.17, 2);
    expect(result.paidCtr).toBeCloseTo(4487 / 4586510, 12);
    expect(result.videos).toHaveLength(4);
    expect(result.statics).toHaveLength(1);
    expect(dataset.paidSummary).toMatchObject({
      paidPostCount: 12,
      paidImpressions: 4_896_521,
      paidReach: 3_006_430,
      paidLikes: 18_815,
      paidComments: 50,
      suppliedEngagementRatePercent: 4.28,
      averageLikesPerPaidPost: 1568,
      averageCommentsPerPaidPost: 4,
      performancePaidReachControl: 4_157_561,
      paidReachConflict: true,
    });
    expect(dataset.paidSummary.frequency).toBeCloseTo(4_896_521 / 3_006_430, 8);
    expect(dataset.paidSummary.measuredCommentRate).toBeCloseTo(50 / 3_006_430, 10);
  });

  it('uses only Posts and Reels and calculates rates from matching totals', () => {
    const dataset = parseCreativeSources();
    const result = calculateOrganic(dataset.posts);
    expect(result.eligiblePostCount).toBe(278);
    expect(result.watchTimeCoverage).toEqual({ populatedReels: 3, totalReels: 179 });
    expect(result.summedPostReach).toBe(543645);
    expect(result.totalViews).toBe(885458);
    expect(result.activeActions).toBe(21909);
    expect(result.activeEngagementRate).toBeCloseTo(21909 / 543645, 10);
    expect(result.frequency).toBeCloseTo(885458 / 543645, 10);
  });

  it('preserves the HTML reference clamp and rounding rule', () => {
    expect(scoreOf(1, { bad: 1, good: 2 })).toBe(2);
    expect(scoreOf(1.5, { bad: 1, good: 2 })).toBe(50);
    expect(scoreOf(3, { bad: 1, good: 2 })).toBe(100);
    expect(scoreOf(null, { bad: 1, good: 2 })).toBeNull();
  });

  it('exposes Pocari paid detail only at the supported whole-export scope', () => {
    const options = getCreativeOptions();
    expect(options.brands).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'pocari-sweat', paidPostLevelAvailable: true }),
    ]));
    expect(options.years.find((entry) => entry.year === 2026)?.months[0]).toMatchObject({ month: 0, label: 'All months' });

    const allMonths = getCreativeDashboard({ year: 2026, month: 0, brand: 'pocari-sweat' });
    expect(allMonths.organic.available).toBe(false);
    expect(allMonths.paid.meta).toMatchObject({
      available: true,
      detailRecordCount: 5,
      accountPaidPostCount: 12,
      accountSummary: expect.objectContaining({ paidReach: 3_006_430, paidComments: 50 }),
      totalPaidClicks: 4487,
      totalPaidImpressions: 4586510,
    });
    expect(allMonths.paid.meta.totalSpendAed).toBeCloseTo(10497.17, 2);

    const publicationMonth = getCreativeDashboard({ year: 2026, month: 3, brand: 'pocari-sweat' });
    expect(publicationMonth.paid.meta.available).toBe(false);
    expect(publicationMonth.paid.meta.message).toContain('Select All months');
  });
});

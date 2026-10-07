import { describe, expect, it } from 'vitest';
import { calculateMetrics, safeDivide, weightedBenchmarkScore } from '../src/modules/media/calculations/media-calculations.js';

describe('media calculation engine', () => {
  it('returns null for unsafe division instead of NaN or Infinity', () => {
    expect(safeDivide(10, 0)).toBeNull();
    expect(safeDivide(Number.NaN, 2)).toBeNull();
    expect(safeDivide(10, Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('calculates the supported metrics from raw totals', () => {
    const result = calculateMetrics({
      googleSpend: 100_000,
      metaSpend: 50_000,
      googleClaims: 600,
      metaClaims: 250,
      sitePurchases: 800,
      siteRevenue: 1_200_000,
      itemsViewed: 100_000,
      itemsAddedToCart: 5_000,
      googleImpressions: 1_000_000,
      googleInteractions: 80_000,
      metaImpressions: 500_000,
      metaClicks: 10_000,
    });

    expect(result.totalSpend).toBe(150_000);
    expect(result.platformClaims).toBe(850);
    expect(result.platformClaimedCac.value).toBeCloseTo(176.470588, 6);
    expect(result.siteAov.value).toBe(1_500);
    expect(result.cacAovRatio.value).toBeCloseTo(0.117647, 6);
    expect(result.claimsDifference).toBe(50);
    expect(result.claimsVsSite.value).toBeCloseTo(1.0625, 6);
    expect(result.directionalReturn.value).toBe(8);
    expect(result.directionalReturn.benchmarkScore).toBe(100);
    expect(result.paidImpressions).toBe(1_500_000);
    expect(result.paidTrafficActions).toBe(90_000);
    expect(result.blendedCtr.value).toBe(0.06);
    expect(result.blendedCtr.benchmarkScore).toBe(100);
    expect(result.cacAovRatio.benchmarkScore).toBe(100);
    expect(result.referenceMediaScore).toBe(100);
    expect(result.viewToCartRate).toBe(0.05);
    expect(result.cartToPurchaseRate).toBe(0.16);
    expect(result.viewToPurchaseRate).toBe(0.008);
  });

  it('recalculates a yearly ratio from totals instead of averaging monthly ratios', () => {
    const january = { spend: 1_000, claims: 10 };
    const february = { spend: 10_000, claims: 50 };
    const averageOfMonthlyCac = (january.spend / january.claims + february.spend / february.claims) / 2;
    const yearlyCac = safeDivide(january.spend + february.spend, january.claims + february.claims);

    expect(averageOfMonthlyCac).toBe(150);
    expect(yearlyCac).toBeCloseTo(183.333333, 6);
    expect(yearlyCac).not.toBe(averageOfMonthlyCac);
  });

  it('calculates the HTML-reference Media score with 40/30/30 weights', () => {
    expect(weightedBenchmarkScore([{ score: 43, weight: 40 }, { score: 63, weight: 30 }, { score: 51, weight: 30 }])).toBe(51);
    expect(weightedBenchmarkScore([{ score: null, weight: 40 }, { score: 60, weight: 30 }, { score: 40, weight: 30 }])).toBe(50);
    expect(weightedBenchmarkScore([{ score: null, weight: 100 }])).toBeNull();
  });
});

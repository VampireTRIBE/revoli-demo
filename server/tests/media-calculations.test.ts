import { describe, expect, it } from 'vitest';
import { calculateMetrics, safeDivide } from '../src/modules/media/calculations/media-calculations.js';

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
      paidImpressions: 1_500_000,
      paidClicks: 10_000,
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
    expect(result.paidImpressions).toBe(1_500_000);
    expect(result.paidTrafficActions).toBe(10_000);
    expect(result.blendedCtr.value).toBeCloseTo(10_000 / 1_500_000, 10);
    expect(result.referenceMediaScore).toBeNull();
    expect(result.scoreLabel).toBe('Unscored — baselines pending');
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

  it('does not calculate blended CTR without comparable paid clicks and impressions', () => {
    const result = calculateMetrics({
      googleSpend: 0, metaSpend: 0, googleClaims: 0, metaClaims: 0,
      sitePurchases: 0, siteRevenue: 0, itemsViewed: 0, itemsAddedToCart: 0,
      paidImpressions: null, paidClicks: null,
      googleImpressions: 1000, googleInteractions: 80, metaImpressions: 0, metaClicks: 0,
    });
    expect(result.blendedCtr.value).toBeNull();
    expect(result.paidTrafficActions).toBeNull();
  });
});

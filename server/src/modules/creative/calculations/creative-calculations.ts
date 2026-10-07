import { creativeBenchmarks } from '../config/creative-source.config.js';
import type { CreativePostView, NormalizedCreativePost, NormalizedPaidCreativePost } from '../types/creative.types.js';

export function scoreOf(value: number | null, benchmark: { bad: number; good: number }): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const raw = ((value - benchmark.bad) / (benchmark.good - benchmark.bad)) * 100;
  return Math.max(2, Math.min(100, Math.round(raw)));
}

export function calculateOrganic(posts: NormalizedCreativePost[]) {
  const eligible = posts.filter((post) => /^(post|reel)$/i.test(post.postType) && post.reach != null && post.reach > 0);
  const views = eligible.filter((post) => post.views != null);
  const actionEligible = eligible.filter((post) => post.shares != null && post.saves != null && post.comments != null);
  const postViews: CreativePostView[] = actionEligible.map((post) => {
    const activeActions = (post.shares ?? 0) + (post.saves ?? 0) + (post.comments ?? 0);
    const frequency = post.views == null || post.reach == null ? null : post.views / post.reach;
    const useWatchTime = /^reel$/i.test(post.postType) && post.averageWatchTimeSeconds != null && post.averageWatchTimeSeconds > 0;
    const attentionBasis: CreativePostView['attentionBasis'] = useWatchTime ? 'watch-time' : frequency == null ? null : 'frequency';
    return {
      ...post,
      activeActions,
      activeEngagementRate: activeActions / (post.reach ?? 1),
      frequency,
      attentionBasis,
      attentionValue: useWatchTime ? post.averageWatchTimeSeconds : frequency,
      giveaway: null,
      language: null,
      day: null,
      timeSlot: null,
      theme: null,
      eligibleForRanking: null,
    };
  }).sort((left, right) => right.activeEngagementRate - left.activeEngagementRate);

  const summedPostReach = eligible.reduce((total, post) => total + (post.reach ?? 0), 0);
  const totalViews = views.reduce((total, post) => total + (post.views ?? 0), 0);
  const actionReach = actionEligible.reduce((total, post) => total + (post.reach ?? 0), 0);
  const activeActions = postViews.reduce((total, post) => total + post.activeActions, 0);
  const activeEngagementRate = actionReach > 0 ? activeActions / actionReach : null;
  const frequency = summedPostReach > 0 && views.length === eligible.length ? totalViews / summedPostReach : null;

  let attentionWeightedScore = 0;
  let attentionReach = 0;
  for (const post of postViews) {
    const benchmark = post.attentionBasis === 'watch-time'
      ? creativeBenchmarks.organicWatchSeconds
      : creativeBenchmarks.organicFrequency;
    const score = scoreOf(post.attentionValue, benchmark);
    if (score != null && post.reach != null) {
      attentionWeightedScore += score * post.reach;
      attentionReach += post.reach;
    }
  }
  const attention = attentionReach > 0 ? Math.round(attentionWeightedScore / attentionReach) : null;
  const activeEngagement = scoreOf(activeEngagementRate, creativeBenchmarks.organicEngagementRate);
  const overall = attention != null && activeEngagement != null ? Math.round(0.5 * attention + 0.5 * activeEngagement) : null;
  const reels = eligible.filter((post) => /^reel$/i.test(post.postType));

  return {
    eligiblePostCount: eligible.length,
    summedPostReach,
    totalViews,
    activeActions,
    activeEngagementRate,
    frequency,
    watchTimeCoverage: {
      populatedReels: reels.filter((post) => post.averageWatchTimeSeconds != null && post.averageWatchTimeSeconds > 0).length,
      totalReels: reels.length,
    },
    score: { overall, attention, activeEngagement },
    posts: postViews,
  };
}

export function calculatePaidCreative(records: NormalizedPaidCreativePost[]) {
  const eligibleCtr = records.filter((record) =>
    record.paidClicks != null && record.paidImpressions != null && record.paidImpressions > 0);
  const totalPaidClicks = eligibleCtr.length
    ? eligibleCtr.reduce((total, record) => total + (record.paidClicks ?? 0), 0)
    : null;
  const totalPaidImpressions = eligibleCtr.length
    ? eligibleCtr.reduce((total, record) => total + (record.paidImpressions ?? 0), 0)
    : null;
  const paidCtr = totalPaidClicks != null && totalPaidImpressions != null && totalPaidImpressions > 0
    ? totalPaidClicks / totalPaidImpressions
    : null;
  const sumWhenComplete = (selector: (record: NormalizedPaidCreativePost) => number | null) => {
    const values = records.map(selector);
    return values.length > 0 && values.every((value): value is number => value != null)
      ? values.reduce((total, value) => total + value, 0)
      : null;
  };
  const bySpend = [...records].sort((left, right) => (right.spendAed ?? -1) - (left.spendAed ?? -1));
  return {
    detailRecordCount: records.length,
    totalPaidClicks,
    totalPaidImpressions,
    totalPaidReach: sumWhenComplete((record) => record.paidReach),
    totalPaidComments: sumWhenComplete((record) => record.paidComments),
    totalSpendAed: sumWhenComplete((record) => record.spendAed),
    paidCtr,
    attentionScore: scoreOf(paidCtr, creativeBenchmarks.paidCtr),
    records: bySpend,
    videos: bySpend.filter((record) => record.postType === 'Video' && (record.spendAed ?? 0) > 80),
    statics: bySpend.filter((record) => record.postType === 'Static' && (record.spendAed ?? 0) > 80),
  };
}

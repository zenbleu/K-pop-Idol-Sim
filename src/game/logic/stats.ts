import {
  ALL_STAT_KEYS,
  IDOL_TIER_THRESHOLDS,
  REPUTATION_ORDER,
  SPECIALTY_WEIGHTS,
  TIER_ORDER,
} from '../../config/gameConfig';
import {
  GameState,
  Idol,
  IdolSpecialty,
  IdolStats,
  ReputationLevel,
  TierDisplay,
  TierRank,
} from '../models/types';
import { clamp } from '../utils/ids';

export function calculateWeightedOverallRating(
  stats: IdolStats,
  specialty: IdolSpecialty
): number {
  const weights = SPECIALTY_WEIGHTS[specialty];
  let weightedSum = 0;
  let totalWeight = 0;
  for (const key of ALL_STAT_KEYS) {
    const w = weights[key] ?? 0;
    weightedSum += clamp(stats[key], 0, 100) * w;
    totalWeight += w;
  }
  if (totalWeight <= 0) return 0;
  return Math.round(clamp(weightedSum / totalWeight, 0, 100));
}

export function getTierFromRating(rating: number): TierRank {
  const r = Math.round(clamp(rating, 0, 100));
  for (const entry of IDOL_TIER_THRESHOLDS) {
    if (r >= entry.min && r <= entry.max) {
      return entry.tier;
    }
  }
  return 'F';
}

export function syncIdolRatingAndTier(idol: Idol): Idol {
  const overallRating = calculateWeightedOverallRating(idol.stats, idol.specialty);
  const tier = getTierFromRating(overallRating);
  return {
    ...idol,
    overallRating,
    tier,
  };
}

/**
 * Maknae is automatically the youngest member of a group.
 * Deterministic tie-breaker: earliest member order in group, then alphabetical ID.
 */
export function findMaknaeId(members: Idol[]): string | null {
  if (members.length === 0) return null;
  let youngest = members[0];
  for (let i = 1; i < members.length; i++) {
    const candidate = members[i];
    if (candidate.age < youngest.age) {
      youngest = candidate;
    } else if (candidate.age === youngest.age && candidate.id < youngest.id) {
      youngest = candidate;
    }
  }
  return youngest.id;
}

export function compareTiers(a: TierRank, b: TierRank): number {
  return TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b);
}

export function compareReputations(a: ReputationLevel, b: ReputationLevel): number {
  return REPUTATION_ORDER.indexOf(a) - REPUTATION_ORDER.indexOf(b);
}

export function evaluateCompanyProgression(state: GameState): {
  score: number;
  tier: TierRank;
  tierDisplay: TierDisplay;
  reputation: ReputationLevel;
  newMilestones: string[];
} {
  const totalFans =
    state.groups.reduce((s, g) => s + g.fanbase, 0) +
    state.soloArtists.reduce((s, a) => s + a.fanbase, 0);
  const avgGroupPop =
    state.groups.length > 0
      ? state.groups.reduce((s, g) => s + g.popularity, 0) / state.groups.length
      : 0;
  const avgSoloPop =
    state.soloArtists.length > 0
      ? state.soloArtists.reduce((s, a) => s + a.popularity, 0) / state.soloArtists.length
      : 0;
  const avgIdolRating =
    state.idols.length > 0
      ? state.idols.reduce((s, i) => s + i.overallRating, 0) / state.idols.length
      : 0;

  const completedReleases = state.releases.filter((r) => r.status !== 'In Production');
  const totalSales = state.releases.reduce((s, r) => s + r.salesUnits, 0);
  const completedConcerts = state.concerts.filter((c) => c.status === 'Completed');
  const facilityLevels = Object.values(state.facilities).reduce((s, f) => s + f.level, 0);
  const upgradeCount = state.company.purchasedUpgradeIds.length;

  // Milestone-based reputation progression (not money alone)
  const newMilestones: string[] = [];
  const hasMilestone = (id: string) =>
    state.milestonesReached.includes(id) || newMilestones.includes(id);

  if (state.idols.length >= 1 && !hasMilestone('first_recruit')) {
    newMilestones.push('first_recruit');
  }
  if ((state.groups.length >= 1 || state.soloArtists.length >= 1) && !hasMilestone('first_debut')) {
    newMilestones.push('first_debut');
  }
  if (completedReleases.length >= 1 && !hasMilestone('first_release')) {
    newMilestones.push('first_release');
  }
  if (completedConcerts.length >= 1 && !hasMilestone('first_concert')) {
    newMilestones.push('first_concert');
  }
  if (
    completedConcerts.some((c) => c.scope === 'International' || c.scope === 'Global') &&
    !hasMilestone('overseas_stage')
  ) {
    newMilestones.push('overseas_stage');
  }
  if (totalSales >= 100_000 && !hasMilestone('sales_100k')) {
    newMilestones.push('sales_100k');
  }

  let reputation: ReputationLevel = state.company.reputation;
  const repIdx = REPUTATION_ORDER.indexOf(reputation);

  // Check reputation promotion conditions (cannot jump multiple levels prematurely, earns step by step)
  const canRegional =
    (state.groups.length >= 1 || state.soloArtists.length >= 1) &&
    totalFans >= 600 &&
    (completedReleases.length >= 1 || completedConcerts.length >= 1);
  const canNational =
    canRegional &&
    totalFans >= 4_000 &&
    completedReleases.length >= 2 &&
    totalSales >= 5_000 &&
    (avgGroupPop >= 30 || avgSoloPop >= 30);
  const canInternational =
    canNational &&
    totalFans >= 18_000 &&
    completedReleases.length >= 4 &&
    completedConcerts.some((c) => c.scope === 'International' || c.scope === 'Global') &&
    totalSales >= 25_000;
  const canGlobal =
    canInternational &&
    totalFans >= 65_000 &&
    totalSales >= 80_000 &&
    state.tours.some((t) => t.status === 'Completed' || t.datesCompleted >= 2) &&
    (avgGroupPop >= 65 || avgSoloPop >= 65);
  const canWorldwide =
    canGlobal &&
    totalFans >= 200_000 &&
    totalSales >= 220_000 &&
    completedConcerts.some((c) => c.scope === 'Global' || c.scope === 'Company') &&
    upgradeCount >= 8;

  if (repIdx === 0 && canRegional) reputation = 'Regional';
  else if (repIdx === 1 && canNational) reputation = 'National';
  else if (repIdx === 2 && canInternational) reputation = 'International';
  else if (repIdx === 3 && canGlobal) reputation = 'Global';
  else if (repIdx === 4 && canWorldwide) reputation = 'Worldwide';

  const finalRepScore = REPUTATION_ORDER.indexOf(reputation) * 14;
  const rosterScore = Math.min(18, state.idols.length * 1.4 + avgIdolRating * 0.16);
  const artistScore = Math.min(20, Math.max(avgGroupPop, avgSoloPop) * 0.22);
  const releaseScore = Math.min(18, completedReleases.length * 2.5 + Math.log10(totalSales + 1) * 2.2);
  const concertScore = Math.min(14, completedConcerts.length * 2.4 + state.tours.length * 3);
  const infraScore = Math.min(16, facilityLevels * 0.9 + upgradeCount * 1.2);
  const financeScore = Math.min(10, Math.log10(Math.max(1, state.company.totalRevenue) / 1_000_000 + 1) * 3.8);

  const score = Math.round(
    clamp(
      finalRepScore + rosterScore + artistScore + releaseScore + concertScore + infraScore + financeScore,
      0,
      100
    )
  );

  // S and P require high composite achievements, not money alone
  let tier: TierRank = 'F';
  if (score >= 90 && reputation === 'Worldwide' && completedReleases.length >= 6 && completedConcerts.length >= 4) {
    tier = 'P';
  } else if (score >= 76 && compareReputations(reputation, 'International') >= 0 && completedReleases.length >= 4) {
    tier = 'S';
  } else if (score >= 60 && compareReputations(reputation, 'National') >= 0) {
    tier = 'A';
  } else if (score >= 44 && compareReputations(reputation, 'Regional') >= 0) {
    tier = 'B';
  } else if (score >= 28) {
    tier = 'C';
  } else if (score >= 14) {
    tier = 'D';
  }

  const tierThresholds: Record<TierRank, number> = {
    F: 0,
    D: 14,
    C: 28,
    B: 44,
    A: 60,
    S: 76,
    P: 90,
  };
  const nextThresholds: Record<TierRank, number> = {
    F: 14,
    D: 28,
    C: 44,
    B: 60,
    A: 76,
    S: 90,
    P: 100,
  };
  const span = nextThresholds[tier] - tierThresholds[tier];
  const isPlus = score >= tierThresholds[tier] + span * 0.6;
  const tierDisplay = (isPlus ? `${tier}+` : tier) as TierDisplay;

  return {
    score,
    tier,
    tierDisplay,
    reputation,
    newMilestones,
  };
}

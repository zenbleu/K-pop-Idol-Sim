import {
  ALL_STAT_KEYS,
  MONEY_AUDITION_CONFIG,
  RUBY_AUDITION_CONFIG,
  SPECIALTY_WEIGHTS,
} from '../../config/gameConfig';
import {
  AuditionCandidate,
  AuditionMoneyType,
  GameState,
  Gender,
  Idol,
  IdolPersonality,
  IdolSpecialty,
  IdolStats,
  RubyAuditionDuration,
  StatKey,
} from '../models/types';
import { monthsToWeeks } from '../utils/date';
import { clamp, createId } from '../utils/ids';
import { pickAvailablePortrait } from '../utils/portraits';
import { calculateWeightedOverallRating, evaluateCompanyProgression, getTierFromRating } from './stats';

const FEMALE_NAMES = [
  'Kim Min-ji', 'Park So-yeon', 'Lee Ha-eun', 'Choi Yu-na', 'Jung Eun-bi',
  'Kang Seul-gi', 'Han Chae-won', 'Yoon Bo-ra', 'Lim Na-yeon', 'Song Ji-hyo',
  'Shin Ryu-jin', 'Jang Won-young', 'Bae Su-zy', 'Hwang Ye-ji', 'Ahn Yu-jin',
  'Kwon Eun-bi', 'Oh Hae-won', 'Seo Soo-jin', 'Moon Byul-yi', 'Noh Ji-sun',
  'Sora Takahashi', 'Mina Sato', 'Hana Kobayashi', 'Chloe Kim', 'Aria Chen',
];

const MALE_NAMES = [
  'Kim Tae-hyun', 'Park Ji-hoon', 'Lee Min-ho', 'Choi Seung-cheol', 'Jung Jae-hyun',
  'Kang Daniel', 'Han Jisung', 'Yoon San-ha', 'Lim Jae-beom', 'Song Min-ho',
  'Shin Dong-hyuk', 'Jang Hyun-seung', 'Bae Jin-young', 'Hwang Hyun-jin', 'Ahn Hyo-seop',
  'Kwon Soon-young', 'Oh Se-hun', 'Seo Chang-bin', 'Moon Bin', 'Noh Tae-hyun',
  'Ren Watanabe', 'Haruto Tanaka', 'Kai Nakamura', 'Leo Park', 'Evan Lin',
];

const NATIONALITIES = ['South Korea', 'South Korea', 'South Korea', 'Japan', 'USA', 'Canada', 'Taiwan', 'Thailand'];

const PERSONALITIES: IdolPersonality[] = [
  'Hardworking',
  'Creative',
  'Charismatic',
  'Perfectionist',
  'Shy',
];

const SPECIALTIES: IdolSpecialty[] = [
  'Vocal Specialist',
  'Dance Specialist',
  'Rap Specialist',
  'All-Rounder',
  'Composer',
  'Performer',
  'Entertainer',
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateStatsForRange(
  specialty: IdolSpecialty,
  minBase: number,
  maxBase: number,
  maxRatingCap = 87
): IdolStats {
  const weights = SPECIALTY_WEIGHTS[specialty];
  const stats = {} as IdolStats;

  for (const key of ALL_STAT_KEYS) {
    const w = weights[key];
    const specialtyBoost = w >= 0.2 ? randInt(4, 14) : w >= 0.1 ? randInt(1, 7) : 0;
    stats[key] = clamp(randInt(minBase, maxBase) + specialtyBoost, 1, 92);
  }

  // Ensure rating never exceeds cap (e.g. Ruby auditions never generate S or P directly)
  let rating = calculateWeightedOverallRating(stats, specialty);
  let safety = 0;
  while (rating > maxRatingCap && safety < 25) {
    for (const key of ALL_STAT_KEYS) {
      stats[key] = Math.max(1, stats[key] - 3);
    }
    rating = calculateWeightedOverallRating(stats, specialty);
    safety++;
  }

  return stats;
}

function generateCandidate(params: {
  gender: Gender;
  minBase: number;
  maxBase: number;
  minPotential: number;
  maxPotential: number;
  costMultiplier: number;
  sourceLabel: string;
  usedPortraits: Set<string>;
  maxRatingCap?: number;
  minRatingFloor?: number;
}): AuditionCandidate {
  const namePool = params.gender === 'Female' ? FEMALE_NAMES : MALE_NAMES;
  const name = namePool[randInt(0, namePool.length - 1)];
  const nationality = NATIONALITIES[randInt(0, NATIONALITIES.length - 1)];
  const age = randInt(15, 23);
  const personality = PERSONALITIES[randInt(0, PERSONALITIES.length - 1)];
  const specialty = SPECIALTIES[randInt(0, SPECIALTIES.length - 1)];
  const portraitFilename = pickAvailablePortrait(params.gender, params.usedPortraits);
  params.usedPortraits.add(portraitFilename);

  // Higher potential should be uncommon
  const potentialRoll = Math.random();
  const potentialBase =
    potentialRoll > 0.88
      ? randInt(Math.max(params.minPotential, params.maxPotential - 10), params.maxPotential)
      : randInt(params.minPotential, Math.max(params.minPotential, params.maxPotential - 12));

  let stats = generateStatsForRange(
    specialty,
    params.minBase,
    params.maxBase,
    params.maxRatingCap ?? 87
  );

  // If floor specified (e.g. higher ruby durations), gently lift primary stats within cap
  let rating = calculateWeightedOverallRating(stats, specialty);
  let guard = 0;
  while (params.minRatingFloor && rating < params.minRatingFloor && guard < 20) {
    for (const key of ALL_STAT_KEYS) {
      stats[key] = clamp(stats[key] + 3, 1, 86);
    }
    rating = calculateWeightedOverallRating(stats, specialty);
    guard++;
  }
  if (params.maxRatingCap && rating > params.maxRatingCap) {
    for (const key of ALL_STAT_KEYS) {
      stats[key] = Math.max(1, stats[key] - (rating - params.maxRatingCap));
    }
    rating = calculateWeightedOverallRating(stats, specialty);
  }

  const tier = getTierFromRating(rating);
  const visual = clamp(randInt(25, 88) + (tier === 'A' ? 6 : 0), 15, 98);
  const recruitmentCost = Math.round(
    (850_000 + rating * 145_000 + potentialBase * 28_000) * params.costMultiplier
  );

  return {
    id: createId('cand'),
    name,
    gender: params.gender,
    age,
    nationality,
    personality,
    specialty,
    potential: potentialBase,
    visual,
    stats,
    overallRating: rating,
    tier,
    recruitmentCost,
    portraitFilename,
    sourceLabel: params.sourceLabel,
  };
}

export function runMoneyAudition(
  state: GameState,
  auditionType: AuditionMoneyType,
  genderFilter: Gender | 'Mixed' = 'Mixed'
): { ok: boolean; error?: string; state: GameState } {
  const cfg = MONEY_AUDITION_CONFIG[auditionType];
  if (
    cfg.unlockUpgradeId &&
    !state.company.purchasedUpgradeIds.includes(cfg.unlockUpgradeId)
  ) {
    return {
      ok: false,
      error: `${cfg.label} requires the matching Audition upgrade in Agency HQ.`,
      state,
    };
  }
  if (state.company.money < cfg.cost) {
    return {
      ok: false,
      error: `Insufficient funds for ${cfg.label}.`,
      state,
    };
  }

  const usedPortraits = new Set(state.idols.map((i) => i.portraitFilename));
  const pool: AuditionCandidate[] = [];
  for (let i = 0; i < state.company.auditionCapacity; i++) {
    const gender: Gender =
      genderFilter === 'Mixed' ? (i % 2 === 0 ? 'Female' : 'Male') : genderFilter;
    pool.push(
      generateCandidate({
        gender,
        minBase: cfg.minBaseStat,
        maxBase: cfg.maxBaseStat,
        minPotential: cfg.minPotential,
        maxPotential: cfg.maxPotential,
        costMultiplier: auditionType === 'Streets' ? 0.85 : auditionType === 'Domestic' ? 1.0 : 1.15,
        sourceLabel: cfg.label,
        usedPortraits,
        maxRatingCap: 87,
      })
    );
  }

  const nextState: GameState = {
    ...state,
    company: {
      ...state.company,
      money: state.company.money - cfg.cost,
      totalExpenses: state.company.totalExpenses + cfg.cost,
    },
    auditionPool: pool,
    lastAuditionInfo: `${cfg.label} held (${pool.length} candidates scouted)`,
  };

  return { ok: true, state: nextState };
}

export function runRubyAudition(
  state: GameState,
  params: {
    gender: Gender;
    duration: RubyAuditionDuration;
    slots: number;
  }
): { ok: boolean; error?: string; state: GameState } {
  const slots = clamp(Math.round(params.slots), 1, state.company.auditionCapacity);
  const cfg = RUBY_AUDITION_CONFIG[params.duration];
  const totalRubyCost = cfg.rubyCostPerSlot * slots;

  if (state.company.rubies < totalRubyCost) {
    return {
      ok: false,
      error: `Need ${totalRubyCost} Rubies for this audition.`,
      state,
    };
  }

  const usedPortraits = new Set(state.idols.map((i) => i.portraitFilename));
  const pool: AuditionCandidate[] = [];
  for (let i = 0; i < slots; i++) {
    pool.push(
      generateCandidate({
        gender: params.gender,
        minBase: Math.max(4, cfg.minRatingTarget - 8),
        maxBase: Math.min(86, cfg.maxRatingTarget + 4),
        minPotential: cfg.minPotential,
        maxPotential: cfg.maxPotential,
        costMultiplier: 0.9,
        sourceLabel: `Ruby Audition (${params.duration})`,
        usedPortraits,
        minRatingFloor: cfg.minRatingTarget,
        maxRatingCap: Math.min(87, cfg.maxRatingTarget), // Never S or P directly
      })
    );
  }

  const nextState: GameState = {
    ...state,
    company: {
      ...state.company,
      rubies: state.company.rubies - totalRubyCost,
    },
    auditionPool: pool,
    lastAuditionInfo: `Ruby ${params.gender} Audition (${params.duration}, ${slots} slots)`,
  };

  return { ok: true, state: nextState };
}

export function recruitCandidate(
  state: GameState,
  candidateId: string
): { ok: boolean; error?: string; state: GameState; recruited?: Idol } {
  const candidate = state.auditionPool.find((c) => c.id === candidateId);
  if (!candidate) {
    return { ok: false, error: 'Candidate not found in current audition pool.', state };
  }
  if (state.company.money < candidate.recruitmentCost) {
    return { ok: false, error: 'Insufficient money to sign this trainee contract.', state };
  }

  const contractMonths = 24;
  const newIdol: Idol = {
    id: createId('idol'),
    name: candidate.name,
    stageName: candidate.name.split(' ').slice(-1)[0],
    gender: candidate.gender,
    age: candidate.age,
    nationality: candidate.nationality,
    personality: candidate.personality,
    potential: candidate.potential,
    visual: candidate.visual,
    popularity: Math.max(4, Math.round(candidate.overallRating * 0.2)),
    fanbase: 0,
    loyalty: 75,
    fatigue: 5,
    currentStamina: 100,
    tier: candidate.tier,
    overallRating: candidate.overallRating,
    specialty: candidate.specialty,
    stats: { ...candidate.stats },
    portraitFilename: candidate.portraitFilename,
    contract: {
      status: 'Active',
      durationMonths: contractMonths,
      startDate: { ...state.date },
      expirationTotalWeeks: state.date.totalWeeks + monthsToWeeks(contractMonths),
      weeklySalary: Math.round(250_000 + candidate.overallRating * 15_000),
      renewalEligible: false,
    },
    trainingHistory: [],
    groupId: null,
    groupRoles: [],
    isSoloArtist: false,
    equippedClothingIds: [],
    equippedAccessoryIds: [],
    rejoinCooldownUntilWeek: null,
    retentionOfferCount: 0,
    departureWarning: false,
  };

  let nextState: GameState = {
    ...state,
    company: {
      ...state.company,
      money: state.company.money - candidate.recruitmentCost,
      totalExpenses: state.company.totalExpenses + candidate.recruitmentCost,
    },
    idols: [...state.idols, newIdol],
    auditionPool: state.auditionPool.filter((c) => c.id !== candidateId),
    news: [
      {
        id: createId('news'),
        dateLabel: `${state.date.year}.${String(state.date.month).padStart(2, '0')}.W${state.date.week}`,
        totalWeeks: state.date.totalWeeks,
        category: 'Roster' as const,
        headline: `${newIdol.stageName} joins ${state.company.name} as trainee`,
        detail: `Scouted via ${candidate.sourceLabel} (${newIdol.tier}-Tier, ${newIdol.specialty}).`,
      },
      ...state.news,
    ].slice(0, 60),
  };

  const prog = evaluateCompanyProgression(nextState);
  nextState = {
    ...nextState,
    company: {
      ...nextState.company,
      companyScore: prog.score,
      tier: prog.tier,
      tierDisplay: prog.tierDisplay,
      reputation: prog.reputation,
    },
    milestonesReached: [...nextState.milestonesReached, ...prog.newMilestones],
  };

  return { ok: true, state: nextState, recruited: newIdol };
}

export function rejectCandidate(state: GameState, candidateId: string): GameState {
  return {
    ...state,
    auditionPool: state.auditionPool.filter((c) => c.id !== candidateId),
  };
}

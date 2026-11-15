import {
  ACTIVITY_CONFIG,
  SCHEDULE_ACTIVITY_DEFINITIONS,
  SCHEDULE_CATEGORIES,
  TRAINING_FACILITIES,
} from '../../config/gameConfig';
import {
  ActivityType,
  GameDate,
  GameState,
  Idol,
  PlannedActivity,
  ScheduleActivityDefinition,
  ScheduleCategory,
  TierRank,
  Weekday,
  WeeklyPActivityAvailability,
} from '../models/types';
import { createId } from '../utils/ids';
import { hasCompletedProduction } from './production';
import { compareTiers } from './stats';

const TRAINING_LEGACY_TYPES: Set<ActivityType> = new Set([
  'Vocal Practice',
  'Dance Practice',
  'Rap Practice',
  'Stamina Conditioning',
]);

export function resolveScheduleActivityDef(
  activityId?: string,
  activityType?: ActivityType
): ScheduleActivityDefinition | null {
  if (activityId) {
    return SCHEDULE_ACTIVITY_DEFINITIONS.find((d) => d.id === activityId) ?? null;
  }
  if (activityType) {
    return (
      SCHEDULE_ACTIVITY_DEFINITIONS.find((d) => d.legacyActivityType === activityType) ?? null
    );
  }
  return null;
}

export function resolveActivityParticipants(
  state: GameState,
  targetType: 'Idol' | 'Group' | 'Solo' | 'Company',
  targetId: string
): Idol[] {
  if (targetType === 'Idol') {
    const idol = state.idols.find((i) => i.id === targetId);
    return idol ? [idol] : [];
  }
  if (targetType === 'Group') {
    const group = state.groups.find((g) => g.id === targetId);
    if (!group) return [];
    return state.idols.filter((i) => group.memberIds.includes(i.id));
  }
  if (targetType === 'Solo') {
    const solo = state.soloArtists.find((s) => s.id === targetId);
    if (!solo) return [];
    return state.idols.filter((i) => i.id === solo.idolId);
  }
  return [];
}

export function getTargetScheduleProfile(
  state: GameState,
  targetType: 'Idol' | 'Group' | 'Solo' | 'Company',
  targetId: string
): {
  found: boolean;
  targetName: string;
  tier: TierRank;
  debuted: boolean;
  popularity: number;
  error?: string;
} {
  if (targetType === 'Group') {
    const group = state.groups.find((g) => g.id === targetId);
    if (!group) {
      return {
        found: false,
        targetName: '',
        tier: 'F',
        debuted: false,
        popularity: 0,
        error: 'Selected group not found.',
      };
    }
    return {
      found: true,
      targetName: group.name,
      tier: group.tier,
      debuted: hasCompletedProduction(state, 'Group', group.id),
      popularity: group.popularity,
    };
  }
  if (targetType === 'Solo') {
    const solo = state.soloArtists.find((s) => s.id === targetId);
    if (!solo) {
      return {
        found: false,
        targetName: '',
        tier: 'F',
        debuted: false,
        popularity: 0,
        error: 'Selected solo artist not found.',
      };
    }
    return {
      found: true,
      targetName: solo.stageName,
      tier: solo.tier,
      debuted: hasCompletedProduction(state, 'Solo', solo.id),
      popularity: solo.popularity,
    };
  }
  if (targetType === 'Idol') {
    const idol = state.idols.find((i) => i.id === targetId);
    if (!idol) {
      return {
        found: false,
        targetName: '',
        tier: 'F',
        debuted: false,
        popularity: 0,
        error: 'Selected idol not found.',
      };
    }
    const soloEntity = state.soloArtists.find((s) => s.idolId === idol.id);
    const debuted = idol.groupId
      ? hasCompletedProduction(state, 'Group', idol.groupId)
      : soloEntity
        ? hasCompletedProduction(state, 'Solo', soloEntity.id)
        : false;
    return {
      found: true,
      targetName: idol.stageName,
      tier: idol.tier,
      debuted,
      popularity: idol.popularity,
    };
  }
  return {
    found: true,
    targetName: state.company.name,
    tier: state.company.tier,
    debuted: state.releases.some(
      (r) => r.status === 'Promoting' || r.status === 'Completed'
    ),
    popularity: 20,
  };
}

function seededRandom(seedStr: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getFacilityName(facilityId: string): string {
  return TRAINING_FACILITIES.find((f) => f.id === facilityId)?.name ?? facilityId;
}

function generateWeeklyPActivityIds(
  state: GameState,
  targetKey: string,
  rng: () => number,
  previousIds?: string[]
): string[] {
  const alwaysIncluded = new Set<string>([
    'act_rest',
    'trn_vocal',
    'trn_rap',
    'trn_dance',
    'trn_endurance',
  ]);
  const selected = new Set<string>(alwaysIncluded);

  // Eligible non-core activities across Training (facility-owned), Company, Music Shows, Concerts, Others
  const categories: ScheduleCategory[] = [
    'Training',
    'Company',
    'Music Shows',
    'Concerts',
    'Others',
  ];

  for (const cat of categories) {
    const pool = SCHEDULE_ACTIVITY_DEFINITIONS.filter((def) => {
      if (def.category !== cat || alwaysIncluded.has(def.id)) return false;
      if (def.requiredFacilityId && (state.facilities[def.requiredFacilityId]?.level ?? 0) < 1) {
        return false;
      }
      return true;
    });
    if (pool.length === 0) continue;

    // Shuffle pool
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Keep ~68% (at least 2 when pool >= 3, at least 1 otherwise) so weekly rotation is obvious yet rich
    const keepCount =
      pool.length >= 3
        ? Math.max(2, Math.min(pool.length - 1, Math.round(pool.length * 0.68)))
        : pool.length;
    for (let i = 0; i < keepCount; i++) {
      selected.add(shuffled[i].id);
    }
  }

  // Ensure new week doesn't accidentally roll identical set when alternatives exist
  if (previousIds && previousIds.length > 0) {
    const prevSet = new Set(previousIds);
    const same =
      prevSet.size === selected.size && [...selected].every((id) => prevSet.has(id));
    if (same) {
      const swappableOut = [...selected].find(
        (id) => !alwaysIncluded.has(id) && SCHEDULE_ACTIVITY_DEFINITIONS.some((d) => d.id === id)
      );
      const swappableIn = SCHEDULE_ACTIVITY_DEFINITIONS.find(
        (d) =>
          !selected.has(d.id) &&
          d.category !== 'Rest' &&
          (!d.requiredFacilityId || (state.facilities[d.requiredFacilityId]?.level ?? 0) >= 1)
      );
      if (swappableOut && swappableIn) {
        selected.delete(swappableOut);
        selected.add(swappableIn.id);
      }
    }
  }

  void targetKey;
  return [...selected];
}

export function getWeeklyPAvailableSet(
  state: GameState,
  targetType: 'Group' | 'Solo',
  targetId: string
): Set<string> {
  const key = `${targetType}:${targetId}`;
  const persisted = state.weeklyPActivityAvailability?.[key];
  if (persisted && persisted.totalWeeks === state.date.totalWeeks) {
    return new Set(persisted.availableActivityIds);
  }
  const rng = seededRandom(`${key}:w${state.date.totalWeeks}`);
  return new Set(generateWeeklyPActivityIds(state, key, rng));
}

export function ensureWeeklyPActivityAvailability(state: GameState): GameState {
  const currentMap = state.weeklyPActivityAvailability ?? {};
  let changed = false;
  const nextMap: Record<string, WeeklyPActivityAvailability> = {};

  for (const g of state.groups) {
    if (g.tier !== 'P') continue;
    const key = `Group:${g.id}`;
    const existing = currentMap[key];
    if (existing && existing.totalWeeks === state.date.totalWeeks) {
      nextMap[key] = existing;
    } else {
      changed = true;
      const rng = seededRandom(`${key}:w${state.date.totalWeeks}`);
      nextMap[key] = {
        targetType: 'Group',
        targetId: g.id,
        year: state.date.year,
        week: state.date.week,
        totalWeeks: state.date.totalWeeks,
        availableActivityIds: generateWeeklyPActivityIds(state, key, rng),
      };
    }
  }

  for (const s of state.soloArtists) {
    if (s.tier !== 'P') continue;
    const key = `Solo:${s.id}`;
    const existing = currentMap[key];
    if (existing && existing.totalWeeks === state.date.totalWeeks) {
      nextMap[key] = existing;
    } else {
      changed = true;
      const rng = seededRandom(`${key}:w${state.date.totalWeeks}`);
      nextMap[key] = {
        targetType: 'Solo',
        targetId: s.id,
        year: state.date.year,
        week: state.date.week,
        totalWeeks: state.date.totalWeeks,
        availableActivityIds: generateWeeklyPActivityIds(state, key, rng),
      };
    }
  }

  if (!changed && Object.keys(currentMap).length === Object.keys(nextMap).length) {
    return state;
  }
  return {
    ...state,
    weeklyPActivityAvailability: nextMap,
  };
}

export function rollWeeklyPActivityAvailabilityForState(
  state: GameState,
  nextDate: GameDate
): Record<string, WeeklyPActivityAvailability> {
  const nextMap: Record<string, WeeklyPActivityAvailability> = {};
  const prevMap = state.weeklyPActivityAvailability ?? {};

  for (const g of state.groups) {
    if (g.tier !== 'P') continue;
    const key = `Group:${g.id}`;
    const prevIds = prevMap[key]?.availableActivityIds;
    nextMap[key] = {
      targetType: 'Group',
      targetId: g.id,
      year: nextDate.year,
      week: nextDate.week,
      totalWeeks: nextDate.totalWeeks,
      availableActivityIds: generateWeeklyPActivityIds(state, key, Math.random, prevIds),
    };
  }

  for (const s of state.soloArtists) {
    if (s.tier !== 'P') continue;
    const key = `Solo:${s.id}`;
    const prevIds = prevMap[key]?.availableActivityIds;
    nextMap[key] = {
      targetType: 'Solo',
      targetId: s.id,
      year: nextDate.year,
      week: nextDate.week,
      totalWeeks: nextDate.totalWeeks,
      availableActivityIds: generateWeeklyPActivityIds(state, key, Math.random, prevIds),
    };
  }

  return nextMap;
}

export interface ScheduleLibraryEntry {
  def: ScheduleActivityDefinition;
  unlocked: boolean;
  lockReason?: string;
  pExcludedThisWeek?: boolean;
}

export function getScheduleLibraryForTarget(
  state: GameState,
  targetType: 'Group' | 'Solo',
  targetId: string
): {
  debuted: boolean;
  tier: TierRank;
  targetName: string;
  isPTierRandomized: boolean;
  entries: ScheduleLibraryEntry[];
  eligibleCategories: ScheduleCategory[];
} {
  const profile = getTargetScheduleProfile(state, targetType, targetId);
  const isP = profile.tier === 'P' && profile.debuted;
  const pSet = isP ? getWeeklyPAvailableSet(state, targetType, targetId) : null;

  const entries: ScheduleLibraryEntry[] = SCHEDULE_ACTIVITY_DEFINITIONS.map((def) => {
    if (!profile.debuted && def.category !== 'Training') {
      return {
        def,
        unlocked: false,
        lockReason: 'Pre-debut: Finish a Music Production first',
      };
    }

    if (compareTiers(profile.tier, def.minTier) < 0) {
      return {
        def,
        unlocked: false,
        lockReason: `Requires Tier ${def.minTier} (now Tier ${profile.tier})`,
      };
    }

    if (
      def.requiredFacilityId &&
      (state.facilities[def.requiredFacilityId]?.level ?? 0) < 1
    ) {
      return {
        def,
        unlocked: false,
        lockReason: `Requires ${getFacilityName(def.requiredFacilityId)}`,
      };
    }

    if (isP && pSet && !pSet.has(def.id)) {
      return {
        def,
        unlocked: false,
        pExcludedThisWeek: true,
        lockReason: 'Rotated out for this week (P-Tier pool)',
      };
    }

    return { def, unlocked: true };
  });

  const eligibleCategories: ScheduleCategory[] = profile.debuted
    ? [...SCHEDULE_CATEGORIES]
    : ['Training'];

  return {
    debuted: profile.debuted,
    tier: profile.tier,
    targetName: profile.targetName,
    isPTierRandomized: isP,
    entries,
    eligibleCategories,
  };
}

export function validateActivityAssignment(
  state: GameState,
  params: {
    day: Weekday;
    activityType: ActivityType;
    activityId?: string;
    targetType: 'Idol' | 'Group' | 'Solo' | 'Company';
    targetId: string;
    ignoreActivityId?: string;
  }
): {
  valid: boolean;
  error?: string;
  targetName: string;
  estimatedIncome: number;
  estimatedCost: number;
  activityLabel: string;
  resolvedDef: ScheduleActivityDefinition | null;
} {
  const def = params.activityId ? resolveScheduleActivityDef(params.activityId) : null;
  const legacyCfg = ACTIVITY_CONFIG[params.activityType];
  const activityLabel = def?.label ?? legacyCfg.label;
  const staminaCost = def?.staminaCost ?? legacyCfg.staminaCost;
  const baseIncome = def?.baseIncome ?? legacyCfg.baseIncome;
  const baseCost = def?.baseCost ?? legacyCfg.baseCost;

  if (!def && !legacyCfg.allowedTargets.includes(params.targetType)) {
    return {
      valid: false,
      error: `${activityLabel} cannot be assigned to ${params.targetType}.`,
      targetName: '',
      estimatedIncome: 0,
      estimatedCost: 0,
      activityLabel,
      resolvedDef: null,
    };
  }

  const profile = getTargetScheduleProfile(state, params.targetType, params.targetId);
  if (!profile.found) {
    return {
      valid: false,
      error: profile.error ?? 'Selected target not found.',
      targetName: '',
      estimatedIncome: 0,
      estimatedCost: 0,
      activityLabel,
      resolvedDef: def,
    };
  }

  const targetName = profile.targetName;
  const artistPopularity = profile.popularity;

  if (params.targetType === 'Idol') {
    const idol = state.idols.find((i) => i.id === params.targetId);
    if (idol && idol.contract.status === 'Expired') {
      return {
        valid: false,
        error: `${idol.stageName}'s contract has expired.`,
        targetName,
        estimatedIncome: 0,
        estimatedCost: 0,
        activityLabel,
        resolvedDef: def,
      };
    }
  } else if (params.targetType === 'Group') {
    const group = state.groups.find((g) => g.id === params.targetId);
    if (group && group.memberIds.length === 0) {
      return {
        valid: false,
        error: `${group.name} has no members.`,
        targetName,
        estimatedIncome: 0,
        estimatedCost: 0,
        activityLabel,
        resolvedDef: def,
      };
    }
    if (!def && params.activityType === 'Recording Session' && group && !group.activeProductionId) {
      return {
        valid: false,
        error: `${group.name} has no active album production to record.`,
        targetName,
        estimatedIncome: 0,
        estimatedCost: 0,
        activityLabel,
        resolvedDef: def,
      };
    }
  } else if (params.targetType === 'Solo') {
    const solo = state.soloArtists.find((s) => s.id === params.targetId);
    if (!def && params.activityType === 'Recording Session' && solo && !solo.activeProductionId) {
      return {
        valid: false,
        error: `${solo.stageName} has no active album production to record.`,
        targetName,
        estimatedIncome: 0,
        estimatedCost: 0,
        activityLabel,
        resolvedDef: def,
      };
    }
  } else if (params.targetType === 'Company') {
    if (state.groups.length === 0 && state.soloArtists.length === 0) {
      return {
        valid: false,
        error: 'Debut at least one Group or Solo Artist before running Company Promotion.',
        targetName,
        estimatedIncome: 0,
        estimatedCost: 0,
        activityLabel,
        resolvedDef: def,
      };
    }
  }

  // Enforce pre-debut production -> schedule dependency (Training only until debut release!)
  if (
    params.targetType === 'Group' ||
    params.targetType === 'Solo' ||
    params.targetType === 'Idol'
  ) {
    const isTraining = def
      ? def.category === 'Training'
      : TRAINING_LEGACY_TYPES.has(params.activityType);
    if (!profile.debuted && !isTraining) {
      return {
        valid: false,
        error: `${targetName} is pre-debut. Finish a Music Production release to unlock ${activityLabel}.`,
        targetName,
        estimatedIncome: 0,
        estimatedCost: 0,
        activityLabel,
        resolvedDef: def,
      };
    }
  }

  // Definition-based tier, facility, weekday, and P-tier randomization gates
  if (def) {
    if (compareTiers(profile.tier, def.minTier) < 0) {
      return {
        valid: false,
        error: `${def.label} requires ${targetName} to reach Tier ${def.minTier} (currently Tier ${profile.tier}).`,
        targetName,
        estimatedIncome: 0,
        estimatedCost: 0,
        activityLabel,
        resolvedDef: def,
      };
    }

    if (
      def.requiredFacilityId &&
      (state.facilities[def.requiredFacilityId]?.level ?? 0) < 1
    ) {
      return {
        valid: false,
        error: `${def.label} requires owning ${getFacilityName(def.requiredFacilityId)} in Training.`,
        targetName,
        estimatedIncome: 0,
        estimatedCost: 0,
        activityLabel,
        resolvedDef: def,
      };
    }

    if (def.allowedWeekdays && !def.allowedWeekdays.includes(params.day)) {
      return {
        valid: false,
        error: `${def.label} is only available on ${def.allowedWeekdays.join(', ')}.`,
        targetName,
        estimatedIncome: 0,
        estimatedCost: 0,
        activityLabel,
        resolvedDef: def,
      };
    }

    if (
      (params.targetType === 'Group' || params.targetType === 'Solo') &&
      profile.tier === 'P' &&
      profile.debuted
    ) {
      const pSet = getWeeklyPAvailableSet(state, params.targetType, params.targetId);
      if (!pSet.has(def.id)) {
        return {
          valid: false,
          error: `${def.label} is not in ${targetName}'s randomized P-tier lineup this week.`,
          targetName,
          estimatedIncome: 0,
          estimatedCost: 0,
          activityLabel,
          resolvedDef: def,
        };
      }
    }
  }

  // Validate participant stamina/fatigue and same-day conflicts (no arbitrary 4-activity cap!)
  const participants = resolveActivityParticipants(state, params.targetType, params.targetId);
  const participantIds = new Set(participants.map((p) => p.id));

  const sameDay = state.weeklyPlan.filter(
    (a) => a.day === params.day && a.id !== params.ignoreActivityId
  );

  for (const existing of sameDay) {
    if (
      params.targetType === 'Company' &&
      existing.targetType === 'Company' &&
      existing.activityType === params.activityType
    ) {
      return {
        valid: false,
        error: `${activityLabel} is already planned on ${params.day}.`,
        targetName,
        estimatedIncome: 0,
        estimatedCost: 0,
        activityLabel,
        resolvedDef: def,
      };
    }

    const existingParts = resolveActivityParticipants(state, existing.targetType, existing.targetId);
    const overlaps = existingParts.some((ep) => participantIds.has(ep.id));
    if (!overlaps) continue;

    const isNewRest =
      def?.category === 'Rest' ||
      params.activityType === 'Rest & Recovery' ||
      params.activityType === 'Artist Vacation';
    const isExistingRest =
      existing.category === 'Rest' ||
      existing.activityType === 'Rest & Recovery' ||
      existing.activityType === 'Artist Vacation';

    if (isNewRest && !isExistingRest) {
      return {
        valid: false,
        error: `${targetName} already has scheduled work on ${params.day} (cannot combine Rest with work on the same day).`,
        targetName,
        estimatedIncome: 0,
        estimatedCost: 0,
        activityLabel,
        resolvedDef: def,
      };
    }
    if (!isNewRest && isExistingRest) {
      return {
        valid: false,
        error: `${targetName} is scheduled for ${existing.notes || existing.activityType} on ${params.day}.`,
        targetName,
        estimatedIncome: 0,
        estimatedCost: 0,
        activityLabel,
        resolvedDef: def,
      };
    }

    const sameSpecificActivity =
      def && existing.activityId
        ? existing.activityId === def.id
        : !def && !existing.activityId && existing.activityType === params.activityType;
    if (sameSpecificActivity && existing.targetId === params.targetId) {
      return {
        valid: false,
        error: `${targetName} already has ${activityLabel} scheduled on ${params.day}.`,
        targetName,
        estimatedIncome: 0,
        estimatedCost: 0,
        activityLabel,
        resolvedDef: def,
      };
    }
  }

  // Check projected stamina across the day's planned work
  if (staminaCost > 0) {
    for (const p of participants) {
      const plannedStaminaToday = sameDay.reduce((sum, a) => {
        const parts = resolveActivityParticipants(state, a.targetType, a.targetId);
        return parts.some((ep) => ep.id === p.id) ? sum + a.staminaCost : sum;
      }, 0);
      if (p.currentStamina - plannedStaminaToday < staminaCost) {
        return {
          valid: false,
          error: `${p.stageName} does not have enough stamina for another ${activityLabel} on ${params.day}.`,
          targetName,
          estimatedIncome: 0,
          estimatedCost: 0,
          activityLabel,
          resolvedDef: def,
        };
      }
      if (p.fatigue >= 90) {
        return {
          valid: false,
          error: `${p.stageName} is too fatigued (${p.fatigue}/100). Schedule Rest & Recovery.`,
          targetName,
          estimatedIncome: 0,
          estimatedCost: 0,
          activityLabel,
          resolvedDef: def,
        };
      }
    }
  }

  const popScale = 1 + artistPopularity * 0.03;
  const estimatedIncome = Math.round(baseIncome * popScale);
  const estimatedCost = baseCost;

  return {
    valid: true,
    targetName,
    estimatedIncome,
    estimatedCost,
    activityLabel,
    resolvedDef: def,
  };
}

export function addPlannedActivity(
  state: GameState,
  params: {
    day: Weekday;
    activityType: ActivityType;
    activityId?: string;
    targetType: 'Idol' | 'Group' | 'Solo' | 'Company';
    targetId: string;
    notes?: string;
  }
): { ok: boolean; error?: string; state: GameState; activityLabel?: string } {
  const check = validateActivityAssignment(state, params);
  if (!check.valid) {
    return { ok: false, error: check.error, state };
  }
  const def = check.resolvedDef;
  const legacyCfg = ACTIVITY_CONFIG[params.activityType];
  const activity: PlannedActivity = {
    id: createId('act'),
    day: params.day,
    activityType: def?.legacyActivityType ?? params.activityType,
    activityId: def?.id,
    category: def?.category,
    imagePath: def?.imagePath,
    targetType: params.targetType,
    targetId: params.targetId,
    targetName: check.targetName,
    estimatedIncome: check.estimatedIncome,
    estimatedCost: check.estimatedCost,
    staminaCost: def?.staminaCost ?? legacyCfg.staminaCost,
    fatigueDelta: def?.fatigueDelta ?? legacyCfg.fatigueDelta,
    completed: false,
    notes: params.notes?.trim() || def?.label || undefined,
  };

  return {
    ok: true,
    activityLabel: check.activityLabel,
    state: {
      ...state,
      weeklyPlan: [...state.weeklyPlan, activity],
    },
  };
}

export function updatePlannedActivity(
  state: GameState,
  plannedId: string,
  params: {
    day: Weekday;
    activityType: ActivityType;
    activityId?: string;
    targetType: 'Idol' | 'Group' | 'Solo' | 'Company';
    targetId: string;
  }
): { ok: boolean; error?: string; state: GameState } {
  const check = validateActivityAssignment(state, {
    ...params,
    ignoreActivityId: plannedId,
  });
  if (!check.valid) {
    return { ok: false, error: check.error, state };
  }
  const def = check.resolvedDef;
  const legacyCfg = ACTIVITY_CONFIG[params.activityType];
  return {
    ok: true,
    state: {
      ...state,
      weeklyPlan: state.weeklyPlan.map((a) =>
        a.id === plannedId
          ? {
              ...a,
              day: params.day,
              activityType: def?.legacyActivityType ?? params.activityType,
              activityId: def?.id,
              category: def?.category,
              imagePath: def?.imagePath,
              targetType: params.targetType,
              targetId: params.targetId,
              targetName: check.targetName,
              estimatedIncome: check.estimatedIncome,
              estimatedCost: check.estimatedCost,
              staminaCost: def?.staminaCost ?? legacyCfg.staminaCost,
              fatigueDelta: def?.fatigueDelta ?? legacyCfg.fatigueDelta,
              notes: def?.label ?? a.notes,
            }
          : a
      ),
    },
  };
}

export function removePlannedActivity(state: GameState, activityId: string): GameState {
  return {
    ...state,
    weeklyPlan: state.weeklyPlan.filter((a) => a.id !== activityId),
  };
}

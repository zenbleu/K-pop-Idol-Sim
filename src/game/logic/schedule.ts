import { ACTIVITY_CONFIG } from '../../config/gameConfig';
import {
  ActivityType,
  GameState,
  Idol,
  PlannedActivity,
  Weekday,
} from '../models/types';
import { createId } from '../utils/ids';

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

export function validateActivityAssignment(
  state: GameState,
  params: {
    day: Weekday;
    activityType: ActivityType;
    targetType: 'Idol' | 'Group' | 'Solo' | 'Company';
    targetId: string;
    ignoreActivityId?: string;
  }
): { valid: boolean; error?: string; targetName: string; estimatedIncome: number; estimatedCost: number } {
  const cfg = ACTIVITY_CONFIG[params.activityType];
  if (!cfg.allowedTargets.includes(params.targetType)) {
    return {
      valid: false,
      error: `${cfg.label} cannot be assigned to ${params.targetType}.`,
      targetName: '',
      estimatedIncome: 0,
      estimatedCost: 0,
    };
  }

  let targetName = state.company.name;
  let artistPopularity = 10;

  if (params.targetType === 'Idol') {
    const idol = state.idols.find((i) => i.id === params.targetId);
    if (!idol) {
      return { valid: false, error: 'Selected idol not found.', targetName: '', estimatedIncome: 0, estimatedCost: 0 };
    }
    if (idol.contract.status === 'Expired') {
      return { valid: false, error: `${idol.stageName}'s contract has expired.`, targetName: '', estimatedIncome: 0, estimatedCost: 0 };
    }
    targetName = idol.stageName;
    artistPopularity = idol.popularity;
  } else if (params.targetType === 'Group') {
    const group = state.groups.find((g) => g.id === params.targetId);
    if (!group) {
      return { valid: false, error: 'Selected group not found.', targetName: '', estimatedIncome: 0, estimatedCost: 0 };
    }
    if (group.memberIds.length === 0) {
      return { valid: false, error: `${group.name} has no members.`, targetName: '', estimatedIncome: 0, estimatedCost: 0 };
    }
    if (params.activityType === 'Recording Session' && !group.activeProductionId) {
      return {
        valid: false,
        error: `${group.name} has no active album production to record.`,
        targetName: '',
        estimatedIncome: 0,
        estimatedCost: 0,
      };
    }
    targetName = group.name;
    artistPopularity = group.popularity;
  } else if (params.targetType === 'Solo') {
    const solo = state.soloArtists.find((s) => s.id === params.targetId);
    if (!solo) {
      return { valid: false, error: 'Selected solo artist not found.', targetName: '', estimatedIncome: 0, estimatedCost: 0 };
    }
    if (params.activityType === 'Recording Session' && !solo.activeProductionId) {
      return {
        valid: false,
        error: `${solo.stageName} has no active album production to record.`,
        targetName: '',
        estimatedIncome: 0,
        estimatedCost: 0,
      };
    }
    targetName = solo.stageName;
    artistPopularity = solo.popularity;
  } else if (params.targetType === 'Company') {
    if (state.groups.length === 0 && state.soloArtists.length === 0) {
      return {
        valid: false,
        error: 'Debut at least one Group or Solo Artist before running Company Promotion.',
        targetName: '',
        estimatedIncome: 0,
        estimatedCost: 0,
      };
    }
  }

  // Validate participant stamina/fatigue and same-day conflicts (no arbitrary 4-activity cap!)
  const participants = resolveActivityParticipants(state, params.targetType, params.targetId);
  const participantIds = new Set(participants.map((p) => p.id));

  // Check conflicting identical/incompatible activities on the same day for overlapping idols
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
        error: `${cfg.label} is already planned on ${params.day}.`,
        targetName,
        estimatedIncome: 0,
        estimatedCost: 0,
      };
    }

    const existingParts = resolveActivityParticipants(state, existing.targetType, existing.targetId);
    const overlaps = existingParts.some((ep) => participantIds.has(ep.id));
    if (!overlaps) continue;

    // Rest/Vacation conflicts with work on the exact same day for the same participant
    const isNewRest =
      params.activityType === 'Rest & Recovery' || params.activityType === 'Artist Vacation';
    const isExistingRest =
      existing.activityType === 'Rest & Recovery' || existing.activityType === 'Artist Vacation';

    if (isNewRest && !isExistingRest) {
      return {
        valid: false,
        error: `${targetName} already has scheduled work on ${params.day} (cannot combine Rest/Vacation with work on the same day).`,
        targetName,
        estimatedIncome: 0,
        estimatedCost: 0,
      };
    }
    if (!isNewRest && isExistingRest) {
      return {
        valid: false,
        error: `${targetName} is scheduled for ${existing.activityType} on ${params.day}.`,
        targetName,
        estimatedIncome: 0,
        estimatedCost: 0,
      };
    }
    if (existing.activityType === params.activityType && existing.targetId === params.targetId) {
      return {
        valid: false,
        error: `${targetName} already has ${cfg.label} scheduled on ${params.day}.`,
        targetName,
        estimatedIncome: 0,
        estimatedCost: 0,
      };
    }
  }

  // Check projected stamina across the day's planned work
  if (cfg.staminaCost > 0) {
    for (const p of participants) {
      const plannedStaminaToday = sameDay.reduce((sum, a) => {
        const parts = resolveActivityParticipants(state, a.targetType, a.targetId);
        return parts.some((ep) => ep.id === p.id) ? sum + a.staminaCost : sum;
      }, 0);
      if (p.currentStamina - plannedStaminaToday < cfg.staminaCost) {
        return {
          valid: false,
          error: `${p.stageName} does not have enough stamina for another ${cfg.label} on ${params.day}.`,
          targetName,
          estimatedIncome: 0,
          estimatedCost: 0,
        };
      }
      if (p.fatigue >= 90) {
        return {
          valid: false,
          error: `${p.stageName} is too fatigued (${p.fatigue}/100). Schedule Rest & Recovery.`,
          targetName,
          estimatedIncome: 0,
          estimatedCost: 0,
        };
      }
    }
  }

  const popScale = 1 + artistPopularity * 0.03;
  const estimatedIncome = Math.round(cfg.baseIncome * popScale);
  const estimatedCost = cfg.baseCost;

  return {
    valid: true,
    targetName,
    estimatedIncome,
    estimatedCost,
  };
}

export function addPlannedActivity(
  state: GameState,
  params: {
    day: Weekday;
    activityType: ActivityType;
    targetType: 'Idol' | 'Group' | 'Solo' | 'Company';
    targetId: string;
    notes?: string;
  }
): { ok: boolean; error?: string; state: GameState } {
  const check = validateActivityAssignment(state, params);
  if (!check.valid) {
    return { ok: false, error: check.error, state };
  }
  const cfg = ACTIVITY_CONFIG[params.activityType];
  const activity: PlannedActivity = {
    id: createId('act'),
    day: params.day,
    activityType: params.activityType,
    targetType: params.targetType,
    targetId: params.targetId,
    targetName: check.targetName,
    estimatedIncome: check.estimatedIncome,
    estimatedCost: check.estimatedCost,
    staminaCost: cfg.staminaCost,
    fatigueDelta: cfg.fatigueDelta,
    completed: false,
    notes: params.notes?.trim() || undefined,
  };

  return {
    ok: true,
    state: {
      ...state,
      weeklyPlan: [...state.weeklyPlan, activity],
    },
  };
}

export function updatePlannedActivity(
  state: GameState,
  activityId: string,
  params: {
    day: Weekday;
    activityType: ActivityType;
    targetType: 'Idol' | 'Group' | 'Solo' | 'Company';
    targetId: string;
  }
): { ok: boolean; error?: string; state: GameState } {
  const check = validateActivityAssignment(state, {
    ...params,
    ignoreActivityId: activityId,
  });
  if (!check.valid) {
    return { ok: false, error: check.error, state };
  }
  const cfg = ACTIVITY_CONFIG[params.activityType];
  return {
    ok: true,
    state: {
      ...state,
      weeklyPlan: state.weeklyPlan.map((a) =>
        a.id === activityId
          ? {
              ...a,
              day: params.day,
              activityType: params.activityType,
              targetType: params.targetType,
              targetId: params.targetId,
              targetName: check.targetName,
              estimatedIncome: check.estimatedIncome,
              estimatedCost: check.estimatedCost,
              staminaCost: cfg.staminaCost,
              fatigueDelta: cfg.fatigueDelta,
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

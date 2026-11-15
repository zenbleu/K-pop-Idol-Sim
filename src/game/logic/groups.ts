import { STARTING_PROGRESSION } from '../../config/gameConfig';
import {
  GameState,
  Gender,
  Group,
  GroupRole,
  Idol,
  SoloArtist,
} from '../models/types';
import { formatGameDateShort, monthsToWeeks } from '../utils/date';
import { clamp, createId } from '../utils/ids';
import { evaluateCompanyProgression, getTierFromRating } from './stats';

export function isIdolInRejoinCooldown(idol: Idol, currentTotalWeeks: number): boolean {
  return idol.rejoinCooldownUntilWeek !== null && currentTotalWeeks < idol.rejoinCooldownUntilWeek;
}

export function formGroup(
  state: GameState,
  params: {
    name: string;
    gender: Gender;
    memberIds: string[];
  }
): { ok: boolean; error?: string; state: GameState; group?: Group } {
  const cleanName = params.name.trim();
  if (!cleanName) {
    return { ok: false, error: 'Group name is required.', state };
  }
  if (state.groups.length >= state.company.maxGroupSlots) {
    return {
      ok: false,
      error: `Group slot limit reached (${state.groups.length}/${state.company.maxGroupSlots}). Upgrade Agency HQ to add more groups.`,
      state,
    };
  }
  if (params.memberIds.length === 0) {
    return { ok: false, error: 'Select at least one eligible trainee.', state };
  }
  if (params.memberIds.length > state.company.maxGroupMembers) {
    return {
      ok: false,
      error: `Group member limit is ${state.company.maxGroupMembers}.`,
      state,
    };
  }

  const members: Idol[] = [];
  for (const id of params.memberIds) {
    const idol = state.idols.find((i) => i.id === id);
    if (!idol) return { ok: false, error: 'Selected idol does not exist.', state };
    if (idol.gender !== params.gender) {
      return {
        ok: false,
        error: `${idol.stageName} does not match ${params.gender} group gender.`,
        state,
      };
    }
    if (idol.groupId !== null) {
      return {
        ok: false,
        error: `${idol.stageName} already belongs to another group.`,
        state,
      };
    }
    if (idol.isSoloArtist) {
      return {
        ok: false,
        error: `${idol.stageName} is currently a Solo Artist.`,
        state,
      };
    }
    if (isIdolInRejoinCooldown(idol, state.date.totalWeeks)) {
      const rem = (idol.rejoinCooldownUntilWeek ?? state.date.totalWeeks) - state.date.totalWeeks;
      return {
        ok: false,
        error: `${idol.stageName} is on a 6-month group rejoining cooldown (${rem} weeks remaining).`,
        state,
      };
    }
    members.push(idol);
  }

  const avgRating =
    members.reduce((sum, m) => sum + m.overallRating, 0) / members.length;
  const avgPop = Math.round(
    members.reduce((sum, m) => sum + m.popularity, 0) / members.length
  );
  const avgLoyalty = Math.round(
    members.reduce((sum, m) => sum + m.loyalty, 0) / members.length
  );

  const newGroup: Group = {
    id: createId('grp'),
    name: cleanName,
    gender: params.gender,
    memberIds: [...params.memberIds],
    popularity: Math.max(8, avgPop),
    fanbase: members.reduce((sum, m) => sum + m.fanbase, 0) + 120,
    weeklyFanGrowth: 0,
    tier: getTierFromRating(avgRating),
    debutDate: { ...state.date },
    reputationContribution: 5,
    companySharePercent: 50,
    groupSharePercent: 50,
    loyalty: avgLoyalty,
    activeProductionId: null,
    activeReleaseId: null,
    soldOutConcertsCount: 0,
    albumHistoryIds: [],
    concertHistoryIds: [],
  };

  let nextState: GameState = {
    ...state,
    idols: state.idols.map((idol) =>
      params.memberIds.includes(idol.id)
        ? { ...idol, groupId: newGroup.id, groupRoles: [] }
        : idol
    ),
    groups: [...state.groups, newGroup],
    news: [
      {
        id: createId('news'),
        dateLabel: formatGameDateShort(state.date),
        totalWeeks: state.date.totalWeeks,
        category: 'Roster' as const,
        headline: `${newGroup.name} debuts under ${state.company.name}!`,
        detail: `${members.length}-member ${params.gender === 'Male' ? 'boy' : 'girl'} group formed.`,
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

  return { ok: true, state: nextState, group: newGroup };
}

export function toggleIdolGroupRole(
  state: GameState,
  idolId: string,
  role: GroupRole
): GameState {
  return {
    ...state,
    idols: state.idols.map((idol) => {
      if (idol.id !== idolId || !idol.groupId) return idol;
      const exists = idol.groupRoles.includes(role);
      const groupRoles = exists
        ? idol.groupRoles.filter((r) => r !== role)
        : [...idol.groupRoles, role];
      return { ...idol, groupRoles };
    }),
  };
}

export function debutSoloArtist(
  state: GameState,
  idolId: string
): { ok: boolean; error?: string; state: GameState } {
  const idol = state.idols.find((i) => i.id === idolId);
  if (!idol) return { ok: false, error: 'Idol not found.', state };
  if (idol.groupId) {
    return { ok: false, error: 'Idol is currently in a group.', state };
  }
  if (idol.isSoloArtist) {
    return { ok: false, error: 'Idol has already debuted as a Solo Artist.', state };
  }

  const newSolo: SoloArtist = {
    id: createId('solo'),
    idolId: idol.id,
    stageName: idol.stageName,
    debutDate: { ...state.date },
    popularity: Math.max(8, idol.popularity),
    fanbase: idol.fanbase + 80,
    weeklyFanGrowth: 0,
    tier: idol.tier,
    activeProductionId: null,
    activeReleaseId: null,
    soldOutConcertsCount: 0,
    albumHistoryIds: [],
    concertHistoryIds: [],
  };

  let nextState: GameState = {
    ...state,
    idols: state.idols.map((i) => (i.id === idolId ? { ...i, isSoloArtist: true } : i)),
    soloArtists: [...state.soloArtists, newSolo],
    news: [
      {
        id: createId('news'),
        dateLabel: formatGameDateShort(state.date),
        totalWeeks: state.date.totalWeeks,
        category: 'Roster' as const,
        headline: `${idol.stageName} debuts as a Solo Artist!`,
        detail: `${state.company.name} launches ${idol.stageName}'s solo career.`,
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

  return { ok: true, state: nextState };
}

export function isIncomeSplitLocked(state: GameState, group: Group): { locked: boolean; reason?: string } {
  if (group.activeProductionId) {
    return {
      locked: true,
      reason: 'Income distribution cannot be adjusted while the group has an active album production.',
    };
  }
  if (group.activeReleaseId) {
    const activeRel = state.releases.find((r) => r.id === group.activeReleaseId);
    if (activeRel && !activeRel.salesCompleted && activeRel.status === 'Promoting') {
      return {
        locked: true,
        reason: 'Income distribution cannot be adjusted during an active album sales/promotion period.',
      };
    }
  }
  return { locked: false };
}

export function updateGroupIncomeSplit(
  state: GameState,
  groupId: string,
  companySharePercent: number
): { ok: boolean; error?: string; state: GameState } {
  const group = state.groups.find((g) => g.id === groupId);
  if (!group) return { ok: false, error: 'Group not found.', state };

  const lockCheck = isIncomeSplitLocked(state, group);
  if (lockCheck.locked) {
    return { ok: false, error: lockCheck.reason, state };
  }

  const companyPct = clamp(Math.round(companySharePercent), 0, 100);
  const groupPct = 100 - companyPct;

  return {
    ok: true,
    state: {
      ...state,
      groups: state.groups.map((g) =>
        g.id === groupId
          ? { ...g, companySharePercent: companyPct, groupSharePercent: groupPct }
          : g
      ),
    },
  };
}

export function removeIdolFromGroup(
  state: GameState,
  idolId: string
): { ok: boolean; error?: string; state: GameState } {
  const idol = state.idols.find((i) => i.id === idolId);
  if (!idol || !idol.groupId) {
    return { ok: false, error: 'Idol is not in a group.', state };
  }
  const group = state.groups.find((g) => g.id === idol.groupId);
  if (!group) {
    return { ok: false, error: 'Group not found.', state };
  }

  const cooldownUntil =
    state.date.totalWeeks + monthsToWeeks(STARTING_PROGRESSION.rejoinCooldownMonths);
  const remainingMembers = group.memberIds.filter((id) => id !== idolId);

  const nextIdols = state.idols.map((i) => {
    if (i.id === idolId) {
      return {
        ...i,
        groupId: null,
        groupRoles: [],
        rejoinCooldownUntilWeek: cooldownUntil,
        loyalty: clamp(i.loyalty - 12, 0, 100),
      };
    }
    if (remainingMembers.includes(i.id)) {
      return {
        ...i,
        loyalty: clamp(i.loyalty - 6, 0, 100),
      };
    }
    return i;
  });

  const nextGroups = state.groups.map((g) =>
    g.id === group.id
      ? {
          ...g,
          memberIds: remainingMembers,
          loyalty: clamp(g.loyalty - 10, 0, 100),
          popularity: clamp(g.popularity - 3, 0, 100),
        }
      : g
  );

  return {
    ok: true,
    state: {
      ...state,
      idols: nextIdols,
      groups: nextGroups,
      news: [
        {
          id: createId('news'),
          dateLabel: formatGameDateShort(state.date),
          totalWeeks: state.date.totalWeeks,
          category: 'Roster' as const,
          headline: `${idol.stageName} leaves ${group.name} lineup`,
          detail: `${idol.stageName} returns to trainee status with a 6-month group rejoin cooldown.`,
        },
        ...state.news,
      ].slice(0, 60),
    },
  };
}

export function removeIdolFromCompany(
  state: GameState,
  idolId: string
): { ok: boolean; error?: string; state: GameState } {
  const idol = state.idols.find((i) => i.id === idolId);
  if (!idol) return { ok: false, error: 'Idol not found.', state };

  const wasGroupId = idol.groupId;
  const nextIdols = state.idols
    .filter((i) => i.id !== idolId)
    .map((i) =>
      wasGroupId && i.groupId === wasGroupId
        ? { ...i, loyalty: clamp(i.loyalty - 14, 0, 100) }
        : i
    );

  const nextGroups = state.groups.map((g) =>
    g.id === wasGroupId
      ? {
          ...g,
          memberIds: g.memberIds.filter((id) => id !== idolId),
          loyalty: clamp(g.loyalty - 18, 0, 100),
          popularity: clamp(g.popularity - 6, 0, 100),
        }
      : g
  );

  const nextSolos = state.soloArtists.filter((s) => s.idolId !== idolId);
  const nextPlan = state.weeklyPlan.filter(
    (act) => !(act.targetType === 'Idol' && act.targetId === idolId)
  );

  let nextState: GameState = {
    ...state,
    idols: nextIdols,
    groups: nextGroups,
    soloArtists: nextSolos,
    weeklyPlan: nextPlan,
    news: [
      {
        id: createId('news'),
        dateLabel: formatGameDateShort(state.date),
        totalWeeks: state.date.totalWeeks,
        category: 'Company' as const,
        headline: `${idol.stageName} departs ${state.company.name}`,
        detail: 'Contract terminated permanently. Company reputation and group stability took a hit.',
      },
      ...state.news,
    ].slice(0, 60),
  };

  // Reputation penalty only if idol had meaningful standing or was in a group
  const prog = evaluateCompanyProgression(nextState);
  nextState = {
    ...nextState,
    company: {
      ...nextState.company,
      companyScore: Math.max(0, prog.score - 6),
      tier: prog.tier,
      tierDisplay: prog.tierDisplay,
    },
  };

  return { ok: true, state: nextState };
}

export function disbandGroup(
  state: GameState,
  groupId: string
): { ok: boolean; error?: string; state: GameState } {
  const group = state.groups.find((g) => g.id === groupId);
  if (!group) return { ok: false, error: 'Group not found.', state };

  // Contracts are NOT automatically terminated; members return to trainee status
  const nextIdols = state.idols.map((idol) =>
    idol.groupId === groupId
      ? {
          ...idol,
          groupId: null,
          groupRoles: [],
          loyalty: clamp(idol.loyalty - 10, 0, 100),
        }
      : idol
  );

  const nextReleases = state.releases.filter(
    (r) => !(r.targetType === 'Group' && r.targetId === groupId && r.status === 'In Production')
  );
  const nextPlan = state.weeklyPlan.filter(
    (act) => !(act.targetType === 'Group' && act.targetId === groupId && !act.completed)
  );

  let nextState: GameState = {
    ...state,
    idols: nextIdols,
    groups: state.groups.filter((g) => g.id !== groupId),
    releases: nextReleases,
    weeklyPlan: nextPlan,
    news: [
      {
        id: createId('news'),
        dateLabel: formatGameDateShort(state.date),
        totalWeeks: state.date.totalWeeks,
        category: 'Company' as const,
        headline: `${group.name} officially disbands`,
        detail: 'Former members returned to the trainee roster with active company contracts intact.',
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
    },
  };

  return { ok: true, state: nextState };
}

export function calculateRetentionOfferCost(state: GameState, idol: Idol): number {
  const base = 1_500_000 + idol.overallRating * 85_000 + idol.popularity * 45_000;
  const repeatMult = Math.pow(1.65, idol.retentionOfferCount);
  const loyaltyPenalty = (100 - idol.loyalty) * 25_000;
  const financeFactor = state.company.money > 150_000_000 ? 1.15 : 1.0;
  return Math.round((base + loyaltyPenalty) * repeatMult * financeFactor);
}

export function makeRetentionOffer(
  state: GameState,
  idolId: string
): { ok: boolean; error?: string; state: GameState } {
  const idol = state.idols.find((i) => i.id === idolId);
  if (!idol) return { ok: false, error: 'Idol not found.', state };

  const cost = calculateRetentionOfferCost(state, idol);
  if (state.company.money < cost) {
    return { ok: false, error: 'Insufficient funds for retention offer.', state };
  }

  return {
    ok: true,
    state: {
      ...state,
      company: {
        ...state.company,
        money: state.company.money - cost,
        totalExpenses: state.company.totalExpenses + cost,
      },
      idols: state.idols.map((i) =>
        i.id === idolId
          ? {
              ...i,
              loyalty: clamp(i.loyalty + 22, 0, 100),
              retentionOfferCount: i.retentionOfferCount + 1,
              departureWarning: false,
            }
          : i
      ),
    },
  };
}

export function renewIdolContract(
  state: GameState,
  idolId: string,
  additionalMonths = 24
): { ok: boolean; error?: string; state: GameState } {
  const idol = state.idols.find((i) => i.id === idolId);
  if (!idol) return { ok: false, error: 'Idol not found.', state };

  const bonus = Math.round(idol.contract.weeklySalary * 4);
  if (state.company.money < bonus) {
    return { ok: false, error: 'Insufficient money for renewal signing bonus.', state };
  }

  const newExp =
    Math.max(state.date.totalWeeks, idol.contract.expirationTotalWeeks) +
    monthsToWeeks(additionalMonths);

  return {
    ok: true,
    state: {
      ...state,
      company: {
        ...state.company,
        money: state.company.money - bonus,
        totalExpenses: state.company.totalExpenses + bonus,
      },
      idols: state.idols.map((i) =>
        i.id === idolId
          ? {
              ...i,
              loyalty: clamp(i.loyalty + 10, 0, 100),
              contract: {
                ...i.contract,
                status: 'Active',
                durationMonths: i.contract.durationMonths + additionalMonths,
                expirationTotalWeeks: newExp,
                weeklySalary: Math.round(i.contract.weeklySalary * 1.1),
                renewalEligible: false,
              },
            }
          : i
      ),
    },
  };
}

export function updateIdolStageName(
  state: GameState,
  idolId: string,
  stageName: string
): GameState {
  const clean = stageName.trim();
  if (!clean) return state;
  return {
    ...state,
    idols: state.idols.map((i) => (i.id === idolId ? { ...i, stageName: clean } : i)),
    soloArtists: state.soloArtists.map((s) =>
      s.idolId === idolId ? { ...s, stageName: clean } : s
    ),
  };
}

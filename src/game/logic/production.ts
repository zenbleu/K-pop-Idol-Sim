import {
  EXTERNAL_STAFF_POOL,
  PERSONALITY_CONFIG,
  RELEASE_TYPE_CONFIG,
  REPUTATION_ORDER,
  SHOP_ITEMS,
  STARTING_PROGRESSION,
} from '../../config/gameConfig';
import {
  Concept,
  GameState,
  Genre,
  Idol,
  ReleaseProject,
  ReleaseType,
} from '../models/types';
import { formatGameDateShort } from '../utils/date';
import { clamp, createId } from '../utils/ids';
import { evaluateCompanyProgression } from './stats';

export function getParticipantIdols(
  state: GameState,
  targetType: 'Group' | 'Solo',
  targetId: string
): Idol[] {
  if (targetType === 'Group') {
    const grp = state.groups.find((g) => g.id === targetId);
    if (!grp) return [];
    return state.idols.filter((i) => grp.memberIds.includes(i.id));
  }
  const solo = state.soloArtists.find((s) => s.id === targetId);
  if (!solo) return [];
  return state.idols.filter((i) => i.id === solo.idolId);
}

export function calculateEquipmentBonus(
  participants: Idol[],
  concept: Concept
): { qualityBonus: number; salesBoostPct: number } {
  let qualityBonus = 0;
  let salesBoostPct = 0;
  if (participants.length === 0) return { qualityBonus: 0, salesBoostPct: 0 };

  for (const idol of participants) {
    const equippedIds = [...idol.equippedClothingIds, ...idol.equippedAccessoryIds];
    for (const itemId of equippedIds) {
      const item = SHOP_ITEMS.find((i) => i.id === itemId);
      if (!item) continue;
      const conceptMatch =
        item.conceptAffinity === 'All' || item.conceptAffinity === concept ? 1 : 0.4;
      qualityBonus += item.qualityBonus * conceptMatch;
      salesBoostPct += item.salesBoostPct * conceptMatch;
    }
  }
  return {
    qualityBonus: Math.round(qualityBonus / participants.length),
    salesBoostPct: Math.round(salesBoostPct / participants.length),
  };
}

export function startAlbumProduction(
  state: GameState,
  params: {
    targetType: 'Group' | 'Solo';
    targetId: string;
    releaseType: ReleaseType;
    title: string;
    genre: Genre;
    concept: Concept;
    writerId: string; // external staff id or idol id
    producerId: string; // external staff id or idol id
    marketingBudget: number;
  }
): { ok: boolean; error?: string; state: GameState; project?: ReleaseProject } {
  const title = params.title.trim();
  if (!title) return { ok: false, error: 'Album/Release title is required.', state };

  let targetName = '';
  if (params.targetType === 'Group') {
    const grp = state.groups.find((g) => g.id === params.targetId);
    if (!grp) return { ok: false, error: 'Selected group not found.', state };
    if (grp.activeProductionId) {
      return { ok: false, error: `${grp.name} already has an active production.`, state };
    }
    if (grp.activeReleaseId) {
      const rel = state.releases.find((r) => r.id === grp.activeReleaseId);
      if (rel && !rel.salesCompleted) {
        return {
          ok: false,
          error: `${grp.name} is currently in an active 10-minute album sales period.`,
          state,
        };
      }
    }
    targetName = grp.name;
  } else {
    const solo = state.soloArtists.find((s) => s.id === params.targetId);
    if (!solo) return { ok: false, error: 'Selected solo artist not found.', state };
    if (solo.activeProductionId) {
      return { ok: false, error: `${solo.stageName} already has an active production.`, state };
    }
    if (solo.activeReleaseId) {
      const rel = state.releases.find((r) => r.id === solo.activeReleaseId);
      if (rel && !rel.salesCompleted) {
        return {
          ok: false,
          error: `${solo.stageName} is currently in an active 10-minute album sales period.`,
          state,
        };
      }
    }
    targetName = solo.stageName;
  }

  const releaseCfg = RELEASE_TYPE_CONFIG[params.releaseType];
  const writerStaff = EXTERNAL_STAFF_POOL.find((s) => s.id === params.writerId);
  const writerIdol = state.idols.find((i) => i.id === params.writerId);
  if (!writerStaff && !writerIdol) {
    return { ok: false, error: 'Select a valid songwriter/lyricist.', state };
  }

  const producerStaff = EXTERNAL_STAFF_POOL.find((s) => s.id === params.producerId);
  const producerIdol = state.idols.find((i) => i.id === params.producerId);
  if (!producerStaff && !producerIdol) {
    return { ok: false, error: 'Select a valid producer.', state };
  }

  const writerCost = writerStaff ? writerStaff.hireCost : 0;
  const producerCost = producerStaff ? producerStaff.hireCost : 0;
  const marketing = Math.max(0, Math.round(params.marketingBudget));
  const totalCost = releaseCfg.baseCost + writerCost + producerCost + marketing;

  if (state.company.money < totalCost) {
    return { ok: false, error: 'Insufficient money to fund production & marketing.', state };
  }

  const writerSkill = writerStaff
    ? writerStaff.skill
    : Math.round(
        ((writerIdol!.stats.writing + writerIdol!.stats.composition) / 2) +
          PERSONALITY_CONFIG[writerIdol!.personality].creativeBonus
      );
  const producerSkill = producerStaff
    ? producerStaff.skill
    : Math.round(
        ((producerIdol!.stats.composition + producerIdol!.stats.musical) / 2) +
          PERSONALITY_CONFIG[producerIdol!.personality].creativeBonus
      );

  const project: ReleaseProject = {
    id: createId('rel'),
    title,
    releaseType: params.releaseType,
    targetType: params.targetType,
    targetId: params.targetId,
    targetName,
    genre: params.genre,
    concept: params.concept,
    writerId: writerStaff ? writerStaff.id : writerIdol!.id,
    writerName: writerStaff ? writerStaff.name : writerIdol!.stageName,
    writerIsIdol: Boolean(writerIdol),
    writerSkill,
    producerId: producerStaff ? producerStaff.id : producerIdol!.id,
    producerName: producerStaff ? producerStaff.name : producerIdol!.stageName,
    producerIsIdol: Boolean(producerIdol),
    producerSkill,
    durationWeeks: releaseCfg.durationWeeks,
    weeksElapsed: 0,
    recordingSessions: 0,
    recordingTarget: releaseCfg.recordingTarget,
    productionCost: totalCost,
    marketingBudget: marketing,
    quality: 0,
    status: 'In Production',
    releasedAtDate: null,
    salesStartTimestamp: null,
    lastSalesUpdateTimestamp: null,
    salesUnits: 0,
    totalRevenue: 0,
    companyRevenueApplied: 0,
    groupRevenueApplied: 0,
    popularityGained: 0,
    fansGained: 0,
    salesCompleted: false,
  };

  project.quality = computeAlbumQuality(state, project);

  return {
    ok: true,
    project,
    state: {
      ...state,
      company: {
        ...state.company,
        money: state.company.money - totalCost,
        totalExpenses: state.company.totalExpenses + totalCost,
      },
      groups: state.groups.map((g) =>
        params.targetType === 'Group' && g.id === params.targetId
          ? { ...g, activeProductionId: project.id }
          : g
      ),
      soloArtists: state.soloArtists.map((s) =>
        params.targetType === 'Solo' && s.id === params.targetId
          ? { ...s, activeProductionId: project.id }
          : s
      ),
      releases: [project, ...state.releases],
    },
  };
}

export function computeAlbumQuality(state: GameState, project: ReleaseProject): number {
  const participants = getParticipantIdols(state, project.targetType, project.targetId);
  const avgSkill =
    participants.length > 0
      ? participants.reduce(
          (sum, i) => sum + i.stats.vocal * 0.4 + i.stats.rap * 0.25 + i.stats.musical * 0.2 + i.stats.dance * 0.15,
          0
        ) / participants.length
      : 20;

  const avgFatiguePenalty =
    participants.length > 0
      ? participants.reduce((s, i) => s + (i.fatigue > 75 ? 6 : 0), 0) / participants.length
      : 0;

  const recordingRatio = clamp(
    project.recordingSessions / Math.max(1, project.recordingTarget),
    0,
    1
  );
  const equipBonus = calculateEquipmentBonus(participants, project.concept).qualityBonus;
  const trendGenreBonus = state.trends.trendingGenres.includes(project.genre) ? 6 : 0;
  const trendConceptBonus = state.trends.trendingConcepts.includes(project.concept) ? 6 : 0;

  let hqBonus = 0;
  if (state.company.purchasedUpgradeIds.includes('prd_mastering_suite')) hqBonus += 6;
  if (state.company.purchasedUpgradeIds.includes('prd_mv_stage')) hqBonus += 10;

  const marketingBonus = Math.min(8, project.marketingBudget / 2_000_000);

  const raw =
    avgSkill * 0.36 +
    project.writerSkill * 0.18 +
    project.producerSkill * 0.2 +
    recordingRatio * 18 +
    equipBonus +
    trendGenreBonus +
    trendConceptBonus +
    hqBonus +
    marketingBonus -
    avgFatiguePenalty;

  return Math.round(clamp(raw, 12, 100));
}

export function recordForProduction(
  state: GameState,
  releaseId: string
): { ok: boolean; error?: string; state: GameState } {
  const project = state.releases.find((r) => r.id === releaseId);
  if (!project || project.status !== 'In Production') {
    return { ok: false, error: 'Active production not found.', state };
  }

  const participants = getParticipantIdols(state, project.targetType, project.targetId);
  if (participants.length === 0) {
    return { ok: false, error: 'No participating idols available to record.', state };
  }

  const staminaCost = 16;
  const exhausted = participants.find((i) => i.currentStamina < staminaCost || i.fatigue >= 94);
  if (exhausted) {
    return {
      ok: false,
      error: `${exhausted.stageName} lacks stamina or is exhausted. Rest before recording.`,
      state,
    };
  }

  const participantIds = new Set(participants.map((p) => p.id));
  const nextIdols = state.idols.map((idol) => {
    if (!participantIds.has(idol.id)) return idol;
    const pCfg = PERSONALITY_CONFIG[idol.personality];
    return {
      ...idol,
      currentStamina: clamp(idol.currentStamina - staminaCost, 0, 100),
      fatigue: clamp(idol.fatigue + Math.round(12 * pCfg.fatigueMult), 0, 100),
    };
  });

  const updatedProject: ReleaseProject = {
    ...project,
    recordingSessions: project.recordingSessions + 1,
  };
  updatedProject.quality = computeAlbumQuality({ ...state, idols: nextIdols }, updatedProject);

  return {
    ok: true,
    state: {
      ...state,
      idols: nextIdols,
      releases: state.releases.map((r) => (r.id === releaseId ? updatedProject : r)),
    },
  };
}

export function releaseAlbumToMarket(
  state: GameState,
  releaseId: string,
  nowTimestamp = Date.now()
): { ok: boolean; error?: string; state: GameState } {
  const project = state.releases.find((r) => r.id === releaseId);
  if (!project || project.status !== 'In Production') {
    return { ok: false, error: 'Project is not in production.', state };
  }
  if (project.weeksElapsed < project.durationWeeks) {
    return {
      ok: false,
      error: `Production requires ${project.durationWeeks - project.weeksElapsed} more week(s) to finish.`,
      state,
    };
  }
  if (project.recordingSessions < 1) {
    return {
      ok: false,
      error: 'Complete at least 1 recording session before releasing.',
      state,
    };
  }

  const finalQuality = computeAlbumQuality(state, project);
  const releasedProject: ReleaseProject = {
    ...project,
    quality: finalQuality,
    status: 'Promoting',
    releasedAtDate: { ...state.date },
    salesStartTimestamp: nowTimestamp,
    lastSalesUpdateTimestamp: nowTimestamp,
  };

  let nextState: GameState = {
    ...state,
    releases: state.releases.map((r) => (r.id === releaseId ? releasedProject : r)),
    groups: state.groups.map((g) =>
      project.targetType === 'Group' && g.id === project.targetId
        ? {
            ...g,
            activeProductionId: null,
            activeReleaseId: project.id,
            albumHistoryIds: [...g.albumHistoryIds, project.id],
          }
        : g
    ),
    soloArtists: state.soloArtists.map((s) =>
      project.targetType === 'Solo' && s.id === project.targetId
        ? {
            ...s,
            activeProductionId: null,
            activeReleaseId: project.id,
            albumHistoryIds: [...s.albumHistoryIds, project.id],
          }
        : s
    ),
    news: [
      {
        id: createId('news'),
        dateLabel: formatGameDateShort(state.date),
        totalWeeks: state.date.totalWeeks,
        category: 'Release' as const,
        headline: `${project.targetName} releases ${project.releaseType} "${project.title}"`,
        detail: `${project.genre} · ${project.concept} concept (Quality ${finalQuality}/100). Live 10-minute sales cycle underway!`,
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

export function calculateProjectedSalesTotals(
  state: GameState,
  project: ReleaseProject
): { totalUnits: number; totalRevenue: number; popGain: number; fanGain: number } {
  const participants = getParticipantIdols(state, project.targetType, project.targetId);
  const equip = calculateEquipmentBonus(participants, project.concept);

  let artistPop = 12;
  let fanbase = 150;
  if (project.targetType === 'Group') {
    const g = state.groups.find((gr) => gr.id === project.targetId);
    if (g) {
      artistPop = g.popularity;
      fanbase = g.fanbase;
    }
  } else {
    const s = state.soloArtists.find((so) => so.id === project.targetId);
    if (s) {
      artistPop = s.popularity;
      fanbase = s.fanbase;
    }
  }

  const repMult = 1 + REPUTATION_ORDER.indexOf(state.company.reputation) * 0.42;
  const releaseMult = RELEASE_TYPE_CONFIG[project.releaseType].salesMultiplier;
  const trendMult =
    (state.trends.trendingGenres.includes(project.genre) ? 1.25 : 1.0) *
    (state.trends.trendingConcepts.includes(project.concept) ? 1.25 : 1.0);
  const mvBoost = state.company.purchasedUpgradeIds.includes('prd_mv_stage') ? 1.18 : 1.0;
  const mediaBoost = state.company.purchasedUpgradeIds.includes('mkt_global_media') ? 1.15 : 1.0;
  const equipMult = 1 + equip.salesBoostPct / 100;
  const marketingMult = 1 + Math.min(0.65, project.marketingBudget / 20_000_000);

  const baseDemand =
    (650 + fanbase * 0.85 + artistPop * 85) *
    (0.45 + project.quality / 100) *
    repMult *
    releaseMult *
    trendMult *
    mvBoost *
    mediaBoost *
    equipMult *
    marketingMult;

  const totalUnits = Math.max(400, Math.round(baseDemand));
  const unitPrice =
    project.releaseType === 'Single'
      ? 6_500
      : project.releaseType === 'EP'
        ? 14_000
        : 21_000;
  const totalRevenue = totalUnits * unitPrice;

  const popGain = Math.max(2, Math.round((project.quality / 18) * (trendMult > 1 ? 1.3 : 1)));
  const prBoost = state.company.purchasedUpgradeIds.includes('mkt_pr_desk') ? 1.18 : 1.0;
  const fanGain = Math.max(120, Math.round(totalUnits * 0.18 * prBoost));

  return { totalUnits, totalRevenue, popGain, fanGain };
}

/**
 * Applies real-time and offline album sales progress cleanly without ever duplicating rewards.
 * Uses salesStartTimestamp + 10 real-time minutes (600,000ms) and tracks applied deltas.
 */
export function syncAlbumSalesProgress(
  state: GameState,
  nowTimestamp = Date.now()
): { state: GameState; newlyCompletedIds: string[] } {
  let working = state;
  let changed = false;
  const newlyCompletedIds: string[] = [];

  for (const rel of state.releases) {
    if (rel.status !== 'Promoting' || rel.salesCompleted || !rel.salesStartTimestamp) {
      continue;
    }

    const elapsed = Math.max(0, nowTimestamp - rel.salesStartTimestamp);
    const ratio = clamp(elapsed / STARTING_PROGRESSION.albumSalesDurationMs, 0, 1);
    const projected = calculateProjectedSalesTotals(working, rel);

    const targetUnits = Math.round(projected.totalUnits * ratio);
    const targetRevenue = Math.round(projected.totalRevenue * ratio);
    const prevTotalApplied = rel.companyRevenueApplied + rel.groupRevenueApplied;
    const revenueDelta = Math.max(0, targetRevenue - prevTotalApplied);

    let companyShare = 100;
    if (rel.targetType === 'Group') {
      const grp = working.groups.find((g) => g.id === rel.targetId);
      companyShare = grp ? grp.companySharePercent : 50;
    }
    const companyDelta = Math.round((revenueDelta * companyShare) / 100);
    const groupDelta = revenueDelta - companyDelta;

    const targetPop = Math.round(projected.popGain * ratio);
    const popDelta = Math.max(0, targetPop - rel.popularityGained);
    const targetFans = Math.round(projected.fanGain * ratio);
    const fansDelta = Math.max(0, targetFans - rel.fansGained);

    const finished = ratio >= 1;
    if (
      revenueDelta === 0 &&
      popDelta === 0 &&
      fansDelta === 0 &&
      targetUnits === rel.salesUnits &&
      !finished
    ) {
      continue;
    }

    changed = true;
    if (finished) {
      newlyCompletedIds.push(rel.id);
    }

    const updatedRel: ReleaseProject = {
      ...rel,
      salesUnits: Math.max(rel.salesUnits, targetUnits),
      totalRevenue: Math.max(rel.totalRevenue, targetRevenue),
      companyRevenueApplied: rel.companyRevenueApplied + companyDelta,
      groupRevenueApplied: rel.groupRevenueApplied + groupDelta,
      popularityGained: rel.popularityGained + popDelta,
      fansGained: rel.fansGained + fansDelta,
      lastSalesUpdateTimestamp: nowTimestamp,
      salesCompleted: finished,
      status: finished ? 'Completed' : 'Promoting',
    };

    working = {
      ...working,
      company: {
        ...working.company,
        money: working.company.money + companyDelta,
        totalRevenue: working.company.totalRevenue + companyDelta,
      },
      releases: working.releases.map((r) => (r.id === rel.id ? updatedRel : r)),
      groups: working.groups.map((g) =>
        rel.targetType === 'Group' && g.id === rel.targetId
          ? {
              ...g,
              popularity: clamp(g.popularity + popDelta, 0, 100),
              fanbase: g.fanbase + fansDelta,
              weeklyFanGrowth: g.weeklyFanGrowth + fansDelta,
              activeReleaseId: finished && g.activeReleaseId === rel.id ? null : g.activeReleaseId,
            }
          : g
      ),
      soloArtists: working.soloArtists.map((s) =>
        rel.targetType === 'Solo' && s.id === rel.targetId
          ? {
              ...s,
              popularity: clamp(s.popularity + popDelta, 0, 100),
              fanbase: s.fanbase + fansDelta,
              weeklyFanGrowth: s.weeklyFanGrowth + fansDelta,
              activeReleaseId: finished && s.activeReleaseId === rel.id ? null : s.activeReleaseId,
            }
          : s
      ),
      idols: working.idols.map((i) => {
        const isParticipant =
          (rel.targetType === 'Group' && i.groupId === rel.targetId) ||
          (rel.targetType === 'Solo' &&
            working.soloArtists.some((s) => s.id === rel.targetId && s.idolId === i.id));
        if (!isParticipant) return i;
        return {
          ...i,
          popularity: clamp(i.popularity + Math.ceil(popDelta * 0.6), 0, 100),
          fanbase: i.fanbase + Math.round(fansDelta * 0.35),
        };
      }),
    };

    if (finished) {
      working = {
        ...working,
        news: [
          {
            id: createId('news'),
            dateLabel: formatGameDateShort(working.date),
            totalWeeks: working.date.totalWeeks,
            category: 'Release' as const,
            headline: `"${rel.title}" completes album sales run`,
            detail: `${updatedRel.salesUnits.toLocaleString()} copies sold · Total Revenue ₩${updatedRel.totalRevenue.toLocaleString()}.`,
          },
          ...working.news,
        ].slice(0, 60),
      };
    }
  }

  if (!changed) return { state, newlyCompletedIds: [] };

  const prog = evaluateCompanyProgression(working);
  working = {
    ...working,
    company: {
      ...working.company,
      companyScore: prog.score,
      tier: prog.tier,
      tierDisplay: prog.tierDisplay,
      reputation: prog.reputation,
    },
    milestonesReached: [...working.milestonesReached, ...prog.newMilestones],
  };

  return { state: working, newlyCompletedIds };
}

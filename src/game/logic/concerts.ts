import { REPUTATION_ORDER, VENUES } from '../../config/gameConfig';
import {
  ConcertPlan,
  ConcertScope,
  GameState,
  TourPlan,
  VenueSize,
} from '../models/types';
import { formatGameDateShort } from '../utils/date';
import { clamp, createId } from '../utils/ids';
import { compareReputations, compareTiers, evaluateCompanyProgression } from './stats';

export function getConcertRequirements(scope: ConcertScope): {
  minPopularity: number;
  minReputation: 'Local' | 'Regional' | 'International' | 'Global';
  prepWeeks: number;
} {
  if (scope === 'Domestic') {
    return { minPopularity: 12, minReputation: 'Local', prepWeeks: 1 };
  }
  if (scope === 'International') {
    return { minPopularity: 38, minReputation: 'Regional', prepWeeks: 2 };
  }
  if (scope === 'Global') {
    return { minPopularity: 62, minReputation: 'International', prepWeeks: 3 };
  }
  return { minPopularity: 70, minReputation: 'Global', prepWeeks: 3 };
}

export function isCompanyConcertUnlocked(state: GameState): { unlocked: boolean; reason?: string } {
  const tierOk = compareTiers(state.company.tier, 'S') >= 0;
  const repOk = compareReputations(state.company.reputation, 'Global') >= 0;
  if (!tierOk || !repOk) {
    return {
      unlocked: false,
      reason: 'Company Concerts unlock at Company Tier S and Global Reputation.',
    };
  }
  if (state.groups.length + state.soloArtists.length < 2) {
    return {
      unlocked: false,
      reason: 'Requires at least 2 active groups or solo artists.',
    };
  }
  return { unlocked: true };
}

export function planConcert(
  state: GameState,
  params: {
    title: string;
    scope: ConcertScope;
    targetType: 'Group' | 'Solo' | 'Company';
    targetId: string;
    venueSize: VenueSize;
    ticketPrice: number;
    marketingBudget: number;
  }
): { ok: boolean; error?: string; state: GameState; concert?: ConcertPlan } {
  const title = params.title.trim();
  if (!title) return { ok: false, error: 'Concert title is required.', state };

  const req = getConcertRequirements(params.scope);
  if (params.scope === 'Company') {
    const companyCheck = isCompanyConcertUnlocked(state);
    if (!companyCheck.unlocked) {
      return { ok: false, error: companyCheck.reason, state };
    }
  } else if (compareReputations(state.company.reputation, req.minReputation) < 0) {
    return {
      ok: false,
      error: `${params.scope} Concerts require ${req.minReputation} Company Reputation.`,
      state,
    };
  }

  const venue = VENUES[params.venueSize];
  let targetName = `${state.company.name} All-Stars`;
  let popularity = 75;

  if (params.targetType === 'Group') {
    const grp = state.groups.find((g) => g.id === params.targetId);
    if (!grp) return { ok: false, error: 'Selected group not found.', state };
    targetName = grp.name;
    popularity = grp.popularity;
  } else if (params.targetType === 'Solo') {
    const solo = state.soloArtists.find((s) => s.id === params.targetId);
    if (!solo) return { ok: false, error: 'Selected solo artist not found.', state };
    targetName = solo.stageName;
    popularity = solo.popularity;
  }

  if (popularity < Math.max(req.minPopularity, venue.minPopularity)) {
    return {
      ok: false,
      error: `${targetName} needs at least ${Math.max(req.minPopularity, venue.minPopularity)} Popularity for ${venue.label}.`,
      state,
    };
  }

  const marketing = Math.max(0, Math.round(params.marketingBudget));
  const totalUpfront = venue.rentalCost + marketing;
  if (state.company.money < totalUpfront) {
    return {
      ok: false,
      error: `Insufficient funds for venue rental + marketing (${totalUpfront.toLocaleString()}).`,
      state,
    };
  }

  const concert: ConcertPlan = {
    id: createId('con'),
    title,
    scope: params.scope,
    targetType: params.targetType,
    targetId: params.targetId,
    targetName,
    venueSize: params.venueSize,
    ticketPrice: clamp(Math.round(params.ticketPrice), 25_000, 350_000),
    marketingBudget: marketing,
    preparationWeeksRequired: req.prepWeeks,
    preparationWeeksDone: 0,
    scheduledWeek: state.date.totalWeeks + req.prepWeeks,
    status: 'Preparing',
    ticketsSold: 0,
    venueCapacity: venue.capacity,
    soldOut: false,
    grossRevenue: 0,
    companyRevenue: 0,
    netProfit: -totalUpfront,
    popularityGain: 0,
    fansGain: 0,
    performedDate: null,
  };

  return {
    ok: true,
    concert,
    state: {
      ...state,
      company: {
        ...state.company,
        money: state.company.money - totalUpfront,
        totalExpenses: state.company.totalExpenses + totalUpfront,
      },
      concerts: [concert, ...state.concerts],
    },
  };
}

export function performPreparedConcert(
  state: GameState,
  concertId: string
): { ok: boolean; error?: string; state: GameState; concert?: ConcertPlan } {
  const concert = state.concerts.find((c) => c.id === concertId);
  if (!concert) return { ok: false, error: 'Concert not found.', state };
  if (concert.status === 'Completed') {
    return { ok: false, error: 'Concert already completed.', state };
  }
  if (concert.preparationWeeksDone < concert.preparationWeeksRequired) {
    return {
      ok: false,
      error: `Requires ${concert.preparationWeeksRequired - concert.preparationWeeksDone} more week(s) of preparation.`,
      state,
    };
  }

  let popularity = 60;
  let fanbase = 1000;
  let companyShare = 100;
  let participantIds: string[] = [];

  if (concert.targetType === 'Group') {
    const grp = state.groups.find((g) => g.id === concert.targetId);
    if (!grp) return { ok: false, error: 'Group no longer exists.', state };
    popularity = grp.popularity;
    fanbase = grp.fanbase;
    companyShare = grp.companySharePercent;
    participantIds = grp.memberIds;
  } else if (concert.targetType === 'Solo') {
    const solo = state.soloArtists.find((s) => s.id === concert.targetId);
    if (!solo) return { ok: false, error: 'Solo artist no longer exists.', state };
    popularity = solo.popularity;
    fanbase = solo.fanbase;
    participantIds = [solo.idolId];
  } else {
    popularity = Math.max(
      70,
      Math.round(
        (state.groups.reduce((s, g) => s + g.popularity, 0) +
          state.soloArtists.reduce((s, a) => s + a.popularity, 0)) /
          Math.max(1, state.groups.length + state.soloArtists.length)
      )
    );
    fanbase =
      state.groups.reduce((s, g) => s + g.fanbase, 0) +
      state.soloArtists.reduce((s, a) => s + a.fanbase, 0);
    participantIds = state.idols.filter((i) => i.groupId || i.isSoloArtist).map((i) => i.id);
  }

  const participants = state.idols.filter((i) => participantIds.includes(i.id));
  const avgStat =
    participants.length > 0
      ? participants.reduce((s, i) => s + i.overallRating, 0) / participants.length
      : 45;
  const avgFatigue =
    participants.length > 0
      ? participants.reduce((s, i) => s + i.fatigue, 0) / participants.length
      : 10;

  const repBoost = 1 + REPUTATION_ORDER.indexOf(state.company.reputation) * 0.2;
  const mediaBoost = state.company.purchasedUpgradeIds.includes('mkt_global_media') ? 1.22 : 1.0;
  const priceSensitivity = clamp(1.28 - concert.ticketPrice / 240_000, 0.45, 1.25);
  const marketingFactor = 1 + Math.min(0.45, concert.marketingBudget / 15_000_000);
  const fatiguePenalty = avgFatigue > 70 ? 0.85 : 1.0;

  const demand = Math.round(
    (fanbase * 0.48 + popularity * 95 + avgStat * 35) *
      repBoost *
      mediaBoost *
      priceSensitivity *
      marketingFactor *
      fatiguePenalty
  );

  // Venue capacity strictly caps ticket sales
  const ticketsSold = clamp(demand, 50, concert.venueCapacity);
  const soldOut = ticketsSold >= concert.venueCapacity;
  const grossRevenue = ticketsSold * concert.ticketPrice;
  const companyRevenue = Math.round((grossRevenue * companyShare) / 100);
  const venueCost = VENUES[concert.venueSize].rentalCost + concert.marketingBudget;
  const netProfit = companyRevenue - venueCost;

  const scopeMult =
    concert.scope === 'Domestic'
      ? 1.0
      : concert.scope === 'International'
        ? 1.4
        : concert.scope === 'Global'
          ? 1.85
          : 2.2;
  const popGain = Math.max(2, Math.round((ticketsSold / concert.venueCapacity) * 7 * scopeMult));
  const fansGain = Math.max(120, Math.round(ticketsSold * 0.24 * scopeMult));

  const completed: ConcertPlan = {
    ...concert,
    status: 'Completed',
    ticketsSold,
    soldOut,
    grossRevenue,
    companyRevenue,
    netProfit,
    popularityGain: popGain,
    fansGain,
    performedDate: { ...state.date },
  };

  let nextState: GameState = {
    ...state,
    company: {
      ...state.company,
      money: state.company.money + companyRevenue,
      totalRevenue: state.company.totalRevenue + companyRevenue,
    },
    concerts: state.concerts.map((c) => (c.id === concertId ? completed : c)),
    idols: state.idols.map((idol) =>
      participantIds.includes(idol.id)
        ? {
            ...idol,
            currentStamina: clamp(idol.currentStamina - 28, 0, 100),
            fatigue: clamp(idol.fatigue + 22, 0, 100),
            popularity: clamp(idol.popularity + Math.ceil(popGain * 0.7), 0, 100),
            fanbase: idol.fanbase + Math.round(fansGain * 0.35),
          }
        : idol
    ),
    groups: state.groups.map((g) =>
      concert.targetType === 'Group' && g.id === concert.targetId
        ? {
            ...g,
            popularity: clamp(g.popularity + popGain, 0, 100),
            fanbase: g.fanbase + fansGain,
            weeklyFanGrowth: g.weeklyFanGrowth + fansGain,
            soldOutConcertsCount: g.soldOutConcertsCount + (soldOut ? 1 : 0),
            concertHistoryIds: [...g.concertHistoryIds, concert.id],
          }
        : g
    ),
    soloArtists: state.soloArtists.map((s) =>
      concert.targetType === 'Solo' && s.id === concert.targetId
        ? {
            ...s,
            popularity: clamp(s.popularity + popGain, 0, 100),
            fanbase: s.fanbase + fansGain,
            weeklyFanGrowth: s.weeklyFanGrowth + fansGain,
            soldOutConcertsCount: s.soldOutConcertsCount + (soldOut ? 1 : 0),
            concertHistoryIds: [...s.concertHistoryIds, concert.id],
          }
        : s
    ),
    news: [
      {
        id: createId('news'),
        dateLabel: formatGameDateShort(state.date),
        totalWeeks: state.date.totalWeeks,
        category: 'Concert' as const,
        headline: `${concert.targetName} ${soldOut ? 'SELLS OUT' : 'performs'} "${concert.title}"!`,
        detail: `${ticketsSold.toLocaleString()}/${concert.venueCapacity.toLocaleString()} tickets sold · Revenue ₩${companyRevenue.toLocaleString()}.`,
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

  return { ok: true, state: nextState, concert: completed };
}

export function isTourUnlockedForArtist(
  state: GameState,
  targetType: 'Group' | 'Solo',
  targetId: string
): { unlocked: boolean; reason?: string } {
  if (targetType === 'Group') {
    const grp = state.groups.find((g) => g.id === targetId);
    if (!grp) return { unlocked: false, reason: 'Group not found.' };
    if (grp.soldOutConcertsCount < 1) {
      return {
        unlocked: false,
        reason: `${grp.name} must sell out at least 1 eligible concert before launching a Tour.`,
      };
    }
    return { unlocked: true };
  }
  const solo = state.soloArtists.find((s) => s.id === targetId);
  if (!solo) return { unlocked: false, reason: 'Solo artist not found.' };
  if (solo.soldOutConcertsCount < 1) {
    return {
      unlocked: false,
      reason: `${solo.stageName} must sell out at least 1 eligible concert before launching a Tour.`,
    };
  }
  return { unlocked: true };
}

export function startTour(
  state: GameState,
  params: {
    title: string;
    targetType: 'Group' | 'Solo';
    targetId: string;
    scope: 'Domestic' | 'International' | 'Global';
    venueSize: VenueSize;
    totalDates: number;
    ticketPrice: number;
  }
): { ok: boolean; error?: string; state: GameState } {
  const title = params.title.trim();
  if (!title) return { ok: false, error: 'Tour title is required.', state };

  const unlock = isTourUnlockedForArtist(state, params.targetType, params.targetId);
  if (!unlock.unlocked) {
    return { ok: false, error: unlock.reason, state };
  }

  const dates = clamp(Math.round(params.totalDates), 3, 10);
  const venue = VENUES[params.venueSize];
  const investmentCost = Math.round(venue.rentalCost * dates * 0.72);
  if (state.company.money < investmentCost) {
    return {
      ok: false,
      error: `Insufficient funds for ${dates}-date tour production (${investmentCost.toLocaleString()}).`,
      state,
    };
  }

  const targetName =
    params.targetType === 'Group'
      ? state.groups.find((g) => g.id === params.targetId)?.name ?? 'Group'
      : state.soloArtists.find((s) => s.id === params.targetId)?.stageName ?? 'Soloist';

  const tour: TourPlan = {
    id: createId('tour'),
    title,
    targetType: params.targetType,
    targetId: params.targetId,
    targetName,
    scope: params.scope,
    venueSize: params.venueSize,
    totalDates: dates,
    datesCompleted: 0,
    ticketPrice: clamp(Math.round(params.ticketPrice), 35_000, 380_000),
    investmentCost,
    status: 'Active',
    totalTicketsSold: 0,
    totalGrossRevenue: 0,
    totalFansGained: 0,
    popularityGain: 0,
  };

  return {
    ok: true,
    state: {
      ...state,
      company: {
        ...state.company,
        money: state.company.money - investmentCost,
        totalExpenses: state.company.totalExpenses + investmentCost,
      },
      tours: [tour, ...state.tours],
      news: [
        {
          id: createId('news'),
          dateLabel: formatGameDateShort(state.date),
          totalWeeks: state.date.totalWeeks,
          category: 'Concert' as const,
          headline: `${targetName} announces "${title}" (${dates}-date ${params.scope} Tour)`,
          detail: `Tour dates will progress weekly as part of company operations.`,
        },
        ...state.news,
      ].slice(0, 60),
    },
  };
}

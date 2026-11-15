import {
  ALL_CONCEPTS,
  ALL_GENRES,
  INITIAL_GAME_DATE,
  STARTING_PROGRESSION,
  TRAINING_FACILITIES,
} from '../../config/gameConfig';
import { CompanyLogoStyle, FacilityState, GameState, TrendState } from '../models/types';

export function generateWeeklyTrends(weekNumber: number): TrendState {
  const g1 = ALL_GENRES[(weekNumber * 3) % ALL_GENRES.length];
  const g2 = ALL_GENRES[(weekNumber * 3 + 2) % ALL_GENRES.length];
  const c1 = ALL_CONCEPTS[(weekNumber * 5) % ALL_CONCEPTS.length];
  const c2 = ALL_CONCEPTS[(weekNumber * 5 + 1) % ALL_CONCEPTS.length];
  return {
    weekUpdated: weekNumber,
    trendingGenres: g1 === g2 ? [g1] : [g1, g2],
    trendingConcepts: c1 === c2 ? [c1] : [c1, c2],
  };
}

export function createInitialFacilities(): Record<string, FacilityState> {
  const facilities: Record<string, FacilityState> = {};
  for (const f of TRAINING_FACILITIES) {
    facilities[f.id] = { id: f.id, level: 0 };
  }
  return facilities;
}

export function createInitialGameState(params?: {
  companyName?: string;
  ceoName?: string;
  logoStyle?: CompanyLogoStyle;
  description?: string;
  initialized?: boolean;
}): GameState {
  const companyName = params?.companyName?.trim() || 'Starlight Entertainment';
  const ceoName = params?.ceoName?.trim() || 'CEO Park';
  const logoStyle = params?.logoStyle || 'Prism';
  const description =
    params?.description?.trim() || 'Rising Seoul agency shaping the next generation of K-pop icons.';

  return {
    saveVersion: 1,
    initialized: params?.initialized ?? false,
    company: {
      name: companyName,
      ceoName,
      logoStyle,
      description,
      money: STARTING_PROGRESSION.money,
      rubies: STARTING_PROGRESSION.rubies,
      totalRevenue: 0,
      totalExpenses: 0,
      tier: STARTING_PROGRESSION.companyTier,
      tierDisplay: STARTING_PROGRESSION.companyTier,
      companyScore: 4,
      reputation: STARTING_PROGRESSION.companyReputation,
      maxGroupSlots: STARTING_PROGRESSION.startingGroupSlots,
      maxGroupMembers: STARTING_PROGRESSION.startingGroupMembers,
      auditionCapacity: STARTING_PROGRESSION.auditionCapacity,
      purchasedUpgradeIds: [],
      unlockedTrainingCategories: ['Main'],
    },
    date: { ...INITIAL_GAME_DATE },
    idols: [],
    groups: [],
    soloArtists: [],
    auditionPool: [],
    lastAuditionInfo: null,
    facilities: createInitialFacilities(),
    ownedItemIds: [],
    itemQuantities: {},
    releases: [],
    weeklyPlan: [],
    weeklyGoalsNote: '',
    concerts: [],
    tours: [],
    trends: generateWeeklyTrends(INITIAL_GAME_DATE.totalWeeks),
    news: [
      {
        id: 'news_founding',
        dateLabel: '2026.01.W1',
        totalWeeks: 1,
        category: 'Company',
        headline: `${companyName} opens its doors in Seoul`,
        detail: `Led by ${ceoName}, the agency begins operations with ₩100,000,000 in capital and 100 Rubies.`,
      },
    ],
    pendingEvent: null,
    lastWeeklySummary: null,
    tutorialDismissed: false,
    tutorialStepCompleted: [],
    milestonesReached: [],
    settings: {
      autosaveEnabled: true,
      compactCards: false,
      confirmWeekAdvance: true,
    },
  };
}

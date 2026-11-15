import {
  ActivityType,
  AuditionMoneyType,
  CompanyLogoStyle,
  Concept,
  GameDate,
  Genre,
  GroupRole,
  IdolPersonality,
  IdolSpecialty,
  ReleaseType,
  ReputationLevel,
  RubyAuditionDuration,
  ShopCategory,
  StaffMember,
  StatKey,
  TierRank,
  TrainingTierCategory,
  VenueSize,
} from '../game/models/types';

// Exact starting progression values (Section 3)
export const STARTING_PROGRESSION = {
  money: 100_000_000,
  rubies: 100,
  companyTier: 'F' as TierRank,
  companyReputation: 'Local' as ReputationLevel,
  groups: 0,
  soloArtists: 0,
  trainees: 0,
  auditionCapacity: 2,
  maxAuditionCapacity: 5,
  startingGroupSlots: 1,
  maxGroupSlots: 5,
  startingGroupMembers: 5,
  maxGroupMembers: 10,
  rejoinCooldownMonths: 6,
  weeksPerMonth: 4,
  monthsPerYear: 12,
  albumSalesDurationMs: 10 * 60 * 1000, // 10 real-time minutes
} as const;

export const INITIAL_GAME_DATE: GameDate = {
  year: 2026,
  month: 1,
  week: 1,
  totalWeeks: 1,
};

export const COMPANY_LOGO_STYLES: { id: CompanyLogoStyle; label: string; mark: string }[] = [
  { id: 'Crown', label: 'Royal Crown', mark: 'CRN' },
  { id: 'Star', label: 'Nova Star', mark: 'STR' },
  { id: 'Vinyl', label: 'Gold Vinyl', mark: 'VNL' },
  { id: 'Prism', label: 'Violet Prism', mark: 'PRM' },
  { id: 'Spark', label: 'Stage Spark', mark: 'SPK' },
  { id: 'Wave', label: 'Sound Wave', mark: 'WAV' },
];

// Exact mandatory idol tier thresholds (Section 11.1)
export const IDOL_TIER_THRESHOLDS: { tier: TierRank; min: number; max: number }[] = [
  { tier: 'P', min: 95, max: 100 },
  { tier: 'S', min: 88, max: 94 },
  { tier: 'A', min: 70, max: 87 },
  { tier: 'B', min: 40, max: 69 },
  { tier: 'C', min: 20, max: 39 },
  { tier: 'D', min: 10, max: 19 },
  { tier: 'F', min: 0, max: 9 },
];

export const ALL_STAT_KEYS: StatKey[] = [
  'vocal',
  'dance',
  'rap',
  'stamina',
  'musical',
  'language',
  'acting',
  'fitness',
  'composition',
  'writing',
  'choreography',
  'entertainment',
];

export const MAIN_STATS: StatKey[] = ['vocal', 'dance', 'rap', 'stamina'];
export const MAIN_2_STATS: StatKey[] = ['musical', 'language', 'acting', 'fitness'];
export const MAIN_3_STATS: StatKey[] = ['composition', 'writing', 'choreography', 'entertainment'];

export const STAT_LABELS: Record<StatKey, string> = {
  vocal: 'Vocal',
  dance: 'Dance',
  rap: 'Rap',
  stamina: 'Stamina',
  musical: 'Musical',
  language: 'Language',
  acting: 'Acting',
  fitness: 'Fitness',
  composition: 'Composition',
  writing: 'Writing',
  choreography: 'Choreography',
  entertainment: 'Entertainment',
};

// Weighted overall rating weights by specialty (each sums to 1.0)
export const SPECIALTY_WEIGHTS: Record<IdolSpecialty, Record<StatKey, number>> = {
  'Vocal Specialist': {
    vocal: 0.34,
    musical: 0.16,
    stamina: 0.08,
    dance: 0.08,
    language: 0.08,
    entertainment: 0.07,
    writing: 0.06,
    composition: 0.05,
    acting: 0.04,
    fitness: 0.02,
    rap: 0.01,
    choreography: 0.01,
  },
  'Dance Specialist': {
    dance: 0.34,
    choreography: 0.15,
    fitness: 0.14,
    stamina: 0.11,
    vocal: 0.08,
    entertainment: 0.06,
    musical: 0.04,
    rap: 0.03,
    language: 0.02,
    acting: 0.02,
    composition: 0.01,
    writing: 0.0,
  },
  'Rap Specialist': {
    rap: 0.34,
    writing: 0.18,
    entertainment: 0.11,
    stamina: 0.08,
    dance: 0.08,
    language: 0.07,
    musical: 0.05,
    composition: 0.05,
    vocal: 0.02,
    fitness: 0.01,
    acting: 0.01,
    choreography: 0.0,
  },
  'All-Rounder': {
    vocal: 0.16,
    dance: 0.16,
    rap: 0.13,
    stamina: 0.1,
    musical: 0.09,
    entertainment: 0.08,
    fitness: 0.06,
    language: 0.06,
    choreography: 0.05,
    writing: 0.04,
    composition: 0.04,
    acting: 0.03,
  },
  Composer: {
    composition: 0.28,
    musical: 0.22,
    writing: 0.18,
    vocal: 0.1,
    language: 0.06,
    entertainment: 0.05,
    stamina: 0.04,
    dance: 0.03,
    rap: 0.02,
    choreography: 0.01,
    acting: 0.01,
    fitness: 0.0,
  },
  Performer: {
    dance: 0.2,
    vocal: 0.18,
    stamina: 0.14,
    fitness: 0.12,
    choreography: 0.1,
    entertainment: 0.1,
    musical: 0.06,
    rap: 0.05,
    acting: 0.03,
    language: 0.02,
    composition: 0.0,
    writing: 0.0,
  },
  Entertainer: {
    entertainment: 0.28,
    acting: 0.18,
    language: 0.14,
    vocal: 0.1,
    dance: 0.09,
    stamina: 0.07,
    rap: 0.05,
    fitness: 0.04,
    musical: 0.03,
    writing: 0.02,
    choreography: 0.0,
    composition: 0.0,
  },
};

export const PERSONALITY_CONFIG: Record<
  IdolPersonality,
  {
    description: string;
    trainingMult: number;
    creativeBonus: number;
    popularityMult: number;
    performanceBonus: number;
    fatigueMult: number;
    entertainmentMod: number;
  }
> = {
  Hardworking: {
    description: '+12% training efficiency on all studio drills.',
    trainingMult: 1.12,
    creativeBonus: 0,
    popularityMult: 1.0,
    performanceBonus: 0,
    fatigueMult: 1.0,
    entertainmentMod: 1.0,
  },
  Creative: {
    description: '+15% songwriting, composition, and production quality contribution.',
    trainingMult: 1.0,
    creativeBonus: 6,
    popularityMult: 1.0,
    performanceBonus: 0,
    fatigueMult: 1.0,
    entertainmentMod: 1.0,
  },
  Charismatic: {
    description: '+12% popularity and fanbase growth from activities.',
    trainingMult: 1.0,
    creativeBonus: 0,
    popularityMult: 1.12,
    performanceBonus: 2,
    fatigueMult: 1.0,
    entertainmentMod: 1.05,
  },
  Perfectionist: {
    description: '+5% stage/recording quality, +10% fatigue from intense schedules.',
    trainingMult: 1.04,
    creativeBonus: 2,
    popularityMult: 1.0,
    performanceBonus: 5,
    fatigueMult: 1.1,
    entertainmentMod: 1.0,
  },
  Shy: {
    description: '-10% variety/entertainment income early on; improves steadily with training.',
    trainingMult: 1.0,
    creativeBonus: 2,
    popularityMult: 0.96,
    performanceBonus: 0,
    fatigueMult: 0.95,
    entertainmentMod: 0.9,
  },
};

export interface TrainingFacilityConfig {
  id: string;
  name: string;
  stat: StatKey;
  category: TrainingTierCategory;
  description: string;
  purchaseCost: number;
  baseTrainingCost: number;
  baseStaminaCost: number;
  baseFatigueGain: number;
  upgradeCosts: number[]; // level 1->2, 2->3, 3->4, 4->5
  requiredCompanyTier: TierRank;
}

export const TRAINING_FACILITIES: TrainingFacilityConfig[] = [
  {
    id: 'vocal_studio',
    name: 'Vocal Studio',
    stat: 'vocal',
    category: 'Main',
    description: 'Soundproof booths and pitch coaching for vocal mastery.',
    purchaseCost: 2_500_000,
    baseTrainingCost: 450_000,
    baseStaminaCost: 14,
    baseFatigueGain: 10,
    upgradeCosts: [4_000_000, 8_000_000, 15_000_000, 28_000_000],
    requiredCompanyTier: 'F',
  },
  {
    id: 'dance_studio',
    name: 'Dance Studio',
    stat: 'dance',
    category: 'Main',
    description: 'Mirrored rehearsal room with sprung hardwood floors.',
    purchaseCost: 2_500_000,
    baseTrainingCost: 450_000,
    baseStaminaCost: 16,
    baseFatigueGain: 12,
    upgradeCosts: [4_000_000, 8_000_000, 15_000_000, 28_000_000],
    requiredCompanyTier: 'F',
  },
  {
    id: 'rap_studio',
    name: 'Rap Studio',
    stat: 'rap',
    category: 'Main',
    description: 'Beat lab and rhythm booth for flow, breath, and cadence.',
    purchaseCost: 2_500_000,
    baseTrainingCost: 450_000,
    baseStaminaCost: 14,
    baseFatigueGain: 10,
    upgradeCosts: [4_000_000, 8_000_000, 15_000_000, 28_000_000],
    requiredCompanyTier: 'F',
  },
  {
    id: 'stamina_track',
    name: 'Endurance Track',
    stat: 'stamina',
    category: 'Main',
    description: 'Cardio and breath-control conditioning for live stages.',
    purchaseCost: 2_000_000,
    baseTrainingCost: 400_000,
    baseStaminaCost: 12,
    baseFatigueGain: 11,
    upgradeCosts: [3_500_000, 7_000_000, 14_000_000, 24_000_000],
    requiredCompanyTier: 'F',
  },
  // Main 2 (unlocked by upgrade)
  {
    id: 'musical_lab',
    name: 'Musical Theory Room',
    stat: 'musical',
    category: 'Main 2',
    description: 'Ear training, harmony, and live acoustic instrument practice.',
    purchaseCost: 6_500_000,
    baseTrainingCost: 750_000,
    baseStaminaCost: 15,
    baseFatigueGain: 11,
    upgradeCosts: [8_000_000, 15_000_000, 25_000_000, 42_000_000],
    requiredCompanyTier: 'D',
  },
  {
    id: 'language_academy',
    name: 'Global Language Lab',
    stat: 'language',
    category: 'Main 2',
    description: 'Foreign interview prep for Japanese, English, and global tours.',
    purchaseCost: 6_500_000,
    baseTrainingCost: 750_000,
    baseStaminaCost: 13,
    baseFatigueGain: 9,
    upgradeCosts: [8_000_000, 15_000_000, 25_000_000, 42_000_000],
    requiredCompanyTier: 'D',
  },
  {
    id: 'acting_stage',
    name: 'Acting & Camera Stage',
    stat: 'acting',
    category: 'Main 2',
    description: 'Expressive camera presence, MV acting, and drama drills.',
    purchaseCost: 7_000_000,
    baseTrainingCost: 800_000,
    baseStaminaCost: 15,
    baseFatigueGain: 11,
    upgradeCosts: [8_500_000, 16_000_000, 27_000_000, 45_000_000],
    requiredCompanyTier: 'D',
  },
  {
    id: 'fitness_center',
    name: 'Athletic Fitness Gym',
    stat: 'fitness',
    category: 'Main 2',
    description: 'Strength and core agility coaching for intense choreography.',
    purchaseCost: 6_000_000,
    baseTrainingCost: 700_000,
    baseStaminaCost: 17,
    baseFatigueGain: 13,
    upgradeCosts: [7_500_000, 14_000_000, 24_000_000, 40_000_000],
    requiredCompanyTier: 'D',
  },
  // Main 3 (unlocked by advanced upgrade)
  {
    id: 'composition_suite',
    name: 'Composition Suite',
    stat: 'composition',
    category: 'Main 3',
    description: 'DAW production suite for self-producing idol songwriters.',
    purchaseCost: 14_000_000,
    baseTrainingCost: 1_200_000,
    baseStaminaCost: 16,
    baseFatigueGain: 11,
    upgradeCosts: [16_000_000, 28_000_000, 45_000_000, 70_000_000],
    requiredCompanyTier: 'C',
  },
  {
    id: 'lyric_atelier',
    name: 'Lyricist Atelier',
    stat: 'writing',
    category: 'Main 3',
    description: 'Songwriting workshop for hooks, verses, and concept storytelling.',
    purchaseCost: 12_000_000,
    baseTrainingCost: 1_100_000,
    baseStaminaCost: 14,
    baseFatigueGain: 10,
    upgradeCosts: [14_000_000, 25_000_000, 42_000_000, 65_000_000],
    requiredCompanyTier: 'C',
  },
  {
    id: 'choreo_lab',
    name: 'Choreography Lab',
    stat: 'choreography',
    category: 'Main 3',
    description: 'Performance formation design and signature point-dance lab.',
    purchaseCost: 13_000_000,
    baseTrainingCost: 1_150_000,
    baseStaminaCost: 18,
    baseFatigueGain: 13,
    upgradeCosts: [15_000_000, 27_000_000, 44_000_000, 68_000_000],
    requiredCompanyTier: 'C',
  },
  {
    id: 'variety_lounge',
    name: 'Broadcast Variety Studio',
    stat: 'entertainment',
    category: 'Main 3',
    description: 'MC hosting, wit, and live broadcast charisma coaching.',
    purchaseCost: 12_000_000,
    baseTrainingCost: 1_100_000,
    baseStaminaCost: 15,
    baseFatigueGain: 10,
    upgradeCosts: [14_000_000, 24_000_000, 40_000_000, 62_000_000],
    requiredCompanyTier: 'C',
  },
];

export type UpgradeBranch =
  | 'Headquarters'
  | 'Training'
  | 'Audition'
  | 'Production'
  | 'Marketing'
  | 'Management';

export interface HQUpgradeConfig {
  id: string;
  branch: UpgradeBranch;
  name: string;
  description: string;
  effectText: string;
  costMoney: number;
  costRubies: number;
  prerequisites: string[];
  requiredTier: TierRank;
  requiredReputation: ReputationLevel;
}

export const HQ_UPGRADES: HQUpgradeConfig[] = [
  // Headquarters
  {
    id: 'hq_dorm_expansion',
    branch: 'Headquarters',
    name: 'Agency Wing Expansion',
    description: 'Expand agency floors to support a second idol group.',
    effectText: '+1 Max Group Slot (total 2), +2 Max Group Members (7)',
    costMoney: 15_000_000,
    costRubies: 0,
    prerequisites: [],
    requiredTier: 'F',
    requiredReputation: 'Local',
  },
  {
    id: 'hq_tower_floor',
    branch: 'Headquarters',
    name: 'Multi-Label Floor',
    description: 'Dedicated floor for simultaneous group operations.',
    effectText: '+1 Max Group Slot (total 3), +1 Max Group Member (8)',
    costMoney: 45_000_000,
    costRubies: 0,
    prerequisites: ['hq_dorm_expansion'],
    requiredTier: 'D',
    requiredReputation: 'Regional',
  },
  {
    id: 'hq_seoul_campus',
    branch: 'Headquarters',
    name: 'Seoul Entertainment Tower',
    description: 'Flagship agency headquarters with full label capacity.',
    effectText: '+2 Max Group Slots (total 5), +2 Max Group Members (10)',
    costMoney: 120_000_000,
    costRubies: 50,
    prerequisites: ['hq_tower_floor'],
    requiredTier: 'B',
    requiredReputation: 'National',
  },
  {
    id: 'hq_recovery_lounge',
    branch: 'Headquarters',
    name: 'Wellness & Recovery Lounge',
    description: 'Improves passive weekly stamina recovery and lowers burnout.',
    effectText: '+8 weekly stamina recovery & -4 weekly fatigue for all idols',
    costMoney: 12_000_000,
    costRubies: 0,
    prerequisites: [],
    requiredTier: 'F',
    requiredReputation: 'Local',
  },

  // Training
  {
    id: 'trn_main2_unlock',
    branch: 'Training',
    name: 'Main 2 Curriculum License',
    description: 'Unlocks Musical, Language, Acting, and Fitness training categories.',
    effectText: 'Unlocks Main 2 Training & Studios',
    costMoney: 10_000_000,
    costRubies: 0,
    prerequisites: [],
    requiredTier: 'D',
    requiredReputation: 'Local',
  },
  {
    id: 'trn_main3_unlock',
    branch: 'Training',
    name: 'Main 3 Master Academy',
    description: 'Unlocks Composition, Writing, Choreography, and Entertainment training.',
    effectText: 'Unlocks Main 3 Training & Studios',
    costMoney: 28_000_000,
    costRubies: 20,
    prerequisites: ['trn_main2_unlock'],
    requiredTier: 'C',
    requiredReputation: 'Regional',
  },

  // Audition
  {
    id: 'aud_domestic_scout',
    branch: 'Audition',
    name: 'Domestic Casting Network',
    description: 'Expand scouting across Korean academies and festivals.',
    effectText: 'Unlocks Domestic Auditions & +1 Audition Capacity (3)',
    costMoney: 8_000_000,
    costRubies: 0,
    prerequisites: [],
    requiredTier: 'F',
    requiredReputation: 'Local',
  },
  {
    id: 'aud_intl_scout',
    branch: 'Audition',
    name: 'International Audition Tour',
    description: 'Send casting directors across Asia-Pacific and North America.',
    effectText: 'Unlocks International Auditions & +1 Audition Capacity (4)',
    costMoney: 25_000_000,
    costRubies: 0,
    prerequisites: ['aud_domestic_scout'],
    requiredTier: 'C',
    requiredReputation: 'Regional',
  },
  {
    id: 'aud_global_scout',
    branch: 'Audition',
    name: 'Global Star Casting',
    description: 'Worldwide open auditions attracting elite global trainees.',
    effectText: 'Unlocks Global Auditions & +1 Audition Capacity (5)',
    costMoney: 75_000_000,
    costRubies: 40,
    prerequisites: ['aud_intl_scout'],
    requiredTier: 'B',
    requiredReputation: 'National',
  },

  // Production
  {
    id: 'prd_mastering_suite',
    branch: 'Production',
    name: 'Digital Mastering Suite',
    description: 'High-end mixing desk that boosts release quality.',
    effectText: '+6 Album Quality bonus on all new releases',
    costMoney: 16_000_000,
    costRubies: 0,
    prerequisites: [],
    requiredTier: 'D',
    requiredReputation: 'Local',
  },
  {
    id: 'prd_mv_stage',
    branch: 'Production',
    name: 'In-House MV Soundstage',
    description: 'Cinematic music video production boosts release appeal and sales.',
    effectText: '+10 Album Quality & +18% Album Sales volume',
    costMoney: 55_000_000,
    costRubies: 25,
    prerequisites: ['prd_mastering_suite'],
    requiredTier: 'C',
    requiredReputation: 'Regional',
  },

  // Marketing
  {
    id: 'mkt_pr_desk',
    branch: 'Marketing',
    name: 'Digital PR & Fan Relations',
    description: 'Drives stronger fanbase conversion from promotions and releases.',
    effectText: '+18% Fanbase growth from activities & album sales',
    costMoney: 14_000_000,
    costRubies: 0,
    prerequisites: [],
    requiredTier: 'F',
    requiredReputation: 'Local',
  },
  {
    id: 'mkt_global_media',
    branch: 'Marketing',
    name: 'Global Media Syndicate',
    description: 'International press network boosting album sales and concerts.',
    effectText: '+22% Concert attendance & +15% Album revenue',
    costMoney: 60_000_000,
    costRubies: 30,
    prerequisites: ['mkt_pr_desk'],
    requiredTier: 'B',
    requiredReputation: 'National',
  },

  // Management
  {
    id: 'mgt_hr_team',
    branch: 'Management',
    name: 'Artist Care & HR Desk',
    description: 'Improves weekly loyalty stability and reduces schedule fatigue.',
    effectText: '+2 weekly Loyalty stability & -10% schedule fatigue',
    costMoney: 18_000_000,
    costRubies: 0,
    prerequisites: [],
    requiredTier: 'D',
    requiredReputation: 'Local',
  },
];

export const REPUTATION_ORDER: ReputationLevel[] = [
  'Local',
  'Regional',
  'National',
  'International',
  'Global',
  'Worldwide',
];

export const TIER_ORDER: TierRank[] = ['F', 'D', 'C', 'B', 'A', 'S', 'P'];

export const MONEY_AUDITION_CONFIG: Record<
  AuditionMoneyType,
  {
    label: string;
    cost: number;
    minBaseStat: number;
    maxBaseStat: number;
    minPotential: number;
    maxPotential: number;
    unlockUpgradeId: string | null;
    description: string;
  }
> = {
  Streets: {
    label: 'Streets Casting',
    cost: 1_500_000,
    minBaseStat: 4,
    maxBaseStat: 24,
    minPotential: 35,
    maxPotential: 72,
    unlockUpgradeId: null,
    description: 'Local street scouting. Affordable, raw prospects with occasional hidden gems.',
  },
  Domestic: {
    label: 'Domestic Audition',
    cost: 5_000_000,
    minBaseStat: 14,
    maxBaseStat: 42,
    minPotential: 45,
    maxPotential: 82,
    unlockUpgradeId: 'aud_domestic_scout',
    description: 'Nationwide academy scouts yielding solid C–B rank trainees.',
  },
  International: {
    label: 'International Audition',
    cost: 14_000_000,
    minBaseStat: 28,
    maxBaseStat: 60,
    minPotential: 58,
    maxPotential: 90,
    unlockUpgradeId: 'aud_intl_scout',
    description: 'Regional overseas auditions with multilingual, stage-ready talent.',
  },
  Global: {
    label: 'Global Audition',
    cost: 32_000_000,
    minBaseStat: 42,
    maxBaseStat: 76,
    minPotential: 68,
    maxPotential: 97,
    unlockUpgradeId: 'aud_global_scout',
    description: 'Premier worldwide casting attracting top-tier trainees.',
  },
};

export const RUBY_AUDITION_CONFIG: Record<
  RubyAuditionDuration,
  {
    rubyCostPerSlot: number;
    intendedTiers: string;
    minRatingTarget: number;
    maxRatingTarget: number;
    minPotential: number;
    maxPotential: number;
  }
> = {
  '1 week': {
    rubyCostPerSlot: 8,
    intendedTiers: 'F–D',
    minRatingTarget: 5,
    maxRatingTarget: 19,
    minPotential: 45,
    maxPotential: 75,
  },
  '3 weeks': {
    rubyCostPerSlot: 16,
    intendedTiers: 'D–C',
    minRatingTarget: 12,
    maxRatingTarget: 39,
    minPotential: 55,
    maxPotential: 84,
  },
  '1 month': {
    rubyCostPerSlot: 28,
    intendedTiers: 'C–B',
    minRatingTarget: 24,
    maxRatingTarget: 66,
    minPotential: 65,
    maxPotential: 92,
  },
  '2 months': {
    rubyCostPerSlot: 48,
    intendedTiers: 'A',
    minRatingTarget: 64,
    maxRatingTarget: 84, // Never generates S or P directly (max A = 87)
    minPotential: 75,
    maxPotential: 98,
  },
};

export const ALL_GROUP_ROLES: GroupRole[] = [
  'Leader',
  'Main Vocalist',
  'Lead Vocalist',
  'Main Dancer',
  'Lead Dancer',
  'Main Rapper',
  'Lead Rapper',
  'Visual',
  'Center',
];

export const ALL_GENRES: Genre[] = [
  'Pop',
  'Dance-pop',
  'R&B',
  'Hip-hop',
  'Electronic',
  'Ballad',
  'Rock',
];

export const ALL_CONCEPTS: Concept[] = ['Pure', 'Cute', 'Chic', 'Sexy'];

export const RELEASE_TYPE_CONFIG: Record<
  ReleaseType,
  {
    durationWeeks: number;
    baseCost: number;
    recordingTarget: number;
    salesMultiplier: number;
  }
> = {
  Single: {
    durationWeeks: 1,
    baseCost: 3_500_000,
    recordingTarget: 2,
    salesMultiplier: 1.0,
  },
  EP: {
    durationWeeks: 3,
    baseCost: 9_000_000,
    recordingTarget: 4,
    salesMultiplier: 1.85,
  },
  Album: {
    durationWeeks: 4, // 1 game month = 4 weeks
    baseCost: 18_000_000,
    recordingTarget: 6,
    salesMultiplier: 3.1,
  },
};

export const EXTERNAL_STAFF_POOL: StaffMember[] = [
  { id: 'staff_w1', name: 'Min Ji-hoon', role: 'Writer', skill: 52, hireCost: 1_200_000 },
  { id: 'staff_w2', name: 'Clara Song', role: 'Writer', skill: 74, hireCost: 3_800_000 },
  { id: 'staff_w3', name: 'Han Seo-yeon', role: 'Writer', skill: 90, hireCost: 8_500_000 },
  { id: 'staff_p1', name: 'DJ K-Beat', role: 'Producer', skill: 55, hireCost: 1_500_000 },
  { id: 'staff_p2', name: 'Park Hyun-woo', role: 'Producer', skill: 78, hireCost: 4_500_000 },
  { id: 'staff_p3', name: 'Teddy Choi', role: 'Producer', skill: 92, hireCost: 10_000_000 },
];

export interface ShopItemConfig {
  id: string;
  name: string;
  category: ShopCategory;
  description: string;
  costMoney: number;
  costRubies: number;
  conceptAffinity: Concept | 'All';
  qualityBonus: number;
  salesBoostPct: number;
  popularityBonus: number;
  staminaRestore: number;
  fatigueReduce: number;
  loyaltyBonus: number;
  statBoost?: { stat: StatKey; amount: number };
}

export const SHOP_ITEMS: ShopItemConfig[] = [
  // Clothes (permanent wardrobe unlocks)
  {
    id: 'cloth_pastel_school',
    name: 'Pastel Uniform Set',
    category: 'Clothes',
    description: 'Crisp pure-concept stage tailoring for debut showcases.',
    costMoney: 2_200_000,
    costRubies: 0,
    conceptAffinity: 'Pure',
    qualityBonus: 5,
    salesBoostPct: 8,
    popularityBonus: 2,
    staminaRestore: 0,
    fatigueReduce: 0,
    loyaltyBonus: 0,
  },
  {
    id: 'cloth_ribbon_pop',
    name: 'Sugar Ribbon Ensemble',
    category: 'Clothes',
    description: 'Bright candy-colored outfits ideal for bubbly Cute stages.',
    costMoney: 3_000_000,
    costRubies: 0,
    conceptAffinity: 'Cute',
    qualityBonus: 6,
    salesBoostPct: 10,
    popularityBonus: 3,
    staminaRestore: 0,
    fatigueReduce: 0,
    loyaltyBonus: 0,
  },
  {
    id: 'cloth_noir_blazer',
    name: 'Midnight Chic Suit',
    category: 'Clothes',
    description: 'Sharp monochrome tailoring built for charismatic Chic performances.',
    costMoney: 5_500_000,
    costRubies: 0,
    conceptAffinity: 'Chic',
    qualityBonus: 8,
    salesBoostPct: 14,
    popularityBonus: 4,
    staminaRestore: 0,
    fatigueReduce: 0,
    loyaltyBonus: 0,
  },
  {
    id: 'cloth_velvet_stage',
    name: 'Crimson Velvet Couture',
    category: 'Clothes',
    description: 'High-fashion stage couture tailored for bold Sexy comebacks.',
    costMoney: 0,
    costRubies: 22,
    conceptAffinity: 'Sexy',
    qualityBonus: 11,
    salesBoostPct: 18,
    popularityBonus: 6,
    staminaRestore: 0,
    fatigueReduce: 0,
    loyaltyBonus: 0,
  },
  {
    id: 'cloth_galaxy_tour',
    name: 'Astral Crown Stagewear',
    category: 'Clothes',
    description: 'Signature ruby-tier custom outfits suited to any album concept.',
    costMoney: 0,
    costRubies: 38,
    conceptAffinity: 'All',
    qualityBonus: 14,
    salesBoostPct: 22,
    popularityBonus: 7,
    staminaRestore: 0,
    fatigueReduce: 0,
    loyaltyBonus: 0,
  },
  // Food (consumable wellbeing & loyalty items)
  {
    id: 'food_vitamin_bento',
    name: 'Idol Energy Bento',
    category: 'Food',
    description: 'Balanced meal box restoring +28 Stamina and -12 Fatigue to an idol.',
    costMoney: 350_000,
    costRubies: 0,
    conceptAffinity: 'All',
    qualityBonus: 0,
    salesBoostPct: 0,
    popularityBonus: 0,
    staminaRestore: 28,
    fatigueReduce: 12,
    loyaltyBonus: 2,
  },
  {
    id: 'food_ginseng_tonic',
    name: 'Royal Red Ginseng Pack',
    category: 'Food',
    description: 'Premium herbal recovery pack restoring +55 Stamina, -28 Fatigue, +4 Loyalty.',
    costMoney: 1_100_000,
    costRubies: 0,
    conceptAffinity: 'All',
    qualityBonus: 0,
    salesBoostPct: 0,
    popularityBonus: 0,
    staminaRestore: 55,
    fatigueReduce: 28,
    loyaltyBonus: 4,
  },
  {
    id: 'food_cafe_treat',
    name: 'Company Dessert Party',
    category: 'Food',
    description: 'Sweet morale-boosting box: +35 Stamina, -20 Fatigue, +6 Loyalty.',
    costMoney: 0,
    costRubies: 6,
    conceptAffinity: 'All',
    qualityBonus: 0,
    salesBoostPct: 0,
    popularityBonus: 0,
    staminaRestore: 35,
    fatigueReduce: 20,
    loyaltyBonus: 6,
  },
  // Accessories (permanent equippable gear)
  {
    id: 'acc_custom_iem',
    name: 'Custom In-Ear Monitors',
    category: 'Accessories',
    description: 'Precision stage monitors giving +4 Vocal/Musical presence & +4% sales.',
    costMoney: 4_200_000,
    costRubies: 0,
    conceptAffinity: 'All',
    qualityBonus: 4,
    salesBoostPct: 4,
    popularityBonus: 2,
    staminaRestore: 0,
    fatigueReduce: 0,
    loyaltyBonus: 0,
    statBoost: { stat: 'vocal', amount: 2 },
  },
  {
    id: 'acc_crystal_mic',
    name: 'Starlight Handheld Mic',
    category: 'Accessories',
    description: 'Signature wireless mic boosting stage charm and popularity.',
    costMoney: 0,
    costRubies: 18,
    conceptAffinity: 'All',
    qualityBonus: 7,
    salesBoostPct: 9,
    popularityBonus: 5,
    staminaRestore: 0,
    fatigueReduce: 0,
    loyaltyBonus: 0,
  },
];

export interface VenueConfig {
  size: VenueSize;
  label: string;
  capacity: number;
  rentalCost: number;
  minPopularity: number;
}

export const VENUES: Record<VenueSize, VenueConfig> = {
  Small: {
    size: 'Small',
    label: 'Small Theater (800)',
    capacity: 800,
    rentalCost: 2_500_000,
    minPopularity: 10,
  },
  Medium: {
    size: 'Medium',
    label: 'City Hall (3,500)',
    capacity: 3_500,
    rentalCost: 9_000_000,
    minPopularity: 28,
  },
  Large: {
    size: 'Large',
    label: 'Olympic Arena (12,000)',
    capacity: 12_000,
    rentalCost: 28_000_000,
    minPopularity: 50,
  },
  Stadium: {
    size: 'Stadium',
    label: 'World Dome Stadium (42,000)',
    capacity: 42_000,
    rentalCost: 85_000_000,
    minPopularity: 74,
  },
};

export const ACTIVITY_CONFIG: Record<
  ActivityType,
  {
    label: string;
    allowedTargets: ('Idol' | 'Group' | 'Solo' | 'Company')[];
    staminaCost: number;
    fatigueDelta: number;
    baseIncome: number;
    baseCost: number;
    statTrained?: StatKey;
    popularityDelta: number;
    fanGainBase: number;
    description: string;
  }
> = {
  'Vocal Practice': {
    label: 'Vocal Practice',
    allowedTargets: ['Idol', 'Group', 'Solo'],
    staminaCost: 14,
    fatigueDelta: 10,
    baseIncome: 0,
    baseCost: 350_000,
    statTrained: 'vocal',
    popularityDelta: 0,
    fanGainBase: 0,
    description: 'Scheduled vocal drill increasing Vocal skill.',
  },
  'Dance Practice': {
    label: 'Dance Practice',
    allowedTargets: ['Idol', 'Group', 'Solo'],
    staminaCost: 16,
    fatigueDelta: 12,
    baseIncome: 0,
    baseCost: 350_000,
    statTrained: 'dance',
    popularityDelta: 0,
    fanGainBase: 0,
    description: 'Synchronized choreography session increasing Dance skill.',
  },
  'Rap Practice': {
    label: 'Rap Practice',
    allowedTargets: ['Idol', 'Group', 'Solo'],
    staminaCost: 14,
    fatigueDelta: 10,
    baseIncome: 0,
    baseCost: 350_000,
    statTrained: 'rap',
    popularityDelta: 0,
    fanGainBase: 0,
    description: 'Breath, rhythm, and lyric flow practice increasing Rap skill.',
  },
  'Stamina Conditioning': {
    label: 'Stamina Conditioning',
    allowedTargets: ['Idol', 'Group', 'Solo'],
    staminaCost: 12,
    fatigueDelta: 10,
    baseIncome: 0,
    baseCost: 300_000,
    statTrained: 'stamina',
    popularityDelta: 0,
    fanGainBase: 0,
    description: 'Athletic conditioning improving Stamina stat.',
  },
  'Variety Show': {
    label: 'Variety Show',
    allowedTargets: ['Idol', 'Group', 'Solo'],
    staminaCost: 18,
    fatigueDelta: 14,
    baseIncome: 2_200_000,
    baseCost: 0,
    popularityDelta: 3,
    fanGainBase: 140,
    description: 'TV entertainment appearance earning money, popularity, and fans.',
  },
  'Radio Appearance': {
    label: 'Radio Appearance',
    allowedTargets: ['Idol', 'Group', 'Solo'],
    staminaCost: 10,
    fatigueDelta: 7,
    baseIncome: 1_100_000,
    baseCost: 0,
    popularityDelta: 2,
    fanGainBase: 85,
    description: 'Broadcast interview building domestic listener awareness.',
  },
  'Brand Photoshoot': {
    label: 'Brand Photoshoot',
    allowedTargets: ['Idol', 'Group', 'Solo'],
    staminaCost: 14,
    fatigueDelta: 10,
    baseIncome: 3_200_000,
    baseCost: 0,
    popularityDelta: 2,
    fanGainBase: 110,
    description: 'Magazine & sponsorship shoot paying strong appearance fees.',
  },
  Fanmeeting: {
    label: 'Fanmeeting',
    allowedTargets: ['Group', 'Solo'],
    staminaCost: 22,
    fatigueDelta: 16,
    baseIncome: 4_500_000,
    baseCost: 900_000,
    popularityDelta: 4,
    fanGainBase: 260,
    description: 'Intimate fan event boosting loyalty, fanbase, and ticket revenue.',
  },
  'Recording Session': {
    label: 'Recording Session',
    allowedTargets: ['Group', 'Solo'],
    staminaCost: 18,
    fatigueDelta: 14,
    baseIncome: 0,
    baseCost: 500_000,
    popularityDelta: 0,
    fanGainBase: 0,
    description: 'Advances active album production recording progress and quality.',
  },
  'Company Promotion': {
    label: 'Company Promotion',
    allowedTargets: ['Company'],
    staminaCost: 0,
    fatigueDelta: 0,
    baseIncome: 0,
    baseCost: 2_000_000,
    popularityDelta: 1,
    fanGainBase: 120,
    description: 'Agency-wide PR campaign boosting visibility across all debuted artists.',
  },
  'Rest & Recovery': {
    label: 'Rest & Recovery',
    allowedTargets: ['Idol', 'Group', 'Solo'],
    staminaCost: 0,
    fatigueDelta: -26,
    baseIncome: 0,
    baseCost: 100_000,
    popularityDelta: 0,
    fanGainBase: 0,
    description: 'Scheduled day off restoring +30 Stamina and reducing fatigue.',
  },
  'Artist Vacation': {
    label: 'Artist Vacation',
    allowedTargets: ['Idol', 'Group', 'Solo'],
    staminaCost: 0,
    fatigueDelta: -45,
    baseIncome: 0,
    baseCost: 1_200_000,
    popularityDelta: 0,
    fanGainBase: 0,
    description: 'Full retreat restoring +55 Stamina, -45 Fatigue, and +6 Loyalty.',
  },
};

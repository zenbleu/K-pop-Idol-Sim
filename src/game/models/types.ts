export type TierRank = 'F' | 'D' | 'C' | 'B' | 'A' | 'S' | 'P';
export type TierDisplay =
  | 'F' | 'F+'
  | 'D' | 'D+'
  | 'C' | 'C+'
  | 'B' | 'B+'
  | 'A' | 'A+'
  | 'S' | 'S+'
  | 'P' | 'P+';

export type ReputationLevel =
  | 'Local'
  | 'Regional'
  | 'National'
  | 'International'
  | 'Global'
  | 'Worldwide';

export type Gender = 'Male' | 'Female';

export type CompanyLogoStyle = 'Crown' | 'Star' | 'Vinyl' | 'Prism' | 'Spark' | 'Wave';

export type IdolSpecialty =
  | 'Vocal Specialist'
  | 'Dance Specialist'
  | 'Rap Specialist'
  | 'All-Rounder'
  | 'Composer'
  | 'Performer'
  | 'Entertainer';

export type IdolPersonality =
  | 'Hardworking'
  | 'Creative'
  | 'Charismatic'
  | 'Perfectionist'
  | 'Shy';

export type StatKey =
  | 'vocal'
  | 'dance'
  | 'rap'
  | 'stamina'
  | 'musical'
  | 'language'
  | 'acting'
  | 'fitness'
  | 'composition'
  | 'writing'
  | 'choreography'
  | 'entertainment';

export type TrainingTierCategory = 'Main' | 'Main 2' | 'Main 3';

export type GroupRole =
  | 'Leader'
  | 'Main Vocalist'
  | 'Lead Vocalist'
  | 'Main Dancer'
  | 'Lead Dancer'
  | 'Main Rapper'
  | 'Lead Rapper'
  | 'Visual'
  | 'Center';

export type Weekday =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type Genre =
  | 'Pop'
  | 'Dance-pop'
  | 'R&B'
  | 'Hip-hop'
  | 'Electronic'
  | 'Ballad'
  | 'Rock';

export type Concept = 'Pure' | 'Cute' | 'Chic' | 'Sexy';

export type ReleaseType = 'Single' | 'EP' | 'Album';

export type AuditionMoneyType = 'Streets' | 'Domestic' | 'International' | 'Global';
export type RubyAuditionDuration = '1 week' | '3 weeks' | '1 month' | '2 months';

export type ShopCategory = 'Clothes' | 'Food' | 'Accessories';

export type NavTab =
  | 'dashboard'
  | 'production'
  | 'schedule'
  | 'concert'
  | 'auditions'
  | 'company'
  | 'training'
  | 'shop'
  | 'hq'
  | 'settings';

export interface GameDate {
  year: number;
  month: number; // 1..12
  week: number;  // 1..4 (4 weeks per month)
  totalWeeks: number;
}

export type IdolStats = Record<StatKey, number>;

export interface IdolContract {
  status: 'Active' | 'Expiring Soon' | 'Expired';
  durationMonths: number;
  startDate: GameDate;
  expirationTotalWeeks: number;
  weeklySalary: number;
  renewalEligible: boolean;
}

export interface TrainingHistoryEntry {
  week: number;
  stat: StatKey;
  gain: number;
  facilityId: string;
}

export interface Idol {
  id: string;
  name: string;
  stageName: string;
  gender: Gender;
  age: number;
  nationality: string;
  personality: IdolPersonality;
  potential: number; // 10..100
  visual: number;    // 0..100
  popularity: number; // 0..100
  fanbase: number;
  loyalty: number;    // 0..100
  fatigue: number;    // 0..100
  currentStamina: number; // 0..100
  tier: TierRank;
  overallRating: number;
  specialty: IdolSpecialty;
  stats: IdolStats;
  portraitFilename: string;
  contract: IdolContract;
  trainingHistory: TrainingHistoryEntry[];
  groupId: string | null;
  groupRoles: GroupRole[];
  isSoloArtist: boolean;
  equippedClothingIds: string[];
  equippedAccessoryIds: string[];
  rejoinCooldownUntilWeek: number | null;
  retentionOfferCount: number;
  departureWarning: boolean;
}

export interface AuditionCandidate {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  nationality: string;
  personality: IdolPersonality;
  specialty: IdolSpecialty;
  potential: number;
  visual: number;
  stats: IdolStats;
  overallRating: number;
  tier: TierRank;
  recruitmentCost: number;
  portraitFilename: string;
  sourceLabel: string;
}

export interface Group {
  id: string;
  name: string;
  gender: Gender;
  memberIds: string[];
  popularity: number;
  fanbase: number;
  weeklyFanGrowth: number;
  tier: TierRank;
  debutDate: GameDate;
  reputationContribution: number;
  companySharePercent: number; // 0..100
  groupSharePercent: number;   // 0..100, always sums to 100
  loyalty: number;             // 0..100
  activeProductionId: string | null;
  activeReleaseId: string | null;
  soldOutConcertsCount: number;
  albumHistoryIds: string[];
  concertHistoryIds: string[];
}

export interface SoloArtist {
  id: string; // matches idolId or solo entity id
  idolId: string;
  stageName: string;
  debutDate: GameDate;
  popularity: number;
  fanbase: number;
  weeklyFanGrowth: number;
  tier: TierRank;
  activeProductionId: string | null;
  activeReleaseId: string | null;
  soldOutConcertsCount: number;
  albumHistoryIds: string[];
  concertHistoryIds: string[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'Writer' | 'Producer';
  skill: number;
  hireCost: number;
}

export interface ReleaseProject {
  id: string;
  title: string;
  releaseType: ReleaseType;
  targetType: 'Group' | 'Solo';
  targetId: string;
  targetName: string;
  genre: Genre;
  concept: Concept;
  writerId: string;
  writerName: string;
  writerIsIdol: boolean;
  writerSkill: number;
  producerId: string;
  producerName: string;
  producerIsIdol: boolean;
  producerSkill: number;
  durationWeeks: number;
  weeksElapsed: number;
  recordingSessions: number;
  recordingTarget: number;
  productionCost: number;
  marketingBudget: number;
  quality: number;
  status: 'In Production' | 'Promoting' | 'Completed';
  releasedAtDate: GameDate | null;
  // Real-time 10-minute sales tracking
  salesStartTimestamp: number | null;
  lastSalesUpdateTimestamp: number | null;
  salesUnits: number;
  totalRevenue: number;
  companyRevenueApplied: number;
  groupRevenueApplied: number;
  popularityGained: number;
  fansGained: number;
  salesCompleted: boolean;
}

export type ActivityType =
  | 'Vocal Practice'
  | 'Dance Practice'
  | 'Rap Practice'
  | 'Stamina Conditioning'
  | 'Variety Show'
  | 'Radio Appearance'
  | 'Brand Photoshoot'
  | 'Fanmeeting'
  | 'Recording Session'
  | 'Company Promotion'
  | 'Rest & Recovery'
  | 'Artist Vacation';

export type ScheduleCategory =
  | 'Rest'
  | 'Training'
  | 'Company'
  | 'Music Shows'
  | 'Concerts'
  | 'Others';

export interface ScheduleActivityDefinition {
  id: string;
  label: string;
  legacyActivityType: ActivityType;
  category: ScheduleCategory;
  imagePath: string;
  minTier: TierRank;
  requiresDebut: boolean;
  allowedWeekdays?: Weekday[];
  requiredFacilityId?: string;
  statTrained?: StatKey;
  staminaCost: number;
  fatigueDelta: number;
  staminaRestore?: number;
  baseIncome: number;
  baseCost: number;
  popularityDelta: number;
  fanGainBase: number;
  loyaltyDelta?: number;
  description: string;
}

export interface WeeklyPActivityAvailability {
  targetType: 'Group' | 'Solo';
  targetId: string;
  year: number;
  week: number;
  totalWeeks: number;
  availableActivityIds: string[];
}

export interface PlannedActivity {
  id: string;
  day: Weekday;
  activityType: ActivityType;
  activityId?: string;
  category?: ScheduleCategory;
  imagePath?: string;
  targetType: 'Idol' | 'Group' | 'Solo' | 'Company';
  targetId: string;
  targetName: string;
  estimatedIncome: number;
  estimatedCost: number;
  staminaCost: number;
  fatigueDelta: number;
  completed: boolean;
  notes?: string;
}

export type ConcertScope = 'Domestic' | 'International' | 'Global' | 'Company';
export type VenueSize = 'Small' | 'Medium' | 'Large' | 'Stadium';

export interface ConcertPlan {
  id: string;
  title: string;
  scope: ConcertScope;
  targetType: 'Group' | 'Solo' | 'Company';
  targetId: string;
  targetName: string;
  venueSize: VenueSize;
  ticketPrice: number;
  marketingBudget: number;
  preparationWeeksRequired: number;
  preparationWeeksDone: number;
  scheduledWeek: number;
  status: 'Preparing' | 'Ready' | 'Completed';
  ticketsSold: number;
  venueCapacity: number;
  soldOut: boolean;
  grossRevenue: number;
  companyRevenue: number;
  netProfit: number;
  popularityGain: number;
  fansGain: number;
  performedDate: GameDate | null;
}

export interface TourPlan {
  id: string;
  title: string;
  targetType: 'Group' | 'Solo';
  targetId: string;
  targetName: string;
  scope: 'Domestic' | 'International' | 'Global';
  venueSize: VenueSize;
  totalDates: number;
  datesCompleted: number;
  ticketPrice: number;
  investmentCost: number;
  status: 'Preparing' | 'Active' | 'Completed';
  totalTicketsSold: number;
  totalGrossRevenue: number;
  totalFansGained: number;
  popularityGain: number;
}

export interface FacilityState {
  id: string;
  level: number; // 0 = not owned, 1..5 = owned level
}

export interface NewsItem {
  id: string;
  dateLabel: string;
  totalWeeks: number;
  category: 'Release' | 'Concert' | 'Milestone' | 'Company' | 'Event' | 'Roster';
  headline: string;
  detail: string;
}

export interface PendingEventChoice {
  id: string;
  eventId: string;
  title: string;
  description: string;
  targetLabel: string;
  optionA: { label: string; effectSummary: string };
  optionB: { label: string; effectSummary: string };
}

export interface WeeklySummary {
  weekDateLabel: string;
  totalWeeks: number;
  income: number;
  expenses: number;
  netProfit: number;
  activitiesCompleted: number;
  activityLogs: string[];
  idolGrowthLogs: string[];
  fansGained: number;
  albumSalesUnits: number;
  albumRevenue: number;
  reputationBefore: ReputationLevel;
  reputationAfter: ReputationLevel;
  tierBefore: TierDisplay;
  tierAfter: TierDisplay;
  importantEvents: string[];
  upcomingCount: number;
}

export interface TrendState {
  weekUpdated: number;
  trendingGenres: Genre[];
  trendingConcepts: Concept[];
}

export interface CompanyState {
  name: string;
  ceoName: string;
  logoStyle: CompanyLogoStyle;
  description: string;
  money: number;
  rubies: number;
  totalRevenue: number;
  totalExpenses: number;
  tier: TierRank;
  tierDisplay: TierDisplay;
  companyScore: number;
  reputation: ReputationLevel;
  maxGroupSlots: number;
  maxGroupMembers: number;
  auditionCapacity: number;
  purchasedUpgradeIds: string[];
  unlockedTrainingCategories: TrainingTierCategory[];
}

export interface GameState {
  saveVersion: number;
  initialized: boolean;
  company: CompanyState;
  date: GameDate;
  idols: Idol[];
  groups: Group[];
  soloArtists: SoloArtist[];
  auditionPool: AuditionCandidate[];
  lastAuditionInfo: string | null;
  facilities: Record<string, FacilityState>;
  ownedItemIds: string[];
  itemQuantities: Record<string, number>;
  releases: ReleaseProject[];
  weeklyPlan: PlannedActivity[];
  weeklyGoalsNote: string;
  weeklyPActivityAvailability: Record<string, WeeklyPActivityAvailability>;
  concerts: ConcertPlan[];
  tours: TourPlan[];
  trends: TrendState;
  news: NewsItem[];
  pendingEvent: PendingEventChoice | null;
  lastWeeklySummary: WeeklySummary | null;
  tutorialDismissed: boolean;
  tutorialStepCompleted: string[];
  milestonesReached: string[];
  settings: {
    autosaveEnabled: boolean;
    compactCards: boolean;
    confirmWeekAdvance: boolean;
  };
}

export interface SaveSlotMeta {
  slotId: string;
  label: string;
  companyName: string;
  dateLabel: string;
  tierDisplay: TierDisplay;
  money: number;
  savedAt: string;
}

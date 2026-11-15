import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  ActivityType,
  AuditionMoneyType,
  CompanyLogoStyle,
  Concept,
  ConcertScope,
  GameState,
  Gender,
  Genre,
  GroupRole,
  NavTab,
  ReleaseType,
  RubyAuditionDuration,
  VenueSize,
  Weekday,
} from '../models/types';
import { createInitialGameState } from '../logic/initialState';
import {
  recruitCandidate,
  rejectCandidate,
  runMoneyAudition,
  runRubyAudition,
} from '../logic/auditions';
import {
  debutSoloArtist,
  disbandGroup,
  formGroup,
  makeRetentionOffer,
  removeIdolFromCompany,
  removeIdolFromGroup,
  renewIdolContract,
  toggleIdolGroupRole,
  updateGroupIncomeSplit,
  updateIdolStageName,
} from '../logic/groups';
import {
  consumeFoodItem,
  purchaseHQUpgrade,
  purchaseOrUpgradeFacility,
  purchaseShopItem,
  restIdolNow,
  toggleEquipItem,
  trainGroupInFacility,
  trainIdol,
} from '../logic/training';
import {
  recordForProduction,
  releaseAlbumToMarket,
  startAlbumProduction,
  syncAlbumSalesProgress,
} from '../logic/production';
import {
  addPlannedActivity,
  ensureWeeklyPActivityAvailability,
  removePlannedActivity,
  updatePlannedActivity,
} from '../logic/schedule';
import { performPreparedConcert, planConcert, startTour } from '../logic/concerts';
import { advanceWeekSimulation, resolvePendingEvent } from '../logic/simulation';
import {
  clearAutosave,
  importSaveJson,
  loadAutosave,
  loadFromSlot,
  saveAutosave,
  saveToSlot,
} from '../save/storage';

export interface ToastMessage {
  id: string;
  kind: 'success' | 'error' | 'info';
  text: string;
}

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}

interface GameContextValue {
  state: GameState;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  selectedIdolId: string | null;
  openIdolProfile: (idolId: string) => void;
  closeIdolProfile: () => void;
  toasts: ToastMessage[];
  notify: (kind: ToastMessage['kind'], text: string) => void;
  dismissToast: (id: string) => void;
  confirmRequest: ConfirmRequest | null;
  requestConfirm: (req: ConfirmRequest) => void;
  closeConfirm: () => void;
  nextWeekModalOpen: boolean;
  setNextWeekModalOpen: (open: boolean) => void;
  weeklySummaryModalOpen: boolean;
  setWeeklySummaryModalOpen: (open: boolean) => void;
  tutorialOpen: boolean;
  setTutorialOpen: (open: boolean) => void;
  // Actions
  createCompany: (params: {
    companyName: string;
    ceoName: string;
    logoStyle: CompanyLogoStyle;
    description: string;
  }) => boolean;
  actions: {
    runMoneyAudition: (type: AuditionMoneyType, genderFilter?: Gender | 'Mixed') => void;
    runRubyAudition: (params: { gender: Gender; duration: RubyAuditionDuration; slots: number }) => void;
    recruitCandidate: (candidateId: string) => void;
    rejectCandidate: (candidateId: string) => void;
    formGroup: (params: { name: string; gender: Gender; memberIds: string[] }) => boolean;
    toggleGroupRole: (idolId: string, role: GroupRole) => void;
    debutSolo: (idolId: string) => void;
    updateIncomeSplit: (groupId: string, companySharePercent: number) => void;
    removeFromGroup: (idolId: string) => void;
    removeFromCompany: (idolId: string) => void;
    disbandGroup: (groupId: string) => void;
    offerRetention: (idolId: string) => void;
    renewContract: (idolId: string, months?: number) => void;
    renameStageName: (idolId: string, name: string) => void;
    buyOrUpgradeFacility: (facilityId: string) => void;
    trainSingleIdol: (idolId: string, facilityId: string) => void;
    trainGroup: (groupId: string, facilityId: string) => void;
    restIdol: (idolId: string) => void;
    buyHQUpgrade: (upgradeId: string) => void;
    buyShopItem: (itemId: string) => void;
    equipShopItem: (idolId: string, itemId: string) => void;
    useFoodItem: (idolId: string, itemId: string) => void;
    startProduction: (params: {
      targetType: 'Group' | 'Solo';
      targetId: string;
      releaseType: ReleaseType;
      title: string;
      genre: Genre;
      concept: Concept;
      writerId: string;
      producerId: string;
      marketingBudget: number;
    }) => boolean;
    recordProduction: (releaseId: string) => void;
    releaseAlbum: (releaseId: string) => void;
    addActivity: (params: {
      day: Weekday;
      activityType: ActivityType;
      activityId?: string;
      targetType: 'Idol' | 'Group' | 'Solo' | 'Company';
      targetId: string;
      notes?: string;
    }) => boolean;
    editActivity: (
      activityId: string,
      params: {
        day: Weekday;
        activityType: ActivityType;
        activityId?: string;
        targetType: 'Idol' | 'Group' | 'Solo' | 'Company';
        targetId: string;
      }
    ) => boolean;
    removeActivity: (activityId: string) => void;
    updateWeeklyGoals: (note: string) => void;
    planConcert: (params: {
      title: string;
      scope: ConcertScope;
      targetType: 'Group' | 'Solo' | 'Company';
      targetId: string;
      venueSize: VenueSize;
      ticketPrice: number;
      marketingBudget: number;
    }) => boolean;
    performConcert: (concertId: string) => void;
    startTour: (params: {
      title: string;
      targetType: 'Group' | 'Solo';
      targetId: string;
      scope: 'Domestic' | 'International' | 'Global';
      venueSize: VenueSize;
      totalDates: number;
      ticketPrice: number;
    }) => boolean;
    confirmAdvanceWeek: () => void;
    resolveEvent: (option: 'A' | 'B') => void;
    saveSlot: (slotId: string, label?: string) => void;
    loadSlot: (slotId: string) => void;
    importSave: (jsonText: string) => boolean;
    resetGame: () => void;
    updateSettings: (partial: Partial<GameState['settings']>) => void;
    dismissTutorial: () => void;
  };
}

const GameContext = createContext<GameContextValue | null>(null);

function loadStartingState(): GameState {
  const autostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const saved = loadAutosave();
  if (saved && saved.initialized) {
    return saved;
  }
  if (autostart) {
    return createInitialGameState({
      companyName: 'Starlight Entertainment',
      ceoName: 'Director Kim',
      logoStyle: 'Prism',
      description: 'Seoul-based K-pop management label.',
      initialized: true,
    });
  }
  return createInitialGameState({ initialized: false });
}

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(() => loadStartingState());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedIdolId, setSelectedIdolId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const [nextWeekModalOpen, setNextWeekModalOpen] = useState(false);
  const [weeklySummaryModalOpen, setWeeklySummaryModalOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const notify = useCallback((kind: ToastMessage['kind'], text: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-1), { id, kind, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Body dataset state marker
  useEffect(() => {
    document.body.dataset.state = state.initialized ? 'playing' : 'title';
  }, [state.initialized]);

  // Ensure P-tier weekly schedule availability is populated & persisted once per week
  const pTierSignature =
    state.groups
      .filter((g) => g.tier === 'P')
      .map((g) => g.id)
      .join(',') +
    '|' +
    state.soloArtists
      .filter((s) => s.tier === 'P')
      .map((s) => s.id)
      .join(',');

  useEffect(() => {
    if (!state.initialized) return;
    setState((prev) => ensureWeeklyPActivityAvailability(prev));
  }, [state.initialized, state.date.totalWeeks, pTierSignature]);

  // Autosave whenever initialized state changes
  useEffect(() => {
    if (state.initialized && state.settings.autosaveEnabled) {
      saveAutosave(state);
    }
  }, [state]);

  const hasActiveSales = state.releases.some(
    (r) => r.status === 'Promoting' && !r.salesCompleted
  );

  // Real-time 10-minute album sales ticker + offline catch-up
  useEffect(() => {
    if (!state.initialized || !hasActiveSales) return;

    const timer = window.setInterval(() => {
      setState((prev) => {
        const res = syncAlbumSalesProgress(prev, Date.now());
        if (res.newlyCompletedIds.length > 0) {
          notify('success', 'Album sales cycle completed! Revenue and fanbase finalized.');
        }
        return res.state;
      });
    }, 2000);

    return () => window.clearInterval(timer);
  }, [state.initialized, hasActiveSales, notify]);

  // Sync offline progress on tab focus
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        setState((prev) => syncAlbumSalesProgress(prev, Date.now()).state);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const createCompany = useCallback(
    (params: {
      companyName: string;
      ceoName: string;
      logoStyle: CompanyLogoStyle;
      description: string;
    }): boolean => {
      if (!params.companyName.trim() || !params.ceoName.trim()) {
        notify('error', 'Please enter both Company Name and CEO Name.');
        return false;
      }
      const next = createInitialGameState({ ...params, initialized: true });
      setState(next);
      saveAutosave(next);
      setActiveTab('dashboard');
      notify('success', `${next.company.name} founded! Welcome, ${next.company.ceoName}.`);
      return true;
    },
    [notify]
  );

  const actions: GameContextValue['actions'] = {
    runMoneyAudition: (type, genderFilter = 'Mixed') => {
      const res = runMoneyAudition(state, type, genderFilter);
      if (!res.ok) return notify('error', res.error ?? 'Audition failed.');
      setState(res.state);
      notify('success', `${res.state.auditionPool.length} candidates scouted.`);
    },
    runRubyAudition: (params) => {
      const res = runRubyAudition(state, params);
      if (!res.ok) return notify('error', res.error ?? 'Ruby audition failed.');
      setState(res.state);
      notify('success', `Ruby audition complete: ${res.state.auditionPool.length} candidates.`);
    },
    recruitCandidate: (candidateId) => {
      const res = recruitCandidate(state, candidateId);
      if (!res.ok) return notify('error', res.error ?? 'Recruitment failed.');
      setState(res.state);
      notify('success', `${res.recruited?.stageName} signed as a trainee!`);
    },
    rejectCandidate: (candidateId) => {
      setState((prev) => rejectCandidate(prev, candidateId));
      notify('info', 'Candidate passed.');
    },
    formGroup: (params) => {
      const res = formGroup(state, params);
      if (!res.ok) {
        notify('error', res.error ?? 'Could not form group.');
        return false;
      }
      setState(res.state);
      notify('success', `${res.group?.name} formed!`);
      return true;
    },
    toggleGroupRole: (idolId, role) => {
      setState((prev) => toggleIdolGroupRole(prev, idolId, role));
    },
    debutSolo: (idolId) => {
      const res = debutSoloArtist(state, idolId);
      if (!res.ok) return notify('error', res.error ?? 'Could not debut solo artist.');
      setState(res.state);
      notify('success', 'Solo artist debuted!');
    },
    updateIncomeSplit: (groupId, companySharePercent) => {
      const res = updateGroupIncomeSplit(state, groupId, companySharePercent);
      if (!res.ok) return notify('error', res.error ?? 'Split update blocked.');
      setState(res.state);
      notify('success', `Income split updated (${companySharePercent}% Company / ${100 - companySharePercent}% Group).`);
    },
    removeFromGroup: (idolId) => {
      const res = removeIdolFromGroup(state, idolId);
      if (!res.ok) return notify('error', res.error ?? 'Action failed.');
      setState(res.state);
      notify('info', 'Idol removed from group and returned to trainee status (6-month cooldown).');
    },
    removeFromCompany: (idolId) => {
      const res = removeIdolFromCompany(state, idolId);
      if (!res.ok) return notify('error', res.error ?? 'Action failed.');
      setState(res.state);
      if (selectedIdolId === idolId) setSelectedIdolId(null);
      notify('info', 'Idol permanently dismissed from company.');
    },
    disbandGroup: (groupId) => {
      const res = disbandGroup(state, groupId);
      if (!res.ok) return notify('error', res.error ?? 'Disbandment failed.');
      setState(res.state);
      notify('info', 'Group disbanded. Members returned to trainees.');
    },
    offerRetention: (idolId) => {
      const res = makeRetentionOffer(state, idolId);
      if (!res.ok) return notify('error', res.error ?? 'Retention offer failed.');
      setState(res.state);
      notify('success', 'Retention offer accepted! Loyalty improved.');
    },
    renewContract: (idolId, months = 24) => {
      const res = renewIdolContract(state, idolId, months);
      if (!res.ok) return notify('error', res.error ?? 'Renewal failed.');
      setState(res.state);
      notify('success', `Contract renewed for +${months} months.`);
    },
    renameStageName: (idolId, name) => {
      if (!name.trim()) return notify('error', 'Stage name cannot be empty.');
      setState((prev) => updateIdolStageName(prev, idolId, name));
      notify('success', 'Stage name updated.');
    },
    buyOrUpgradeFacility: (facilityId) => {
      const res = purchaseOrUpgradeFacility(state, facilityId);
      if (!res.ok) return notify('error', res.error ?? 'Facility purchase failed.');
      setState(res.state);
      notify('success', 'Facility upgraded!');
    },
    trainSingleIdol: (idolId, facilityId) => {
      const res = trainIdol(state, idolId, facilityId);
      if (!res.ok) return notify('error', res.error ?? 'Training failed.');
      setState(res.state);
      notify('success', `Training complete (+${res.gain} stat gain)!`);
    },
    trainGroup: (groupId, facilityId) => {
      const res = trainGroupInFacility(state, groupId, facilityId);
      if (!res.ok) return notify('error', res.error ?? 'Group training failed.');
      setState(res.state);
      notify('success', `Group training finished for ${res.trainedCount} member(s).`);
    },
    restIdol: (idolId) => {
      setState((prev) => restIdolNow(prev, idolId));
      notify('info', 'Idol rested (+25 Stamina, -20 Fatigue).');
    },
    buyHQUpgrade: (upgradeId) => {
      const res = purchaseHQUpgrade(state, upgradeId);
      if (!res.ok) return notify('error', res.error ?? 'Upgrade failed.');
      setState(res.state);
      notify('success', 'Agency HQ upgrade installed!');
    },
    buyShopItem: (itemId) => {
      const res = purchaseShopItem(state, itemId);
      if (!res.ok) return notify('error', res.error ?? 'Purchase failed.');
      setState(res.state);
      notify('success', 'Item purchased!');
    },
    equipShopItem: (idolId, itemId) => {
      const res = toggleEquipItem(state, idolId, itemId);
      if (!res.ok) return notify('error', res.error ?? 'Equip failed.');
      setState(res.state);
      notify('success', 'Wardrobe updated.');
    },
    useFoodItem: (idolId, itemId) => {
      const res = consumeFoodItem(state, idolId, itemId);
      if (!res.ok) return notify('error', res.error ?? 'Cannot use item.');
      setState(res.state);
      notify('success', 'Wellbeing item used!');
    },
    startProduction: (params) => {
      const res = startAlbumProduction(state, params);
      if (!res.ok) {
        notify('error', res.error ?? 'Production start failed.');
        return false;
      }
      setState(res.state);
      notify('success', `Production started: "${res.project?.title}"!`);
      return true;
    },
    recordProduction: (releaseId) => {
      const res = recordForProduction(state, releaseId);
      if (!res.ok) return notify('error', res.error ?? 'Recording failed.');
      setState(res.state);
      notify('success', 'Recording session complete! Album quality improved.');
    },
    releaseAlbum: (releaseId) => {
      const res = releaseAlbumToMarket(state, releaseId, Date.now());
      if (!res.ok) return notify('error', res.error ?? 'Release failed.');
      setState(res.state);
      notify('success', 'Album released! 10-minute real-time sales cycle started.');
    },
    addActivity: (params) => {
      const res = addPlannedActivity(state, params);
      if (!res.ok) {
        notify('error', res.error ?? 'Cannot schedule activity.');
        return false;
      }
      setState(res.state);
      notify('success', `Added ${res.activityLabel ?? params.activityType} to ${params.day}.`);
      return true;
    },
    editActivity: (activityId, params) => {
      const res = updatePlannedActivity(state, activityId, params);
      if (!res.ok) {
        notify('error', res.error ?? 'Cannot update activity.');
        return false;
      }
      setState(res.state);
      notify('success', 'Activity updated.');
      return true;
    },
    removeActivity: (activityId) => {
      setState((prev) => removePlannedActivity(prev, activityId));
      notify('info', 'Activity removed from schedule.');
    },
    updateWeeklyGoals: (note) => {
      setState((prev) => ({ ...prev, weeklyGoalsNote: note }));
    },
    planConcert: (params) => {
      const res = planConcert(state, params);
      if (!res.ok) {
        notify('error', res.error ?? 'Cannot schedule concert.');
        return false;
      }
      setState(res.state);
      notify('success', `Concert "${res.concert?.title}" entered preparation.`);
      return true;
    },
    performConcert: (concertId) => {
      const res = performPreparedConcert(state, concertId);
      if (!res.ok) return notify('error', res.error ?? 'Cannot perform concert.');
      setState(res.state);
      notify(
        'success',
        `Concert complete! ${res.concert?.ticketsSold.toLocaleString()} tickets sold${res.concert?.soldOut ? ' (SOLD OUT!)' : ''}.`
      );
    },
    startTour: (params) => {
      const res = startTour(state, params);
      if (!res.ok) {
        notify('error', res.error ?? 'Cannot start tour.');
        return false;
      }
      setState(res.state);
      notify('success', `Tour "${params.title}" launched!`);
      return true;
    },
    confirmAdvanceWeek: () => {
      const next = advanceWeekSimulation(state, Date.now());
      setState(next);
      setNextWeekModalOpen(false);
      setWeeklySummaryModalOpen(true);
    },
    resolveEvent: (option) => {
      const res = resolvePendingEvent(state, option);
      if (!res.ok) return notify('error', res.error ?? 'Cannot resolve event.');
      setState(res.state);
      notify('success', 'Event decision resolved.');
    },
    saveSlot: (slotId, label) => {
      const meta = saveToSlot(state, slotId, label);
      if (!meta) return notify('error', 'Failed to save slot.');
      notify('success', `Saved to ${slotId.replace('_', ' ').toUpperCase()}.`);
    },
    loadSlot: (slotId) => {
      const res = loadFromSlot(slotId);
      if (!res.ok || !res.state) return notify('error', res.error ?? 'Failed to load save.');
      setState(res.state);
      setSelectedIdolId(null);
      notify('success', `Loaded "${res.state.company.name}".`);
    },
    importSave: (jsonText) => {
      const res = importSaveJson(jsonText);
      if (!res.ok || !res.state) {
        notify('error', res.error ?? 'Invalid save file.');
        return false;
      }
      setState(res.state);
      setSelectedIdolId(null);
      notify('success', `Imported "${res.state.company.name}"!`);
      return true;
    },
    resetGame: () => {
      clearAutosave();
      setState(createInitialGameState({ initialized: false }));
      setSelectedIdolId(null);
      setActiveTab('dashboard');
      notify('info', 'Game reset. Create a new company to begin.');
    },
    updateSettings: (partial) => {
      setState((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...partial },
      }));
    },
    dismissTutorial: () => {
      setState((prev) => ({ ...prev, tutorialDismissed: true }));
      setTutorialOpen(false);
    },
  };

  return (
    <GameContext.Provider
      value={{
        state,
        activeTab,
        setActiveTab,
        selectedIdolId,
        openIdolProfile: (id) => setSelectedIdolId(id),
        closeIdolProfile: () => setSelectedIdolId(null),
        toasts,
        notify,
        dismissToast,
        confirmRequest,
        requestConfirm: (req) => setConfirmRequest(req),
        closeConfirm: () => setConfirmRequest(null),
        nextWeekModalOpen,
        setNextWeekModalOpen,
        weeklySummaryModalOpen,
        setWeeklySummaryModalOpen,
        tutorialOpen,
        setTutorialOpen,
        createCompany,
        actions,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}

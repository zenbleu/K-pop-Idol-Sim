import {
  HQ_UPGRADES,
  PERSONALITY_CONFIG,
  SHOP_ITEMS,
  SPECIALTY_WEIGHTS,
  TRAINING_FACILITIES,
  TrainingFacilityConfig,
} from '../../config/gameConfig';
import { GameState, Idol } from '../models/types';
import { formatGameDateShort } from '../utils/date';
import { clamp, createId } from '../utils/ids';
import {
  compareReputations,
  compareTiers,
  evaluateCompanyProgression,
  getTierFromRating,
  syncIdolRatingAndTier,
} from './stats';

export function isFacilityUnlocked(
  state: GameState,
  facility: TrainingFacilityConfig
): { unlocked: boolean; reason?: string } {
  if (!state.company.unlockedTrainingCategories.includes(facility.category)) {
    return {
      unlocked: false,
      reason: `Requires ${facility.category} Training License in Agency HQ.`,
    };
  }
  if (compareTiers(state.company.tier, facility.requiredCompanyTier) < 0) {
    return {
      unlocked: false,
      reason: `Requires Company Tier ${facility.requiredCompanyTier}.`,
    };
  }
  return { unlocked: true };
}

export function purchaseOrUpgradeFacility(
  state: GameState,
  facilityId: string
): { ok: boolean; error?: string; state: GameState } {
  const cfg = TRAINING_FACILITIES.find((f) => f.id === facilityId);
  if (!cfg) return { ok: false, error: 'Facility not found.', state };

  const unlockCheck = isFacilityUnlocked(state, cfg);
  if (!unlockCheck.unlocked) {
    return { ok: false, error: unlockCheck.reason, state };
  }

  const currentLevel = state.facilities[facilityId]?.level ?? 0;
  if (currentLevel >= 5) {
    return { ok: false, error: `${cfg.name} is already at max Level 5.`, state };
  }

  const cost =
    currentLevel === 0 ? cfg.purchaseCost : cfg.upgradeCosts[currentLevel - 1];
  if (state.company.money < cost) {
    return { ok: false, error: `Insufficient funds for ${cfg.name}.`, state };
  }

  const nextLevel = currentLevel + 1;
  let nextState: GameState = {
    ...state,
    company: {
      ...state.company,
      money: state.company.money - cost,
      totalExpenses: state.company.totalExpenses + cost,
    },
    facilities: {
      ...state.facilities,
      [facilityId]: { id: facilityId, level: nextLevel },
    },
    news: [
      {
        id: createId('news'),
        dateLabel: formatGameDateShort(state.date),
        totalWeeks: state.date.totalWeeks,
        category: 'Company' as const,
        headline:
          currentLevel === 0
            ? `${state.company.name} opens ${cfg.name}`
            : `${cfg.name} upgraded to Level ${nextLevel}`,
        detail: `Training efficiency and stat growth for ${cfg.stat} improved.`,
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

export function calculateTrainingOutcome(
  state: GameState,
  idol: Idol,
  facility: TrainingFacilityConfig
): {
  gain: number;
  cost: number;
  staminaCost: number;
  fatigueGain: number;
  efficiencyLabel: string;
} {
  const facilityLevel = state.facilities[facility.id]?.level ?? 0;
  const personality = PERSONALITY_CONFIG[idol.personality];
  const specialtyWeight = SPECIALTY_WEIGHTS[idol.specialty][facility.stat] ?? 0;
  const specialtyMult = specialtyWeight >= 0.2 ? 1.2 : specialtyWeight >= 0.1 ? 1.1 : 1.0;

  // Facility level bonus (Level 0 base self-practice vs Level 1..5 studio boost)
  const facilityMult = facilityLevel === 0 ? 0.72 : 1 + facilityLevel * 0.16;

  // Potential affects growth rate and ceiling resistance
  const potentialMult = 0.68 + (idol.potential / 100) * 0.62;

  // Fatigue reduces efficiency gently (never brutally)
  const fatigueMult = idol.fatigue > 75 ? 0.65 : idol.fatigue > 50 ? 0.85 : 1.0;

  // Loyalty & generous group split (>=70% to group) bonus
  let loyaltyMult = idol.loyalty >= 75 ? 1.08 : idol.loyalty < 35 ? 0.86 : 1.0;
  if (idol.groupId) {
    const grp = state.groups.find((g) => g.id === idol.groupId);
    if (grp && grp.groupSharePercent >= 70) {
      loyaltyMult += ((grp.groupSharePercent - 65) / 100) * 0.4;
    }
  }

  // Diminishing returns at high stats (cannot infinitely spam to 100 effortlessly)
  const currentStat = idol.stats[facility.stat];
  const diminishing = Math.max(0.22, 1 - Math.pow(currentStat / 105, 1.55));

  // Potential soft ceiling
  const softCapPenalty = currentStat >= idol.potential ? 0.32 : 1.0;

  const rawGain =
    3.2 *
    personality.trainingMult *
    specialtyMult *
    facilityMult *
    potentialMult *
    fatigueMult *
    loyaltyMult *
    diminishing *
    softCapPenalty;

  const gain = currentStat >= 100 ? 0 : Math.max(1, Math.round(rawGain));
  const cost = Math.round(
    facility.baseTrainingCost * (facilityLevel === 0 ? 0.85 : 1 + (facilityLevel - 1) * 0.12)
  );
  const staminaCost = facility.baseStaminaCost;
  const fatigueGain = Math.round(facility.baseFatigueGain * personality.fatigueMult);

  const efficiencyPct = Math.round(
    personality.trainingMult * specialtyMult * facilityMult * fatigueMult * loyaltyMult * 100
  );

  return {
    gain,
    cost,
    staminaCost,
    fatigueGain,
    efficiencyLabel: `${efficiencyPct}%`,
  };
}

export function trainIdol(
  state: GameState,
  idolId: string,
  facilityId: string
): { ok: boolean; error?: string; state: GameState; gain?: number } {
  const cfg = TRAINING_FACILITIES.find((f) => f.id === facilityId);
  if (!cfg) return { ok: false, error: 'Training facility not found.', state };

  const unlockCheck = isFacilityUnlocked(state, cfg);
  if (!unlockCheck.unlocked) {
    return { ok: false, error: unlockCheck.reason, state };
  }

  const facilityLevel = state.facilities[facilityId]?.level ?? 0;
  if (facilityLevel <= 0) {
    return {
      ok: false,
      error: `Purchase ${cfg.name} first to run structured studio training.`,
      state,
    };
  }

  const idol = state.idols.find((i) => i.id === idolId);
  if (!idol) return { ok: false, error: 'Idol not found.', state };

  const outcome = calculateTrainingOutcome(state, idol, cfg);
  if (state.company.money < outcome.cost) {
    return { ok: false, error: `Insufficient money (${cfg.name} costs ${outcome.cost}).`, state };
  }
  if (idol.currentStamina < outcome.staminaCost) {
    return {
      ok: false,
      error: `${idol.stageName} needs at least ${outcome.staminaCost} Stamina to train.`,
      state,
    };
  }
  if (idol.fatigue >= 95) {
    return {
      ok: false,
      error: `${idol.stageName} is exhausted (Fatigue ${idol.fatigue}/100). Schedule rest or use food items.`,
      state,
    };
  }

  const updatedIdol = syncIdolRatingAndTier({
    ...idol,
    currentStamina: clamp(idol.currentStamina - outcome.staminaCost, 0, 100),
    fatigue: clamp(idol.fatigue + outcome.fatigueGain, 0, 100),
    stats: {
      ...idol.stats,
      [cfg.stat]: clamp(idol.stats[cfg.stat] + outcome.gain, 0, 100),
    },
    trainingHistory: [
      {
        week: state.date.totalWeeks,
        stat: cfg.stat,
        gain: outcome.gain,
        facilityId,
      },
      ...idol.trainingHistory,
    ].slice(0, 30),
  });

  // Update group/solo tier if idol is in one
  let nextGroups = state.groups;
  if (updatedIdol.groupId) {
    nextGroups = state.groups.map((g) => {
      if (g.id !== updatedIdol.groupId) return g;
      const members = state.idols.map((i) => (i.id === idolId ? updatedIdol : i)).filter((i) => i.groupId === g.id);
      const avg = members.reduce((s, m) => s + m.overallRating, 0) / Math.max(1, members.length);
      return { ...g, tier: getTierFromRating(avg) };
    });
  }

  const nextSolos = state.soloArtists.map((s) =>
    s.idolId === idolId ? { ...s, tier: updatedIdol.tier } : s
  );

  let nextState: GameState = {
    ...state,
    company: {
      ...state.company,
      money: state.company.money - outcome.cost,
      totalExpenses: state.company.totalExpenses + outcome.cost,
    },
    idols: state.idols.map((i) => (i.id === idolId ? updatedIdol : i)),
    groups: nextGroups,
    soloArtists: nextSolos,
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
  };

  return { ok: true, state: nextState, gain: outcome.gain };
}

export function trainGroupInFacility(
  state: GameState,
  groupId: string,
  facilityId: string
): { ok: boolean; error?: string; state: GameState; trainedCount: number } {
  const group = state.groups.find((g) => g.id === groupId);
  if (!group) return { ok: false, error: 'Group not found.', state, trainedCount: 0 };

  let working = state;
  let trainedCount = 0;
  for (const memberId of group.memberIds) {
    const res = trainIdol(working, memberId, facilityId);
    if (res.ok) {
      working = res.state;
      trainedCount++;
    }
  }
  if (trainedCount === 0) {
    return {
      ok: false,
      error: 'No group members could train (check facility ownership, stamina, fatigue, or funds).',
      state,
      trainedCount: 0,
    };
  }
  return { ok: true, state: working, trainedCount };
}

export function restIdolNow(state: GameState, idolId: string): GameState {
  return {
    ...state,
    idols: state.idols.map((i) =>
      i.id === idolId
        ? {
            ...i,
            currentStamina: clamp(i.currentStamina + 25, 0, 100),
            fatigue: clamp(i.fatigue - 20, 0, 100),
          }
        : i
    ),
  };
}

export function purchaseHQUpgrade(
  state: GameState,
  upgradeId: string
): { ok: boolean; error?: string; state: GameState } {
  const cfg = HQ_UPGRADES.find((u) => u.id === upgradeId);
  if (!cfg) return { ok: false, error: 'Upgrade not found.', state };

  if (state.company.purchasedUpgradeIds.includes(upgradeId)) {
    return { ok: false, error: 'Upgrade already purchased.', state };
  }
  for (const pre of cfg.prerequisites) {
    if (!state.company.purchasedUpgradeIds.includes(pre)) {
      const preCfg = HQ_UPGRADES.find((u) => u.id === pre);
      return {
        ok: false,
        error: `Requires prerequisite: ${preCfg?.name ?? pre}.`,
        state,
      };
    }
  }
  if (compareTiers(state.company.tier, cfg.requiredTier) < 0) {
    return { ok: false, error: `Requires Company Tier ${cfg.requiredTier}.`, state };
  }
  if (compareReputations(state.company.reputation, cfg.requiredReputation) < 0) {
    return {
      ok: false,
      error: `Requires ${cfg.requiredReputation} Reputation.`,
      state,
    };
  }
  if (state.company.money < cfg.costMoney) {
    return { ok: false, error: 'Insufficient money for this upgrade.', state };
  }
  if (state.company.rubies < cfg.costRubies) {
    return { ok: false, error: 'Insufficient rubies for this upgrade.', state };
  }

  let maxGroupSlots = state.company.maxGroupSlots;
  let maxGroupMembers = state.company.maxGroupMembers;
  let auditionCapacity = state.company.auditionCapacity;
  const unlockedTrainingCategories = [...state.company.unlockedTrainingCategories];

  if (upgradeId === 'hq_dorm_expansion') {
    maxGroupSlots = Math.max(maxGroupSlots, 2);
    maxGroupMembers = Math.max(maxGroupMembers, 7);
  } else if (upgradeId === 'hq_tower_floor') {
    maxGroupSlots = Math.max(maxGroupSlots, 3);
    maxGroupMembers = Math.max(maxGroupMembers, 8);
  } else if (upgradeId === 'hq_seoul_campus') {
    maxGroupSlots = 5;
    maxGroupMembers = 10;
  } else if (upgradeId === 'trn_main2_unlock') {
    if (!unlockedTrainingCategories.includes('Main 2')) {
      unlockedTrainingCategories.push('Main 2');
    }
  } else if (upgradeId === 'trn_main3_unlock') {
    if (!unlockedTrainingCategories.includes('Main 3')) {
      unlockedTrainingCategories.push('Main 3');
    }
  } else if (upgradeId === 'aud_domestic_scout') {
    auditionCapacity = Math.max(auditionCapacity, 3);
  } else if (upgradeId === 'aud_intl_scout') {
    auditionCapacity = Math.max(auditionCapacity, 4);
  } else if (upgradeId === 'aud_global_scout') {
    auditionCapacity = 5;
  }

  let nextState: GameState = {
    ...state,
    company: {
      ...state.company,
      money: state.company.money - cfg.costMoney,
      rubies: state.company.rubies - cfg.costRubies,
      totalExpenses: state.company.totalExpenses + cfg.costMoney,
      maxGroupSlots,
      maxGroupMembers,
      auditionCapacity,
      unlockedTrainingCategories,
      purchasedUpgradeIds: [...state.company.purchasedUpgradeIds, upgradeId],
    },
    news: [
      {
        id: createId('news'),
        dateLabel: formatGameDateShort(state.date),
        totalWeeks: state.date.totalWeeks,
        category: 'Company' as const,
        headline: `${state.company.name} completes ${cfg.name}`,
        detail: cfg.effectText,
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
  };

  return { ok: true, state: nextState };
}

export function purchaseShopItem(
  state: GameState,
  itemId: string
): { ok: boolean; error?: string; state: GameState } {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) return { ok: false, error: 'Item not found.', state };

  const isPermanent = item.category === 'Clothes' || item.category === 'Accessories';
  if (isPermanent && state.ownedItemIds.includes(itemId)) {
    return { ok: false, error: 'You already own this wardrobe/accessory item.', state };
  }
  if (state.company.money < item.costMoney) {
    return { ok: false, error: 'Insufficient money.', state };
  }
  if (state.company.rubies < item.costRubies) {
    return { ok: false, error: 'Insufficient rubies.', state };
  }

  const nextQty = (state.itemQuantities[itemId] ?? 0) + 1;
  return {
    ok: true,
    state: {
      ...state,
      company: {
        ...state.company,
        money: state.company.money - item.costMoney,
        rubies: state.company.rubies - item.costRubies,
        totalExpenses: state.company.totalExpenses + item.costMoney,
      },
      ownedItemIds: isPermanent ? [...state.ownedItemIds, itemId] : state.ownedItemIds,
      itemQuantities: isPermanent
        ? state.itemQuantities
        : { ...state.itemQuantities, [itemId]: nextQty },
    },
  };
}

export function toggleEquipItem(
  state: GameState,
  idolId: string,
  itemId: string
): { ok: boolean; error?: string; state: GameState } {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) return { ok: false, error: 'Item not found.', state };
  if (!state.ownedItemIds.includes(itemId)) {
    return { ok: false, error: 'Purchase this item in the Shop before equipping it.', state };
  }

  return {
    ok: true,
    state: {
      ...state,
      idols: state.idols.map((idol) => {
        if (idol.id !== idolId) return idol;
        if (item.category === 'Clothes') {
          const equipped = idol.equippedClothingIds.includes(itemId);
          return {
            ...idol,
            equippedClothingIds: equipped ? [] : [itemId],
          };
        }
        if (item.category === 'Accessories') {
          const equipped = idol.equippedAccessoryIds.includes(itemId);
          return {
            ...idol,
            equippedAccessoryIds: equipped ? [] : [itemId],
          };
        }
        return idol;
      }),
    },
  };
}

export function consumeFoodItem(
  state: GameState,
  idolId: string,
  itemId: string
): { ok: boolean; error?: string; state: GameState } {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item || item.category !== 'Food') {
    return { ok: false, error: 'Consumable item not found.', state };
  }
  const qty = state.itemQuantities[itemId] ?? 0;
  if (qty <= 0) {
    return { ok: false, error: `No ${item.name} in inventory. Buy it in the Shop.`, state };
  }

  return {
    ok: true,
    state: {
      ...state,
      itemQuantities: {
        ...state.itemQuantities,
        [itemId]: qty - 1,
      },
      idols: state.idols.map((idol) =>
        idol.id === idolId
          ? {
              ...idol,
              currentStamina: clamp(idol.currentStamina + item.staminaRestore, 0, 100),
              fatigue: clamp(idol.fatigue - item.fatigueReduce, 0, 100),
              loyalty: clamp(idol.loyalty + item.loyaltyBonus, 0, 100),
            }
          : idol
      ),
    },
  };
}

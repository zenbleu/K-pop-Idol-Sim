import {
  ACTIVITY_CONFIG,
  PERSONALITY_CONFIG,
  REPUTATION_ORDER,
  SCHEDULE_ACTIVITY_DEFINITIONS,
  VENUES,
} from '../../config/gameConfig';
import {
  GameState,
  NewsItem,
  PendingEventChoice,
  WeeklySummary,
} from '../models/types';
import { advanceGameWeeks, formatGameDateShort, WEEKDAYS } from '../utils/date';
import { clamp, createId } from '../utils/ids';
import { generateWeeklyTrends } from './initialState';
import { computeAlbumQuality, syncAlbumSalesProgress } from './production';
import {
  resolveActivityParticipants,
  rollWeeklyPActivityAvailabilityForState,
} from './schedule';
import { evaluateCompanyProgression, getTierFromRating, syncIdolRatingAndTier } from './stats';

function maybeGenerateRandomEvent(state: GameState): {
  eventChoice: PendingEventChoice | null;
  autoLog: string | null;
  state: GameState;
} {
  // Modest probability (~24% per week), never destructive or excessive
  if (state.pendingEvent || state.idols.length === 0 || Math.random() > 0.24) {
    return { eventChoice: null, autoLog: null, state };
  }

  const activeIdol = state.idols[Math.floor(Math.random() * state.idols.length)];
  const activeGroup = state.groups[0];

  const roll = Math.random();
  if (roll < 0.35 && activeGroup) {
    // Interactive positive promo opportunity
    const choice: PendingEventChoice = {
      id: createId('evt'),
      eventId: 'viral_clip',
      title: 'Viral Rehearsal Clip',
      description: `A backstage dance clip featuring ${activeGroup.name} is gaining traction online.`,
      targetLabel: activeGroup.name,
      optionA: {
        label: 'Boost with Social Ad (₩1,500,000)',
        effectSummary: '+6 Popularity, +450 Fans, -₩1,500,000',
      },
      optionB: {
        label: 'Let It Grow Organically (Free)',
        effectSummary: '+2 Popularity, +160 Fans',
      },
    };
    return { eventChoice: choice, autoLog: `Event triggered: Viral Rehearsal Clip for ${activeGroup.name}.`, state };
  }

  if (roll < 0.65) {
    // Positive indie spotlight
    const fansBonus = 180 + Math.round(activeIdol.popularity * 5);
    const nextState: GameState = {
      ...state,
      idols: state.idols.map((i) =>
        i.id === activeIdol.id
          ? {
              ...i,
              popularity: clamp(i.popularity + 2, 0, 100),
              fanbase: i.fanbase + fansBonus,
            }
          : i
      ),
    };
    return {
      eventChoice: null,
      autoLog: `${activeIdol.stageName} drew unexpected attention on music forums (+2 Popularity, +${fansBonus} Fans).`,
      state: nextState,
    };
  }

  if (roll < 0.85) {
    // Minor unexpected studio maintenance expense
    const fee = 750_000;
    if (state.company.money >= fee) {
      return {
        eventChoice: null,
        autoLog: `Unexpected sound equipment calibration cost ₩${fee.toLocaleString()}.`,
        state: {
          ...state,
          company: {
            ...state.company,
            money: state.company.money - fee,
            totalExpenses: state.company.totalExpenses + fee,
          },
        },
      };
    }
  }

  // Exhaustion check if any idol has high fatigue
  const tired = state.idols.find((i) => i.fatigue >= 72);
  if (tired) {
    return {
      eventChoice: null,
      autoLog: `${tired.stageName} showed signs of fatigue (-3 Loyalty). Consider scheduling Rest & Recovery.`,
      state: {
        ...state,
        idols: state.idols.map((i) =>
          i.id === tired.id ? { ...i, loyalty: clamp(i.loyalty - 3, 0, 100) } : i
        ),
      },
    };
  }

  return { eventChoice: null, autoLog: null, state };
}

export function resolvePendingEvent(
  state: GameState,
  option: 'A' | 'B'
): { ok: boolean; error?: string; state: GameState } {
  const evt = state.pendingEvent;
  if (!evt) return { ok: false, error: 'No pending event.', state };

  if (evt.eventId === 'viral_clip') {
    const grp = state.groups.find((g) => g.name === evt.targetLabel) ?? state.groups[0];
    if (option === 'A') {
      const cost = 1_500_000;
      if (state.company.money < cost) {
        return { ok: false, error: 'Insufficient money for social boost.', state };
      }
      return {
        ok: true,
        state: {
          ...state,
          pendingEvent: null,
          company: {
            ...state.company,
            money: state.company.money - cost,
            totalExpenses: state.company.totalExpenses + cost,
          },
          groups: grp
            ? state.groups.map((g) =>
                g.id === grp.id
                  ? {
                      ...g,
                      popularity: clamp(g.popularity + 6, 0, 100),
                      fanbase: g.fanbase + 450,
                    }
                  : g
              )
            : state.groups,
        },
      };
    } else {
      return {
        ok: true,
        state: {
          ...state,
          pendingEvent: null,
          groups: grp
            ? state.groups.map((g) =>
                g.id === grp.id
                  ? {
                      ...g,
                      popularity: clamp(g.popularity + 2, 0, 100),
                      fanbase: g.fanbase + 160,
                    }
                  : g
              )
            : state.groups,
        },
      };
    }
  }

  return { ok: true, state: { ...state, pendingEvent: null } };
}

/**
 * Advances the simulation by 1 game week, processing Monday through Sunday chronologically.
 */
export function advanceWeekSimulation(
  initialState: GameState,
  nowTimestamp = Date.now()
): GameState {
  // First sync any real-time album sales so totals are accurate
  let working = syncAlbumSalesProgress(initialState, nowTimestamp).state;

  const repBefore = working.company.reputation;
  const tierBefore = working.company.tierDisplay;
  const weekDateLabel = formatGameDateShort(working.date);

  let weekIncome = 0;
  let weekExpenses = 0;
  let weekFansGained = 0;
  let activitiesCompleted = 0;
  const activityLogs: string[] = [];
  const idolGrowthLogs: string[] = [];
  const importantEvents: string[] = [];
  const generatedNews: NewsItem[] = [];

  // Reset weekly fan growth counters
  working = {
    ...working,
    groups: working.groups.map((g) => ({ ...g, weeklyFanGrowth: 0 })),
    soloArtists: working.soloArtists.map((s) => ({ ...s, weeklyFanGrowth: 0 })),
  };

  const prBoost = working.company.purchasedUpgradeIds.includes('mkt_pr_desk') ? 1.18 : 1.0;
  const hrFatigueMult = working.company.purchasedUpgradeIds.includes('mgt_hr_team') ? 0.9 : 1.0;

  // 1. Chronological Day-by-Day Simulation (Monday -> Sunday)
  for (const day of WEEKDAYS) {
    const dayActivities = working.weeklyPlan.filter(
      (a) => a.day === day && !a.completed
    );

    for (const act of dayActivities) {
      const legacyCfg = ACTIVITY_CONFIG[act.activityType];
      const def = act.activityId
        ? SCHEDULE_ACTIVITY_DEFINITIONS.find((d) => d.id === act.activityId) ?? null
        : null;
      const activityLabel = def?.label ?? act.notes ?? act.activityType;
      const staminaCost = def?.staminaCost ?? legacyCfg.staminaCost;
      const fatigueDelta = def?.fatigueDelta ?? legacyCfg.fatigueDelta;
      const staminaRestore =
        def?.staminaRestore ??
        (act.activityType === 'Rest & Recovery'
          ? 30
          : act.activityType === 'Artist Vacation'
            ? 55
            : 0);
      const loyaltyDelta =
        def?.loyaltyDelta ??
        (act.activityType === 'Artist Vacation'
          ? 6
          : act.activityType === 'Fanmeeting'
            ? 3
            : 0);
      const statTrained = def?.statTrained ?? legacyCfg.statTrained;
      const popularityDelta = def?.popularityDelta ?? legacyCfg.popularityDelta;
      const fanGainBase = def?.fanGainBase ?? legacyCfg.fanGainBase;
      const isRestActivity =
        def?.category === 'Rest' ||
        act.activityType === 'Rest & Recovery' ||
        act.activityType === 'Artist Vacation';

      const participants = resolveActivityParticipants(
        working,
        act.targetType,
        act.targetId
      );

      // Re-verify funds & stamina at execution time
      if (act.estimatedCost > 0 && working.company.money < act.estimatedCost) {
        activityLogs.push(`${day}: Skipped ${activityLabel} (${act.targetName}) — insufficient funds.`);
        continue;
      }

      if (staminaCost > 0 && participants.some((p) => p.currentStamina < staminaCost)) {
        activityLogs.push(`${day}: Skipped ${activityLabel} (${act.targetName}) — low stamina.`);
        continue;
      }

      // Deduct activity cost
      if (act.estimatedCost > 0) {
        working = {
          ...working,
          company: {
            ...working.company,
            money: working.company.money - act.estimatedCost,
            totalExpenses: working.company.totalExpenses + act.estimatedCost,
          },
        };
        weekExpenses += act.estimatedCost;
      }

      // Apply income (split by group share if target is a group)
      if (act.estimatedIncome > 0) {
        let actualCompanyIncome = act.estimatedIncome;
        if (act.targetType === 'Group') {
          const grp = working.groups.find((g) => g.id === act.targetId);
          if (grp) {
            actualCompanyIncome = Math.round(
              (act.estimatedIncome * grp.companySharePercent) / 100
            );
          }
        }
        // Personality modifier for variety/entertainment
        if (act.activityType === 'Variety Show' && participants.length > 0) {
          const avgEnt =
            participants.reduce(
              (s, p) => s + PERSONALITY_CONFIG[p.personality].entertainmentMod,
              0
            ) / participants.length;
          actualCompanyIncome = Math.round(actualCompanyIncome * avgEnt);
        }

        working = {
          ...working,
          company: {
            ...working.company,
            money: working.company.money + actualCompanyIncome,
            totalRevenue: working.company.totalRevenue + actualCompanyIncome,
          },
        };
        weekIncome += actualCompanyIncome;
      }

      // Apply stamina, fatigue, training, popularity, fan gains
      const participantIds = new Set(participants.map((p) => p.id));
      let fanGainForAct = Math.round(
        fanGainBase * (1 + REPUTATION_ORDER.indexOf(working.company.reputation) * 0.25) * prBoost
      );
      if (participants.length > 0) {
        const avgPopMult =
          participants.reduce(
            (s, p) => s + PERSONALITY_CONFIG[p.personality].popularityMult,
            0
          ) / participants.length;
        fanGainForAct = Math.round(fanGainForAct * avgPopMult);
      }

      working = {
        ...working,
        idols: working.idols.map((idol) => {
          if (!participantIds.has(idol.id)) return idol;
          const pCfg = PERSONALITY_CONFIG[idol.personality];
          let nextStamina = idol.currentStamina;
          let nextFatigue = idol.fatigue;
          let nextLoyalty = idol.loyalty;
          const nextStats = { ...idol.stats };

          if (isRestActivity) {
            nextStamina = clamp(nextStamina + staminaRestore, 0, 100);
            nextFatigue = clamp(nextFatigue + fatigueDelta, 0, 100);
            if (loyaltyDelta > 0) {
              nextLoyalty = clamp(nextLoyalty + loyaltyDelta, 0, 100);
            }
          } else {
            nextStamina = clamp(nextStamina - staminaCost, 0, 100);
            nextFatigue = clamp(
              nextFatigue + Math.round(fatigueDelta * pCfg.fatigueMult * hrFatigueMult),
              0,
              100
            );
          }

          if (statTrained) {
            const currentVal = nextStats[statTrained];
            const gain = currentVal >= 95 ? 1 : currentVal >= 75 ? 1 : 2;
            nextStats[statTrained] = clamp(currentVal + gain, 0, 100);
            idolGrowthLogs.push(`${day}: ${idol.stageName} +${gain} ${statTrained}`);
          }

          const updated = syncIdolRatingAndTier({
            ...idol,
            currentStamina: nextStamina,
            fatigue: nextFatigue,
            loyalty: nextLoyalty,
            popularity: clamp(idol.popularity + Math.ceil(popularityDelta * 0.6), 0, 100),
            fanbase: idol.fanbase + Math.round(fanGainForAct / Math.max(1, participants.length)),
            stats: nextStats,
          });
          return updated;
        }),
      };

      // Update group / solo fanbase, popularity & tier
      if (act.targetType === 'Group') {
        working = {
          ...working,
          groups: working.groups.map((g) => {
            if (g.id !== act.targetId) return g;
            const members = working.idols.filter((i) => g.memberIds.includes(i.id));
            const avg =
              members.length > 0
                ? members.reduce((s, m) => s + m.overallRating, 0) / members.length
                : 0;
            return {
              ...g,
              popularity: clamp(g.popularity + popularityDelta, 0, 100),
              fanbase: g.fanbase + fanGainForAct,
              weeklyFanGrowth: g.weeklyFanGrowth + fanGainForAct,
              loyalty: clamp(g.loyalty + (loyaltyDelta > 0 ? Math.min(3, loyaltyDelta) : 0), 0, 100),
              tier: getTierFromRating(avg),
            };
          }),
        };
        weekFansGained += fanGainForAct;
      } else if (act.targetType === 'Solo') {
        working = {
          ...working,
          soloArtists: working.soloArtists.map((s) => {
            if (s.id !== act.targetId) return s;
            const linkedIdol = working.idols.find((i) => i.id === s.idolId);
            return {
              ...s,
              popularity: clamp(s.popularity + popularityDelta, 0, 100),
              fanbase: s.fanbase + fanGainForAct,
              weeklyFanGrowth: s.weeklyFanGrowth + fanGainForAct,
              tier: linkedIdol ? linkedIdol.tier : s.tier,
            };
          }),
        };
        weekFansGained += fanGainForAct;
      } else if (act.activityType === 'Company Promotion') {
        working = {
          ...working,
          groups: working.groups.map((g) => ({
            ...g,
            popularity: clamp(g.popularity + 1, 0, 100),
            fanbase: g.fanbase + fanGainForAct,
            weeklyFanGrowth: g.weeklyFanGrowth + fanGainForAct,
          })),
          soloArtists: working.soloArtists.map((s) => ({
            ...s,
            popularity: clamp(s.popularity + 1, 0, 100),
            fanbase: s.fanbase + fanGainForAct,
            weeklyFanGrowth: s.weeklyFanGrowth + fanGainForAct,
          })),
        };
        weekFansGained += fanGainForAct * (working.groups.length + working.soloArtists.length);
      }

      // Legacy Recording Session advances active production
      if (!def && act.activityType === 'Recording Session') {
        working = {
          ...working,
          releases: working.releases.map((rel) => {
            if (
              rel.status === 'In Production' &&
              rel.targetType === act.targetType &&
              rel.targetId === act.targetId
            ) {
              const nextRel = { ...rel, recordingSessions: rel.recordingSessions + 1 };
              nextRel.quality = computeAlbumQuality(working, nextRel);
              return nextRel;
            }
            return rel;
          }),
        };
      }

      activitiesCompleted++;
      activityLogs.push(`${day}: Completed ${activityLabel} (${act.targetName}).`);
    }

    // Gentle daily overnight recovery for idols who had no work that day
    const workedTodayIds = new Set<string>();
    for (const act of dayActivities) {
      const def = act.activityId
        ? SCHEDULE_ACTIVITY_DEFINITIONS.find((d) => d.id === act.activityId) ?? null
        : null;
      const cost = def?.staminaCost ?? ACTIVITY_CONFIG[act.activityType].staminaCost;
      if (cost > 0) {
        for (const p of resolveActivityParticipants(working, act.targetType, act.targetId)) {
          workedTodayIds.add(p.id);
        }
      }
    }
    working = {
      ...working,
      idols: working.idols.map((idol) =>
        workedTodayIds.has(idol.id)
          ? idol
          : {
              ...idol,
              currentStamina: clamp(idol.currentStamina + 8, 0, 100),
              fatigue: clamp(idol.fatigue - 3, 0, 100),
            }
      ),
    };
  }

  // 2. Weekly Salaries & Contracts
  const totalSalaries = working.idols.reduce(
    (sum, i) => sum + i.contract.weeklySalary,
    0
  );
  if (totalSalaries > 0) {
    working = {
      ...working,
      company: {
        ...working.company,
        money: working.company.money - totalSalaries,
        totalExpenses: working.company.totalExpenses + totalSalaries,
      },
    };
    weekExpenses += totalSalaries;
  }

  const nextWeekTotal = working.date.totalWeeks + 1;
  working = {
    ...working,
    idols: working.idols.map((idol) => {
      const weeksLeft = idol.contract.expirationTotalWeeks - nextWeekTotal;
      let status = idol.contract.status;
      let renewalEligible = idol.contract.renewalEligible;
      if (weeksLeft <= 0) {
        status = 'Expired';
        renewalEligible = true;
        importantEvents.push(`${idol.stageName}'s contract has expired — renew or negotiate in their Profile.`);
      } else if (weeksLeft <= 8) {
        status = 'Expiring Soon';
        renewalEligible = true;
        if (weeksLeft === 8) {
          importantEvents.push(`${idol.stageName}'s contract expires in 2 months (8 weeks).`);
        }
      } else {
        status = 'Active';
      }

      // Passive recovery upgrade & HR team
      const loungeBonus = working.company.purchasedUpgradeIds.includes('hq_recovery_lounge')
        ? { stam: 8, fat: 4 }
        : { stam: 0, fat: 0 };
      const hrLoyalty = working.company.purchasedUpgradeIds.includes('mgt_hr_team') ? 2 : 0;

      // Income distribution loyalty effects (Section 20)
      let splitLoyaltyDelta = 0;
      if (idol.groupId) {
        const grp = working.groups.find((g) => g.id === idol.groupId);
        if (grp) {
          if (grp.groupSharePercent >= 70) {
            splitLoyaltyDelta = Math.round((grp.groupSharePercent - 65) / 10);
          } else if (grp.companySharePercent >= 70) {
            splitLoyaltyDelta = -Math.round((grp.companySharePercent - 60) / 8);
          }
        }
      }
      const debtPenalty = working.company.money < 0 ? -3 : 0;
      const nextLoyalty = clamp(
        idol.loyalty + hrLoyalty + splitLoyaltyDelta + debtPenalty,
        0,
        100
      );
      const departureWarning = nextLoyalty < 28;
      if (departureWarning && !idol.departureWarning) {
        importantEvents.push(
          `Loyalty Alert: ${idol.stageName} is dissatisfied (${nextLoyalty}/100). Consider a retention offer or fairer split.`
        );
      }

      return {
        ...idol,
        currentStamina: clamp(idol.currentStamina + loungeBonus.stam, 0, 100),
        fatigue: clamp(idol.fatigue - loungeBonus.fat, 0, 100),
        loyalty: nextLoyalty,
        departureWarning,
        contract: {
          ...idol.contract,
          status,
          renewalEligible,
        },
      };
    }),
  };

  // Sync Group Loyalty from members + split
  working = {
    ...working,
    groups: working.groups.map((g) => {
      const members = working.idols.filter((i) => g.memberIds.includes(i.id));
      const avgLoyalty =
        members.length > 0
          ? Math.round(members.reduce((s, m) => s + m.loyalty, 0) / members.length)
          : g.loyalty;
      return { ...g, loyalty: avgLoyalty };
    }),
  };

  // 3. Production Weekly Progress
  working = {
    ...working,
    releases: working.releases.map((rel) => {
      if (rel.status !== 'In Production') return rel;
      const nextElapsed = Math.min(rel.durationWeeks, rel.weeksElapsed + 1);
      if (nextElapsed === rel.durationWeeks && rel.weeksElapsed < rel.durationWeeks) {
        importantEvents.push(
          `"${rel.title}" (${rel.targetName}) finished production timeline and is ready to release!`
        );
      }
      return { ...rel, weeksElapsed: nextElapsed };
    }),
  };

  // 4. Concert Preparation & Active Tour Dates
  working = {
    ...working,
    concerts: working.concerts.map((c) => {
      if (c.status !== 'Preparing') return c;
      const done = c.preparationWeeksDone + 1;
      const ready = done >= c.preparationWeeksRequired;
      if (ready) {
        importantEvents.push(`Concert "${c.title}" (${c.targetName}) is Ready to perform!`);
      }
      return {
        ...c,
        preparationWeeksDone: done,
        status: ready ? 'Ready' : 'Preparing',
      };
    }),
  };

  // Progress active Tours (1 date per week)
  const updatedTours = working.tours.map((t) => {
    if (t.status !== 'Active') return t;
    const venue = VENUES[t.venueSize];
    const artistPop =
      t.targetType === 'Group'
        ? working.groups.find((g) => g.id === t.targetId)?.popularity ?? 40
        : working.soloArtists.find((s) => s.id === t.targetId)?.popularity ?? 40;
    const attendance = clamp(
      Math.round(venue.capacity * (0.52 + artistPop / 180)),
      Math.round(venue.capacity * 0.45),
      venue.capacity
    );
    const gross = attendance * t.ticketPrice;
    const grp =
      t.targetType === 'Group'
        ? working.groups.find((g) => g.id === t.targetId)
        : undefined;
    const share = grp ? grp.companySharePercent : 100;
    const companyTake = Math.round((gross * share) / 100);
    const fansFromStop = Math.round(attendance * 0.2);

    weekIncome += companyTake;
    weekFansGained += fansFromStop;
    working = {
      ...working,
      company: {
        ...working.company,
        money: working.company.money + companyTake,
        totalRevenue: working.company.totalRevenue + companyTake,
      },
      groups: working.groups.map((g) =>
        t.targetType === 'Group' && g.id === t.targetId
          ? {
              ...g,
              popularity: clamp(g.popularity + 2, 0, 100),
              fanbase: g.fanbase + fansFromStop,
              weeklyFanGrowth: g.weeklyFanGrowth + fansFromStop,
            }
          : g
      ),
      soloArtists: working.soloArtists.map((s) =>
        t.targetType === 'Solo' && s.id === t.targetId
          ? {
              ...s,
              popularity: clamp(s.popularity + 2, 0, 100),
              fanbase: s.fanbase + fansFromStop,
              weeklyFanGrowth: s.weeklyFanGrowth + fansFromStop,
            }
          : s
      ),
    };

    const completedDates = t.datesCompleted + 1;
    const finished = completedDates >= t.totalDates;
    if (finished) {
      importantEvents.push(`${t.targetName} completed their "${t.title}" tour!`);
      generatedNews.push({
        id: createId('news'),
        dateLabel: formatGameDateShort(working.date),
        totalWeeks: working.date.totalWeeks,
        category: 'Concert',
        headline: `${t.targetName} wraps "${t.title}" tour`,
        detail: `${t.totalDates} shows · ${(t.totalTicketsSold + attendance).toLocaleString()} total tickets sold.`,
      });
    } else {
      activityLogs.push(`Tour Stop ${completedDates}/${t.totalDates}: "${t.title}" (${attendance.toLocaleString()} attendees).`);
    }

    return {
      ...t,
      datesCompleted: completedDates,
      status: (finished ? 'Completed' : 'Active') as TourPlanStatus,
      totalTicketsSold: t.totalTicketsSold + attendance,
      totalGrossRevenue: t.totalGrossRevenue + gross,
      totalFansGained: t.totalFansGained + fansFromStop,
      popularityGain: t.popularityGain + 2,
    };
  });
  working = { ...working, tours: updatedTours };

  // 5. Random Event
  const eventRes = maybeGenerateRandomEvent(working);
  working = eventRes.state;
  if (eventRes.autoLog) {
    importantEvents.push(eventRes.autoLog);
    generatedNews.push({
      id: createId('news'),
      dateLabel: weekDateLabel,
      totalWeeks: working.date.totalWeeks,
      category: 'Event',
      headline: 'Agency Weekly Spotlight',
      detail: eventRes.autoLog,
    });
  }

  // 6. Advance Calendar Date by 1 Week (7 Days) & Clear Completed Plan
  const nextDate = advanceGameWeeks(working.date, 1);
  const nextTrends = generateWeeklyTrends(nextDate.totalWeeks);
  const nextWeeklyPActivityAvailability = rollWeeklyPActivityAvailabilityForState(
    working,
    nextDate
  );

  // 7. Re-evaluate Company Tier & Reputation
  const prog = evaluateCompanyProgression(working);
  if (prog.reputation !== repBefore) {
    importantEvents.push(`Company Reputation rose to ${prog.reputation}!`);
    generatedNews.push({
      id: createId('news'),
      dateLabel: formatGameDateShort(nextDate),
      totalWeeks: nextDate.totalWeeks,
      category: 'Milestone',
      headline: `${working.company.name} achieves ${prog.reputation} Reputation!`,
      detail: `Industry recognition expands new concert and growth opportunities.`,
    });
  }

  const albumSalesUnits = working.releases
    .filter((r) => r.status === 'Promoting')
    .reduce((s, r) => s + r.salesUnits, 0);
  const albumRevenue = working.releases
    .filter((r) => r.status === 'Promoting')
    .reduce((s, r) => s + r.companyRevenueApplied, 0);

  // Build weekly summary from actual simulated results
  const summary: WeeklySummary = {
    weekDateLabel,
    totalWeeks: working.date.totalWeeks,
    income: weekIncome,
    expenses: weekExpenses,
    netProfit: weekIncome - weekExpenses,
    activitiesCompleted,
    activityLogs,
    idolGrowthLogs,
    fansGained: weekFansGained,
    albumSalesUnits,
    albumRevenue,
    reputationBefore: repBefore,
    reputationAfter: prog.reputation,
    tierBefore,
    tierAfter: prog.tierDisplay,
    importantEvents,
    upcomingCount: 0, // next week starts fresh so nothing duplicates!
  };

  return {
    ...working,
    date: nextDate,
    trends: nextTrends,
    pendingEvent: eventRes.eventChoice ?? working.pendingEvent,
    weeklyPlan: [], // Clear week's completed/past plan so activities never process twice
    weeklyPActivityAvailability: nextWeeklyPActivityAvailability,
    company: {
      ...working.company,
      companyScore: prog.score,
      tier: prog.tier,
      tierDisplay: prog.tierDisplay,
      reputation: prog.reputation,
    },
    milestonesReached: [...working.milestonesReached, ...prog.newMilestones],
    news: [...generatedNews, ...working.news].slice(0, 60),
    lastWeeklySummary: summary,
  };
}

type TourPlanStatus = 'Preparing' | 'Active' | 'Completed';

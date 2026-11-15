import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createInitialGameState } from './initialState';
import { runMoneyAudition, runRubyAudition, recruitCandidate } from './auditions';
import {
  calculateWeightedOverallRating,
  findMaknaeId,
  getTierFromRating,
} from './stats';
import {
  disbandGroup,
  formGroup,
  isIdolInRejoinCooldown,
  removeIdolFromCompany,
  removeIdolFromGroup,
  toggleIdolGroupRole,
  updateGroupIncomeSplit,
} from './groups';
import { purchaseHQUpgrade, purchaseOrUpgradeFacility, trainIdol } from './training';
import {
  recordForProduction,
  releaseAlbumToMarket,
  startAlbumProduction,
  syncAlbumSalesProgress,
} from './production';
import { addPlannedActivity } from './schedule';
import { advanceWeekSimulation } from './simulation';
import { performPreparedConcert, planConcert, startTour } from './concerts';
import { exportSaveJson, importSaveJson } from '../save/storage';
import { STARTING_PROGRESSION } from '../../config/gameConfig';
import { IdolStats } from '../models/types';

function makeStats(val: number): IdolStats {
  return {
    vocal: val,
    dance: val,
    rap: val,
    stamina: val,
    musical: val,
    language: val,
    acting: val,
    fitness: val,
    composition: val,
    writing: val,
    choreography: val,
    entertainment: val,
  };
}

test('exact starting progression values match specification', () => {
  const s = createInitialGameState({ companyName: 'Nova Ent', ceoName: 'Min', initialized: true });
  assert.equal(s.company.money, 100_000_000);
  assert.equal(s.company.rubies, 100);
  assert.equal(s.company.tier, 'F');
  assert.equal(s.company.reputation, 'Local');
  assert.equal(s.groups.length, 0);
  assert.equal(s.soloArtists.length, 0);
  assert.equal(s.idols.length, 0);
  assert.equal(s.company.auditionCapacity, 2);
});

test('all 80 male and female portrait files exist in centralized collections', () => {
  for (let i = 1; i <= 40; i++) {
    assert.equal(
      fs.existsSync(path.join(process.cwd(), 'public', 'female-idol-roster', `F-Idol-${i}.jpg`)),
      true,
      `Missing F-Idol-${i}.jpg`
    );
    assert.equal(
      fs.existsSync(path.join(process.cwd(), 'public', 'male-idol-roster', `M-Idol-${i}.jpg`)),
      true,
      `Missing M-Idol-${i}.jpg`
    );
  }
});

test('exact idol tier thresholds F(0-9) D(10-19) C(20-39) B(40-69) A(70-87) S(88-94) P(95-100)', () => {
  assert.equal(getTierFromRating(0), 'F');
  assert.equal(getTierFromRating(9), 'F');
  assert.equal(getTierFromRating(10), 'D');
  assert.equal(getTierFromRating(19), 'D');
  assert.equal(getTierFromRating(20), 'C');
  assert.equal(getTierFromRating(39), 'C');
  assert.equal(getTierFromRating(40), 'B');
  assert.equal(getTierFromRating(69), 'B');
  assert.equal(getTierFromRating(70), 'A');
  assert.equal(getTierFromRating(87), 'A');
  assert.equal(getTierFromRating(88), 'S');
  assert.equal(getTierFromRating(94), 'S');
  assert.equal(getTierFromRating(95), 'P');
  assert.equal(getTierFromRating(100), 'P');

  const stats = { ...makeStats(10), vocal: 90 };
  const weighted = calculateWeightedOverallRating(stats, 'Vocal Specialist');
  assert.ok(weighted < 70, 'Single high stat must not jump to A/S/P tier');
});

test('auditions, recruitment, gender portrait matching, and Ruby A-tier cap', () => {
  let state = createInitialGameState({ initialized: true });
  const aud = runMoneyAudition(state, 'Streets', 'Female');
  assert.equal(aud.ok, true);
  assert.equal(aud.state.auditionPool.length, 2);
  for (const c of aud.state.auditionPool) {
    assert.equal(c.gender, 'Female');
    assert.match(c.portraitFilename, /^F-Idol-\d+\.jpg$/);
  }

  const rubyAud = runRubyAudition(aud.state, {
    gender: 'Male',
    duration: '2 months',
    slots: 2,
  });
  assert.equal(rubyAud.ok, true);
  for (const c of rubyAud.state.auditionPool) {
    assert.equal(c.gender, 'Male');
    assert.match(c.portraitFilename, /^M-Idol-\d+\.jpg$/);
    assert.ok(c.overallRating <= 87, 'Ruby audition must never generate S or P directly');
  }

  const candId = rubyAud.state.auditionPool[0].id;
  const candCost = rubyAud.state.auditionPool[0].recruitmentCost;
  const moneyBefore = rubyAud.state.company.money;
  const rec = recruitCandidate(rubyAud.state, candId);
  assert.equal(rec.ok, true);
  assert.equal(rec.state.idols.length, 1);
  assert.equal(rec.state.company.money, moneyBefore - candCost);
});

test('training facilities gating, training stat gain, stamina/fatigue, and Main 2 unlock', () => {
  let state = createInitialGameState({ initialized: true });
  const aud = runMoneyAudition(state, 'Streets', 'Female');
  const rec = recruitCandidate(aud.state, aud.state.auditionPool[0].id);
  state = rec.state;
  const idolId = state.idols[0].id;

  // Main 2 facility locked at start
  const lockedTry = purchaseOrUpgradeFacility(state, 'musical_lab');
  assert.equal(lockedTry.ok, false);

  // Purchase Vocal Studio
  const buyVocal = purchaseOrUpgradeFacility(state, 'vocal_studio');
  assert.equal(buyVocal.ok, true);
  state = buyVocal.state;

  const beforeStat = state.idols[0].stats.vocal;
  const beforeStamina = state.idols[0].currentStamina;
  const beforeFatigue = state.idols[0].fatigue;
  const tr = trainIdol(state, idolId, 'vocal_studio');
  assert.equal(tr.ok, true);
  assert.ok(tr.state.idols[0].stats.vocal > beforeStat);
  assert.ok(tr.state.idols[0].currentStamina < beforeStamina);
  assert.ok(tr.state.idols[0].fatigue > beforeFatigue);
});

test('group formation, Maknae auto-detection, 6-month cooldown, and disbandment contract retention', () => {
  let state = createInitialGameState({ initialized: true });
  const aud = runMoneyAudition(state, 'Streets', 'Female');
  state = recruitCandidate(aud.state, aud.state.auditionPool[0].id).state;
  state = recruitCandidate(state, state.auditionPool[0].id).state;

  // Give distinct ages so Maknae is unambiguous
  state = {
    ...state,
    idols: state.idols.map((idol, idx) => ({ ...idol, age: idx === 0 ? 22 : 16 })),
  };

  const grpRes = formGroup(state, {
    name: 'VELVET PIXEL',
    gender: 'Female',
    memberIds: state.idols.map((i) => i.id),
  });
  assert.equal(grpRes.ok, true);
  state = grpRes.state;

  const grpId = state.groups[0].id;
  const maknaeId = findMaknaeId(state.idols);
  assert.equal(maknaeId, state.idols[1].id);

  // Role assignment
  state = toggleIdolGroupRole(state, state.idols[0].id, 'Leader');
  assert.ok(state.idols[0].groupRoles.includes('Leader'));

  // Remove member -> 6-month cooldown + keeps contract + returns to trainee
  const remRes = removeIdolFromGroup(state, state.idols[1].id);
  assert.equal(remRes.ok, true);
  state = remRes.state;
  const removedIdol = state.idols.find((i) => i.id === maknaeId)!;
  assert.equal(removedIdol.groupId, null);
  assert.equal(isIdolInRejoinCooldown(removedIdol, state.date.totalWeeks), true);

  // Attempt to form new group with cooled-down idol fails
  const hq = purchaseHQUpgrade(state, 'hq_dorm_expansion');
  assert.equal(hq.ok, true);
  const blockedForm = formGroup(hq.state, {
    name: 'TEMP',
    gender: 'Female',
    memberIds: [removedIdol.id],
  });
  assert.equal(blockedForm.ok, false);

  // Disbandment preserves company contracts
  const disb = disbandGroup(state, grpId);
  assert.equal(disb.ok, true);
  assert.equal(disb.state.groups.length, 0);
  assert.equal(disb.state.idols.length, 2);

  // Permanent company removal removes idol permanently
  const kick = removeIdolFromCompany(disb.state, removedIdol.id);
  assert.equal(kick.ok, true);
  assert.equal(kick.state.idols.length, 1);
});

test('income split lock during production/promotion and non-duplicating 10-min album sales', () => {
  let state = createInitialGameState({ initialized: true });
  const aud = runMoneyAudition(state, 'Streets', 'Female');
  state = recruitCandidate(aud.state, aud.state.auditionPool[0].id).state;
  state = formGroup(state, {
    name: 'PRISM',
    gender: 'Female',
    memberIds: [state.idols[0].id],
  }).state;
  const grpId = state.groups[0].id;

  // Adjust split to 60/40 before production
  const splitOk = updateGroupIncomeSplit(state, grpId, 60);
  assert.equal(splitOk.ok, true);
  state = splitOk.state;

  // Start Single production (1 week)
  const prod = startAlbumProduction(state, {
    targetType: 'Group',
    targetId: grpId,
    releaseType: 'Single',
    title: 'Neon Heart',
    genre: 'Pop',
    concept: 'Cute',
    writerId: 'staff_w1',
    producerId: 'staff_p1',
    marketingBudget: 1_000_000,
  });
  assert.equal(prod.ok, true);
  state = prod.state;

  // Blocked while in production
  const splitBlocked = updateGroupIncomeSplit(state, grpId, 50);
  assert.equal(splitBlocked.ok, false);

  // Record & advance 1 week
  state = recordForProduction(state, prod.project!.id).state;
  state = advanceWeekSimulation(state);

  const relRes = releaseAlbumToMarket(state, prod.project!.id, 1_000_000);
  assert.equal(relRes.ok, true);
  state = relRes.state;

  // Still blocked during 10-min active sales
  const splitBlockedPromo = updateGroupIncomeSplit(state, grpId, 50);
  assert.equal(splitBlockedPromo.ok, false);

  // Halfway at 5 minutes
  const half = syncAlbumSalesProgress(
    state,
    1_000_000 + STARTING_PROGRESSION.albumSalesDurationMs / 2
  );
  const moneyAtHalf = half.state.company.money;
  assert.ok(moneyAtHalf > state.company.money);

  // Complete at 10 minutes
  const full = syncAlbumSalesProgress(
    half.state,
    1_000_000 + STARTING_PROGRESSION.albumSalesDurationMs
  );
  const moneyAtFull = full.state.company.money;
  assert.ok(moneyAtFull > moneyAtHalf);

  // Re-syncing after completion MUST NOT duplicate rewards
  const repeat = syncAlbumSalesProgress(
    full.state,
    1_000_000 + STARTING_PROGRESSION.albumSalesDurationMs * 2
  );
  assert.equal(repeat.state.company.money, moneyAtFull);

  // Split unlocked after sales complete
  const splitAfter = updateGroupIncomeSplit(repeat.state, grpId, 50);
  assert.equal(splitAfter.ok, true);
});

test('weekly planner supports >4 activities per day, validates conflicts, and never double-processes', () => {
  let state = createInitialGameState({ initialized: true });
  const aud = runMoneyAudition(state, 'Streets', 'Female');
  state = recruitCandidate(aud.state, aud.state.auditionPool[0].id).state;
  state = formGroup(state, {
    name: 'AURORA',
    gender: 'Female',
    memberIds: [state.idols[0].id],
  }).state;
  const grpId = state.groups[0].id;

  // Assign 5 distinct activities on Monday (proving no 4-activity cap)
  const acts = ['Vocal Practice', 'Dance Practice', 'Radio Appearance', 'Variety Show', 'Brand Photoshoot'] as const;
  for (const act of acts) {
    const res = addPlannedActivity(state, {
      day: 'Monday',
      activityType: act,
      targetType: 'Group',
      targetId: grpId,
    });
    assert.equal(res.ok, true, `Failed adding ${act}: ${res.error}`);
    state = res.state;
  }
  assert.equal(state.weeklyPlan.length, 5);

  // Incompatible Rest on same day must be rejected
  const conflict = addPlannedActivity(state, {
    day: 'Monday',
    activityType: 'Rest & Recovery',
    targetType: 'Group',
    targetId: grpId,
  });
  assert.equal(conflict.ok, false);

  const afterWeek = advanceWeekSimulation(state);
  assert.equal(afterWeek.date.week, 2);
  assert.equal(afterWeek.weeklyPlan.length, 0);
  assert.equal(afterWeek.lastWeeklySummary?.activitiesCompleted, 5);
});

test('concert venue capacity limits ticket sales and sellout unlocks tours', () => {
  let state = createInitialGameState({ initialized: true });
  const aud = runMoneyAudition(state, 'Streets', 'Female');
  state = recruitCandidate(aud.state, aud.state.auditionPool[0].id).state;
  state = formGroup(state, {
    name: 'SOLARIS',
    gender: 'Female',
    memberIds: [state.idols[0].id],
  }).state;

  // Boost popularity/fanbase so Small venue (800 cap) sells out
  state = {
    ...state,
    groups: state.groups.map((g) => ({ ...g, popularity: 55, fanbase: 6000 })),
  };

  const cPlan = planConcert(state, {
    title: 'Solaris Debut Live',
    scope: 'Domestic',
    targetType: 'Group',
    targetId: state.groups[0].id,
    venueSize: 'Small',
    ticketPrice: 65_000,
    marketingBudget: 1_000_000,
  });
  assert.equal(cPlan.ok, true);
  state = advanceWeekSimulation(cPlan.state);

  const perf = performPreparedConcert(state, cPlan.concert!.id);
  assert.equal(perf.ok, true);
  assert.ok(perf.concert!.ticketsSold <= perf.concert!.venueCapacity);
  assert.equal(perf.concert!.soldOut, true);

  // Tour now unlocked
  const tour = startTour(perf.state, {
    title: 'Korea Live Tour',
    targetType: 'Group',
    targetId: perf.state.groups[0].id,
    scope: 'Domestic',
    venueSize: 'Small',
    totalDates: 4,
    ticketPrice: 70_000,
  });
  assert.equal(tour.ok, true);
});

test('save export/import validates corrupt payloads without overwriting', () => {
  const state = createInitialGameState({ companyName: 'TestEnt', ceoName: 'Kim', initialized: true });
  const exported = exportSaveJson(state);
  const imported = importSaveJson(exported);
  assert.equal(imported.ok, true);
  assert.equal(imported.state?.company.name, 'TestEnt');

  const bad = importSaveJson('{"bad": true}');
  assert.equal(bad.ok, false);
});

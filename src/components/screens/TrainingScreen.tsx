import React, { useEffect, useState } from 'react';
import { STAT_LABELS, TRAINING_FACILITIES } from '../../config/gameConfig';
import { calculateTrainingOutcome, isFacilityUnlocked } from '../../game/logic/training';
import { TrainingTierCategory } from '../../game/models/types';
import { useGame } from '../../game/state/GameContext';
import { formatWon } from '../../game/utils/format';

export const TrainingScreen: React.FC = () => {
  const { state, actions } = useGame();
  const [categoryFilter, setCategoryFilter] = useState<'All' | TrainingTierCategory>('All');
  const [targetMode, setTargetMode] = useState<'Idol' | 'Group'>('Idol');
  const [selectedIdolId, setSelectedIdolId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  useEffect(() => {
    if (!selectedIdolId && state.idols.length > 0) {
      setSelectedIdolId(state.idols[0].id);
    }
    if (!selectedGroupId && state.groups.length > 0) {
      setSelectedGroupId(state.groups[0].id);
    }
  }, [state.idols.length, state.groups.length, selectedIdolId, selectedGroupId]);

  const selectedIdol = state.idols.find((i) => i.id === selectedIdolId) ?? null;
  const visibleFacilities = TRAINING_FACILITIES.filter(
    (f) => categoryFilter === 'All' || f.category === categoryFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="pixel-title text-[#fffdf7]">Training Studios</h1>
          <p className="pixel-micro text-purple-200 mt-1">
            Purchase studios to unlock structured drills. Upgrade levels for stronger stat growth.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-[#240e44] p-1.5 rounded-lg border border-purple-300/25">
          {(['All', 'Main', 'Main 2', 'Main 3'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded pixel-micro cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-[#180832] font-bold'
                  : 'text-purple-100 hover:bg-[#31145c]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Trainee / Group Target Selector */}
      <div className="rounded-xl bg-[#240e44] border border-purple-300/25 p-4 flex flex-wrap items-center gap-4">
        <div className="flex gap-1.5 bg-[#15072c] p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setTargetMode('Idol')}
            className={`px-3 py-1.5 rounded pixel-micro cursor-pointer ${
              targetMode === 'Idol' ? 'bg-teal-500 text-[#180832] font-bold' : 'text-purple-200'
            }`}
          >
            Individual Idol
          </button>
          <button
            type="button"
            onClick={() => setTargetMode('Group')}
            className={`px-3 py-1.5 rounded pixel-micro cursor-pointer ${
              targetMode === 'Group' ? 'bg-teal-500 text-[#180832] font-bold' : 'text-purple-200'
            }`}
          >
            Entire Group
          </button>
        </div>

        {targetMode === 'Idol' ? (
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <select
              aria-label="Select idol to train"
              value={selectedIdolId}
              onChange={(e) => setSelectedIdolId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#1e0b4b] border border-purple-300/30 text-white pixel-micro min-w-[220px]"
            >
              {state.idols.length === 0 ? (
                <option value="">No idols recruited yet</option>
              ) : (
                state.idols.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.stageName} (Tier {i.tier} · Sta {i.currentStamina}% · Fat {i.fatigue}%)
                  </option>
                ))
              )}
            </select>

            {selectedIdol && (
              <div className="flex items-center gap-4 pixel-micro text-purple-200">
                <span>
                  Rating: <strong className="text-white">{selectedIdol.overallRating}</strong> ({selectedIdol.tier})
                </span>
                <span>
                  Sta: <strong className="text-emerald-300">{selectedIdol.currentStamina}%</strong>
                </span>
                <span>
                  Fat: <strong className="text-amber-300">{selectedIdol.fatigue}%</strong>
                </span>
                <button
                  type="button"
                  onClick={() => actions.restIdol(selectedIdol.id)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white pixel-micro cursor-pointer"
                >
                  Rest Now
                </button>
              </div>
            )}
          </div>
        ) : (
          <select
            aria-label="Select group to train"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#1e0b4b] border border-purple-300/30 text-white pixel-micro min-w-[220px]"
          >
            {state.groups.length === 0 ? (
              <option value="">No groups formed yet</option>
            ) : (
              state.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.memberIds.length} members)
                </option>
              ))
            )}
          </select>
        )}
      </div>

      {/* PDF Page 13: Card or Block Layout (Vocal Studio, Rap Studio, Dance Studio, etc.) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {visibleFacilities.map((fac) => {
          const level = state.facilities[fac.id]?.level ?? 0;
          const unlock = isFacilityUnlocked(state, fac);
          const nextCost =
            level === 0
              ? fac.purchaseCost
              : level < 5
                ? fac.upgradeCosts[level - 1]
                : null;
          const outcome =
            selectedIdol && level > 0
              ? calculateTrainingOutcome(state, selectedIdol, fac)
              : null;

          return (
            <article
              key={fac.id}
              data-testid={`facility-card-${fac.id}`}
              className={`rounded-xl border p-5 flex flex-col justify-between gap-4 ${
                unlock.unlocked
                  ? 'bg-[#240e44] border-purple-300/25'
                  : 'bg-[#1a0936] border-purple-300/15 opacity-85'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[8px] text-teal-300">{fac.category}</div>
                    <h2 className="pixel-subtitle text-[#fffdf7] mt-0.5">{fac.name}</h2>
                  </div>
                  <span className="pixel-micro text-amber-300 shrink-0">
                    {level === 0 ? 'Unowned' : `Lv.${level}/5`}
                  </span>
                </div>

                <p className="pixel-micro text-purple-200 leading-relaxed">
                  {fac.description}
                </p>

                <div className="rounded-lg bg-[#15072c] p-3 border border-purple-300/15 space-y-1">
                  <div className="pixel-micro text-purple-200">
                    Trains: <span className="text-[#fffdf7]">{STAT_LABELS[fac.stat]}</span>
                  </div>
                  {selectedIdol && (
                    <div className="pixel-micro text-purple-300">
                      Current {STAT_LABELS[fac.stat]}:{' '}
                      <span className="text-amber-300">{selectedIdol.stats[fac.stat]}/100</span>
                    </div>
                  )}
                  {outcome && (
                    <div className="text-[8px] text-teal-300 pt-1">
                      Est. +{outcome.gain} {STAT_LABELS[fac.stat]} ({outcome.efficiencyLabel} eff) ·{' '}
                      {formatWon(outcome.cost)} · Sta -{outcome.staminaCost}
                    </div>
                  )}
                </div>

                {!unlock.unlocked && (
                  <div className="pixel-micro text-amber-300">{unlock.reason}</div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-purple-300/20">
                {level > 0 && (
                  <button
                    type="button"
                    disabled={
                      targetMode === 'Idol' ? !selectedIdolId : !selectedGroupId
                    }
                    onClick={() => {
                      if (targetMode === 'Idol' && selectedIdolId) {
                        actions.trainSingleIdol(selectedIdolId, fac.id);
                      } else if (targetMode === 'Group' && selectedGroupId) {
                        actions.trainGroup(selectedGroupId, fac.id);
                      }
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:bg-[#170833] disabled:text-purple-400 text-[#180832] font-bold pixel-micro cursor-pointer"
                  >
                    Train {targetMode}
                  </button>
                )}

                {nextCost !== null && (
                  <button
                    type="button"
                    disabled={!unlock.unlocked}
                    onClick={() => actions.buyOrUpgradeFacility(fac.id)}
                    className={`py-2 px-3 rounded-lg pixel-micro font-bold ${
                      unlock.unlocked
                        ? level === 0
                          ? 'flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-[#180832] cursor-pointer'
                          : 'bg-[#31145c] hover:bg-[#411d75] border border-amber-300/40 text-amber-200 cursor-pointer'
                        : 'flex-1 bg-[#170833] text-purple-400 cursor-not-allowed'
                    }`}
                  >
                    {level === 0
                      ? `Buy Studio (${formatWon(nextCost)})`
                      : `Upgrade (${formatWon(nextCost)})`}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

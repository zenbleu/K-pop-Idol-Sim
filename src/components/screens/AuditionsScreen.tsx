import React, { useState } from 'react';
import {
  MONEY_AUDITION_CONFIG,
  RUBY_AUDITION_CONFIG,
} from '../../config/gameConfig';
import {
  AuditionMoneyType,
  Gender,
  RubyAuditionDuration,
} from '../../game/models/types';
import { useGame } from '../../game/state/GameContext';
import { formatWon } from '../../game/utils/format';
import { IdolPortrait } from '../common/IdolPortrait';

export const AuditionsScreen: React.FC = () => {
  const { state, actions } = useGame();

  const [moneyGenderFilter, setMoneyGenderFilter] = useState<Gender | 'Mixed'>('Mixed');
  const [rubyGender, setRubyGender] = useState<Gender>('Female');
  const [rubyDuration, setRubyDuration] = useState<RubyAuditionDuration>('1 week');
  const [rubySlots, setRubySlots] = useState(state.company.auditionCapacity);

  const clampedSlots = Math.min(rubySlots, state.company.auditionCapacity);
  const rubyCost = RUBY_AUDITION_CONFIG[rubyDuration].rubyCostPerSlot * clampedSlots;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="pixel-title text-[#fffdf7]">Auditions & Scouting</h1>
          <p className="pixel-micro text-purple-200 mt-1">
            Audition Capacity: <span className="text-teal-300">{state.company.auditionCapacity}/5</span> candidates · Inspect stats before recruiting.
          </p>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel 1 (Left): Audition Types & Controls */}
        <div className="lg:col-span-4 space-y-5">
          {/* Money Auditions */}
          <div className="rounded-xl bg-[#240e44] border border-purple-300/25 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="pixel-subtitle text-[#fffdf7]">Money Auditions</h2>
              <select
                aria-label="Money audition gender filter"
                value={moneyGenderFilter}
                onChange={(e) => setMoneyGenderFilter(e.target.value as Gender | 'Mixed')}
                className="px-2 py-1 rounded bg-[#15072c] border border-purple-300/30 text-[#fffdf7] pixel-micro"
              >
                <option value="Mixed">Mixed</option>
                <option value="Female">Female Only</option>
                <option value="Male">Male Only</option>
              </select>
            </div>

            <div className="space-y-2.5">
              {(Object.keys(MONEY_AUDITION_CONFIG) as AuditionMoneyType[]).map((type) => {
                const cfg = MONEY_AUDITION_CONFIG[type];
                const unlocked =
                  !cfg.unlockUpgradeId ||
                  state.company.purchasedUpgradeIds.includes(cfg.unlockUpgradeId);
                return (
                  <div
                    key={type}
                    className="rounded-lg bg-[#15072c] p-3 border border-purple-300/20 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="pixel-micro text-[#fffdf7]">{cfg.label}</span>
                      <span className="pixel-micro text-amber-300">{formatWon(cfg.cost)}</span>
                    </div>
                    <p className="text-[8px] text-purple-200 leading-relaxed">
                      {cfg.description}
                    </p>
                    <button
                      type="button"
                      disabled={!unlocked}
                      onClick={() => actions.runMoneyAudition(type, moneyGenderFilter)}
                      className={`w-full py-2 rounded-lg pixel-micro font-bold ${
                        unlocked
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-[#180832] cursor-pointer'
                          : 'bg-[#240e44] text-purple-400 cursor-not-allowed'
                      }`}
                    >
                      {unlocked ? `Hold ${type} Audition` : 'Locked (Agency HQ Upgrade)'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ruby Auditions */}
          <div className="rounded-xl bg-[#240e44] border border-pink-400/35 p-5 space-y-3.5">
            <h2 className="pixel-subtitle text-pink-300">Ruby Auditions</h2>
            <p className="text-[8px] text-purple-200 leading-relaxed">
              Targeted scouting up to A-tier. Higher durations improve candidate distribution without guaranteeing tier.
            </p>

            <div>
              <span className="block pixel-micro text-purple-200 mb-1.5">Gender</span>
              <div className="grid grid-cols-2 gap-2">
                {(['Female', 'Male'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setRubyGender(g)}
                    className={`py-2 rounded-lg border pixel-micro cursor-pointer ${
                      rubyGender === g
                        ? 'bg-pink-600 border-pink-300 text-white'
                        : 'bg-[#15072c] border-purple-300/20 text-purple-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="ruby-dur" className="block pixel-micro text-purple-200 mb-1.5">
                Duration & Intended Range
              </label>
              <select
                id="ruby-dur"
                value={rubyDuration}
                onChange={(e) => setRubyDuration(e.target.value as RubyAuditionDuration)}
                className="w-full px-3 py-2 rounded-lg bg-[#15072c] border border-purple-300/30 text-[#fffdf7] pixel-micro"
              >
                {(Object.keys(RUBY_AUDITION_CONFIG) as RubyAuditionDuration[]).map((d) => (
                  <option key={d} value={d}>
                    {d} ({RUBY_AUDITION_CONFIG[d].intendedTiers}) · {RUBY_AUDITION_CONFIG[d].rubyCostPerSlot} Rubies/slot
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ruby-slots" className="block pixel-micro text-purple-200 mb-1.5">
                Candidate Slots: {clampedSlots}/{state.company.auditionCapacity}
              </label>
              <input
                id="ruby-slots"
                type="range"
                min={1}
                max={state.company.auditionCapacity}
                value={clampedSlots}
                onChange={(e) => setRubySlots(Number(e.target.value))}
                className="w-full accent-pink-400"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                actions.runRubyAudition({
                  gender: rubyGender,
                  duration: rubyDuration,
                  slots: clampedSlots,
                })
              }
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold pixel-micro cursor-pointer"
            >
              Scout ({rubyCost} Rubies)
            </button>
          </div>
        </div>

        {/* Panel 2 & 3 (Right): Candidate Cards */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="pixel-subtitle text-[#fffdf7]">
              Audition Candidates ({state.auditionPool.length})
            </h2>
            {state.lastAuditionInfo && (
              <span className="pixel-micro text-teal-300">{state.lastAuditionInfo}</span>
            )}
          </div>

          {state.auditionPool.length === 0 ? (
            <div className="rounded-xl bg-[#240e44] border border-purple-300/25 p-8 text-center space-y-2">
              <div className="pixel-subtitle text-[#fffdf7]">No Active Candidates</div>
              <p className="pixel-micro text-purple-200">
                Select an audition type on the left to scout up to {state.company.auditionCapacity} candidates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[760px] overflow-y-auto pr-1">
              {state.auditionPool.map((cand, idx) => (
                <article
                  key={cand.id}
                  data-testid={`audition-candidate-${idx}`}
                  className="rounded-xl bg-[#240e44] border border-purple-300/25 p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-4">
                    <div className="flex items-start gap-3.5">
                      <IdolPortrait
                        gender={cand.gender}
                        filename={cand.portraitFilename}
                        alt={cand.name}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="pixel-subtitle text-[#fffdf7] truncate">
                          {cand.name}
                        </div>
                        <div className="pixel-micro text-amber-300 mt-1">
                          Tier {cand.tier} ({cand.overallRating}) · {cand.specialty}
                        </div>
                        <div className="pixel-micro text-purple-200 mt-1">
                          {cand.gender} · Age {cand.age} · {cand.nationality}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-[#1e0b4b] p-3 border border-purple-300/15">
                      <div className="pixel-micro text-purple-200">
                        Pot: <span className="text-white">{cand.potential}</span>
                      </div>
                      <div className="pixel-micro text-purple-200">
                        Vis: <span className="text-white">{cand.visual}</span>
                      </div>
                      <div className="pixel-micro text-purple-200 truncate">
                        {cand.personality}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pixel-micro text-purple-200">
                      <div className="flex justify-between">
                        <span>Vocal</span>
                        <span className="text-white">{cand.stats.vocal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dance</span>
                        <span className="text-white">{cand.stats.dance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rap</span>
                        <span className="text-white">{cand.stats.rap}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stamina</span>
                        <span className="text-white">{cand.stats.stamina}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Musical</span>
                        <span className="text-white">{cand.stats.musical}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Entertain</span>
                        <span className="text-white">{cand.stats.entertainment}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-purple-300/20">
                    <button
                      type="button"
                      onClick={() => actions.rejectCandidate(cand.id)}
                      className="px-3.5 py-2 rounded-lg bg-[#31145c] hover:bg-[#411d75] border border-purple-300/25 text-purple-100 pixel-micro cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.recruitCandidate(cand.id)}
                      className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-[#180832] font-bold pixel-micro cursor-pointer"
                    >
                      Recruit ({formatWon(cand.recruitmentCost)})
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

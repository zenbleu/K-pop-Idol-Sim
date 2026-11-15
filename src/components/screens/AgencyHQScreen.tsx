import React, { useState } from 'react';
import { HQ_UPGRADES, UpgradeBranch } from '../../config/gameConfig';
import { compareReputations, compareTiers } from '../../game/logic/stats';
import { useGame } from '../../game/state/GameContext';
import { formatWon } from '../../game/utils/format';

const BRANCHES: UpgradeBranch[] = [
  'Headquarters',
  'Training',
  'Audition',
  'Production',
  'Marketing',
  'Management',
];

export const AgencyHQScreen: React.FC = () => {
  const { state, actions } = useGame();
  const [branchFilter, setBranchFilter] = useState<'All' | UpgradeBranch>('All');

  const visibleUpgrades = HQ_UPGRADES.filter(
    (u) => branchFilter === 'All' || u.branch === branchFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="pixel-title text-[#fffdf7]">Agency HQ Upgrades</h1>
          <p className="pixel-micro text-purple-200 mt-1">
            Expand group capacity, audition scouting, training licenses, and production tech.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-[#240e44] p-1.5 rounded-lg border border-purple-300/25">
          {(['All', ...BRANCHES] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBranchFilter(b)}
              className={`px-2.5 py-1.5 rounded pixel-micro cursor-pointer ${
                branchFilter === b
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-[#180832] font-bold'
                  : 'text-purple-100 hover:bg-[#31145c]'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* PDF Page 14: Card or Block Layout by Upgrade Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {visibleUpgrades.map((upg) => {
          const purchased = state.company.purchasedUpgradeIds.includes(upg.id);
          const prereqsMet = upg.prerequisites.every((p) =>
            state.company.purchasedUpgradeIds.includes(p)
          );
          const tierMet = compareTiers(state.company.tier, upg.requiredTier) >= 0;
          const repMet =
            compareReputations(state.company.reputation, upg.requiredReputation) >= 0;
          const available = !purchased && prereqsMet && tierMet && repMet;

          const costParts: string[] = [];
          if (upg.costMoney > 0) costParts.push(formatWon(upg.costMoney));
          if (upg.costRubies > 0) costParts.push(`${upg.costRubies} Rubies`);

          return (
            <article
              key={upg.id}
              data-testid={`hq-upgrade-${upg.id}`}
              className={`rounded-xl border p-5 flex flex-col justify-between gap-4 ${
                purchased
                  ? 'bg-[#240e44] border-teal-400/50'
                  : available
                    ? 'bg-[#240e44] border-purple-300/30'
                    : 'bg-[#1a0936] border-purple-300/15 opacity-85'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[8px] text-amber-300">{upg.branch}</div>
                    <h2 className="pixel-subtitle text-[#fffdf7] mt-0.5">{upg.name}</h2>
                  </div>
                  <span
                    className={`pixel-micro shrink-0 ${
                      purchased
                        ? 'text-teal-300'
                        : available
                          ? 'text-orange-300'
                          : 'text-amber-300'
                    }`}
                  >
                    {purchased ? 'Owned' : available ? 'Available' : 'Locked'}
                  </span>
                </div>

                <p className="pixel-micro text-purple-200 leading-relaxed">
                  {upg.description}
                </p>

                <div className="rounded-lg bg-[#15072c] p-3 border border-purple-300/15 space-y-1">
                  <div className="pixel-micro text-teal-300">{upg.effectText}</div>
                  {!purchased && (
                    <div className="text-[8px] text-purple-300 pt-1">
                      Requires: Tier {upg.requiredTier} · {upg.requiredReputation} Rep
                      {upg.prerequisites.length > 0 &&
                        ` · Prereq: ${upg.prerequisites
                          .map((pid) => HQ_UPGRADES.find((u) => u.id === pid)?.name ?? pid)
                          .join(', ')}`}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-purple-300/20">
                {purchased ? (
                  <div className="w-full py-2 text-center rounded-lg bg-teal-500/15 border border-teal-400/40 text-teal-200 pixel-micro">
                    Installed
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!available}
                    onClick={() => actions.buyHQUpgrade(upg.id)}
                    className={`w-full py-2.5 px-4 rounded-lg pixel-micro font-bold ${
                      available
                        ? 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-[#180832] cursor-pointer'
                        : 'bg-[#170833] text-purple-400 cursor-not-allowed'
                    }`}
                  >
                    {available ? `Purchase (${costParts.join(' + ')})` : 'Requirements Not Met'}
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

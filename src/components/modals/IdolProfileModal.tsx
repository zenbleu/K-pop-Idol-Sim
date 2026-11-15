import React, { useEffect, useState } from 'react';
import {
  ALL_STAT_KEYS,
  PERSONALITY_CONFIG,
  SHOP_ITEMS,
  STAT_LABELS,
} from '../../config/gameConfig';
import { calculateRetentionOfferCost, isIdolInRejoinCooldown } from '../../game/logic/groups';
import { useGame } from '../../game/state/GameContext';
import { formatWon } from '../../game/utils/format';
import { IdolPortrait } from '../common/IdolPortrait';
import { X } from 'lucide-react';

export const IdolProfileModal: React.FC = () => {
  const {
    state,
    selectedIdolId,
    closeIdolProfile,
    actions,
    requestConfirm,
  } = useGame();

  const idol = state.idols.find((i) => i.id === selectedIdolId) ?? null;
  const [editingStageName, setEditingStageName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    if (idol) {
      setEditingStageName(idol.stageName);
      setIsRenaming(false);
    }
  }, [idol?.id]);

  useEffect(() => {
    if (!idol) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeIdolProfile();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idol, closeIdolProfile]);

  if (!idol) return null;

  const group = idol.groupId
    ? state.groups.find((g) => g.id === idol.groupId) ?? null
    : null;
  const inCooldown = isIdolInRejoinCooldown(idol, state.date.totalWeeks);
  const cooldownWeeksLeft =
    inCooldown && idol.rejoinCooldownUntilWeek
      ? idol.rejoinCooldownUntilWeek - state.date.totalWeeks
      : 0;
  const weeksToContractEnd = Math.max(
    0,
    idol.contract.expirationTotalWeeks - state.date.totalWeeks
  );
  const retentionCost = calculateRetentionOfferCost(state, idol);
  const ownedClothes = SHOP_ITEMS.filter(
    (item) => item.category === 'Clothes' && state.ownedItemIds.includes(item.id)
  );
  const ownedAccessories = SHOP_ITEMS.filter(
    (item) => item.category === 'Accessories' && state.ownedItemIds.includes(item.id)
  );
  const ownedFoods = SHOP_ITEMS.filter(
    (item) => item.category === 'Food' && (state.itemQuantities[item.id] ?? 0) > 0
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="idol-profile-modal-title"
      data-testid="idol-profile-modal"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4"
      onClick={closeIdolProfile}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-300/40 bg-[#240e44] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-purple-300/20 bg-[#31145c]">
          <div className="min-w-0">
            <h2
              id="idol-profile-modal-title"
              className="pixel-title text-[#fffdf7] truncate"
            >
              Idol Profile — {idol.stageName}
            </h2>
            <p className="pixel-micro text-purple-200 mt-1">
              {idol.name} · {idol.gender} · Age {idol.age} · {idol.nationality}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close idol profile"
            onClick={closeIdolProfile}
            className="p-2 rounded-lg bg-[#15072c] hover:bg-orange-500 hover:text-[#180832] text-[#fffdf7] cursor-pointer shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Featured Image + Summary Split */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-5 items-start bg-[#15072c] rounded-xl p-4 border border-purple-300/20">
            <div className="flex flex-col items-center gap-3 shrink-0">
              <IdolPortrait
                gender={idol.gender}
                filename={idol.portraitFilename}
                alt={`${idol.stageName} portrait`}
                size="lg"
              />
              <div className="text-center">
                <div className="pixel-title text-amber-300">
                  Tier {idol.tier} ({idol.overallRating})
                </div>
                <div className="pixel-micro text-teal-200 mt-1">
                  {idol.specialty}
                </div>
              </div>
            </div>

            <div className="flex-1 w-full space-y-4">
              {/* Editable Stage Name */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {isRenaming ? (
                  <form
                    className="flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      actions.renameStageName(idol.id, editingStageName);
                      setIsRenaming(false);
                    }}
                  >
                    <input
                      type="text"
                      value={editingStageName}
                      onChange={(e) => setEditingStageName(e.target.value)}
                      aria-label="Stage Name"
                      className="px-3 py-1.5 rounded-lg bg-[#270e55] border border-purple-300/40 text-white pixel-micro"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white pixel-micro cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRenaming(false)}
                      className="px-3 py-1.5 rounded-lg bg-purple-900 text-purple-200 pixel-micro cursor-pointer"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="pixel-subtitle text-white">
                      Stage Name: {idol.stageName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsRenaming(true)}
                      className="px-2.5 py-1 rounded bg-purple-800/80 hover:bg-purple-700 text-purple-100 pixel-micro cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                )}

                <div className="pixel-micro text-purple-200">
                  Status:{' '}
                  <span className="text-white">
                    {group
                      ? `Group (${group.name})`
                      : idol.isSoloArtist
                        ? 'Solo Artist'
                        : 'Trainee'}
                  </span>
                </div>
              </div>

              {/* Core Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-[#2e1065] p-2.5 border border-purple-300/15">
                  <div className="pixel-micro text-purple-300">Potential</div>
                  <div className="pixel-subtitle text-white mt-1">{idol.potential}/100</div>
                </div>
                <div className="rounded-lg bg-[#2e1065] p-2.5 border border-purple-300/15">
                  <div className="pixel-micro text-purple-300">Visual</div>
                  <div className="pixel-subtitle text-white mt-1">{idol.visual}/100</div>
                </div>
                <div className="rounded-lg bg-[#2e1065] p-2.5 border border-purple-300/15">
                  <div className="pixel-micro text-purple-300">Popularity</div>
                  <div className="pixel-subtitle text-white mt-1">{idol.popularity}/100</div>
                </div>
                <div className="rounded-lg bg-[#2e1065] p-2.5 border border-purple-300/15">
                  <div className="pixel-micro text-purple-300">Fanbase</div>
                  <div className="pixel-subtitle text-white mt-1">
                    {idol.fanbase.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Wellbeing & Loyalty Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex justify-between pixel-micro text-purple-200 mb-1">
                    <span>Stamina</span>
                    <span>{idol.currentStamina}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-purple-950 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400"
                      style={{ width: `${idol.currentStamina}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between pixel-micro text-purple-200 mb-1">
                    <span>Fatigue</span>
                    <span className={idol.fatigue >= 70 ? 'text-amber-300' : ''}>
                      {idol.fatigue}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-purple-950 overflow-hidden">
                    <div
                      className={`h-full ${
                        idol.fatigue >= 75 ? 'bg-rose-500' : 'bg-amber-400'
                      }`}
                      style={{ width: `${idol.fatigue}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between pixel-micro text-purple-200 mb-1">
                    <span>Loyalty</span>
                    <span className={idol.loyalty < 35 ? 'text-rose-300' : ''}>
                      {idol.loyalty}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-purple-950 overflow-hidden">
                    <div
                      className={`h-full ${
                        idol.loyalty < 35 ? 'bg-rose-500' : 'bg-fuchsia-400'
                      }`}
                      style={{ width: `${idol.loyalty}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pixel-micro text-purple-200">
                Personality: <span className="text-white">{idol.personality}</span> —{' '}
                {PERSONALITY_CONFIG[idol.personality].description}
              </div>

              {inCooldown && (
                <div className="rounded-lg border border-amber-400/50 bg-amber-950/50 px-3 py-2 pixel-micro text-amber-200">
                  6-Month Group Rejoin Cooldown active: {cooldownWeeksLeft} week(s) remaining.
                </div>
              )}
              {idol.departureWarning && (
                <div className="rounded-lg border border-rose-400/60 bg-rose-950/60 px-3 py-2 pixel-micro text-rose-200 flex flex-wrap items-center justify-between gap-2">
                  <span>Low Loyalty Warning! Offer retention bonus to stabilize.</span>
                  <button
                    type="button"
                    onClick={() => actions.offerRetention(idol.id)}
                    className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white pixel-micro cursor-pointer"
                  >
                    Retention Offer ({formatWon(retentionCost)})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* All 12 Skill Stats */}
          <div className="bg-[#15072c] rounded-xl p-4 border border-purple-300/20">
            <h3 className="pixel-subtitle text-[#fffdf7] mb-2.5">Skill Stats (0–100)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {ALL_STAT_KEYS.map((key) => (
                <div
                  key={key}
                  className="rounded-lg bg-[#240e44] p-2 border border-purple-300/15"
                >
                  <div className="flex justify-between pixel-micro text-purple-200 mb-1">
                    <span>{STAT_LABELS[key]}</span>
                    <span className="text-amber-300">{idol.stats[key]}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#110524] overflow-hidden">
                    <div
                      className="h-full bg-teal-400"
                      style={{ width: `${idol.stats[key]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contract & Wardrobe Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#15072c] rounded-xl p-4 border border-purple-300/20 space-y-2.5">
              <h3 className="pixel-subtitle text-[#fffdf7]">Contract & Career</h3>
              <div className="space-y-1.5 pixel-micro text-purple-200">
                <div>
                  Status:{' '}
                  <span
                    className={
                      idol.contract.status === 'Expired'
                        ? 'text-rose-300'
                        : idol.contract.status === 'Expiring Soon'
                          ? 'text-amber-300'
                          : 'text-teal-300'
                    }
                  >
                    {idol.contract.status}
                  </span>
                </div>
                <div>Remaining: {weeksToContractEnd} week(s)</div>
                <div>Weekly Salary: {formatWon(idol.contract.weeklySalary)}</div>
                <div>
                  Group Roles:{' '}
                  {idol.groupRoles.length > 0 ? idol.groupRoles.join(', ') : 'None'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => actions.renewContract(idol.id, 24)}
                  className="px-3 py-2 rounded-lg bg-[#31145c] hover:bg-[#411d75] border border-purple-300/30 text-[#fffdf7] pixel-micro cursor-pointer"
                >
                  Renew +24m ({formatWon(idol.contract.weeklySalary * 4)})
                </button>
                <button
                  type="button"
                  onClick={() => actions.restIdol(idol.id)}
                  className="px-3 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-[#180832] font-bold pixel-micro cursor-pointer"
                >
                  Quick Rest
                </button>
                {!idol.groupId && !idol.isSoloArtist && (
                  <button
                    type="button"
                    onClick={() => actions.debutSolo(idol.id)}
                    className="px-3 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold pixel-micro cursor-pointer"
                  >
                    Debut Solo
                  </button>
                )}
              </div>
            </div>

            <div className="bg-[#1e0b4b] rounded-xl p-4 border border-purple-300/20 space-y-2.5">
              <h3 className="pixel-subtitle text-white">Wardrobe & Wellbeing Items</h3>
              <div className="space-y-2">
                <div className="pixel-micro text-purple-200">Stage Outfit:</div>
                {ownedClothes.length === 0 ? (
                  <p className="pixel-micro text-purple-300/80">
                    No outfits owned yet. Visit Shop &gt; Clothes.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ownedClothes.map((item) => {
                      const equipped = idol.equippedClothingIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => actions.equipShopItem(idol.id, item.id)}
                          className={`px-2.5 py-1.5 rounded-lg pixel-micro cursor-pointer border ${
                            equipped
                              ? 'bg-fuchsia-600 border-fuchsia-300 text-white'
                              : 'bg-purple-900/60 border-purple-300/25 text-purple-200 hover:bg-purple-800'
                          }`}
                        >
                          {item.name} {equipped ? '(Equipped)' : ''}
                        </button>
                      );
                    })}
                  </div>
                )}

                {ownedAccessories.length > 0 && (
                  <div className="pt-1">
                    <div className="pixel-micro text-purple-200 mb-1.5">Accessories:</div>
                    <div className="flex flex-wrap gap-2">
                      {ownedAccessories.map((item) => {
                        const equipped = idol.equippedAccessoryIds.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => actions.equipShopItem(idol.id, item.id)}
                            className={`px-2.5 py-1.5 rounded-lg pixel-micro cursor-pointer border ${
                              equipped
                                ? 'bg-fuchsia-600 border-fuchsia-300 text-white'
                                : 'bg-purple-900/60 border-purple-300/25 text-purple-200 hover:bg-purple-800'
                            }`}
                          >
                            {item.name} {equipped ? '(Equipped)' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {ownedFoods.length > 0 && (
                  <div className="pt-1">
                    <div className="pixel-micro text-purple-200 mb-1.5">Give Food Item:</div>
                    <div className="flex flex-wrap gap-2">
                      {ownedFoods.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => actions.useFoodItem(idol.id, item.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 pixel-micro cursor-pointer"
                        >
                          Use {item.name} ({state.itemQuantities[item.id]})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Training History & Roster Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-purple-300/20">
            <div className="pixel-micro text-purple-200">
              Recent Training:{' '}
              {idol.trainingHistory.length === 0
                ? 'None recorded yet'
                : idol.trainingHistory
                    .slice(0, 3)
                    .map((h) => `W${h.week} +${h.gain} ${STAT_LABELS[h.stat]}`)
                    .join(' · ')}
            </div>

            <div className="flex flex-wrap gap-2">
              {group && (
                <button
                  type="button"
                  onClick={() =>
                    requestConfirm({
                      title: `Remove ${idol.stageName} from ${group.name}?`,
                      message:
                        'Idol will return to trainee status and receive a 6-month cooldown before joining any group. Group loyalty and popularity will decrease.',
                      confirmLabel: 'Remove from Group',
                      destructive: true,
                      onConfirm: () => actions.removeFromGroup(idol.id),
                    })
                  }
                  className="px-3 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white pixel-micro cursor-pointer"
                >
                  Remove from Group
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  requestConfirm({
                    title: `Permanently Dismiss ${idol.stageName}?`,
                    message:
                      'WARNING: This permanently terminates their contract and removes them from the company roster (and any group). They will NOT return to trainees, and company reputation/group loyalty will suffer.',
                    confirmLabel: 'Dismiss Permanently',
                    destructive: true,
                    onConfirm: () => actions.removeFromCompany(idol.id),
                  })
                }
                className="px-3 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white pixel-micro cursor-pointer"
              >
                Dismiss from Company
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

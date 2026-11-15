import React, { useEffect, useState } from 'react';
import { SHOP_ITEMS } from '../../config/gameConfig';
import { ShopCategory } from '../../game/models/types';
import { useGame } from '../../game/state/GameContext';
import { getLocalAssetUrl } from '../../game/utils/assets';
import { formatWon } from '../../game/utils/format';

const FALLBACK_SHOP_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="12" fill="#170833"/><rect x="10" y="10" width="76" height="76" rx="8" fill="none" stroke="#fbbf24" stroke-width="2" stroke-dasharray="4 4"/><text x="48" y="53" text-anchor="middle" fill="#fb923c" font-family="monospace" font-size="11">ITEM</text></svg>`
  );

export const ShopScreen: React.FC = () => {
  const { state, actions } = useGame();
  const [category, setCategory] = useState<ShopCategory>('Clothes');
  const [targetIdolId, setTargetIdolId] = useState('');

  useEffect(() => {
    if (!targetIdolId && state.idols.length > 0) {
      setTargetIdolId(state.idols[0].id);
    }
  }, [state.idols, targetIdolId]);

  const items = SHOP_ITEMS.filter((i) => i.category === category);
  const targetIdol = state.idols.find((i) => i.id === targetIdolId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="pixel-title text-[#fffdf7]">Agency Shop & Wardrobe</h1>
          <p className="pixel-micro text-purple-200 mt-1">
            Outfits & Accessories boost album quality and sales. Food restores stamina, lowers fatigue, and lifts loyalty.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-[#240e44] p-1.5 rounded-lg border border-purple-300/25">
          {(['Clothes', 'Food', 'Accessories'] as ShopCategory[]).map((cat) => {
            const count = SHOP_ITEMS.filter((i) => i.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-2 rounded pixel-micro cursor-pointer transition-colors ${
                  category === cat
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-[#180832] font-bold'
                    : 'text-purple-100 hover:bg-[#341663]'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Idol selector for quick equip/use */}
      <div className="rounded-xl bg-[#240e44] border border-purple-300/25 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="shop-idol" className="pixel-micro text-amber-300">
            Active Idol for Equip / Use:
          </label>
          <select
            id="shop-idol"
            value={targetIdolId}
            onChange={(e) => setTargetIdolId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#170833] border border-purple-300/30 text-[#fffdf7] pixel-micro"
          >
            {state.idols.length === 0 ? (
              <option value="">Recruit an idol first</option>
            ) : (
              state.idols.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.stageName} (Sta {i.currentStamina}% · Fat {i.fatigue}% · Loy {i.loyalty})
                </option>
              ))
            )}
          </select>
        </div>
        {targetIdol && (
          <div className="pixel-micro text-teal-200">
            Selected: <span className="text-[#fffdf7]">{targetIdol.stageName}</span> ·
            Equipped: {targetIdol.equippedClothingIds.length} Outfit /{' '}
            {targetIdol.equippedAccessoryIds.length} Acc
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item) => {
          const isPermanent =
            item.category === 'Clothes' || item.category === 'Accessories';
          const owned = isPermanent && state.ownedItemIds.includes(item.id);
          const qty = state.itemQuantities[item.id] ?? 0;
          const equipped =
            targetIdol &&
            (targetIdol.equippedClothingIds.includes(item.id) ||
              targetIdol.equippedAccessoryIds.includes(item.id));

          return (
            <article
              key={item.id}
              data-testid={`shop-card-${item.id}`}
              className="rounded-xl bg-[#240e44] border border-purple-300/25 p-4 flex flex-col justify-between gap-4 shadow-lg hover:border-amber-300/50 transition-colors"
            >
              <div className="space-y-3">
                {/* Framed Image Preview */}
                <div className="relative aspect-[4/3] w-full rounded-xl bg-[#120626] border border-purple-300/20 p-2 flex items-center justify-center overflow-hidden">
                  <img
                    src={getLocalAssetUrl(item.imagePath)}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    onError={(ev) => {
                      ev.currentTarget.src = FALLBACK_SHOP_SVG;
                    }}
                    className="w-full h-full object-contain"
                  />
                  <span
                    className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[8px] border ${
                      isPermanent
                        ? equipped
                          ? 'bg-teal-500/25 border-teal-400 text-teal-200'
                          : owned
                            ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                            : 'bg-[#170833]/90 border-purple-300/30 text-purple-200'
                        : qty > 0
                          ? 'bg-teal-500/25 border-teal-400 text-teal-200'
                          : 'bg-[#170833]/90 border-purple-300/30 text-purple-200'
                    }`}
                  >
                    {isPermanent
                      ? equipped
                        ? 'Equipped'
                        : owned
                          ? 'Owned'
                          : 'Available'
                      : `Stock: ${qty}`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h2 className="pixel-subtitle text-[#fffdf7]">{item.name}</h2>
                  <p className="pixel-micro text-purple-200 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="rounded-lg bg-[#15072c] p-3 border border-purple-300/15 space-y-1 pixel-micro">
                  {isPermanent ? (
                    <>
                      <div className="text-pink-200">
                        Concept Affinity: <span className="text-amber-300">{item.conceptAffinity}</span>
                      </div>
                      <div className="text-teal-200">
                        Bonus: +{item.qualityBonus} Quality · +{item.salesBoostPct}% Sales
                        {item.statBoost
                          ? ` · +${item.statBoost.amount} ${item.statBoost.stat.toUpperCase()}`
                          : ''}
                      </div>
                    </>
                  ) : (
                    <div className="text-teal-200">
                      Effect: +{item.staminaRestore} Sta · -{item.fatigueReduce} Fat · +
                      {item.loyaltyBonus} Loy
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-purple-300/20">
                {(!isPermanent || !owned) && (
                  <button
                    type="button"
                    onClick={() => actions.buyShopItem(item.id)}
                    className={`flex-1 py-2 px-3 rounded-lg pixel-micro font-bold cursor-pointer transition-colors ${
                      item.costRubies > 0
                        ? 'bg-pink-600 hover:bg-pink-500 text-white'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-[#180832]'
                    }`}
                  >
                    Buy (
                    {item.costMoney > 0
                      ? formatWon(item.costMoney)
                      : `${item.costRubies} Rubies`}
                    )
                  </button>
                )}

                {isPermanent && owned && targetIdol && (
                  <button
                    type="button"
                    onClick={() => actions.equipShopItem(targetIdol.id, item.id)}
                    className={`flex-1 py-2 px-3 rounded-lg pixel-micro cursor-pointer font-bold ${
                      equipped
                        ? 'bg-teal-500 hover:bg-teal-400 text-[#180832]'
                        : 'bg-[#361666] hover:bg-[#492087] text-[#fffdf7] border border-amber-300/40'
                    }`}
                  >
                    {equipped ? 'Equipped (Unequip)' : `Equip on ${targetIdol.stageName}`}
                  </button>
                )}

                {!isPermanent && qty > 0 && targetIdol && (
                  <button
                    type="button"
                    onClick={() => actions.useFoodItem(targetIdol.id, item.id)}
                    className="py-2 px-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-[#180832] font-bold pixel-micro cursor-pointer"
                  >
                    Give to {targetIdol.stageName}
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

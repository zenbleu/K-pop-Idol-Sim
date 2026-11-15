import React, { useEffect, useState } from 'react';
import { SHOP_ITEMS } from '../../config/gameConfig';
import { ShopCategory } from '../../game/models/types';
import { useGame } from '../../game/state/GameContext';
import { formatWon } from '../../game/utils/format';

export const ShopScreen: React.FC = () => {
  const { state, actions } = useGame();
  const [category, setCategory] = useState<ShopCategory>('Clothes');
  const [targetIdolId, setTargetIdolId] = useState('');

  useEffect(() => {
    if (!targetIdolId && state.idols.length > 0) {
      setTargetIdolId(state.idols[0].id);
    }
  }, [state.idols.length, targetIdolId]);

  const items = SHOP_ITEMS.filter((i) => i.category === category);
  const targetIdol = state.idols.find((i) => i.id === targetIdolId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="pixel-title text-white">Agency Shop & Wardrobe</h1>
          <p className="pixel-micro text-purple-200 mt-1">
            Outfits & Accessories boost album quality/sales. Food restores stamina and loyalty.
          </p>
        </div>

        <div className="flex gap-1.5 bg-[#2e1065] p-1.5 rounded-lg border border-purple-300/20">
          {(['Clothes', 'Food', 'Accessories'] as ShopCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-2 rounded pixel-micro cursor-pointer ${
                category === cat
                  ? 'bg-fuchsia-600 text-white'
                  : 'text-purple-200 hover:bg-purple-800/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Idol selector for quick equip/use */}
      <div className="rounded-xl bg-[#2e1065] border border-purple-300/25 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label htmlFor="shop-idol" className="pixel-micro text-purple-200">
            Active Idol for Equip / Use:
          </label>
          <select
            id="shop-idol"
            value={targetIdolId}
            onChange={(e) => setTargetIdolId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#1e0b4b] border border-purple-300/30 text-white pixel-micro"
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {items.map((item) => {
          const isPermanent = item.category === 'Clothes' || item.category === 'Accessories';
          const owned = isPermanent && state.ownedItemIds.includes(item.id);
          const qty = state.itemQuantities[item.id] ?? 0;
          const equipped =
            targetIdol &&
            (targetIdol.equippedClothingIds.includes(item.id) ||
              targetIdol.equippedAccessoryIds.includes(item.id));

          return (
            <article
              key={item.id}
              className="rounded-xl bg-[#2e1065] border border-purple-300/25 p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="pixel-subtitle text-white">{item.name}</h2>
                  <span className="pixel-micro text-fuchsia-300 shrink-0">
                    {isPermanent
                      ? owned
                        ? 'Owned'
                        : 'Locked'
                      : `Stock: ${qty}`}
                  </span>
                </div>

                <p className="pixel-micro text-purple-200 leading-relaxed">
                  {item.description}
                </p>

                <div className="rounded-lg bg-[#1e0b4b] p-3 border border-purple-300/15 space-y-1 pixel-micro text-purple-200">
                  {isPermanent ? (
                    <>
                      <div>Concept Affinity: {item.conceptAffinity}</div>
                      <div>
                        Bonus: +{item.qualityBonus} Quality · +{item.salesBoostPct}% Sales
                      </div>
                    </>
                  ) : (
                    <div>
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
                    className="flex-1 py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white pixel-micro cursor-pointer"
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
                    className={`flex-1 py-2 px-3 rounded-lg pixel-micro cursor-pointer ${
                      equipped
                        ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white'
                        : 'bg-indigo-700 hover:bg-indigo-600 text-white'
                    }`}
                  >
                    {equipped ? 'Equipped (Unequip)' : `Equip on ${targetIdol.stageName}`}
                  </button>
                )}

                {!isPermanent && qty > 0 && targetIdol && (
                  <button
                    type="button"
                    onClick={() => actions.useFoodItem(targetIdol.id, item.id)}
                    className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white pixel-micro cursor-pointer"
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

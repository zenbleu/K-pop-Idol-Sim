import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck,
  GripVertical,
  Lock,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  SCHEDULE_ACTIVITY_DEFINITIONS,
  SCHEDULE_CATEGORIES,
} from '../../config/gameConfig';
import {
  getScheduleLibraryForTarget,
  resolveScheduleActivityDef,
} from '../../game/logic/schedule';
import { hasCompletedProduction } from '../../game/logic/production';
import {
  ScheduleActivityDefinition,
  ScheduleCategory,
  Weekday,
} from '../../game/models/types';
import { useGame } from '../../game/state/GameContext';
import { getLocalAssetUrl } from '../../game/utils/assets';
import { WEEKDAYS } from '../../game/utils/date';
import { formatNumber, formatWon } from '../../game/utils/format';

const FALLBACK_ACTIVITY_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="12" fill="#1b0938"/><rect x="8" y="8" width="80" height="80" rx="8" fill="none" stroke="#f97316" stroke-width="2" stroke-dasharray="4 4"/><text x="48" y="53" text-anchor="middle" fill="#fbbf24" font-family="monospace" font-size="11">STAGE</text></svg>`
  );

function getDayShortLabel(day: Weekday): string {
  return day.slice(0, 3).toUpperCase();
}

export const ScheduleScreen: React.FC = () => {
  const { state, actions } = useGame();

  // Scope dropdown ('Group' | 'Soloist') replaces old 4 dropdowns
  const [scope, setScope] = useState<'Group' | 'Soloist'>('Group');
  // Starts empty so Activity Library stays empty until user explicitly selects a Group or Soloist
  const [selectedTargetKey, setSelectedTargetKey] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<ScheduleCategory>('Training');
  const [selectedDay, setSelectedDay] = useState<Weekday>('Monday');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [draggingActivityId, setDraggingActivityId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<Weekday | null>(null);

  const scopeTargets = useMemo(() => {
    if (scope === 'Group') {
      return state.groups.map((g) => ({
        key: `Group:${g.id}`,
        targetType: 'Group' as const,
        id: g.id,
        name: g.name,
        tier: g.tier,
        popularity: g.popularity,
        fanbase: g.fanbase,
        debuted: hasCompletedProduction(state, 'Group', g.id),
        subtitle: `${g.memberIds.length} member${g.memberIds.length === 1 ? '' : 's'} · ${g.gender}`,
      }));
    }
    return state.soloArtists.map((s) => ({
      key: `Solo:${s.id}`,
      targetType: 'Solo' as const,
      id: s.id,
      name: s.stageName,
      tier: s.tier,
      popularity: s.popularity,
      fanbase: s.fanbase,
      debuted: hasCompletedProduction(state, 'Solo', s.id),
      subtitle: 'Soloist',
    }));
  }, [scope, state]);

  const selectedTarget = useMemo(
    () => scopeTargets.find((t) => t.key === selectedTargetKey) ?? null,
    [scopeTargets, selectedTargetKey]
  );

  // Clear selection if chosen target no longer exists or scope changes
  useEffect(() => {
    if (selectedTargetKey && !scopeTargets.some((t) => t.key === selectedTargetKey)) {
      setSelectedTargetKey('');
      setSelectedActivityId(null);
    }
  }, [scopeTargets, selectedTargetKey]);

  const library = useMemo(() => {
    if (!selectedTarget) return null;
    return getScheduleLibraryForTarget(
      state,
      selectedTarget.targetType,
      selectedTarget.id
    );
  }, [state, selectedTarget]);

  // Enforce pre-debut auto-switch to Training
  useEffect(() => {
    if (library && !library.debuted && activeCategory !== 'Training') {
      setActiveCategory('Training');
      setSelectedActivityId(null);
    }
  }, [library, activeCategory]);

  const categoryEntries = useMemo(() => {
    if (!library) return [];
    return library.entries.filter((e) => e.def.category === activeCategory);
  }, [library, activeCategory]);

  const selectedActivityDef: ScheduleActivityDefinition | null = useMemo(() => {
    if (!selectedActivityId || !library) return null;
    const entry = library.entries.find((e) => e.def.id === selectedActivityId);
    return entry && entry.unlocked ? entry.def : null;
  }, [selectedActivityId, library]);

  const draggingDef: ScheduleActivityDefinition | null = useMemo(() => {
    if (!draggingActivityId) return null;
    return (
      SCHEDULE_ACTIVITY_DEFINITIONS.find((d) => d.id === draggingActivityId) ?? null
    );
  }, [draggingActivityId]);

  const assignActivityToDay = (
    day: Weekday,
    def: ScheduleActivityDefinition
  ) => {
    if (!selectedTarget) return;
    actions.addActivity({
      day,
      activityType: def.legacyActivityType,
      activityId: def.id,
      targetType: selectedTarget.targetType,
      targetId: selectedTarget.id,
    });
  };

  const handleDropOnDay = (e: React.DragEvent, day: Weekday) => {
    e.preventDefault();
    setDragOverDay(null);
    let def: ScheduleActivityDefinition | null = draggingDef;
    if (!def) {
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) {
          const parsed = JSON.parse(raw) as { activityId?: string };
          if (parsed.activityId) {
            def =
              SCHEDULE_ACTIVITY_DEFINITIONS.find(
                (d) => d.id === parsed.activityId
              ) ?? null;
          }
        }
      } catch {
        def = null;
      }
    }
    setDraggingActivityId(null);
    if (!def || !selectedTarget) return;
    setSelectedDay(day);
    assignActivityToDay(day, def);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="pixel-title text-[#fffdf7]">7-Day Weekly Schedule</h1>
          <p className="pixel-micro text-purple-200 mt-1">
            Select a Group or Soloist, pick from unlocked category cards, and drag-and-drop (or click) into Mon–Sun. Unlimited activities per day.
          </p>
        </div>
      </div>

      {/* 1. Target Selector */}
      <section
        aria-label="Select Idol or Group"
        className="rounded-xl bg-[#240e44] border border-purple-300/25 p-4 space-y-4 shadow-lg"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label
              htmlFor="sched-scope"
              className="pixel-micro text-amber-300 uppercase"
            >
              Select Idol / Group
            </label>
            <select
              id="sched-scope"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as 'Group' | 'Soloist');
                setSelectedTargetKey('');
                setSelectedActivityId(null);
              }}
              className="px-3 py-2 rounded-lg bg-[#170833] border border-orange-400/40 text-[#fffdf7] pixel-micro cursor-pointer"
            >
              <option value="Group">Group ({state.groups.length})</option>
              <option value="Soloist">Soloist ({state.soloArtists.length})</option>
            </select>
          </div>

          {selectedTarget && (
            <div className="flex flex-wrap items-center gap-2 pixel-micro">
              <span className="text-purple-200">Active Target:</span>
              <span className="px-2.5 py-1 rounded bg-[#170833] border border-amber-400/40 text-amber-300">
                {selectedTarget.name} · Tier {selectedTarget.tier}
              </span>
              <span
                className={`px-2.5 py-1 rounded border ${
                  selectedTarget.debuted
                    ? 'bg-teal-500/15 border-teal-400/50 text-teal-200'
                    : 'bg-amber-500/15 border-amber-400/50 text-amber-200'
                }`}
              >
                {selectedTarget.debuted ? 'Debuted' : 'Pre-Debut (Training Only)'}
              </span>
            </div>
          )}
        </div>

        {/* Selectable Target Cards */}
        {scopeTargets.length === 0 ? (
          <div className="rounded-lg bg-[#170833] border border-purple-300/20 p-4 pixel-micro text-purple-200">
            No {scope === 'Group' ? 'groups formed' : 'soloists debuted'} yet. Visit{' '}
            <span className="text-amber-300">Company</span> to form a Group or debut a Soloist first.
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {scopeTargets.map((target) => {
              const isSelected = target.key === selectedTargetKey;
              return (
                <button
                  key={target.key}
                  type="button"
                  data-testid={`sched-target-${target.key}`}
                  onClick={() => {
                    setSelectedTargetKey(isSelected ? '' : target.key);
                    setSelectedActivityId(null);
                  }}
                  className={`text-left min-w-[210px] flex-1 sm:flex-none rounded-xl p-3 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#361666] border-orange-400 shadow-[0_0_0_2px_rgba(251,146,60,0.45)]'
                      : 'bg-[#170833] border-purple-300/25 hover:border-amber-300/60 hover:bg-[#220d46]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="pixel-micro text-[#fffdf7] font-bold truncate">
                      {target.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[8px] shrink-0">
                      Tier {target.tier}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[8px]">
                    <span className="text-purple-200">{target.subtitle}</span>
                    <span
                      className={
                        target.debuted ? 'text-teal-300' : 'text-amber-300'
                      }
                    >
                      {target.debuted ? 'Debuted' : 'Pre-Debut'}
                    </span>
                  </div>
                  <div className="mt-1 text-[8px] text-purple-300">
                    Pop {target.popularity} · Fans {formatNumber(target.fanbase)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Activity Library Panel (empty until target is selected) */}
      <section
        aria-label="Schedule Activity Library"
        data-testid="schedule-activity-library"
        className="rounded-xl bg-[#240e44] border border-purple-300/25 overflow-hidden shadow-lg"
      >
        {!library || !selectedTarget ? (
          <div
            data-testid="schedule-library-empty"
            className="p-8 text-center space-y-2 bg-[#170833]/70"
          >
            <div className="pixel-subtitle text-amber-300">
              Activity Library Awaiting Target Selection
            </div>
            <p className="pixel-micro text-purple-200 max-w-xl mx-auto">
              Select a Group or Soloist above to load eligible weekly activities.
            </p>
          </div>
        ) : (
          <div>
            {/* Sticky 6 Category Tabs */}
            <div className="sticky top-0 z-10 bg-[#1a0836] border-b border-purple-300/25 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5" role="tablist">
                {SCHEDULE_CATEGORIES.map((cat) => {
                  const tabAllowed = library.eligibleCategories.includes(cat);
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      disabled={!tabAllowed}
                      onClick={() => {
                        if (!tabAllowed) return;
                        setActiveCategory(cat);
                        setSelectedActivityId(null);
                      }}
                      title={
                        tabAllowed
                          ? cat
                          : 'Pre-debut target: Release a Music Production first'
                      }
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg pixel-micro border transition-colors ${
                        isActive
                          ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-[#180832] border-amber-300 font-bold cursor-pointer'
                          : tabAllowed
                            ? 'bg-[#2b1054] border-purple-300/25 text-purple-100 hover:bg-[#3a166e] hover:border-amber-300/50 cursor-pointer'
                            : 'bg-[#14062b] border-purple-300/10 text-purple-400/50 cursor-not-allowed'
                      }`}
                    >
                      {!tabAllowed && <Lock className="w-3 h-3 shrink-0" />}
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>

              {library.isPTierRandomized && (
                <div
                  data-testid="p-tier-rotation-badge"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/15 border border-pink-400/50 text-pink-200 text-[8px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-pink-300 shrink-0" />
                  <span>
                    P-Tier Weekly Rotation (W{state.date.week} · Rerolls Next Week)
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 space-y-4">
              {!library.debuted && (
                <div
                  data-testid="predebut-training-notice"
                  className="rounded-lg bg-amber-500/12 border border-amber-400/45 px-4 py-2.5 pixel-micro text-amber-200 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>
                    Pre-Debut Target: Complete and release a Music Production for{' '}
                    <strong className="text-[#fffdf7]">{library.targetName}</strong> to
                    unlock Rest, Company, Music Shows, Concerts, and Others.
                  </span>
                </div>
              )}

              {selectedActivityDef && (
                <div className="rounded-lg bg-orange-500/15 border border-orange-400/50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="pixel-micro text-[#fffdf7]">
                    Selected:{' '}
                    <span className="text-amber-300 font-bold">
                      {selectedActivityDef.label}
                    </span>{' '}
                    — Drag onto a day below or quick-assign to:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedActivityDef.allowedWeekdays ?? WEEKDAYS).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => assignActivityToDay(d, selectedActivityDef)}
                        className="px-2.5 py-1.5 rounded bg-orange-500 hover:bg-orange-400 text-[#180832] font-bold text-[8px] cursor-pointer"
                      >
                        + {getDayShortLabel(d)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 6-Column Desktop Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {categoryEntries.map((entry) => {
                  const { def, unlocked, lockReason } = entry;
                  const isPicked = selectedActivityId === def.id && unlocked;
                  return (
                    <div
                      key={def.id}
                      data-testid={`activity-card-${def.id}`}
                      draggable={unlocked}
                      onDragStart={(e) => {
                        if (!unlocked) {
                          e.preventDefault();
                          return;
                        }
                        setDraggingActivityId(def.id);
                        e.dataTransfer.effectAllowed = 'copy';
                        e.dataTransfer.setData(
                          'application/json',
                          JSON.stringify({
                            activityId: def.id,
                            legacyActivityType: def.legacyActivityType,
                          })
                        );
                      }}
                      onDragEnd={() => {
                        setDraggingActivityId(null);
                        setDragOverDay(null);
                      }}
                      className={`group relative rounded-xl border p-2.5 flex flex-col justify-between gap-2 transition-colors ${
                        !unlocked
                          ? 'bg-[#14062b] border-purple-300/15 opacity-70 cursor-not-allowed'
                          : isPicked
                            ? 'bg-[#361666] border-orange-400 shadow-[0_0_0_2px_rgba(251,146,60,0.45)] cursor-grab'
                            : 'bg-[#170833] border-purple-300/25 hover:border-amber-300/70 hover:bg-[#230e48] cursor-grab'
                      }`}
                    >
                      {/* Clickable card top body (no nested buttons) */}
                      <button
                        type="button"
                        disabled={!unlocked}
                        onClick={() => {
                          if (!unlocked) return;
                          setSelectedActivityId((prev) =>
                            prev === def.id ? null : def.id
                          );
                        }}
                        className={`w-full text-left space-y-2 ${
                          unlocked ? 'cursor-pointer' : 'cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 text-[8px]">
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300">
                            Tier {def.minTier}
                          </span>
                          {def.allowedWeekdays ? (
                            <span className="px-1.5 py-0.5 rounded bg-teal-500/20 border border-teal-400/40 text-teal-200">
                              {def.allowedWeekdays.map(getDayShortLabel).join('/')}
                            </span>
                          ) : unlocked ? (
                            <GripVertical className="w-3.5 h-3.5 text-purple-300/70" />
                          ) : (
                            <Lock className="w-3 h-3 text-amber-300" />
                          )}
                        </div>

                        <div className="relative aspect-[4/3] w-full rounded-lg bg-[#0f0522] border border-purple-300/15 overflow-hidden p-1.5 flex items-center justify-center">
                          <img
                            src={getLocalAssetUrl(def.imagePath)}
                            alt={def.label}
                            referrerPolicy="no-referrer"
                            onError={(ev) => {
                              ev.currentTarget.src = FALLBACK_ACTIVITY_SVG;
                            }}
                            className={`w-full h-full object-contain pointer-events-none select-none ${
                              unlocked ? '' : 'opacity-40 grayscale-[35%]'
                            }`}
                          />
                        </div>

                        <div className="pixel-micro text-[#fffdf7] font-bold leading-snug">
                          {def.label}
                        </div>
                      </button>

                      <div className="mt-auto space-y-1.5 pt-1.5 border-t border-purple-300/15 text-[8px]">
                        <div className="flex items-center justify-between text-purple-200">
                          <span>Sta -{def.staminaCost}</span>
                          <span>
                            Fat {def.fatigueDelta > 0 ? `+${def.fatigueDelta}` : def.fatigueDelta}
                          </span>
                        </div>
                        {def.baseIncome > 0 && (
                          <div className="text-teal-300">
                            +{formatWon(def.baseIncome)}
                          </div>
                        )}
                        {def.baseCost > 0 && (
                          <div className="text-amber-300">
                            Cost {formatWon(def.baseCost)}
                          </div>
                        )}
                        {unlocked ? (
                          <button
                            type="button"
                            onClick={() => {
                              const targetDay =
                                def.allowedWeekdays &&
                                !def.allowedWeekdays.includes(selectedDay)
                                  ? def.allowedWeekdays[0]
                                  : selectedDay;
                              assignActivityToDay(targetDay, def);
                            }}
                            className="w-full py-1 px-2 rounded bg-orange-500/90 hover:bg-orange-400 text-[#180832] font-bold text-[8px] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>
                              Add (
                              {getDayShortLabel(
                                def.allowedWeekdays &&
                                  !def.allowedWeekdays.includes(selectedDay)
                                  ? def.allowedWeekdays[0]
                                  : selectedDay
                              )}
                              )
                            </span>
                          </button>
                        ) : (
                          <div
                            title={lockReason ?? 'Locked'}
                            className="w-full py-1 px-2 rounded bg-[#1d0a3c] border border-amber-400/25 text-amber-200/90 text-[8px] truncate text-center"
                          >
                            {lockReason ?? 'Locked'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. 7-Day Schedule Grid (MON..SUN + GOALS) */}
      <div className="rounded-xl border border-purple-300/25 overflow-hidden bg-[#240e44] shadow-lg">
        {WEEKDAYS.map((day) => {
          const dayItems = state.weeklyPlan.filter((a) => a.day === day);
          const isSelected = selectedDay === day;
          const isDropValid =
            !draggingDef ||
            !draggingDef.allowedWeekdays ||
            draggingDef.allowedWeekdays.includes(day);
          const isHovered = dragOverDay === day;

          const assignArmedHere =
            selectedActivityDef &&
            (!selectedActivityDef.allowedWeekdays ||
              selectedActivityDef.allowedWeekdays.includes(day));

          return (
            <div
              key={day}
              data-testid={`schedule-day-row-${day}`}
              onDragOver={(e) => {
                if (!selectedTarget) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = isDropValid ? 'copy' : 'none';
                if (dragOverDay !== day) setDragOverDay(day);
              }}
              onDragLeave={() => {
                if (dragOverDay === day) setDragOverDay(null);
              }}
              onDrop={(e) => handleDropOnDay(e, day)}
              className={`flex flex-col sm:flex-row border-b border-purple-300/20 transition-colors ${
                isHovered
                  ? isDropValid
                    ? 'ring-2 ring-inset ring-teal-400 bg-teal-500/10'
                    : 'ring-2 ring-inset ring-rose-500 bg-rose-500/10'
                  : draggingDef && draggingDef.allowedWeekdays
                    ? isDropValid
                      ? 'ring-1 ring-inset ring-teal-400/50'
                      : 'opacity-70'
                    : ''
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`sm:w-36 shrink-0 px-4 py-3.5 text-left font-bold cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-[#180832]'
                    : 'bg-[#31145c] text-[#fffdf7] hover:bg-[#3f1c73]'
                }`}
              >
                <div className="pixel-micro">{getDayShortLabel(day)}</div>
                <div className="text-[8px] opacity-85 mt-1">
                  {dayItems.length} item{dayItems.length === 1 ? '' : 's'}
                </div>
              </button>

              <div className="flex-1 p-3 bg-[#15072c] min-h-[68px] flex flex-wrap items-center gap-2">
                {dayItems.map((act) => {
                  const def = resolveScheduleActivityDef(
                    act.activityId,
                    act.activityType
                  );
                  const thumb = act.imagePath || def?.imagePath;
                  return (
                    <div
                      key={act.id}
                      data-testid={`scheduled-item-${act.id}`}
                      className="flex items-center gap-2.5 rounded-lg bg-[#240e44] border border-purple-300/25 px-3 py-2"
                    >
                      {thumb && (
                        <div className="w-9 h-9 rounded bg-[#110524] border border-purple-300/20 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                          <img
                            src={getLocalAssetUrl(thumb)}
                            alt={act.notes || act.activityType}
                            referrerPolicy="no-referrer"
                            onError={(ev) => {
                              ev.currentTarget.src = FALLBACK_ACTIVITY_SVG;
                            }}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div>
                        <div className="pixel-micro text-[#fffdf7]">
                          {act.notes || act.activityType} ·{' '}
                          <span className="text-amber-300">{act.targetName}</span>
                        </div>
                        <div className="text-[8px] text-purple-200 mt-1">
                          Sta -{act.staminaCost} · Fat{' '}
                          {act.fatigueDelta > 0
                            ? `+${act.fatigueDelta}`
                            : act.fatigueDelta}
                          {act.estimatedIncome > 0 &&
                            ` · +${formatWon(act.estimatedIncome)}`}
                          {act.estimatedCost > 0 &&
                            ` · -${formatWon(act.estimatedCost)}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${act.notes || act.activityType} on ${day}`}
                        onClick={() => actions.removeActivity(act.id)}
                        className="p-1.5 rounded bg-rose-900/80 hover:bg-rose-700 text-rose-100 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {dayItems.length === 0 && !assignArmedHere && (
                  <div className="pixel-micro text-purple-300/70 py-1.5">
                    {selectedTarget
                      ? `Drop an activity onto ${getDayShortLabel(day)} or click an activity card above.`
                      : `No tasks scheduled for ${day}. Select a Group or Soloist above to begin.`}
                  </div>
                )}

                {assignArmedHere && selectedActivityDef && (
                  <button
                    type="button"
                    onClick={() => assignActivityToDay(day, selectedActivityDef)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/35 border border-teal-400/50 text-teal-200 pixel-micro cursor-pointer"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>+ Assign {selectedActivityDef.label}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* GOALS row */}
        <div className="flex flex-col sm:flex-row bg-[#240e44]">
          <div className="sm:w-36 shrink-0 px-4 py-3.5 bg-[#3b186e] text-amber-300 pixel-micro">
            GOALS
          </div>
          <div className="flex-1 p-3 bg-[#15072c]">
            <input
              type="text"
              aria-label="Weekly goals note"
              placeholder="Enter weekly goals or comeback deadlines..."
              value={state.weeklyGoalsNote}
              onChange={(e) => actions.updateWeeklyGoals(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#240e44] border border-purple-300/25 text-[#fffdf7] pixel-micro"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

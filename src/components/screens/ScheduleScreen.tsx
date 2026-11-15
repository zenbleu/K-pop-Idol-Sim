import React, { useEffect, useState } from 'react';
import { ACTIVITY_CONFIG } from '../../config/gameConfig';
import { ActivityType, Weekday } from '../../game/models/types';
import { useGame } from '../../game/state/GameContext';
import { WEEKDAYS } from '../../game/utils/date';
import { formatWon } from '../../game/utils/format';
import { Trash2, Edit3, Plus } from 'lucide-react';

const ALL_ACTIVITIES = Object.keys(ACTIVITY_CONFIG) as ActivityType[];

export const ScheduleScreen: React.FC = () => {
  const { state, actions } = useGame();

  const [selectedDay, setSelectedDay] = useState<Weekday>('Monday');
  const [activityType, setActivityType] = useState<ActivityType>('Vocal Practice');
  const [targetType, setTargetType] = useState<'Idol' | 'Group' | 'Solo' | 'Company'>('Group');
  const [targetId, setTargetId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const cfg = ACTIVITY_CONFIG[activityType];

  useEffect(() => {
    if (!cfg.allowedTargets.includes(targetType)) {
      setTargetType(cfg.allowedTargets[0]);
    }
  }, [activityType, cfg.allowedTargets, targetType]);

  const targetOptions =
    targetType === 'Group'
      ? state.groups.map((g) => ({ id: g.id, name: g.name }))
      : targetType === 'Solo'
        ? state.soloArtists.map((s) => ({ id: s.id, name: s.stageName }))
        : targetType === 'Idol'
          ? state.idols.map((i) => ({ id: i.id, name: `${i.stageName} (Sta ${i.currentStamina}%)` }))
          : [{ id: 'company', name: state.company.name }];

  useEffect(() => {
    if (targetOptions.length > 0 && !targetOptions.some((o) => o.id === targetId)) {
      setTargetId(targetOptions[0].id);
    } else if (targetOptions.length === 0) {
      setTargetId('');
    }
  }, [targetType, targetOptions.length, state.idols.length, state.groups.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return;
    if (editingId) {
      const ok = actions.editActivity(editingId, {
        day: selectedDay,
        activityType,
        targetType,
        targetId,
      });
      if (ok) setEditingId(null);
    } else {
      actions.addActivity({
        day: selectedDay,
        activityType,
        targetType,
        targetId,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="pixel-title text-white">7-Day Weekly Schedule</h1>
          <p className="pixel-micro text-purple-200 mt-1">
            Plan unlimited activities per day (Mon–Sun). Days simulate chronologically on Next Week.
          </p>
        </div>
      </div>

      {/* Add / Edit Activity Bar */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-[#2e1065] border border-purple-300/25 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
      >
        <div>
          <label htmlFor="sched-day" className="block pixel-micro text-purple-200 mb-1.5">
            Day
          </label>
          <select
            id="sched-day"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value as Weekday)}
            className="w-full px-3 py-2 rounded-lg bg-[#1e0b4b] border border-purple-300/30 text-white pixel-micro"
          >
            {WEEKDAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sched-act" className="block pixel-micro text-purple-200 mb-1.5">
            Activity Type
          </label>
          <select
            id="sched-act"
            value={activityType}
            onChange={(e) => setActivityType(e.target.value as ActivityType)}
            className="w-full px-3 py-2 rounded-lg bg-[#1e0b4b] border border-purple-300/30 text-white pixel-micro"
          >
            {ALL_ACTIVITIES.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sched-ttype" className="block pixel-micro text-purple-200 mb-1.5">
            Target Scope
          </label>
          <select
            id="sched-ttype"
            value={targetType}
            onChange={(e) =>
              setTargetType(e.target.value as 'Idol' | 'Group' | 'Solo' | 'Company')
            }
            className="w-full px-3 py-2 rounded-lg bg-[#1e0b4b] border border-purple-300/30 text-white pixel-micro"
          >
            {cfg.allowedTargets.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sched-target" className="block pixel-micro text-purple-200 mb-1.5">
            Participant
          </label>
          <select
            id="sched-target"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#1e0b4b] border border-purple-300/30 text-white pixel-micro"
          >
            {targetOptions.length === 0 ? (
              <option value="">No eligible {targetType}s</option>
            ) : (
              targetOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!targetId}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg pixel-micro ${
              targetId
                ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white cursor-pointer'
                : 'bg-purple-950 text-purple-400 cursor-not-allowed'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{editingId ? 'Update' : 'Add'}</span>
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="px-3 py-2.5 rounded-lg bg-purple-900 text-purple-200 pixel-micro cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="sm:col-span-2 lg:col-span-5 pixel-micro text-purple-200 flex flex-wrap gap-4 pt-1 border-t border-purple-300/15">
          <span>{cfg.description}</span>
          <span>Stamina: -{cfg.staminaCost}</span>
          <span>Fatigue: {cfg.fatigueDelta > 0 ? `+${cfg.fatigueDelta}` : cfg.fatigueDelta}</span>
          {cfg.baseIncome > 0 && <span className="text-emerald-300">Base Income: {formatWon(cfg.baseIncome)}</span>}
          {cfg.baseCost > 0 && <span className="text-amber-300">Cost: {formatWon(cfg.baseCost)}</span>}
        </div>
      </form>

      {/* PDF Page 7: 7-Day Schedule Grid (MON..SUN + GOALS) */}
      <div className="rounded-xl border border-purple-300/25 overflow-hidden bg-[#2e1065]">
        {WEEKDAYS.map((day) => {
          const dayItems = state.weeklyPlan.filter((a) => a.day === day);
          const isSelected = selectedDay === day;
          return (
            <div
              key={day}
              className="flex flex-col sm:flex-row border-b border-purple-300/20"
            >
              <button
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`sm:w-36 shrink-0 px-4 py-3.5 text-left font-bold cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-fuchsia-600 text-white'
                    : 'bg-[#4c1d95] text-purple-100 hover:bg-purple-700'
                }`}
              >
                <div className="pixel-micro">{day.slice(0, 3).toUpperCase()}</div>
                <div className="text-[8px] opacity-80 mt-1">
                  {dayItems.length} item{dayItems.length === 1 ? '' : 's'}
                </div>
              </button>

              <div className="flex-1 p-3 bg-[#1e0b4b] min-h-[60px]">
                {dayItems.length === 0 ? (
                  <div className="pixel-micro text-purple-400/70 py-1.5">
                    No tasks scheduled for {day}. Select {day.slice(0, 3).toUpperCase()} and add an activity above.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {dayItems.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-center gap-2.5 rounded-lg bg-[#2e1065] border border-purple-300/25 px-3 py-2"
                      >
                        <div>
                          <div className="pixel-micro text-white">
                            {act.activityType} · {act.targetName}
                          </div>
                          <div className="text-[8px] text-purple-200 mt-1">
                            Sta -{act.staminaCost} · Fat{' '}
                            {act.fatigueDelta > 0 ? `+${act.fatigueDelta}` : act.fatigueDelta}
                            {act.estimatedIncome > 0 && ` · +${formatWon(act.estimatedIncome)}`}
                            {act.estimatedCost > 0 && ` · -${formatWon(act.estimatedCost)}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            aria-label={`Edit ${act.activityType} on ${day}`}
                            onClick={() => {
                              setEditingId(act.id);
                              setSelectedDay(act.day);
                              setActivityType(act.activityType);
                              setTargetType(act.targetType);
                              setTargetId(act.targetId);
                            }}
                            className="p-1.5 rounded bg-purple-800 hover:bg-purple-700 text-purple-100 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${act.activityType} on ${day}`}
                            onClick={() => actions.removeActivity(act.id)}
                            className="p-1.5 rounded bg-rose-900/80 hover:bg-rose-700 text-rose-100 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* GOALS row matching PDF Page 7 */}
        <div className="flex flex-col sm:flex-row bg-[#2e1065]">
          <div className="sm:w-36 shrink-0 px-4 py-3.5 bg-[#5b21b6] text-white pixel-micro">
            GOALS
          </div>
          <div className="flex-1 p-3 bg-[#1e0b4b]">
            <input
              type="text"
              aria-label="Weekly goals note"
              placeholder="Enter weekly goals or comeback deadlines..."
              value={state.weeklyGoalsNote}
              onChange={(e) => actions.updateWeeklyGoals(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#270e55] border border-purple-300/20 text-white pixel-micro"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

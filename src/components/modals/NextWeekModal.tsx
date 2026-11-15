import React, { useEffect } from 'react';
import { useGame } from '../../game/state/GameContext';
import { formatGameDate, WEEKDAYS } from '../../game/utils/date';
import { formatNumber, formatWon } from '../../game/utils/format';
import { X } from 'lucide-react';

export const NextWeekModals: React.FC = () => {
  const {
    state,
    nextWeekModalOpen,
    setNextWeekModalOpen,
    weeklySummaryModalOpen,
    setWeeklySummaryModalOpen,
    actions,
  } = useGame();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (nextWeekModalOpen) setNextWeekModalOpen(false);
        if (weeklySummaryModalOpen) setWeeklySummaryModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nextWeekModalOpen, weeklySummaryModalOpen, setNextWeekModalOpen, setWeeklySummaryModalOpen]);

  const plannedIncome = state.weeklyPlan.reduce((s, a) => s + a.estimatedIncome, 0);
  const plannedCosts = state.weeklyPlan.reduce((s, a) => s + a.estimatedCost, 0);
  const salaries = state.idols.reduce((s, i) => s + i.contract.weeklySalary, 0);

  return (
    <>
      {/* Pre-Advance Confirmation Modal */}
      {nextWeekModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="next-week-title"
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setNextWeekModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-amber-300/40 bg-[#240e44] p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-purple-300/20 pb-3">
              <h2 id="next-week-title" className="pixel-title text-[#fffdf7]">
                Review Week & Advance ({formatGameDate(state.date)})
              </h2>
              <button
                type="button"
                aria-label="Close review"
                onClick={() => setNextWeekModalOpen(false)}
                className="p-2 rounded-lg bg-[#15072c] hover:bg-orange-500 hover:text-[#180832] text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-[#15072c] p-3 border border-purple-300/15">
                <div className="pixel-micro text-purple-200">Planned Activities</div>
                <div className="pixel-title text-[#fffdf7] mt-1">{state.weeklyPlan.length}</div>
              </div>
              <div className="rounded-lg bg-[#15072c] p-3 border border-purple-300/15">
                <div className="pixel-micro text-purple-200">Est. Schedule Income</div>
                <div className="pixel-subtitle text-teal-300 mt-1">
                  {formatWon(plannedIncome)}
                </div>
              </div>
              <div className="rounded-lg bg-[#15072c] p-3 border border-purple-300/15">
                <div className="pixel-micro text-purple-200">Costs + Salaries</div>
                <div className="pixel-subtitle text-amber-300 mt-1">
                  {formatWon(plannedCosts + salaries)}
                </div>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl bg-[#15072c] p-4 border border-purple-300/20 space-y-2">
              {state.weeklyPlan.length === 0 ? (
                <p className="pixel-micro text-purple-200">
                  No activities scheduled this week. Idols will rest and recover stamina passively.
                </p>
              ) : (
                WEEKDAYS.map((day) => {
                  const items = state.weeklyPlan.filter((a) => a.day === day);
                  if (items.length === 0) return null;
                  return (
                    <div key={day} className="pixel-micro text-purple-100">
                      <span className="text-amber-300">{day}:</span>{' '}
                      {items.map((i) => `${i.notes || i.activityType} (${i.targetName})`).join(', ')}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setNextWeekModalOpen(false)}
                className="px-4 py-2.5 rounded-lg border border-purple-300/30 bg-[#31145c] hover:bg-[#411d75] text-purple-100 pixel-micro cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={actions.confirmAdvanceWeek}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-[#180832] font-bold pixel-micro cursor-pointer"
              >
                Confirm & Simulate 7 Days
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Summary Results Modal */}
      {weeklySummaryModalOpen && state.lastWeeklySummary && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="weekly-summary-title"
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setWeeklySummaryModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl border border-amber-300/40 bg-[#240e44] p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-purple-300/20 pb-3">
              <h2 id="weekly-summary-title" className="pixel-title text-[#fffdf7]">
                Weekly Report — {state.lastWeeklySummary.weekDateLabel}
              </h2>
              <button
                type="button"
                aria-label="Close weekly report"
                onClick={() => setWeeklySummaryModalOpen(false)}
                className="p-2 rounded-lg bg-[#15072c] text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-[#15072c] p-3 border border-purple-300/15">
                <div className="pixel-micro text-purple-200">Income</div>
                <div className="pixel-subtitle text-teal-300 mt-1">
                  {formatWon(state.lastWeeklySummary.income)}
                </div>
              </div>
              <div className="rounded-lg bg-[#15072c] p-3 border border-purple-300/15">
                <div className="pixel-micro text-purple-200">Expenses</div>
                <div className="pixel-subtitle text-rose-300 mt-1">
                  {formatWon(state.lastWeeklySummary.expenses)}
                </div>
              </div>
              <div className="rounded-lg bg-[#15072c] p-3 border border-purple-300/15">
                <div className="pixel-micro text-purple-200">Net Profit</div>
                <div
                  className={`pixel-subtitle mt-1 ${
                    state.lastWeeklySummary.netProfit >= 0 ? 'text-amber-300' : 'text-rose-300'
                  }`}
                >
                  {formatWon(state.lastWeeklySummary.netProfit)}
                </div>
              </div>
              <div className="rounded-lg bg-[#15072c] p-3 border border-purple-300/15">
                <div className="pixel-micro text-purple-200">Fans Gained</div>
                <div className="pixel-subtitle text-pink-300 mt-1">
                  +{formatNumber(state.lastWeeklySummary.fansGained)}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#15072c] p-4 border border-purple-300/20 space-y-2">
              <div className="pixel-micro text-purple-200">
                Tier: {state.lastWeeklySummary.tierBefore} →{' '}
                <span className="text-amber-300">{state.lastWeeklySummary.tierAfter}</span> ·
                Reputation: {state.lastWeeklySummary.reputationBefore} →{' '}
                <span className="text-teal-300">{state.lastWeeklySummary.reputationAfter}</span>
              </div>
              <div className="pixel-micro text-purple-200">
                Completed Activities: {state.lastWeeklySummary.activitiesCompleted}
              </div>
            </div>

            {state.lastWeeklySummary.importantEvents.length > 0 && (
              <div className="rounded-xl bg-[#15072c] p-4 border border-amber-400/40 space-y-2">
                <div className="pixel-subtitle text-amber-300">Highlights & Alerts</div>
                <ul className="space-y-1.5">
                  {state.lastWeeklySummary.importantEvents.map((ev, idx) => (
                    <li key={idx} className="pixel-micro text-[#fffdf7]">
                      · {ev}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {state.lastWeeklySummary.activityLogs.length > 0 && (
              <div className="rounded-xl bg-[#15072c] p-4 border border-purple-300/20 space-y-2">
                <div className="pixel-subtitle text-[#fffdf7]">Daily Activity Log</div>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {state.lastWeeklySummary.activityLogs.map((log, idx) => (
                    <div key={idx} className="pixel-micro text-purple-200">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setWeeklySummaryModalOpen(false)}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-[#180832] font-bold pixel-micro cursor-pointer"
              >
                Continue to {formatGameDate(state.date)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

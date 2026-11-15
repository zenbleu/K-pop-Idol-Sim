import React, { useEffect, useState } from 'react';
import { STARTING_PROGRESSION } from '../../config/gameConfig';
import { useGame } from '../../game/state/GameContext';
import { formatCountdown, formatNumber, formatWon } from '../../game/utils/format';
import { IdolPortrait } from '../common/IdolPortrait';

export const DashboardScreen: React.FC = () => {
  const { state, setActiveTab, openIdolProfile, actions } = useGame();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const trainees = state.idols.filter((i) => !i.groupId && !i.isSoloArtist);
  const totalFans =
    state.groups.reduce((s, g) => s + g.fanbase, 0) +
    state.soloArtists.reduce((s, a) => s + a.fanbase, 0);
  const activeProductions = state.releases.filter((r) => r.status === 'In Production');
  const activePromos = state.releases.filter(
    (r) => r.status === 'Promoting' && !r.salesCompleted
  );
  const warnings = [
    ...state.idols
      .filter((i) => i.fatigue >= 75)
      .map((i) => `${i.stageName} is fatigued (${i.fatigue}%). Schedule Rest & Recovery.`),
    ...state.idols
      .filter((i) => i.departureWarning)
      .map((i) => `${i.stageName} has critically low Loyalty (${i.loyalty}/100).`),
    ...state.idols
      .filter((i) => i.contract.status !== 'Active')
      .map((i) => `${i.stageName}'s contract is ${i.contract.status}.`),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="pixel-title text-[#fffdf7]">Company Dashboard</h1>
          <p className="pixel-micro text-purple-200 mt-1">
            {state.company.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('auditions')}
            className="px-3 py-2 rounded-lg bg-[#31145c] hover:bg-[#411d75] border border-purple-300/30 text-[#fffdf7] pixel-micro cursor-pointer"
          >
            Scout Trainees
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-[#180832] font-bold pixel-micro cursor-pointer"
          >
            Plan Week ({state.weeklyPlan.length})
          </button>
        </div>
      </div>

      {/* Interactive Random Event Decision (if triggered) */}
      {state.pendingEvent && (
        <div className="rounded-xl border border-amber-400/60 bg-[#31145c] p-5 space-y-3 shadow-lg">
          <div className="pixel-subtitle text-amber-300">
            Agency Event: {state.pendingEvent.title}
          </div>
          <p className="pixel-micro text-[#fffdf7]">{state.pendingEvent.description}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => actions.resolveEvent('A')}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-[#180832] font-bold pixel-micro cursor-pointer"
            >
              {state.pendingEvent.optionA.label} ({state.pendingEvent.optionA.effectSummary})
            </button>
            <button
              type="button"
              onClick={() => actions.resolveEvent('B')}
              className="px-4 py-2 rounded-lg bg-[#170833] hover:bg-[#240e44] border border-purple-300/30 text-purple-100 pixel-micro cursor-pointer"
            >
              {state.pendingEvent.optionB.label} ({state.pendingEvent.optionB.effectSummary})
            </button>
          </div>
        </div>
      )}

      {/* Top KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#240e44] border border-purple-300/25 p-4">
          <div className="pixel-micro text-purple-200">Roster Overview</div>
          <div className="text-[11px] leading-snug text-[#fffdf7] mt-2 sm:whitespace-nowrap">
            {state.groups.length} Grp · {state.soloArtists.length} Solo · {trainees.length} Trn
          </div>
          <div className="pixel-micro text-amber-300 mt-1.5">
            Total Idols: {state.idols.length}
          </div>
        </div>
        <div className="rounded-xl bg-[#240e44] border border-purple-300/25 p-4">
          <div className="pixel-micro text-purple-200">Total Fanbase</div>
          <div className="pixel-title text-pink-300 mt-2">
            {formatNumber(totalFans)}
          </div>
          <div className="pixel-micro text-purple-200 mt-1">
            Reputation: <span className="text-teal-300">{state.company.reputation}</span>
          </div>
        </div>
        <div className="rounded-xl bg-[#240e44] border border-purple-300/25 p-4">
          <div className="pixel-micro text-purple-200">Lifetime Revenue</div>
          <div className="pixel-subtitle text-amber-300 mt-2">
            {formatWon(state.company.totalRevenue)}
          </div>
          <div className="pixel-micro text-purple-200 mt-1">
            Expenses: {formatWon(state.company.totalExpenses)}
          </div>
        </div>
        <div className="rounded-xl bg-[#240e44] border border-purple-300/25 p-4">
          <div className="pixel-micro text-purple-200">Audition & Group Slots</div>
          <div className="pixel-subtitle text-teal-300 mt-2">
            {state.company.auditionCapacity} Aud · {state.groups.length}/{state.company.maxGroupSlots} Grp
          </div>
          <div className="pixel-micro text-purple-200 mt-1">
            Max Group Size: {state.company.maxGroupMembers}
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid: Trends, Current Production/Sales, News, Roster */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Column 1-2: Trends + Active Production/Sales + Groups/Idols */}
        <div className="xl:col-span-2 space-y-6">
          {/* Current Trends & Warnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#240e44] border border-purple-300/25 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="pixel-subtitle text-[#fffdf7]">Weekly Market Trends</h2>
                <span className="pixel-micro text-teal-300">W{state.trends.weekUpdated}</span>
              </div>
              <div className="pixel-micro text-purple-200">
                Hot Genres:{' '}
                <span className="text-amber-300">
                  {state.trends.trendingGenres.join(' / ')}
                </span>
              </div>
              <div className="pixel-micro text-purple-200">
                Hot Concepts:{' '}
                <span className="text-pink-300">
                  {state.trends.trendingConcepts.join(' / ')}
                </span>
              </div>
              <p className="pixel-micro text-purple-300/90 pt-1">
                Matching trends boosts album quality and sales volume.
              </p>
            </div>

            <div className="rounded-xl bg-[#240e44] border border-purple-300/25 p-4 space-y-2">
              <h2 className="pixel-subtitle text-[#fffdf7]">Upcoming & Alerts</h2>
              {warnings.length === 0 ? (
                <p className="pixel-micro text-teal-300">
                  All contracts, stamina, and loyalty levels are healthy.
                </p>
              ) : (
                <ul className="space-y-1.5 max-h-24 overflow-y-auto">
                  {warnings.map((w, idx) => (
                    <li key={idx} className="pixel-micro text-amber-300">
                      · {w}
                    </li>
                  ))}
                </ul>
              )}
              <div className="pixel-micro text-purple-200 pt-1">
                Scheduled this week: {state.weeklyPlan.length} activit{state.weeklyPlan.length === 1 ? 'y' : 'ies'}
              </div>
            </div>
          </div>

          {/* Current Production & Live 10-Min Sales */}
          <div className="rounded-xl bg-[#240e44] border border-purple-300/25 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="pixel-subtitle text-[#fffdf7]">Current Production & Live Sales</h2>
              <button
                type="button"
                onClick={() => setActiveTab('production')}
                className="pixel-micro text-amber-300 hover:text-amber-200 cursor-pointer"
              >
                Manage Production →
              </button>
            </div>

            {activeProductions.length === 0 && activePromos.length === 0 ? (
              <p className="pixel-micro text-purple-200">
                No active album production or live sales right now. Debut an artist and start a release in Production.
              </p>
            ) : (
              <div className="space-y-3">
                {activeProductions.map((rel) => (
                  <div
                    key={rel.id}
                    className="rounded-lg bg-[#15072c] p-3.5 border border-purple-300/20 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="pixel-micro text-[#fffdf7]">
                        [{rel.releaseType}] {rel.title} — {rel.targetName}
                      </div>
                      <div className="pixel-micro text-purple-200 mt-1">
                        {rel.genre} · {rel.concept} · Quality Est. {rel.quality}/100
                      </div>
                    </div>
                    <div className="pixel-micro text-amber-300">
                      Weeks {rel.weeksElapsed}/{rel.durationWeeks} · Rec {rel.recordingSessions}/{rel.recordingTarget}
                    </div>
                  </div>
                ))}

                {activePromos.map((rel) => {
                  const elapsed = rel.salesStartTimestamp
                    ? Math.max(0, now - rel.salesStartTimestamp)
                    : 0;
                  const rem = Math.max(0, STARTING_PROGRESSION.albumSalesDurationMs - elapsed);
                  const pct = Math.min(
                    100,
                    Math.round((elapsed / STARTING_PROGRESSION.albumSalesDurationMs) * 100)
                  );
                  return (
                    <div
                      key={rel.id}
                      className="rounded-lg bg-[#15072c] p-3.5 border border-orange-400/40 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="pixel-micro text-[#fffdf7]">
                          LIVE SALES: "{rel.title}" ({rel.targetName})
                        </span>
                        <span className="pixel-micro text-pink-300">
                          {formatCountdown(rem)} left
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#240e44] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-pink-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between pixel-micro text-purple-200">
                        <span>Sold: {formatNumber(rel.salesUnits)} copies</span>
                        <span className="text-teal-300">Company Rev: {formatWon(rel.companyRevenueApplied)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Roster Overview */}
          <div className="rounded-xl bg-[#240e44] border border-purple-300/25 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="pixel-subtitle text-[#fffdf7]">Active Artists & Roster</h2>
              <button
                type="button"
                onClick={() => setActiveTab('company')}
                className="pixel-micro text-amber-300 hover:text-amber-200 cursor-pointer"
              >
                Open Company →
              </button>
            </div>
            {state.idols.length === 0 ? (
              <p className="pixel-micro text-purple-200">
                No trainees recruited yet. Visit Auditions to discover your first talent.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {state.idols.slice(0, 6).map((idol) => (
                  <button
                    key={idol.id}
                    type="button"
                    onClick={() => openIdolProfile(idol.id)}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-[#15072c] hover:bg-[#31145c] border border-purple-300/20 hover:border-amber-300/50 text-left cursor-pointer transition-colors"
                  >
                    <IdolPortrait
                      gender={idol.gender}
                      filename={idol.portraitFilename}
                      alt={idol.stageName}
                      size="xs"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="pixel-micro text-[#fffdf7] truncate">
                        {idol.stageName} · <span className="text-amber-300">Tier {idol.tier}</span>
                      </div>
                      <div className="pixel-micro text-purple-200 truncate">
                        {idol.specialty} · Sta {idol.currentStamina}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 3: News Feed */}
        <div className="rounded-xl bg-[#240e44] border border-purple-300/25 p-5 flex flex-col">
          <h2 className="pixel-subtitle text-[#fffdf7] mb-4">Entertainment News</h2>
          <div className="space-y-3 overflow-y-auto max-h-[540px] pr-1">
            {state.news.map((item) => (
              <div
                key={item.id}
                className="rounded-lg bg-[#15072c] p-3 border border-purple-300/15 space-y-1.5"
              >
                <div className="flex items-center justify-between pixel-micro text-teal-300">
                  <span>{item.category}</span>
                  <span>{item.dateLabel}</span>
                </div>
                <div className="pixel-micro text-[#fffdf7] leading-snug">{item.headline}</div>
                <p className="pixel-micro text-purple-200 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

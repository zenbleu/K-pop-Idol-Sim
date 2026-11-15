import React, { useState } from 'react';
import { ALL_GROUP_ROLES } from '../../config/gameConfig';
import { isIdolInRejoinCooldown, isIncomeSplitLocked } from '../../game/logic/groups';
import { findMaknaeId } from '../../game/logic/stats';
import { Gender, Group } from '../../game/models/types';
import { useGame } from '../../game/state/GameContext';
import { formatNumber } from '../../game/utils/format';
import { IdolPortrait } from '../common/IdolPortrait';

export const CompanyScreen: React.FC = () => {
  const { state, openIdolProfile, actions, requestConfirm } = useGame();

  // Group Formation Form State
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupGender, setGroupGender] = useState<Gender>('Female');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Active Group detail/role/split editor
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const debutedIdols = state.idols.filter((i) => i.groupId || i.isSoloArtist);
  const trainees = state.idols.filter((i) => !i.groupId && !i.isSoloArtist);
  const eligibleTraineesForGroup = trainees.filter(
    (t) =>
      t.gender === groupGender &&
      !isIdolInRejoinCooldown(t, state.date.totalWeeks)
  );

  const handleToggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = actions.formGroup({
      name: groupName,
      gender: groupGender,
      memberIds: selectedMemberIds,
    });
    if (ok) {
      setGroupName('');
      setSelectedMemberIds([]);
      setShowCreateGroup(false);
    }
  };

  const renderSplitEffectHint = (group: Group) => {
    if (group.groupSharePercent >= 70) {
      return 'Group >=70%: +Loyalty, +Training efficiency, lower immediate company cashflow.';
    }
    if (group.companySharePercent >= 70) {
      return 'Company >=70%: +Agency cashflow, but Idol/Group loyalty erodes faster.';
    }
    return 'Balanced split: steady loyalty and fair agency revenue.';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="pixel-title text-[#fffdf7]">Company Management</h1>
          <p className="pixel-micro text-purple-200 mt-1">
            Click any idol card to open their Profile Modal. Manage Groups, Soloists, and Trainees.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateGroup((v) => !v)}
          className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-[#180832] font-bold pixel-micro cursor-pointer"
        >
          {showCreateGroup
            ? 'Close Group Form'
            : `Form New Group (${state.groups.length}/${state.company.maxGroupSlots})`}
        </button>
      </div>

      {/* Group Formation Drawer */}
      {showCreateGroup && (
        <form
          onSubmit={handleCreateGroup}
          className="rounded-xl bg-[#240e44] border border-orange-400/50 p-5 space-y-4"
        >
          <h2 className="pixel-subtitle text-amber-300">Form New Idol Group</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="grp-name" className="block pixel-micro text-purple-200 mb-1.5">
                Group Name
              </label>
              <input
                id="grp-name"
                type="text"
                required
                placeholder="e.g. VIOLET NOVA"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1e0b4b] border border-purple-300/30 text-white pixel-micro"
              />
            </div>

            <div>
              <span className="block pixel-micro text-purple-200 mb-1.5">
                Group Gender
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(['Female', 'Male'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setGroupGender(g);
                      setSelectedMemberIds([]);
                    }}
                    className={`py-2 rounded-lg border pixel-micro cursor-pointer ${
                      groupGender === g
                        ? 'bg-fuchsia-600 border-fuchsia-300 text-white'
                        : 'bg-[#1e0b4b] border-purple-300/20 text-purple-200'
                    }`}
                  >
                    {g === 'Female' ? 'Girl Group' : 'Boy Group'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="pixel-micro text-purple-200 mb-2">
              Select Eligible {groupGender} Trainees ({selectedMemberIds.length}/{state.company.maxGroupMembers} max):
            </div>
            {eligibleTraineesForGroup.length === 0 ? (
              <p className="pixel-micro text-amber-300">
                No eligible {groupGender} trainees available (check Auditions or 6-month cooldowns).
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {eligibleTraineesForGroup.map((t) => {
                  const checked = selectedMemberIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleToggleMember(t.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left cursor-pointer ${
                        checked
                          ? 'bg-purple-600 border-fuchsia-300 text-white'
                          : 'bg-[#1e0b4b] border-purple-300/20 text-purple-200'
                      }`}
                    >
                      <IdolPortrait
                        gender={t.gender}
                        filename={t.portraitFilename}
                        alt={t.stageName}
                        size="xs"
                      />
                      <div className="min-w-0">
                        <div className="pixel-micro truncate">{t.stageName}</div>
                        <div className="text-[8px] opacity-85">
                          Tier {t.tier} · Age {t.age} · {t.specialty}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-[#180832] font-bold pixel-micro cursor-pointer"
            >
              Debut Group
            </button>
          </div>
        </form>
      )}

      {/* Strict 3-Column Composition (Col 1: Idols | Col 2: Group/Solo | Col 3: Trainees) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Column 1: Debuted Idols */}
        <section
          aria-label="Idols Column"
          className="rounded-xl bg-[#240e44] border border-purple-300/25 p-4 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-purple-300/20 pb-2.5">
            <h2 className="pixel-subtitle text-[#fffdf7]">Idols ({debutedIdols.length})</h2>
          </div>
          {debutedIdols.length === 0 ? (
            <p className="pixel-micro text-purple-200">
              No debuted idols yet. Form a group or debut a trainee as a solo artist.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {debutedIdols.map((idol) => {
                const grp = state.groups.find((g) => g.id === idol.groupId);
                return (
                  <button
                    key={idol.id}
                    type="button"
                    data-testid={`idol-card-${idol.id}`}
                    onClick={() => openIdolProfile(idol.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#15072c] hover:bg-[#31145c] border border-purple-300/20 hover:border-amber-300/50 text-left cursor-pointer transition-colors"
                  >
                    <IdolPortrait
                      gender={idol.gender}
                      filename={idol.portraitFilename}
                      alt={idol.stageName}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="pixel-micro text-[#fffdf7] truncate">{idol.stageName}</span>
                        <span className="pixel-micro text-amber-300 shrink-0">
                          {idol.tier} ({idol.overallRating})
                        </span>
                      </div>
                      <div className="text-[8px] text-purple-200 mt-1 truncate">
                        {grp ? grp.name : 'Solo Artist'} · Pop {idol.popularity} · Loy {idol.loyalty}
                      </div>
                      <div className="text-[8px] text-teal-300 mt-0.5">
                        Sta {idol.currentStamina}% · Fat {idol.fatigue}%
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Column 2: Group / Solo */}
        <section
          aria-label="Group and Solo Column"
          className="rounded-xl bg-[#240e44] border border-purple-300/25 p-4 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-purple-300/20 pb-2.5">
            <h2 className="pixel-subtitle text-[#fffdf7]">
              Group / Solo ({state.groups.length + state.soloArtists.length})
            </h2>
          </div>

          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {state.groups.map((grp) => {
              const members = state.idols.filter((i) => grp.memberIds.includes(i.id));
              const maknaeId = findMaknaeId(members);
              const splitLock = isIncomeSplitLocked(state, grp);
              const isExpanded = expandedGroupId === grp.id;

              return (
                <div
                  key={grp.id}
                  className="rounded-xl bg-[#15072c] border border-purple-300/25 p-3.5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="pixel-subtitle text-[#fffdf7]">{grp.name}</div>
                      <div className="text-[8px] text-amber-300 mt-1">
                        {grp.gender} Group · Tier {grp.tier} · {members.length} members
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedGroupId(isExpanded ? null : grp.id)
                      }
                      className="px-2.5 py-1.5 rounded bg-[#31145c] hover:bg-[#411d75] border border-purple-300/30 text-[#fffdf7] text-[8px] cursor-pointer"
                    >
                      {isExpanded ? 'Hide Details' : 'Manage'}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pixel-micro text-purple-200">
                    <div>Pop: {grp.popularity}</div>
                    <div>Fans: {formatNumber(grp.fanbase)}</div>
                    <div>Loy: {grp.loyalty}</div>
                  </div>

                  {/* Member Lineup + Automatic Maknae */}
                  <div className="space-y-1.5">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-2 rounded bg-[#2e1065] px-2.5 py-1.5"
                      >
                        <button
                          type="button"
                          onClick={() => openIdolProfile(m.id)}
                          className="text-left pixel-micro text-white hover:text-fuchsia-300 cursor-pointer truncate"
                        >
                          {m.stageName} (Age {m.age})
                        </button>
                        <div className="text-[8px] text-fuchsia-300 shrink-0">
                          {m.id === maknaeId ? 'Maknae' : ''}
                          {m.id === maknaeId && m.groupRoles.length > 0 ? ' · ' : ''}
                          {m.groupRoles.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Expanded Management: Roles, Income Split, Disband */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-purple-300/20 space-y-4">
                      {/* Income Split */}
                      <div className="space-y-2">
                        <div className="flex justify-between pixel-micro text-white">
                          <span>Income Split</span>
                          <span>
                            Co {grp.companySharePercent}% / Grp {grp.groupSharePercent}%
                          </span>
                        </div>
                        <input
                          type="range"
                          aria-label={`${grp.name} company income share`}
                          min={0}
                          max={100}
                          step={5}
                          disabled={splitLock.locked}
                          value={grp.companySharePercent}
                          onChange={(e) =>
                            actions.updateIncomeSplit(grp.id, Number(e.target.value))
                          }
                          className="w-full accent-fuchsia-500"
                        />
                        {splitLock.locked ? (
                          <div className="text-[8px] text-amber-300">{splitLock.reason}</div>
                        ) : (
                          <div className="text-[8px] text-purple-300">
                            {renderSplitEffectHint(grp)}
                          </div>
                        )}
                      </div>

                      {/* Group Roles Editor */}
                      <div className="space-y-2">
                        <div className="pixel-micro text-purple-200">Assign Roles:</div>
                        {members.map((m) => (
                          <div key={m.id} className="space-y-1">
                            <div className="text-[8px] text-white">{m.stageName}</div>
                            <div className="flex flex-wrap gap-1">
                              {ALL_GROUP_ROLES.map((role) => {
                                const has = m.groupRoles.includes(role);
                                return (
                                  <button
                                    key={role}
                                    type="button"
                                    onClick={() => actions.toggleGroupRole(m.id, role)}
                                    className={`px-1.5 py-1 rounded text-[8px] cursor-pointer border ${
                                      has
                                        ? 'bg-fuchsia-600 border-fuchsia-300 text-white'
                                        : 'bg-[#2e1065] border-purple-300/20 text-purple-300'
                                    }`}
                                  >
                                    {role}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          requestConfirm({
                            title: `Disband ${grp.name}?`,
                            message:
                              'Members will return to trainee status with their stats and contracts preserved. Any active group production or future scheduled activities will be cleared.',
                            confirmLabel: 'Disband Group',
                            destructive: true,
                            onConfirm: () => actions.disbandGroup(grp.id),
                          })
                        }
                        className="w-full py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white pixel-micro cursor-pointer"
                      >
                        Disband Group
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {state.soloArtists.map((solo) => {
              const idol = state.idols.find((i) => i.id === solo.idolId);
              if (!idol) return null;
              return (
                <div
                  key={solo.id}
                  className="rounded-xl bg-[#1e0b4b] border border-pink-400/25 p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <IdolPortrait
                        gender={idol.gender}
                        filename={idol.portraitFilename}
                        alt={solo.stageName}
                        size="xs"
                      />
                      <div>
                        <div className="pixel-micro text-white">{solo.stageName} (Solo)</div>
                        <div className="text-[8px] text-pink-300">
                          Tier {solo.tier} · Pop {solo.popularity} · Fans {formatNumber(solo.fanbase)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openIdolProfile(idol.id)}
                      className="px-2.5 py-1 rounded bg-purple-700 hover:bg-purple-600 text-white text-[8px] cursor-pointer"
                    >
                      Profile
                    </button>
                  </div>
                </div>
              );
            })}

            {state.groups.length === 0 && state.soloArtists.length === 0 && (
              <p className="pixel-micro text-purple-300">
                No groups or solo artists yet. Click "Form New Group" above or debut a trainee as a Solo Artist from their profile.
              </p>
            )}
          </div>
        </section>

        {/* Column 3: Trainees */}
        <section
          aria-label="Trainees Column"
          className="rounded-xl bg-[#240e44] border border-purple-300/25 p-4 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-purple-300/20 pb-2.5">
            <h2 className="pixel-subtitle text-[#fffdf7]">Trainees ({trainees.length})</h2>
          </div>
          {trainees.length === 0 ? (
            <p className="pixel-micro text-purple-200">
              No trainees on roster. Scout new talent in Auditions.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {trainees.map((idol) => {
                const cooldown = isIdolInRejoinCooldown(idol, state.date.totalWeeks);
                return (
                  <div
                    key={idol.id}
                    className="rounded-lg bg-[#15072c] border border-purple-300/20 p-3 space-y-2"
                  >
                    <button
                      type="button"
                      data-testid={`trainee-card-${idol.id}`}
                      onClick={() => openIdolProfile(idol.id)}
                      className="w-full flex items-center gap-3 text-left cursor-pointer"
                    >
                      <IdolPortrait
                        gender={idol.gender}
                        filename={idol.portraitFilename}
                        alt={idol.stageName}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="pixel-micro text-[#fffdf7] truncate">
                            {idol.stageName}
                          </span>
                          <span className="pixel-micro text-amber-300 shrink-0">
                            {idol.tier} ({idol.overallRating})
                          </span>
                        </div>
                        <div className="text-[8px] text-purple-200 mt-1">
                          {idol.gender} · Age {idol.age} · Pot {idol.potential}
                        </div>
                        <div className="text-[8px] text-purple-300 mt-0.5">
                          {idol.specialty} · Sta {idol.currentStamina}%
                        </div>
                      </div>
                    </button>
                    {cooldown && (
                      <div className="text-[8px] text-amber-300">
                        Group Cooldown: {(idol.rejoinCooldownUntilWeek ?? 0) - state.date.totalWeeks} wk(s)
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openIdolProfile(idol.id)}
                        className="px-2.5 py-1 rounded bg-purple-800 hover:bg-purple-700 text-purple-100 text-[8px] cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button
                        type="button"
                        onClick={() => actions.debutSolo(idol.id)}
                        className="px-2.5 py-1 rounded bg-pink-600 hover:bg-pink-500 text-white text-[8px] cursor-pointer"
                      >
                        Debut Solo
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

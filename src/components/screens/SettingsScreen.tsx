import React, { useState } from 'react';
import {
  deleteSaveSlot,
  exportSaveJson,
  listSaveSlots,
  SAVE_SLOTS,
} from '../../game/save/storage';
import { useGame } from '../../game/state/GameContext';
import { formatNumber, formatWon } from '../../game/utils/format';

export const SettingsScreen: React.FC = () => {
  const { state, actions, requestConfirm, notify } = useGame();
  const [slotTick, setSlotTick] = useState(0);
  const [importText, setImportText] = useState('');
  const [exportedText, setExportedText] = useState('');

  const slots = listSaveSlots();
  const refreshSlots = () => setSlotTick((v) => v + 1);
  void slotTick;

  const totalFans =
    state.groups.reduce((s, g) => s + g.fanbase, 0) +
    state.soloArtists.reduce((s, a) => s + a.fanbase, 0);
  const totalSales = state.releases.reduce((s, r) => s + r.salesUnits, 0);
  const traineesCount = state.idols.filter((i) => !i.groupId && !i.isSoloArtist).length;

  const handleExport = () => {
    const json = exportSaveJson(state);
    setExportedText(json);
    notify('success', 'Exported current save JSON.');
  };

  const handleDownloadExport = () => {
    const json = exportSaveJson(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.company.name.toLowerCase().replace(/\s+/g, '_')}_save.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('success', 'Downloaded JSON save file.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="pixel-title text-white">Statistics, Saves & Settings</h1>
        <p className="pixel-micro text-purple-200 mt-1">
          Inspect live company analytics, manage multiple local save slots, export/import JSON, or reset.
        </p>
      </div>

      {/* Company & Career Statistics */}
      <section className="rounded-xl bg-[#2e1065] border border-purple-300/25 p-5 space-y-4">
        <h2 className="pixel-subtitle text-fuchsia-300">Company Statistics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="rounded-lg bg-[#1e0b4b] p-3 border border-purple-300/15">
            <div className="pixel-micro text-purple-300">Money</div>
            <div className="pixel-micro text-emerald-300 mt-1">{formatWon(state.company.money)}</div>
          </div>
          <div className="rounded-lg bg-[#1e0b4b] p-3 border border-purple-300/15">
            <div className="pixel-micro text-purple-300">Rubies</div>
            <div className="pixel-micro text-pink-300 mt-1">{state.company.rubies}</div>
          </div>
          <div className="rounded-lg bg-[#1e0b4b] p-3 border border-purple-300/15">
            <div className="pixel-micro text-purple-300">Total Revenue</div>
            <div className="pixel-micro text-white mt-1">{formatWon(state.company.totalRevenue)}</div>
          </div>
          <div className="rounded-lg bg-[#1e0b4b] p-3 border border-purple-300/15">
            <div className="pixel-micro text-purple-300">Total Expenses</div>
            <div className="pixel-micro text-amber-300 mt-1">{formatWon(state.company.totalExpenses)}</div>
          </div>
          <div className="rounded-lg bg-[#1e0b4b] p-3 border border-purple-300/15">
            <div className="pixel-micro text-purple-300">Tier / Rep</div>
            <div className="pixel-micro text-white mt-1">
              {state.company.tierDisplay} · {state.company.reputation}
            </div>
          </div>
          <div className="rounded-lg bg-[#1e0b4b] p-3 border border-purple-300/15">
            <div className="pixel-micro text-purple-300">Groups / Solos</div>
            <div className="pixel-micro text-white mt-1">
              {state.groups.length} / {state.soloArtists.length}
            </div>
          </div>
          <div className="rounded-lg bg-[#1e0b4b] p-3 border border-purple-300/15">
            <div className="pixel-micro text-purple-300">Trainees</div>
            <div className="pixel-micro text-white mt-1">{traineesCount}</div>
          </div>
          <div className="rounded-lg bg-[#1e0b4b] p-3 border border-purple-300/15">
            <div className="pixel-micro text-purple-300">Total Fanbase</div>
            <div className="pixel-micro text-fuchsia-300 mt-1">{formatNumber(totalFans)}</div>
          </div>
          <div className="rounded-lg bg-[#1e0b4b] p-3 border border-purple-300/15">
            <div className="pixel-micro text-purple-300">Album Copies</div>
            <div className="pixel-micro text-white mt-1">{formatNumber(totalSales)}</div>
          </div>
          <div className="rounded-lg bg-[#1e0b4b] p-3 border border-purple-300/15">
            <div className="pixel-micro text-purple-300">Concerts / Tours</div>
            <div className="pixel-micro text-white mt-1">
              {state.concerts.filter((c) => c.status === 'Completed').length} / {state.tours.length}
            </div>
          </div>
        </div>
      </section>

      {/* Save Slots & Export/Import */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-xl bg-[#2e1065] border border-purple-300/25 p-5 space-y-4">
          <h2 className="pixel-subtitle text-white">Local Save Slots</h2>
          <div className="space-y-2.5">
            {SAVE_SLOTS.map((slotId, idx) => {
              const meta = slots[slotId];
              return (
                <div
                  key={slotId}
                  className="rounded-lg bg-[#1e0b4b] p-3 border border-purple-300/20 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="pixel-micro text-white">
                      Slot {idx + 1}: {meta ? meta.label : 'Empty'}
                    </div>
                    {meta && (
                      <div className="text-[8px] text-purple-300 mt-1">
                        Tier {meta.tierDisplay} · {formatWon(meta.money)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        actions.saveSlot(slotId);
                        refreshSlots();
                      }}
                      className="px-2.5 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white pixel-micro cursor-pointer"
                    >
                      Save
                    </button>
                    {meta && (
                      <>
                        <button
                          type="button"
                          onClick={() => actions.loadSlot(slotId)}
                          className="px-2.5 py-1.5 rounded bg-indigo-700 hover:bg-indigo-600 text-white pixel-micro cursor-pointer"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestConfirm({
                              title: `Delete Save Slot ${idx + 1}?`,
                              message: `Permanently delete "${meta.label}"?`,
                              confirmLabel: 'Delete Save',
                              destructive: true,
                              onConfirm: () => {
                                deleteSaveSlot(slotId);
                                refreshSlots();
                                notify('info', `Deleted Slot ${idx + 1}.`);
                              },
                            })
                          }
                          className="px-2.5 py-1.5 rounded bg-rose-800 hover:bg-rose-700 text-white pixel-micro cursor-pointer"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl bg-[#2e1065] border border-purple-300/25 p-5 space-y-4">
          <h2 className="pixel-subtitle text-white">Export & Import Save</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white pixel-micro cursor-pointer"
            >
              Generate Export JSON
            </button>
            <button
              type="button"
              onClick={handleDownloadExport}
              className="px-3.5 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white pixel-micro cursor-pointer"
            >
              Download .json File
            </button>
          </div>
          {exportedText && (
            <textarea
              readOnly
              rows={4}
              aria-label="Exported save JSON"
              value={exportedText}
              className="w-full px-3 py-2 rounded-lg bg-[#1e0b4b] border border-purple-300/20 text-purple-100 pixel-micro"
            />
          )}

          <div className="pt-2 border-t border-purple-300/20 space-y-2">
            <label htmlFor="settings-import" className="block pixel-micro text-purple-200">
              Import Save JSON
            </label>
            <textarea
              id="settings-import"
              rows={3}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste valid K-pop Idol Tycoon save JSON..."
              className="w-full px-3 py-2 rounded-lg bg-[#1e0b4b] border border-purple-300/30 text-white pixel-micro"
            />
            <button
              type="button"
              onClick={() => {
                if (actions.importSave(importText)) setImportText('');
              }}
              className="px-4 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white pixel-micro cursor-pointer"
            >
              Validate & Load JSON
            </button>
          </div>
        </section>
      </div>

      {/* Options & Danger Zone */}
      <section className="rounded-xl bg-[#2e1065] border border-purple-300/25 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2.5 pixel-micro text-purple-100 cursor-pointer">
            <input
              type="checkbox"
              checked={state.settings.autosaveEnabled}
              onChange={(e) =>
                actions.updateSettings({ autosaveEnabled: e.target.checked })
              }
              className="accent-fuchsia-500 w-4 h-4"
            />
            <span>Autosave Enabled</span>
          </label>
          <label className="flex items-center gap-2.5 pixel-micro text-purple-100 cursor-pointer">
            <input
              type="checkbox"
              checked={state.settings.confirmWeekAdvance}
              onChange={(e) =>
                actions.updateSettings({ confirmWeekAdvance: e.target.checked })
              }
              className="accent-fuchsia-500 w-4 h-4"
            />
            <span>Confirm Before Next Week</span>
          </label>
        </div>

        <button
          type="button"
          onClick={() =>
            requestConfirm({
              title: 'Reset Entire Game?',
              message:
                'This clears your active company and autosave, returning to Company Creation. Manual save slots remain untouched.',
              confirmLabel: 'Reset Game',
              destructive: true,
              onConfirm: actions.resetGame,
            })
          }
          className="px-4 py-2.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white pixel-micro cursor-pointer"
        >
          Reset Current Game
        </button>
      </section>
    </div>
  );
};

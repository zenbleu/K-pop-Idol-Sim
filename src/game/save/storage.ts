import { GameState, SaveSlotMeta } from '../models/types';
import { formatGameDateShort } from '../utils/date';
import { createInitialGameState } from '../logic/initialState';
import { syncAlbumSalesProgress } from '../logic/production';

const AUTOSAVE_KEY = 'kpop_idol_tycoon_autosave_v1';
const SLOTS_INDEX_KEY = 'kpop_idol_tycoon_slots_meta_v1';
const SLOT_PREFIX = 'kpop_idol_tycoon_slot_v1_';

export const SAVE_SLOTS = ['slot_1', 'slot_2', 'slot_3', 'slot_4', 'slot_5'] as const;

function hasStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function migrateGameState(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  if (typeof obj.saveVersion !== 'number' || !obj.company || !obj.date) {
    return null;
  }

  const comp = obj.company as Record<string, unknown>;
  const date = obj.date as Record<string, unknown>;
  if (
    typeof comp.name !== 'string' ||
    typeof comp.money !== 'number' ||
    typeof comp.rubies !== 'number' ||
    typeof date.year !== 'number' ||
    typeof date.month !== 'number' ||
    typeof date.week !== 'number' ||
    typeof date.totalWeeks !== 'number'
  ) {
    return null;
  }

  if (!Array.isArray(obj.idols) || !Array.isArray(obj.groups)) {
    return null;
  }

  const base = createInitialGameState({
    companyName: comp.name,
    ceoName: typeof comp.ceoName === 'string' ? comp.ceoName : 'CEO',
    initialized: Boolean(obj.initialized),
  });

  const merged: GameState = {
    ...base,
    ...(obj as Partial<GameState>),
    saveVersion: 1,
    company: {
      ...base.company,
      ...(comp as Partial<GameState['company']>),
    },
    date: {
      ...base.date,
      ...(date as Partial<GameState['date']>),
    },
    facilities: {
      ...base.facilities,
      ...((obj.facilities as GameState['facilities']) ?? {}),
    },
    weeklyPActivityAvailability:
      (obj.weeklyPActivityAvailability as GameState['weeklyPActivityAvailability']) ?? {},
    settings: {
      ...base.settings,
      ...((obj.settings as GameState['settings']) ?? {}),
    },
  };

  // Apply eligible offline real-time album sales progress cleanly
  return syncAlbumSalesProgress(merged, Date.now()).state;
}

export function saveAutosave(state: GameState): void {
  if (!hasStorage() || !state.initialized) return;
  try {
    window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota exceeded or unavailable; fail gracefully
  }
}

export function loadAutosave(): GameState | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    return migrateGameState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function listSaveSlots(): Record<string, SaveSlotMeta | null> {
  const result: Record<string, SaveSlotMeta | null> = {};
  for (const slot of SAVE_SLOTS) result[slot] = null;
  if (!hasStorage()) return result;
  try {
    const raw = window.localStorage.getItem(SLOTS_INDEX_KEY);
    if (!raw) return result;
    const parsed = JSON.parse(raw) as Record<string, SaveSlotMeta | null>;
    for (const slot of SAVE_SLOTS) {
      result[slot] = parsed[slot] ?? null;
    }
  } catch {
    // ignore
  }
  return result;
}

export function saveToSlot(state: GameState, slotId: string, customLabel?: string): SaveSlotMeta | null {
  if (!hasStorage()) return null;
  try {
    window.localStorage.setItem(`${SLOT_PREFIX}${slotId}`, JSON.stringify(state));
    const meta: SaveSlotMeta = {
      slotId,
      label: customLabel?.trim() || `${state.company.name} (${formatGameDateShort(state.date)})`,
      companyName: state.company.name,
      dateLabel: formatGameDateShort(state.date),
      tierDisplay: state.company.tierDisplay,
      money: state.company.money,
      savedAt: new Date().toISOString(),
    };
    const index = listSaveSlots();
    index[slotId] = meta;
    window.localStorage.setItem(SLOTS_INDEX_KEY, JSON.stringify(index));
    return meta;
  } catch {
    return null;
  }
}

export function loadFromSlot(slotId: string): { ok: boolean; error?: string; state?: GameState } {
  if (!hasStorage()) return { ok: false, error: 'LocalStorage unavailable.' };
  try {
    const raw = window.localStorage.getItem(`${SLOT_PREFIX}${slotId}`);
    if (!raw) return { ok: false, error: 'Save slot is empty.' };
    const migrated = migrateGameState(JSON.parse(raw));
    if (!migrated) return { ok: false, error: 'Save slot data is corrupted or invalid.' };
    return { ok: true, state: migrated };
  } catch {
    return { ok: false, error: 'Failed to parse save slot.' };
  }
}

export function deleteSaveSlot(slotId: string): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(`${SLOT_PREFIX}${slotId}`);
    const index = listSaveSlots();
    index[slotId] = null;
    window.localStorage.setItem(SLOTS_INDEX_KEY, JSON.stringify(index));
  } catch {
    // ignore
  }
}

export function clearAutosave(): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    // ignore
  }
}

export function exportSaveJson(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

export function importSaveJson(jsonText: string): { ok: boolean; error?: string; state?: GameState } {
  try {
    const parsed = JSON.parse(jsonText);
    const migrated = migrateGameState(parsed);
    if (!migrated) {
      return {
        ok: false,
        error: 'Invalid save file format. Missing required company, date, or roster fields.',
      };
    }
    return { ok: true, state: migrated };
  } catch {
    return { ok: false, error: 'Invalid JSON file. Could not parse save data.' };
  }
}

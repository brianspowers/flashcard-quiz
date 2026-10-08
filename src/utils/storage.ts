import type { WordSet, WordStatsMap, GameSummary, WordAttempt } from '../types';
import { getDefaultPresets, getPresetById } from '../data/presetRegistry';

const STORAGE_KEYS = {
  SETS: 'wordquest_sets_v2', // v2 defaults to Woodland Springs Elementary (WSES) 1st Grade Word Book #1
  STATS: 'wordquest_stats_v1',
  HISTORY: 'wordquest_history_v1',
  SOUND_ENABLED: 'wordquest_sound_enabled_v1',
  AUTO_SPEAK: 'wordquest_auto_speak_v1',
};

// Default wordlist sets from the preset registry
export const DEFAULT_SETS: WordSet[] = getDefaultPresets();

// Helper to normalize word key
export function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

// Storage loaders with non-destructive auto-sync for newly released books
export function loadSets(): WordSet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETS);
    if (!raw) {
      const defaults = getDefaultPresets();
      saveSets(defaults);
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Auto-sync any default presets that are not yet in user sets (e.g. when Book #2 is released)
      let hasUpdates = false;
      const currentSets: WordSet[] = [...parsed];
      const defaultPresets = getDefaultPresets();

      for (const preset of defaultPresets) {
        const alreadyExists = currentSets.some(
          (s) => s.id === preset.id || s.name.trim().toLowerCase() === preset.name.trim().toLowerCase()
        );
        if (!alreadyExists) {
          currentSets.push(preset);
          hasUpdates = true;
          console.info(`[WordQuest] Auto-synced new default set: ${preset.name}`);
        }
      }

      if (hasUpdates) {
        saveSets(currentSets);
      }
      return currentSets;
    }
    const defaults = getDefaultPresets();
    saveSets(defaults);
    return defaults;
  } catch (e) {
    console.error('Failed to load sets from storage', e);
    return getDefaultPresets();
  }
}

// 1-Click Install or Re-sync a preset book
export function installPreset(presetId: string): { success: boolean; message: string; updatedSets: WordSet[] } {
  const presetDef = getPresetById(presetId);
  if (!presetDef) {
    return { success: false, message: `Preset "${presetId}" not found.`, updatedSets: loadSets() };
  }

  const currentSets = loadSets();
  const freshSet = presetDef.getSet();
  const existingIndex = currentSets.findIndex(
    (s) => s.id === freshSet.id || s.name.trim().toLowerCase() === freshSet.name.trim().toLowerCase()
  );

  let updatedSets: WordSet[];
  if (existingIndex >= 0) {
    updatedSets = [...currentSets];
    updatedSets[existingIndex] = freshSet;
  } else {
    updatedSets = [...currentSets, freshSet];
  }

  saveSets(updatedSets);
  const wordCount = freshSet.lists.reduce((acc, l) => acc + l.words.length, 0);
  return {
    success: true,
    message: `Installed "${freshSet.name}" (${freshSet.lists.length} lists, ${wordCount} words)!`,
    updatedSets,
  };
}

export function saveSets(sets: WordSet[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETS, JSON.stringify(sets));
  } catch (e) {
    console.error('Failed to save sets to storage', e);
  }
}

export function loadStats(): WordStatsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load stats from storage', e);
    return {};
  }
}

export function saveStats(stats: WordStatsMap): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats to storage', e);
  }
}

export function loadGameHistory(): GameSummary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load game history from storage', e);
    return [];
  }
}

export function saveGameHistory(history: GameSummary[]): void {
  try {
    // Keep last 100 game summaries
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(-100)));
  } catch (e) {
    console.error('Failed to save game history to storage', e);
  }
}

// Record an individual word result into the stats map
export function recordWordResults(attempts: WordAttempt[]): WordStatsMap {
  const stats = loadStats();
  const now = new Date().toISOString();

  for (const attempt of attempts) {
    const key = normalizeWord(attempt.word);
    const existing = stats[key] || {
      timesCorrect: 0,
      timesIncorrect: 0,
      currentStreak: 0,
    };

    if (attempt.isCorrect) {
      existing.timesCorrect += 1;
      existing.currentStreak = (existing.currentStreak || 0) + 1;
    } else {
      existing.timesIncorrect += 1;
      existing.currentStreak = 0;
    }
    existing.lastPracticed = now;
    stats[key] = existing;
  }

  saveStats(stats);
  return stats;
}

// Clear all recorded statistics (keeps word sets intact)
export function resetAllStats(): void {
  localStorage.removeItem(STORAGE_KEYS.STATS);
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
}

// Reset everything to factory defaults (WSES Word Book #1)
export function resetToDefaults(): { sets: WordSet[]; stats: WordStatsMap; history: GameSummary[] } {
  saveSets(DEFAULT_SETS);
  localStorage.removeItem(STORAGE_KEYS.STATS);
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
  return {
    sets: DEFAULT_SETS,
    stats: {},
    history: [],
  };
}

// Backup & Restore
export function exportData(): string {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sets: loadSets(),
    stats: loadStats(),
    history: loadGameHistory(),
  };
  return JSON.stringify(data, null, 2);
}

// Normalizer to accept flexible input formats during import
function normalizeImportedSets(rawSets: unknown[]): WordSet[] {
  return rawSets.map((rawSet: any, setIdx) => {
    const setId = rawSet.id || `set-${Date.now()}-${setIdx}`;
    const setName = rawSet.name || `Set ${setIdx + 1}`;
    const icon = rawSet.icon || '📚';
    const description = rawSet.description || undefined;

    const lists = Array.isArray(rawSet.lists)
      ? rawSet.lists.map((rawList: any, listIdx: number) => {
          const listId = rawList.id || `list-${Date.now()}-${setIdx}-${listIdx}`;
          const listName = rawList.name || `List ${listIdx + 1}`;
          const listDesc = rawList.description || undefined;

          const words = Array.isArray(rawList.words)
            ? rawList.words.map((w: any, wordIdx: number) => {
                if (typeof w === 'string') {
                  return { id: `w-${Date.now()}-${setIdx}-${listIdx}-${wordIdx}`, word: w.trim() };
                }
                return {
                  id: w.id || `w-${Date.now()}-${setIdx}-${listIdx}-${wordIdx}`,
                  word: String(w.word || '').trim(),
                };
              }).filter((w: { word: string }) => w.word.length > 0)
            : [];

          return {
            id: listId,
            name: listName,
            description: listDesc,
            words,
          };
        })
      : [];

    return {
      id: setId,
      name: setName,
      description,
      icon,
      lists,
    };
  });
}

export function importData(jsonString: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonString);

    let parsedSets: WordSet[] | null = null;

    // Format 1: Full exported backup object `{ sets: [...], stats: {...}, history: [...] }`
    if (data && typeof data === 'object' && Array.isArray(data.sets)) {
      parsedSets = normalizeImportedSets(data.sets);
      if (data.stats && typeof data.stats === 'object') {
        saveStats(data.stats);
      }
      if (data.history && Array.isArray(data.history)) {
        saveGameHistory(data.history);
      }
    } 
    // Format 2: Direct array of sets `[ { name: "...", lists: [...] } ]`
    else if (Array.isArray(data)) {
      parsedSets = normalizeImportedSets(data);
    }
    // Format 3: Single set object `{ name: "...", lists: [...] }`
    else if (data && typeof data === 'object' && data.lists && Array.isArray(data.lists)) {
      parsedSets = normalizeImportedSets([data]);
    }

    if (!parsedSets || parsedSets.length === 0) {
      return { 
        success: false, 
        message: 'Invalid format: JSON must be an exported backup object or an array of sets.' 
      };
    }

    // Smart Merge: Merge incoming sets into existing sets library so Book #2 appends without wiping Book #1
    const currentSets = loadSets();
    const mergedSets = [...currentSets];

    parsedSets.forEach((incomingSet) => {
      const idx = mergedSets.findIndex(
        (s) => s.id === incomingSet.id || s.name.toLowerCase().trim() === incomingSet.name.toLowerCase().trim()
      );
      if (idx >= 0) {
        mergedSets[idx] = incomingSet; // update existing set if same ID or name
      } else {
        mergedSets.push(incomingSet); // append new set (e.g. Book #2)
      }
    });

    saveSets(mergedSets);
    return { success: true, message: `Successfully imported ${parsedSets.length} word set(s)! Total library now has ${mergedSets.length} set(s).` };
  } catch (e) {
    return { success: false, message: `Failed to parse JSON file: ${(e as Error).message}` };
  }
}

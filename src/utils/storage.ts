import type { WordSet, WordStatsMap, GameSummary, WordAttempt } from '../types';

const STORAGE_KEYS = {
  SETS: 'wordquest_sets_v1',
  STATS: 'wordquest_stats_v1',
  HISTORY: 'wordquest_history_v1',
  SOUND_ENABLED: 'wordquest_sound_enabled_v1',
  AUTO_SPEAK: 'wordquest_auto_speak_v1',
};

// Rich default sets with Dolch & Fry sight words and fun vocabulary
export const DEFAULT_SETS: WordSet[] = [
  {
    id: 'set-dolch-sight-words',
    name: 'Dolch Sight Words',
    description: 'Essential high-frequency sight words for early readers',
    icon: '📚',
    color: 'emerald',
    lists: [
      {
        id: 'list-pre-k',
        name: 'Pre-K Primer (List 1)',
        description: 'First early sight words for preschool and pre-k',
        words: [
          { id: 'w-1', word: 'a' },
          { id: 'w-2', word: 'and' },
          { id: 'w-3', word: 'away' },
          { id: 'w-4', word: 'big' },
          { id: 'w-5', word: 'blue' },
          { id: 'w-6', word: 'can' },
          { id: 'w-7', word: 'come' },
          { id: 'w-8', word: 'down' },
          { id: 'w-9', word: 'find' },
          { id: 'w-10', word: 'for' },
        ],
      },
      {
        id: 'list-pre-k-2',
        name: 'Pre-K Primer (List 2)',
        description: 'Common verbs and direction words',
        words: [
          { id: 'w-11', word: 'funny' },
          { id: 'w-12', word: 'go' },
          { id: 'w-13', word: 'help' },
          { id: 'w-14', word: 'here' },
          { id: 'w-15', word: 'in' },
          { id: 'w-16', word: 'is' },
          { id: 'w-17', word: 'it' },
          { id: 'w-18', word: 'jump' },
          { id: 'w-19', word: 'little' },
          { id: 'w-20', word: 'look' },
        ],
      },
      {
        id: 'list-kindergarten-1',
        name: 'Kindergarten (List 1)',
        description: 'Crucial kindergarten sight words',
        words: [
          { id: 'w-21', word: 'all' },
          { id: 'w-22', word: 'am' },
          { id: 'w-23', word: 'are' },
          { id: 'w-24', word: 'at' },
          { id: 'w-25', word: 'ate' },
          { id: 'w-26', word: 'be' },
          { id: 'w-27', word: 'black' },
          { id: 'w-28', word: 'brown' },
          { id: 'w-29', word: 'but' },
          { id: 'w-30', word: 'came' },
        ],
      },
      {
        id: 'list-kindergarten-2',
        name: 'Kindergarten (List 2)',
        description: 'More kindergarten essentials',
        words: [
          { id: 'w-31', word: 'did' },
          { id: 'w-32', word: 'do' },
          { id: 'w-33', word: 'eat' },
          { id: 'w-34', word: 'four' },
          { id: 'w-35', word: 'get' },
          { id: 'w-36', word: 'good' },
          { id: 'w-37', word: 'have' },
          { id: 'w-38', word: 'he' },
          { id: 'w-39', word: 'into' },
          { id: 'w-40', word: 'like' },
        ],
      },
      {
        id: 'list-first-grade',
        name: 'First Grade Core',
        description: 'First grade reading staples',
        words: [
          { id: 'w-41', word: 'after' },
          { id: 'w-42', word: 'again' },
          { id: 'w-43', word: 'an' },
          { id: 'w-44', word: 'any' },
          { id: 'w-45', word: 'ask' },
          { id: 'w-46', word: 'by' },
          { id: 'w-47', word: 'could' },
          { id: 'w-48', word: 'every' },
          { id: 'w-49', word: 'fly' },
          { id: 'w-50', word: 'from' },
        ],
      },
    ],
  },
  {
    id: 'set-fun-themes',
    name: 'Everyday Explorer',
    description: 'Animals, colors, nature, and food words kids love to read',
    icon: '🦁',
    color: 'amber',
    lists: [
      {
        id: 'list-animals',
        name: 'Creatures & Pets',
        description: 'Familiar animal names',
        words: [
          { id: 'w-101', word: 'cat' },
          { id: 'w-102', word: 'dog' },
          { id: 'w-103', word: 'fish' },
          { id: 'w-104', word: 'bird' },
          { id: 'w-105', word: 'duck' },
          { id: 'w-106', word: 'frog' },
          { id: 'w-107', word: 'bear' },
          { id: 'w-108', word: 'lion' },
        ],
      },
      {
        id: 'list-colors-shapes',
        name: 'Colors & Magic',
        description: 'Bright descriptive words',
        words: [
          { id: 'w-109', word: 'red' },
          { id: 'w-110', word: 'blue' },
          { id: 'w-111', word: 'green' },
          { id: 'w-112', word: 'yellow' },
          { id: 'w-113', word: 'pink' },
          { id: 'w-114', word: 'purple' },
          { id: 'w-115', word: 'star' },
          { id: 'w-116', word: 'moon' },
          { id: 'w-117', word: 'sun' },
        ],
      },
      {
        id: 'list-food-kitchen',
        name: 'Yummy Treats',
        description: 'Food and drink words',
        words: [
          { id: 'w-118', word: 'apple' },
          { id: 'w-119', word: 'banana' },
          { id: 'w-120', word: 'milk' },
          { id: 'w-121', word: 'water' },
          { id: 'w-122', word: 'bread' },
          { id: 'w-123', word: 'cookie' },
        ],
      },
    ],
  },
];

// Helper to normalize word key
export function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

// Storage loaders
export function loadSets(): WordSet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETS);
    if (!raw) {
      saveSets(DEFAULT_SETS);
      return DEFAULT_SETS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_SETS;
  } catch (e) {
    console.error('Failed to load sets from storage', e);
    return DEFAULT_SETS;
  }
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

// Reset everything to factory defaults
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

export function importData(jsonString: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!data.sets || !Array.isArray(data.sets)) {
      return { success: false, message: 'Invalid file format: missing sets list' };
    }
    saveSets(data.sets);
    if (data.stats && typeof data.stats === 'object') {
      saveStats(data.stats);
    }
    if (data.history && Array.isArray(data.history)) {
      saveGameHistory(data.history);
    }
    return { success: true, message: 'Data restored successfully!' };
  } catch (e) {
    return { success: false, message: `Failed to parse backup JSON: ${(e as Error).message}` };
  }
}

import type { WordSet } from '../types';
import wsesBook1Raw from './presets/wses-1st-grade-book-1.json';
import dolchRaw from './presets/dolch-sight-words.json';
import themesRaw from './presets/everyday-explorer-themes.json';

export interface PresetDefinition {
  id: string;
  name: string;
  category: 'Official WSES' | 'Sight Words' | 'Themed Vocabulary';
  description: string;
  icon: string;
  color: string;
  wordCount: number;
  listCount: number;
  isDefaultAutoLoaded: boolean; // Auto-synced to localStorage for all users on app launch
  getSet: () => WordSet;
}

// Hydrates a preset raw JSON object into a typed WordSet with consistent IDs
function hydratePreset(raw: any, fallbackColor: string = 'emerald'): WordSet {
  const setId = raw.id || `set-${raw.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return {
    id: setId,
    name: raw.name,
    description: raw.description,
    icon: raw.icon || '📚',
    color: raw.color || fallbackColor,
    lists: (raw.lists || []).map((l: any, lIdx: number) => {
      const listId = l.id || `${setId}-list-${lIdx + 1}`;
      return {
        id: listId,
        name: l.name,
        description: l.description,
        words: (l.words || []).map((w: any, wIdx: number) => {
          if (typeof w === 'string') {
            return {
              id: `${listId}-w-${wIdx + 1}`,
              word: w.trim(),
            };
          }
          return {
            id: w.id || `${listId}-w-${wIdx + 1}`,
            word: String(w.word || '').trim(),
          };
        }),
      };
    }),
  };
}

export const PRESET_REGISTRY: PresetDefinition[] = [
  {
    id: 'set-wses-1st-grade-book-1',
    name: 'WSES 1st Grade - Book #1',
    category: 'Official WSES',
    description: 'Woodland Springs Elementary (WSES) 1st Grade - High Frequency Word Book #1 (100 words)',
    icon: '🏫',
    color: 'emerald',
    wordCount: 100,
    listCount: 10,
    isDefaultAutoLoaded: true,
    getSet: () => hydratePreset(wsesBook1Raw, 'emerald'),
  },
  {
    id: 'set-dolch-sight-words',
    name: 'Dolch Sight Words',
    category: 'Sight Words',
    description: 'Essential high-frequency sight words for early readers (Pre-K to 1st Grade)',
    icon: '📚',
    color: 'amber',
    wordCount: 50,
    listCount: 5,
    isDefaultAutoLoaded: false,
    getSet: () => hydratePreset(dolchRaw, 'amber'),
  },
  {
    id: 'set-everyday-explorer',
    name: 'Everyday Explorer',
    category: 'Themed Vocabulary',
    description: 'Animals, colors, nature, and food words kids love to read',
    icon: '🦁',
    color: 'purple',
    wordCount: 23,
    listCount: 3,
    isDefaultAutoLoaded: false,
    getSet: () => hydratePreset(themesRaw, 'purple'),
  },
];

// Returns all presets marked as auto-loaded defaults
export function getDefaultPresets(): WordSet[] {
  return PRESET_REGISTRY.filter((p) => p.isDefaultAutoLoaded).map((p) => p.getSet());
}

// Find a preset definition by its ID
export function getPresetById(id: string): PresetDefinition | undefined {
  return PRESET_REGISTRY.find((p) => p.id === id);
}

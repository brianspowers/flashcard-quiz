export interface WordItem {
  id: string;
  word: string;
}

export interface WordList {
  id: string;
  name: string;
  description?: string;
  words: WordItem[];
}

export interface WordSet {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string; // Tailwind color theme identifier, e.g., 'amber', 'emerald', 'sky', 'purple'
  lists: WordList[];
}

export interface WordStats {
  timesCorrect: number;
  timesIncorrect: number;
  currentStreak: number;
  lastPracticed?: string; // ISO date string
}

// Map of word (lowercase trimmed) to its overall statistics
export type WordStatsMap = Record<string, WordStats>;

export type GameTargetType = 'set' | 'list';

export interface GameConfig {
  targetType: GameTargetType;
  setId: string;
  setName: string;
  listId?: string;
  listName?: string;
  words: WordItem[];
}

export interface WordAttempt {
  wordId: string;
  word: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface GameSummary {
  id: string;
  completedAt: string;
  targetType: GameTargetType;
  targetName: string;
  totalWords: number;
  correctCount: number;
  incorrectCount: number;
  finalScore: number;
  accuracy: number;
  attempts: WordAttempt[];
  missedWords: string[];
}

export type ActiveTab = 'play' | 'stats' | 'admin';

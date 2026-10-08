import type { WordItem, WordStatsMap } from '../types';
import { normalizeWord } from './storage';

export interface SubsetCandidate {
  item: WordItem;
  practiceCount: number;
  timesCorrect: number;
  timesIncorrect: number;
  currentStreak: number;
  lastPracticed?: string;
  randomRank: number;
}

export interface SubsetDistributionSummary {
  minPractices: number;
  maxPractices: number;
  zeroAttemptCount: number;
  totalUniqueWords: number;
}

export type SessionSizeType = 'subset' | 'all' | 'struggling';

export interface SessionSizeOption {
  type: SessionSizeType;
  count: number;
  label: string;
  subtitle: string;
  disabled?: boolean;
}

/**
 * Returns available session size options for a set, including bite-sized subsets,
 * struggling words review, and the option to play the entire set.
 */
export function getSessionSizeOptions(
  totalWords: number,
  strugglingCount: number = 0
): SessionSizeOption[] {
  if (totalWords <= 0) return [];

  const options: SessionSizeOption[] = [];

  // For very small sets (<= 6 words), offering just the full set
  if (totalWords <= 6) {
    options.push({
      type: 'all',
      count: totalWords,
      label: `All ${totalWords} Words`,
      subtitle: 'Entire Set 📚',
    });
  } else {
    // Subset options: sensible step sizes strictly less than totalWords
    const candidateSteps = [10, 20, 30, 50];
    const validSteps = candidateSteps.filter((step) => step < totalWords);

    if (validSteps.length === 0) {
      const half = Math.floor(totalWords / 2);
      if (half >= 3) {
        options.push({
          type: 'subset',
          count: half,
          label: `${half} Words`,
          subtitle: 'Half Set',
        });
      }
    } else {
      validSteps.forEach((step) => {
        const subtitle =
          step === 10
            ? 'Quick Warm-up'
            : step === 20
            ? 'Light Review'
            : step === 30
            ? 'Recommended Goal ⭐'
            : 'Deep Practice';
        options.push({
          type: 'subset',
          count: step,
          label: `${step} Words`,
          subtitle,
        });
      });
    }

    // Always include the "All Words" option
    options.push({
      type: 'all',
      count: totalWords,
      label: `All ${totalWords} Words`,
      subtitle: 'Entire Set 📚',
    });
  }

  // Struggling Words Option (Per-Set)
  if (strugglingCount > 0) {
    const sessionCount = Math.min(strugglingCount, 25);
    options.push({
      type: 'struggling',
      count: sessionCount,
      label: strugglingCount > 25 ? `Top ${sessionCount} Struggling` : `${strugglingCount} Struggling Words`,
      subtitle: 'Needs Review 🎯',
    });
  } else {
    options.push({
      type: 'struggling',
      count: 0,
      label: 'Struggling Words',
      subtitle: '0 Words (All Mastered! 🌟)',
      disabled: true,
    });
  }

  return options;
}

/**
 * Selects `count` words from `allWords`, prioritizing words that have been
 * selected/practiced the fewest total times (timesCorrect + timesIncorrect),
 * to ensure an even distribution across games.
 * Words with equal practice counts are picked uniformly at random.
 */
export function selectSubsetWords(
  allWords: WordItem[],
  count: number,
  stats: WordStatsMap
): {
  selected: WordItem[];
  summary: SubsetDistributionSummary;
} {
  // Deduplicate words in the set by normalized word
  const seen = new Set<string>();
  const uniqueWords: WordItem[] = [];
  for (const item of allWords) {
    const key = normalizeWord(item.word);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueWords.push(item);
    }
  }

  const targetCount = Math.min(count, uniqueWords.length);

  // Annotate each word with its current practice count
  const candidates: SubsetCandidate[] = uniqueWords.map((item) => {
    const key = normalizeWord(item.word);
    const wordStat = stats[key];
    const timesCorrect = wordStat?.timesCorrect || 0;
    const timesIncorrect = wordStat?.timesIncorrect || 0;
    const practiceCount = timesCorrect + timesIncorrect;

    return {
      item,
      practiceCount,
      timesCorrect,
      timesIncorrect,
      currentStreak: wordStat?.currentStreak || 0,
      lastPracticed: wordStat?.lastPracticed,
      randomRank: Math.random(),
    };
  });

  // Sort ascending by practiceCount (fewest first), tie-break with random rank
  candidates.sort((a, b) => {
    if (a.practiceCount !== b.practiceCount) {
      return a.practiceCount - b.practiceCount;
    }
    return a.randomRank - b.randomRank;
  });

  const chosenCandidates = candidates.slice(0, targetCount);

  // Summary statistics for feedback display
  const practiceCounts = chosenCandidates.map((c) => c.practiceCount);
  const minPractices = practiceCounts.length > 0 ? Math.min(...practiceCounts) : 0;
  const maxPractices = practiceCounts.length > 0 ? Math.max(...practiceCounts) : 0;
  const zeroAttemptCount = chosenCandidates.filter((c) => c.practiceCount === 0).length;

  // Shuffle chosen candidates so the flashcard display order during play is random
  const shuffledSelected = chosenCandidates
    .map((c) => c.item)
    .sort(() => Math.random() - 0.5);

  return {
    selected: shuffledSelected,
    summary: {
      minPractices,
      maxPractices,
      zeroAttemptCount,
      totalUniqueWords: uniqueWords.length,
    },
  };
}

export interface StrugglingWordCandidate {
  item: WordItem;
  accuracy: number;
  timesCorrect: number;
  timesIncorrect: number;
  currentStreak: number;
  lastPracticed?: string;
}

/**
 * Identifies and ranks words in a set that the user has struggled with the most.
 *
 * Criteria:
 * - Has been practiced at least once (attempts > 0).
 * - Has at least 1 mistake (timesIncorrect > 0) AND (accuracy < 70% OR currentStreak < 2).
 *
 * Ranked by:
 * 1. Lowest accuracy first
 * 2. Highest timesIncorrect
 * 3. Lowest current streak
 * 4. Most recently practiced
 */
export function getStrugglingWords(
  allWords: WordItem[],
  stats: WordStatsMap,
  maxCount?: number
): {
  words: WordItem[];
  candidates: StrugglingWordCandidate[];
  totalStruggling: number;
} {
  const seen = new Set<string>();
  const uniqueWords: WordItem[] = [];
  for (const item of allWords) {
    const key = normalizeWord(item.word);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueWords.push(item);
    }
  }

  const struggling: StrugglingWordCandidate[] = [];

  for (const item of uniqueWords) {
    const key = normalizeWord(item.word);
    const s = stats[key];
    if (!s) continue;

    const total = s.timesCorrect + s.timesIncorrect;
    if (total === 0) continue;

    const accuracy = Math.round((s.timesCorrect / total) * 100);
    const hasMistake = s.timesIncorrect > 0;
    const isLowAccuracy = accuracy < 70;
    const isBrokenStreak = s.currentStreak < 2;

    if (hasMistake && (isLowAccuracy || isBrokenStreak)) {
      struggling.push({
        item,
        accuracy,
        timesCorrect: s.timesCorrect,
        timesIncorrect: s.timesIncorrect,
        currentStreak: s.currentStreak,
        lastPracticed: s.lastPracticed,
      });
    }
  }

  // Sort by struggle priority
  struggling.sort((a, b) => {
    if (a.accuracy !== b.accuracy) {
      return a.accuracy - b.accuracy;
    }
    if (a.timesIncorrect !== b.timesIncorrect) {
      return b.timesIncorrect - a.timesIncorrect;
    }
    if (a.currentStreak !== b.currentStreak) {
      return a.currentStreak - b.currentStreak;
    }
    return (b.lastPracticed || '').localeCompare(a.lastPracticed || '');
  });

  const targetCandidates = maxCount ? struggling.slice(0, maxCount) : struggling;

  // Shuffle for game presentation so child doesn't see them in strict score order
  const shuffledWords = targetCandidates
    .map((c) => c.item)
    .sort(() => Math.random() - 0.5);

  return {
    words: shuffledWords,
    candidates: targetCandidates,
    totalStruggling: struggling.length,
  };
}

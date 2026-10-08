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

export interface SessionSizeOption {
  count: number;
  isAll: boolean;
  label: string;
  subtitle: string;
}

/**
 * Returns available session size options for a set, including bite-sized subsets
 * and the option to play the entire set.
 */
export function getSessionSizeOptions(totalWords: number): SessionSizeOption[] {
  if (totalWords <= 0) return [];

  // For very small sets (<= 6 words), offering just the full set makes the most sense
  if (totalWords <= 6) {
    return [
      {
        count: totalWords,
        isAll: true,
        label: `All ${totalWords} Words`,
        subtitle: 'Entire Set 📚',
      },
    ];
  }

  const options: SessionSizeOption[] = [];

  // Subset options: sensible step sizes strictly less than totalWords
  const candidateSteps = [10, 20, 30, 50];
  const validSteps = candidateSteps.filter((step) => step < totalWords);

  if (validSteps.length === 0) {
    const half = Math.floor(totalWords / 2);
    if (half >= 3) {
      options.push({
        count: half,
        isAll: false,
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
        count: step,
        isAll: false,
        label: `${step} Words`,
        subtitle,
      });
    });
  }

  // Always include the "All Words" option
  options.push({
    count: totalWords,
    isAll: true,
    label: `All ${totalWords} Words`,
    subtitle: 'Entire Set 📚',
  });

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

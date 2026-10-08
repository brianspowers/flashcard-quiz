import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Target, 
  Award, 
  Flame, 
  Search, 
  Layers, 
  ListFilter, 
  Type, 
  RotateCcw, 
  Volume2, 
  History, 
  AlertTriangle 
} from 'lucide-react';
import type { WordSet, WordStatsMap, GameSummary } from '../types';
import { normalizeWord } from '../utils/storage';
import { speakWord } from '../utils/audio';

interface StatsDashboardProps {
  sets: WordSet[];
  stats: WordStatsMap;
  history: GameSummary[];
  onResetStats: () => void;
}

type StatsViewLevel = 'sets' | 'lists' | 'words' | 'history';

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  sets,
  stats,
  history,
  onResetStats,
}) => {
  const [viewLevel, setViewLevel] = useState<StatsViewLevel>('sets');
  const [wordSearch, setWordSearch] = useState('');
  const [wordFilter, setWordFilter] = useState<'all' | 'needs-work' | 'mastered' | 'unplayed'>('all');
  const [wordSort, setWordSort] = useState<'accuracy-asc' | 'accuracy-desc' | 'attempts-desc' | 'alpha'>('accuracy-asc');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Overall KPIs calculation
  const kpis = useMemo(() => {
    let totalUniqueWords = 0;
    const uniqueWordKeys = new Set<string>();

    sets.forEach((s) => {
      s.lists.forEach((l) => {
        l.words.forEach((w) => {
          uniqueWordKeys.add(normalizeWord(w.word));
        });
      });
    });
    totalUniqueWords = uniqueWordKeys.size;

    let totalCorrect = 0;
    let totalIncorrect = 0;
    let masteredCount = 0;
    let needsWorkCount = 0;

    uniqueWordKeys.forEach((key) => {
      const s = stats[key];
      if (s) {
        totalCorrect += s.timesCorrect;
        totalIncorrect += s.timesIncorrect;
        const total = s.timesCorrect + s.timesIncorrect;
        if (total >= 2) {
          const acc = s.timesCorrect / total;
          if (acc >= 0.8) masteredCount++;
          else if (acc < 0.6) needsWorkCount++;
        }
      }
    });

    const totalAttempts = totalCorrect + totalIncorrect;
    const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    return {
      totalUniqueWords,
      totalAttempts,
      totalCorrect,
      totalIncorrect,
      overallAccuracy,
      masteredCount,
      needsWorkCount,
    };
  }, [sets, stats]);

  // Set-level data
  const setSummaries = useMemo(() => {
    return sets.map((set) => {
      const allWords = set.lists.flatMap((l) => l.words);
      let setCorrect = 0;
      let setIncorrect = 0;

      allWords.forEach((w) => {
        const s = stats[normalizeWord(w.word)];
        if (s) {
          setCorrect += s.timesCorrect;
          setIncorrect += s.timesIncorrect;
        }
      });

      const total = setCorrect + setIncorrect;
      const accuracy = total > 0 ? Math.round((setCorrect / total) * 100) : null;

      return {
        id: set.id,
        name: set.name,
        icon: set.icon,
        description: set.description,
        listCount: set.lists.length,
        wordCount: allWords.length,
        totalAttempts: total,
        correct: setCorrect,
        incorrect: setIncorrect,
        accuracy,
        lists: set.lists,
      };
    });
  }, [sets, stats]);

  // List-level data
  const listSummaries = useMemo(() => {
    const results: Array<{
      id: string;
      setName: string;
      setIcon?: string;
      listName: string;
      wordCount: number;
      totalAttempts: number;
      correct: number;
      incorrect: number;
      accuracy: number | null;
      words: Array<{ id: string; word: string }>;
    }> = [];

    sets.forEach((set) => {
      set.lists.forEach((list) => {
        let lCorrect = 0;
        let lIncorrect = 0;

        list.words.forEach((w) => {
          const s = stats[normalizeWord(w.word)];
          if (s) {
            lCorrect += s.timesCorrect;
            lIncorrect += s.timesIncorrect;
          }
        });

        const total = lCorrect + lIncorrect;
        const accuracy = total > 0 ? Math.round((lCorrect / total) * 100) : null;

        results.push({
          id: list.id,
          setName: set.name,
          setIcon: set.icon,
          listName: list.name,
          wordCount: list.words.length,
          totalAttempts: total,
          correct: lCorrect,
          incorrect: lIncorrect,
          accuracy,
          words: list.words,
        });
      });
    });

    return results;
  }, [sets, stats]);

  // Individual Word-level data
  const wordRows = useMemo(() => {
    const map = new Map<string, {
      word: string;
      sources: Array<{ setName: string; listName: string }>;
      stats?: {
        timesCorrect: number;
        timesIncorrect: number;
        currentStreak: number;
        lastPracticed?: string;
      };
    }>();

    sets.forEach((set) => {
      set.lists.forEach((list) => {
        list.words.forEach((item) => {
          const key = normalizeWord(item.word);
          const existing = map.get(key);
          if (existing) {
            existing.sources.push({ setName: set.name, listName: list.name });
          } else {
            map.set(key, {
              word: item.word,
              sources: [{ setName: set.name, listName: list.name }],
              stats: stats[key],
            });
          }
        });
      });
    });

    let list = Array.from(map.values()).map((item) => {
      const correct = item.stats?.timesCorrect || 0;
      const incorrect = item.stats?.timesIncorrect || 0;
      const total = correct + incorrect;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : null;
      const streak = item.stats?.currentStreak || 0;
      const lastPracticed = item.stats?.lastPracticed;

      let status: 'mastered' | 'needs-work' | 'practicing' | 'unplayed' = 'unplayed';
      if (total === 0) {
        status = 'unplayed';
      } else if (accuracy !== null && accuracy >= 80 && total >= 2) {
        status = 'mastered';
      } else if (accuracy !== null && accuracy < 60) {
        status = 'needs-work';
      } else {
        status = 'practicing';
      }

      return {
        ...item,
        total,
        correct,
        incorrect,
        accuracy,
        streak,
        lastPracticed,
        status,
      };
    });

    // Apply Search
    if (wordSearch) {
      const term = wordSearch.toLowerCase();
      list = list.filter((r) => r.word.toLowerCase().includes(term));
    }

    // Apply Filter
    if (wordFilter === 'mastered') {
      list = list.filter((r) => r.status === 'mastered');
    } else if (wordFilter === 'needs-work') {
      list = list.filter((r) => r.status === 'needs-work');
    } else if (wordFilter === 'unplayed') {
      list = list.filter((r) => r.status === 'unplayed');
    }

    // Apply Sort
    list.sort((a, b) => {
      if (wordSort === 'accuracy-asc') {
        if (a.accuracy === null && b.accuracy === null) return a.word.localeCompare(b.word);
        if (a.accuracy === null) return 1;
        if (b.accuracy === null) return -1;
        return a.accuracy - b.accuracy;
      } else if (wordSort === 'accuracy-desc') {
        if (a.accuracy === null && b.accuracy === null) return a.word.localeCompare(b.word);
        if (a.accuracy === null) return 1;
        if (b.accuracy === null) return -1;
        return b.accuracy - a.accuracy;
      } else if (wordSort === 'attempts-desc') {
        return b.total - a.total;
      } else {
        return a.word.localeCompare(b.word);
      }
    });

    return list;
  }, [sets, stats, wordSearch, wordFilter, wordSort]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-fun text-3xl sm:text-4xl font-extrabold text-slate-800 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-amber-500" />
            <span>Learning Analytics</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Track child progress across Sets, Lists, and individual Words.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Stats</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Words</span>
            <Type className="w-4 h-4 text-orange-500" />
          </div>
          <div className="font-fun text-2xl sm:text-3xl font-bold text-slate-800">
            {kpis.totalUniqueWords}
          </div>
          <span className="text-xs text-slate-500 font-medium">in library</span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Overall Accuracy</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-fun text-2xl sm:text-3xl font-bold text-emerald-600">
            {kpis.overallAccuracy}%
          </div>
          <span className="text-xs text-slate-500 font-medium">{kpis.totalAttempts} total attempts</span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Mastered Words</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="font-fun text-2xl sm:text-3xl font-bold text-purple-600">
            {kpis.masteredCount}
          </div>
          <span className="text-xs text-slate-500 font-medium">&ge;80% accuracy</span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Needs Practice</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="font-fun text-2xl sm:text-3xl font-bold text-rose-600">
            {kpis.needsWorkCount}
          </div>
          <span className="text-xs text-slate-500 font-medium">&lt;60% accuracy</span>
        </div>
      </div>

      {/* Level View Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4 mb-6 overflow-x-auto">
        <button
          onClick={() => setViewLevel('sets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 cursor-pointer ${
            viewLevel === 'sets'
              ? 'bg-amber-500 text-white shadow-sm shadow-amber-300'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>By Set Level</span>
        </button>

        <button
          onClick={() => setViewLevel('lists')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 cursor-pointer ${
            viewLevel === 'lists'
              ? 'bg-amber-500 text-white shadow-sm shadow-amber-300'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>By List Level</span>
        </button>

        <button
          onClick={() => setViewLevel('words')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 cursor-pointer ${
            viewLevel === 'words'
              ? 'bg-amber-500 text-white shadow-sm shadow-amber-300'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Individual Words</span>
        </button>

        <button
          onClick={() => setViewLevel('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 cursor-pointer ${
            viewLevel === 'history'
              ? 'bg-amber-500 text-white shadow-sm shadow-amber-300'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Game History ({history.length})</span>
        </button>
      </div>

      {/* Content for View Level */}

      {/* 1. SET LEVEL */}
      {viewLevel === 'sets' && (
        <div className="space-y-4">
          {setSummaries.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <span className="text-3xl p-2.5 rounded-xl bg-amber-50 border border-amber-200/50">
                    {s.icon || '📚'}
                  </span>
                  <div>
                    <h3 className="font-fun text-xl font-bold text-slate-800">{s.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {s.listCount} lists • {s.wordCount} words
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-xs uppercase font-bold text-slate-400 block">Accuracy</span>
                    <span className="font-fun text-2xl font-bold text-slate-800">
                      {s.accuracy !== null ? `${s.accuracy}%` : 'Unplayed'}
                    </span>
                  </div>

                  <div className="text-right border-l pl-4 border-slate-100">
                    <span className="text-xs uppercase font-bold text-slate-400 block">Performance</span>
                    <span className="text-xs font-semibold text-slate-600">
                      <span className="text-emerald-600 font-bold">{s.correct} ✓</span> /{' '}
                      <span className="text-rose-600 font-bold">{s.incorrect} ✗</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all"
                    style={{ width: `${s.accuracy || 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. LIST LEVEL */}
      {viewLevel === 'lists' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">List Name</th>
                  <th className="px-5 py-3.5">Parent Set</th>
                  <th className="px-5 py-3.5">Words</th>
                  <th className="px-5 py-3.5">Total Attempts</th>
                  <th className="px-5 py-3.5">Correct / Incorrect</th>
                  <th className="px-5 py-3.5">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listSummaries.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-fun font-bold text-slate-800">
                      {l.listName}
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-slate-500">
                      <span className="mr-1">{l.setIcon}</span> {l.setName}
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-semibold">
                      {l.wordCount}
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-semibold">
                      {l.totalAttempts}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold">
                      <span className="text-emerald-600 font-bold">{l.correct}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-rose-600 font-bold">{l.incorrect}</span>
                    </td>
                    <td className="px-5 py-4">
                      {l.accuracy !== null ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            l.accuracy >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : l.accuracy >= 60
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {l.accuracy}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Unplayed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. INDIVIDUAL WORD LEVEL */}
      {viewLevel === 'words' && (
        <div className="space-y-4">
          {/* Controls: Search, Filter, Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Find specific word..."
                value={wordSearch}
                onChange={(e) => setWordSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={wordFilter}
                onChange={(e) => setWordFilter(e.target.value as any)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer"
              >
                <option value="all">All Words</option>
                <option value="needs-work">Needs Focus (&lt;60%)</option>
                <option value="mastered">Mastered (&ge;80%)</option>
                <option value="unplayed">Not Practiced Yet</option>
              </select>

              <select
                value={wordSort}
                onChange={(e) => setWordSort(e.target.value as any)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer"
              >
                <option value="accuracy-asc">Struggling Words First</option>
                <option value="accuracy-desc">Highest Accuracy First</option>
                <option value="attempts-desc">Most Practiced</option>
                <option value="alpha">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Words Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Word</th>
                    <th className="px-5 py-3.5">Lists</th>
                    <th className="px-5 py-3.5">Correct</th>
                    <th className="px-5 py-3.5">Incorrect</th>
                    <th className="px-5 py-3.5">Accuracy</th>
                    <th className="px-5 py-3.5">Streak</th>
                    <th className="px-5 py-3.5">Audio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wordRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                        No words match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    wordRows.map((r) => (
                      <tr key={r.word} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-fun text-lg font-bold text-slate-800">
                            {r.word}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 max-w-xs truncate">
                          {r.sources.map((s) => s.listName).join(', ')}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-emerald-600">
                          {r.correct}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-rose-600">
                          {r.incorrect}
                        </td>
                        <td className="px-5 py-3.5">
                          {r.accuracy !== null ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                                r.accuracy >= 80
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.accuracy >= 60
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {r.accuracy}%
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Unplayed</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">
                          {r.streak > 0 ? (
                            <span className="flex items-center gap-1 text-orange-600 font-bold">
                              <Flame className="w-3.5 h-3.5 fill-current" />
                              {r.streak}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => speakWord(r.word)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
                            title={`Listen to "${r.word}"`}
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. GAME HISTORY */}
      {viewLevel === 'history' && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-fun text-lg font-bold text-slate-700">No game sessions completed yet</h3>
              <p className="text-xs text-slate-500">Play a round from the Play tab to see your game records here!</p>
            </div>
          ) : (
            history.slice().reverse().map((game) => (
              <div
                key={game.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-fun text-base font-bold text-slate-800">
                      {game.targetName}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-600 uppercase">
                      {game.targetType}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(game.completedAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-400 block">Final Score</span>
                    <span className={`font-fun text-lg font-extrabold ${game.finalScore >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {game.finalScore > 0 ? `+${game.finalScore}` : game.finalScore}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs uppercase font-bold text-slate-400 block">Accuracy</span>
                    <span className="font-fun text-lg font-extrabold text-emerald-600">
                      {game.accuracy}%
                    </span>
                  </div>

                  <div>
                    <span className="text-xs uppercase font-bold text-slate-400 block">Words</span>
                    <span className="text-xs font-semibold text-slate-600">
                      {game.correctCount} / {game.totalWords}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reset Stats Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-xl border border-slate-200">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h4 className="font-fun text-xl font-bold text-slate-800 mb-2">Reset All Stats?</h4>
            <p className="text-xs text-slate-600 mb-6">
              This will clear all word accuracy records, streaks, and game history. Word sets and lists will not be deleted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onResetStats();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
              >
                Yes, Reset Stats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

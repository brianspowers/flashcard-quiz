import React, { useState } from 'react';
import { 
  Play, 
  ListFilter, 
  Sparkles, 
  ChevronRight, 
  ChevronDown,
  BookOpen, 
  Award, 
  Search, 
  HelpCircle,
  Dices,
  Check,
  X,
  Target,
  AlertCircle
} from 'lucide-react';
import type { WordSet, WordList, GameConfig, WordStatsMap } from '../types';
import { normalizeWord } from '../utils/storage';
import { 
  getSessionSizeOptions, 
  selectSubsetWords, 
  getStrugglingWords,
  type SessionSizeOption 
} from '../utils/selection';

interface HomeSelectorProps {
  sets: WordSet[];
  stats: WordStatsMap;
  onStartGame: (config: GameConfig) => void;
  onGoToAdmin: () => void;
}

export const HomeSelector: React.FC<HomeSelectorProps> = ({
  sets,
  stats,
  onStartGame,
  onGoToAdmin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  // Map of setId -> expanded boolean (default all collapsed)
  const [expandedSetIds, setExpandedSetIds] = useState<Record<string, boolean>>({});

  const toggleSetExpanded = (setId: string) => {
    setExpandedSetIds((prev) => ({
      ...prev,
      [setId]: !prev[setId],
    }));
  };

  // Helper to compute stats for a collection of words
  const getGroupStats = (words: { word: string }[]) => {
    let totalAttempts = 0;
    let correctAttempts = 0;

    words.forEach((w) => {
      const s = stats[normalizeWord(w.word)];
      if (s) {
        totalAttempts += s.timesCorrect + s.timesIncorrect;
        correctAttempts += s.timesCorrect;
      }
    });

    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : null;
    return { totalAttempts, accuracy };
  };

  // Start game with an entire Set
  const handlePlaySet = (set: WordSet) => {
    // Gather all unique words across all lists in this set
    const seen = new Set<string>();
    const allWords = set.lists.flatMap((list) => list.words).filter((w) => {
      const key = normalizeWord(w.word);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (allWords.length === 0) {
      alert('This set has no words yet! Add some words first in Manage Words.');
      return;
    }

    onStartGame({
      targetType: 'set',
      setId: set.id,
      setName: set.name,
      words: allWords,
    });
  };

  // Start game with a specific List
  const handlePlayList = (set: WordSet, list: WordList) => {
    if (list.words.length === 0) {
      alert('This list has no words yet! Add some words first in Manage Words.');
      return;
    }

    onStartGame({
      targetType: 'list',
      setId: set.id,
      setName: set.name,
      listId: list.id,
      listName: list.name,
      words: list.words,
    });
  };

  // Play Set configuration modal state
  const [playModalSet, setPlayModalSet] = useState<WordSet | null>(null);
  const [selectedOptionKey, setSelectedOptionKey] = useState<string>('subset-30');

  const getOptionKey = (opt: SessionSizeOption) => `${opt.type}-${opt.count}`;

  const handleOpenPlayModal = (set: WordSet) => {
    const allWords = set.lists.flatMap((l) => l.words);
    const seen = new Set<string>();
    const uniqueWords = allWords.filter((w) => {
      const key = normalizeWord(w.word);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (uniqueWords.length === 0) {
      alert('This set has no words yet! Add some words first in Manage Words.');
      return;
    }

    const { totalStruggling } = getStrugglingWords(allWords, stats);
    const options = getSessionSizeOptions(uniqueWords.length, totalStruggling);

    // If small set with only 1 option (e.g. <= 6 words), start full set immediately
    if (options.length === 1 && !options[0].disabled) {
      handlePlaySet(set);
      return;
    }

    // Default to 30 words if available, else first non-disabled option
    const defaultOption =
      options.find((o) => o.type === 'subset' && o.count === 30) ||
      options.find((o) => !o.disabled) ||
      options[0];

    setSelectedOptionKey(getOptionKey(defaultOption));
    setPlayModalSet(set);
  };

  // Calculate modal dynamic preview data
  const modalAllWords = playModalSet ? playModalSet.lists.flatMap((l) => l.words) : [];
  const modalStruggling = playModalSet ? getStrugglingWords(modalAllWords, stats) : null;

  const modalUniqueWordsCount = modalAllWords.filter(
    (w, idx, arr) => arr.findIndex((x) => normalizeWord(x.word) === normalizeWord(w.word)) === idx
  ).length;

  const availableSessionOptions = playModalSet
    ? getSessionSizeOptions(modalUniqueWordsCount, modalStruggling?.totalStruggling || 0)
    : [];

  const selectedOptionObj =
    availableSessionOptions.find((o) => getOptionKey(o) === selectedOptionKey) ||
    availableSessionOptions.find((o) => !o.disabled) ||
    availableSessionOptions[0];

  const subsetPreview =
    playModalSet && selectedOptionObj && selectedOptionObj.type === 'subset'
      ? selectSubsetWords(modalAllWords, selectedOptionObj.count, stats)
      : null;

  const handleStartSession = () => {
    if (!playModalSet || !selectedOptionObj) return;
    const allSetWords = playModalSet.lists.flatMap((l) => l.words);

    if (selectedOptionObj.type === 'all') {
      handlePlaySet(playModalSet);
      setPlayModalSet(null);
      return;
    }

    if (selectedOptionObj.type === 'struggling') {
      const { words } = getStrugglingWords(allSetWords, stats, selectedOptionObj.count);
      onStartGame({
        targetType: 'struggling',
        setId: playModalSet.id,
        setName: playModalSet.name,
        listName: `${playModalSet.name} (Struggling Words Review)`,
        words,
        subsetCount: words.length,
      });
      setPlayModalSet(null);
      return;
    }

    const { selected } = selectSubsetWords(allSetWords, selectedOptionObj.count, stats);
    onStartGame({
      targetType: 'subset',
      setId: playModalSet.id,
      setName: playModalSet.name,
      listName: `${playModalSet.name} (${selected.length} Words)`,
      words: selected,
      subsetCount: selected.length,
    });
    setPlayModalSet(null);
  };

  // Filter sets by search term
  const filteredSets = sets.filter((set) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const matchesSetName = set.name.toLowerCase().includes(term);
    const matchesListName = set.lists.some((l) => l.name.toLowerCase().includes(term));
    const matchesWord = set.lists.some((l) => l.words.some((w) => w.word.toLowerCase().includes(term)));
    return matchesSetName || matchesListName || matchesWord;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-orange-200/50 mb-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4 text-yellow-200" />
            <span>Interactive Word Flashcards</span>
          </div>
          <h1 className="font-fun text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">
            Ready to Read & Score?
          </h1>
          <p className="text-white/90 text-sm sm:text-base font-medium leading-relaxed">
            Choose a <span className="font-bold underline decoration-yellow-300">Set</span> or a specific{' '}
            <span className="font-bold underline decoration-yellow-300">List</span> below. Words are presented randomly. Parents mark <span className="font-bold text-emerald-200">Got It (+1)</span> or <span className="font-bold text-rose-200">Try Again (-1)</span> as the child reads!
          </p>
        </div>

        {/* Decorative background icons */}
        <div className="absolute -right-6 -bottom-8 opacity-15 text-white select-none pointer-events-none text-9xl">
          🌟
        </div>
      </div>

      {/* Control bar: Search & Quick summary */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search sets, lists, or words..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onGoToAdmin}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2.5 rounded-2xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-orange-500" />
            <span>Customize Word Lists</span>
          </button>
        </div>
      </div>

      {/* Sets & Lists Grid */}
      {filteredSets.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 max-w-lg mx-auto">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-fun text-xl font-bold text-slate-700 mb-1">No matching words or lists found</h3>
          <p className="text-sm text-slate-500 mb-4">Try clearing your search term or add custom words in Manage Words.</p>
          <button
            onClick={() => setSearchTerm('')}
            className="text-sm font-bold text-orange-600 hover:underline cursor-pointer"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredSets.map((set) => {
            const isExpanded = !!expandedSetIds[set.id];
            const totalWordsInSet = set.lists.reduce((acc, l) => acc + l.words.length, 0);
            const allSetWords = set.lists.flatMap((l) => l.words);
            const setStats = getGroupStats(allSetWords);
            const setStrugglingCount = getStrugglingWords(allSetWords, stats).totalStruggling;

            return (
              <div
                key={set.id}
                className="bg-white rounded-3xl border-2 border-slate-100 shadow-md hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Set Header */}
                <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-50/80 to-amber-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200/60 flex items-center justify-center text-3xl shadow-xs shrink-0">
                      {set.icon || '📚'}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-fun text-2xl font-bold text-slate-800">
                          {set.name}
                        </h2>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                          {set.lists.length} {set.lists.length === 1 ? 'list' : 'lists'} • {totalWordsInSet} words
                        </span>
                        {setStrugglingCount > 0 && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            {setStrugglingCount} need practice
                          </span>
                        )}
                        {setStats.accuracy !== null && (
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                              setStats.accuracy >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : setStats.accuracy >= 60
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            <Award className="w-3 h-3" />
                            {setStats.accuracy}% accuracy
                          </span>
                        )}
                      </div>
                      {set.description && (
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium max-w-xl">
                          {set.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Set-Level Quick Action: Play Set & Expand/Collapse Toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenPlayModal(set)}
                      disabled={totalWordsInSet === 0}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-fun font-bold text-base shadow-md shadow-orange-300/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play Set</span>
                    </button>

                    <button
                      onClick={() => toggleSetExpanded(set.id)}
                      className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer shadow-2xs"
                      title={isExpanded ? 'Collapse lists' : 'Expand lists'}
                    >
                      <span className="hidden sm:inline">{isExpanded ? 'Hide Lists' : 'Show Lists'}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-orange-600' : 'text-slate-500'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Sub-Lists within Set (Collapsible) */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 animate-pop">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <ListFilter className="w-3.5 h-3.5" />
                      <span>Choose a Specific List:</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {set.lists.map((list) => {
                        const listStats = getGroupStats(list.words);
                        return (
                          <div
                            key={list.id}
                            className="group relative bg-white hover:bg-orange-50/30 rounded-2xl p-4 border border-slate-200/90 hover:border-orange-300 transition-all flex flex-col justify-between shadow-2xs hover:shadow-sm"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-fun font-bold text-slate-800 text-base group-hover:text-orange-600 transition-colors">
                                  {list.name}
                                </h4>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                                  {list.words.length} words
                                </span>
                              </div>
                              {list.description && (
                                <p className="text-xs text-slate-500 mb-3 line-clamp-1">
                                  {list.description}
                                </p>
                              )}

                              {/* Word preview badges */}
                              <div className="flex flex-wrap gap-1 mb-4">
                                {list.words.slice(0, 5).map((w) => (
                                  <span
                                    key={w.id}
                                    className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600"
                                  >
                                    {w.word}
                                  </span>
                                ))}
                                {list.words.length > 5 && (
                                  <span className="text-xs font-medium px-1.5 py-0.5 text-slate-400">
                                    +{list.words.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
                              <div>
                                {listStats.accuracy !== null ? (
                                  <span className="text-xs font-bold text-slate-600">
                                    {listStats.accuracy}% accuracy
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400 font-medium">New / Unplayed</span>
                                )}
                              </div>

                              <button
                                onClick={() => handlePlayList(set, list)}
                                disabled={list.words.length === 0}
                                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-500 text-orange-700 hover:text-white transition-all group-hover:bg-orange-500 group-hover:text-white cursor-pointer"
                              >
                                <span>Play List</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Play Set Configuration Modal */}
      {playModalSet && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-amber-200 animate-pop">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-2xl shrink-0">
                  {playModalSet.icon || '📚'}
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
                    Play Session Setup
                  </span>
                  <h3 className="font-fun text-xl font-bold text-slate-800 leading-snug">
                    {playModalSet.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setPlayModalSet(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Smart Distribution, Struggling Review, or Full Set Explanatory Card */}
            {selectedOptionObj?.type === 'struggling' ? (
              <div className="mb-5 p-3.5 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/80 rounded-2xl text-left">
                <div className="flex items-start gap-2.5">
                  <Target className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-950 leading-relaxed font-medium">
                    <strong className="text-rose-700 font-bold">Struggling Words Review:</strong> Focuses specifically on the {modalStruggling?.totalStruggling} words from this book with low accuracy (&lt;70%) or recent mistakes so your child can master them!
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-5 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl text-left">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    {selectedOptionObj?.type === 'all' ? (
                      <>
                        <strong className="text-orange-700 font-bold">Entire Set Mode:</strong> Practice all {modalUniqueWordsCount} words in the set, presented in random shuffled order.
                      </>
                    ) : (
                      <>
                        <strong className="text-orange-700 font-bold">Smart Even Distribution:</strong> Words practiced the fewest times are chosen first so your child reviews every word in the book evenly over time!
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Session Size Picker */}
            <div className="mb-5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                Choose Session Mode & Size:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {availableSessionOptions.map((opt) => {
                  const optKey = getOptionKey(opt);
                  const isSelected = selectedOptionKey === optKey;
                  const isDisabled = !!opt.disabled;

                  return (
                    <button
                      key={optKey}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setSelectedOptionKey(optKey)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                        isDisabled
                          ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                          : isSelected
                          ? opt.type === 'struggling'
                            ? 'border-rose-500 bg-rose-50 text-rose-950 shadow-xs scale-[1.01] cursor-pointer'
                            : 'border-orange-500 bg-orange-50 text-orange-950 shadow-xs scale-[1.01] cursor-pointer'
                          : opt.type === 'struggling'
                          ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-100/60 text-rose-900 cursor-pointer'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 text-slate-700 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-fun text-base sm:text-lg font-bold flex items-center gap-1.5">
                          {opt.type === 'struggling' && <Target className="w-4 h-4 text-rose-600" />}
                          {opt.label}
                        </span>
                        {isSelected && (
                          <Check className={`w-4 h-4 ${opt.type === 'struggling' ? 'text-rose-600' : 'text-orange-600'}`} />
                        )}
                      </div>
                      <span className={`text-[11px] font-semibold block ${opt.type === 'struggling' && !isDisabled ? 'text-rose-600' : 'text-slate-500'}`}>
                        {opt.subtitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Smart Breakdown / Preview */}
            {subsetPreview && (
              <div className="mb-6 px-3.5 py-2.5 bg-slate-100/80 rounded-xl text-xs text-slate-600 font-medium flex items-center gap-2">
                <Dices className="w-4 h-4 text-orange-500 shrink-0" />
                <span>
                  {subsetPreview.summary.zeroAttemptCount > 0
                    ? `Includes ${subsetPreview.summary.zeroAttemptCount} new word${subsetPreview.summary.zeroAttemptCount === 1 ? '' : 's'} not yet tested!`
                    : `Selected words currently have only ${subsetPreview.summary.minPractices} prior attempt${subsetPreview.summary.minPractices === 1 ? '' : 's'}.`}
                </span>
              </div>
            )}

            {selectedOptionObj?.type === 'struggling' && modalStruggling && modalStruggling.totalStruggling > 0 && (
              <div className="mb-6 px-3.5 py-2.5 bg-rose-50/80 border border-rose-200/60 rounded-xl text-xs text-rose-800 font-medium flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Reviewing {selectedOptionObj.count} words needing focus.</span>
                </div>
                {modalStruggling.candidates[0] && (
                  <span className="text-[11px] font-bold text-rose-600">
                    Lowest: {modalStruggling.candidates[0].accuracy}%
                  </span>
                )}
              </div>
            )}

            {selectedOptionObj?.type === 'all' && (
              <div className="mb-6 px-3.5 py-2.5 bg-slate-100/80 rounded-xl text-xs text-slate-600 font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Full set session containing all {modalUniqueWordsCount} words.</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setPlayModalSet(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartSession}
                className={`flex-2 py-3 px-5 rounded-xl text-white font-fun font-bold text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedOptionObj?.type === 'struggling'
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-rose-300/40'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-300/40'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {selectedOptionObj?.type === 'all'
                    ? `Start (${modalUniqueWordsCount} Words)`
                    : selectedOptionObj?.type === 'struggling'
                    ? `Review (${selectedOptionObj.count} Struggling Words)`
                    : `Start (${selectedOptionObj?.count || 30} Words)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

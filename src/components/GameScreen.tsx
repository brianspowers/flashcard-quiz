import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Check, 
  X, 
  RotateCcw, 
  Volume2, 
  ArrowLeft, 
  Sparkles, 
  Trophy, 
  Flame, 
  Play, 
  AlertCircle 
} from 'lucide-react';
import type { GameConfig, WordItem, WordAttempt, GameSummary } from '../types';
import { sounds, speakWord } from '../utils/audio';

interface GameScreenProps {
  config: GameConfig;
  onFinishGame: (summary: GameSummary) => void;
  onExitGame: () => void;
  onPracticeMissedWords?: (missedWords: string[]) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  config,
  onFinishGame,
  onExitGame,
  onPracticeMissedWords,
}) => {
  // Shuffled word queue initialized on mount
  const [deck, setDeck] = useState<WordItem[]>(() =>
    [...config.words].sort(() => Math.random() - 0.5)
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [runningScore, setRunningScore] = useState<number>(0);
  const [attempts, setAttempts] = useState<WordAttempt[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [scoreDelta, setScoreDelta] = useState<{ amount: number; id: number } | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);

  const currentWordItem = deck[currentIndex];

  // Optional auto-pronounce on word reveal
  useEffect(() => {
    if (autoSpeak && currentWordItem && !isCompleted) {
      speakWord(currentWordItem.word);
    }
  }, [currentIndex, currentWordItem, autoSpeak, isCompleted]);

  // Trigger celebratory confetti
  const fireConfetti = useCallback((isFullCelebration = false) => {
    if (isFullCelebration) {
      // Grand celebratory explosion
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

      const interval: ReturnType<typeof setInterval> = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: 0.2, y: 0.6 } });
        confetti({ ...defaults, particleCount, origin: { x: 0.8, y: 0.6 } });
      }, 250);
    } else {
      // Small celebratory burst for correct answer
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
        disableForReducedMotion: true,
      });
    }
  }, []);

  // Handle parent marking word as correct or incorrect
  const handleAnswer = useCallback(
    (isCorrect: boolean) => {
      if (!currentWordItem || isCompleted) return;

      const newAttempt: WordAttempt = {
        wordId: currentWordItem.id,
        word: currentWordItem.word,
        isCorrect,
        timestamp: new Date().toISOString(),
      };

      const nextAttempts = [...attempts, newAttempt];
      setAttempts(nextAttempts);

      // Score rule: +1 for correct, -1 for incorrect
      const newScore = runningScore + (isCorrect ? 1 : -1);
      setRunningScore(newScore);
      setScoreDelta({ amount: isCorrect ? 1 : -1, id: Date.now() });

      if (isCorrect) {
        sounds.playCorrect();
        setCurrentStreak((prev) => prev + 1);
        fireConfetti(false);
      } else {
        sounds.playIncorrect();
        setCurrentStreak(0);
      }

      // Check if finished
      if (currentIndex + 1 >= deck.length) {
        // Game finished!
        const correctCount = nextAttempts.filter((a) => a.isCorrect).length;
        const incorrectCount = nextAttempts.filter((a) => !a.isCorrect).length;
        const missedWords = Array.from(
          new Set(nextAttempts.filter((a) => !a.isCorrect).map((a) => a.word))
        );
        const accuracy = Math.round((correctCount / nextAttempts.length) * 100);

        const summary: GameSummary = {
          id: 'game-' + Date.now(),
          completedAt: new Date().toISOString(),
          targetType: config.targetType,
          targetName: config.listName || config.setName,
          totalWords: nextAttempts.length,
          correctCount,
          incorrectCount,
          finalScore: newScore,
          accuracy,
          attempts: nextAttempts,
          missedWords,
        };

        setIsCompleted(true);
        sounds.playFanfare();
        fireConfetti(true);
        onFinishGame(summary);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentWordItem, isCompleted, deck.length, attempts, runningScore, currentIndex, config, onFinishGame, fireConfetti]
  );

  // Undo last action (helpful if parent tapped wrong button)
  const handleUndo = useCallback(() => {
    if (attempts.length === 0 || isCompleted) return;

    const lastAttempt = attempts[attempts.length - 1];
    setAttempts((prev) => prev.slice(0, -1));
    setCurrentIndex((prev) => Math.max(0, prev - 1));

    // Revert score
    const revertedScore = runningScore - (lastAttempt.isCorrect ? 1 : -1);
    setRunningScore(revertedScore);

    // Revert streak
    if (lastAttempt.isCorrect) {
      setCurrentStreak((prev) => Math.max(0, prev - 1));
    }
  }, [attempts, isCompleted, runningScore]);

  // Keyboard shortcut support for quick parent review
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted || showExitConfirm) return;

      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ' || e.key === '1') {
        e.preventDefault();
        handleAnswer(true);
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === '0' || e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleAnswer(false);
      } else if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (currentWordItem) speakWord(currentWordItem.word);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAnswer, handleUndo, isCompleted, showExitConfirm, currentWordItem]);

  // Calculate summary stats
  const correctCount = attempts.filter((a) => a.isCorrect).length;
  const accuracyPct = attempts.length > 0 ? Math.round((correctCount / attempts.length) * 100) : 0;
  const missedWordsList = Array.from(new Set(attempts.filter((a) => !a.isCorrect).map((a) => a.word)));

  // If completed, render the celebratory Results screen
  if (isCompleted) {
    const isPerfect = accuracyPct === 100;
    const isGreat = accuracyPct >= 80;

    return (
      <div className="max-w-2xl w-full mx-auto px-4 py-4 sm:py-6 my-auto animate-pop">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-amber-200 text-center relative overflow-hidden">
          {/* Top celebratory banner */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400" />

          {/* Trophy badge */}
          <div className="w-24 h-24 mx-auto mb-5 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-300/50 animate-float">
            <Trophy className="w-14 h-14 text-white drop-shadow-md" />
          </div>

          <h2 className="font-fun text-4xl sm:text-5xl font-extrabold text-slate-800 mb-2">
            {isPerfect ? 'Super Star! 🌟' : isGreat ? 'Awesome Job! 🎉' : 'Great Effort! 💪'}
          </h2>
          <p className="text-slate-600 font-medium text-lg mb-8">
            Completed <span className="font-bold text-orange-600">{config.listName || config.setName}</span>
          </p>

          {/* Score & Stats Pill Grid */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Final Score</span>
              <span className={`font-fun text-3xl sm:text-4xl font-extrabold ${runningScore >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                {runningScore > 0 ? `+${runningScore}` : runningScore}
              </span>
            </div>

            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Correct</span>
              <span className="font-fun text-3xl sm:text-4xl font-extrabold text-emerald-600">
                {correctCount}
              </span>
              <span className="text-xs text-emerald-600/80 font-medium block">of {deck.length} words</span>
            </div>

            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">Accuracy</span>
              <span className="font-fun text-3xl sm:text-4xl font-extrabold text-purple-600">
                {accuracyPct}%
              </span>
            </div>
          </div>

          {/* Missed Words Section */}
          {missedWordsList.length > 0 ? (
            <div className="mb-8 p-5 bg-rose-50/70 border-2 border-rose-200/80 rounded-2xl text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="font-fun text-base font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Words to Practice ({missedWordsList.length}):
                </span>
                {onPracticeMissedWords && (
                  <button
                    onClick={() => onPracticeMissedWords(missedWordsList)}
                    className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Practice These Now
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {missedWordsList.map((word) => (
                  <div
                    key={word}
                    className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-rose-200 shadow-xs"
                  >
                    <span className="font-fun font-bold text-rose-900 text-lg">{word}</span>
                    <button
                      onClick={() => speakWord(word)}
                      title={`Listen to "${word}"`}
                      className="p-1 text-slate-400 hover:text-orange-500 rounded-md hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 font-semibold flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              100% Mastery! Every single word was identified correctly!
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                const shuffled = [...config.words].sort(() => Math.random() - 0.5);
                setDeck(shuffled);
                setCurrentIndex(0);
                setRunningScore(0);
                setAttempts([]);
                setCurrentStreak(0);
                setIsCompleted(false);
              }}
              className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-fun font-bold text-lg shadow-lg shadow-orange-400/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </button>
            <button
              onClick={onExitGame}
              className="flex-1 py-4 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-fun font-bold text-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Sets
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active game view
  const progressPct = deck.length > 0 ? Math.round(((currentIndex) / deck.length) * 100) : 0;

  return (
    <div className="max-w-3xl w-full mx-auto px-4 pt-3.5 pb-2 sm:pt-4.5 sm:pb-3 flex flex-col flex-1 justify-between min-h-0">
      {/* Top Bar: Progress, Score & Exit */}
      <div className="shrink-0">
        <div className="flex items-center justify-between gap-4 mb-2">
          {/* Back/Exit button */}
          <button
            onClick={() => setShowExitConfirm(true)}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-800 bg-white/80 hover:bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit Game</span>
          </button>

          {/* Group Label */}
          <div className="text-center truncate px-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">
              {config.targetType === 'set' ? 'Set Practice' : 'List Practice'}
            </span>
            <h3 className="font-fun font-bold text-slate-800 text-sm sm:text-base truncate">
              {config.listName || config.setName}
            </h3>
          </div>

          {/* Running Score Indicator (Prominent Arcade HUD) */}
          <div className="relative pt-1">
            <div
              className={`flex items-center gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl font-fun font-bold border-2 transition-all duration-300 shadow-md ${
                runningScore > 0
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400/80 shadow-emerald-400/30'
                  : runningScore < 0
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white border-rose-400/80 shadow-rose-400/30'
                  : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-amber-300/80 shadow-orange-400/30'
              }`}
            >
              <span className="text-xl sm:text-2xl drop-shadow-xs">⭐</span>
              <div className="flex flex-col text-left leading-none">
                <span className="text-[10px] uppercase font-sans font-extrabold tracking-wider text-white/85 mb-0.5">
                  Score
                </span>
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight font-fun">
                  {runningScore > 0 ? `+${runningScore}` : runningScore}
                </span>
              </div>
            </div>

            {/* Score delta animation badge */}
            {scoreDelta && (
              <span
                key={scoreDelta.id}
                className={`absolute -top-1.5 -right-1 text-xs font-black px-2 py-0.5 rounded-full shadow-lg ring-2 animate-pop ${
                  scoreDelta.amount > 0
                    ? 'bg-emerald-600 text-white ring-white'
                    : 'bg-rose-600 text-white ring-white'
                }`}
              >
                {scoreDelta.amount > 0 ? '+1' : '-1'}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar & Word Counter */}
        <div className="bg-white/90 p-2.5 sm:p-3 rounded-2xl border border-amber-100 shadow-2xs mb-2 sm:mb-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
            <span className="flex items-center gap-1.5">
              <span>Card {currentIndex + 1} of {deck.length}</span>
              {currentStreak >= 3 && (
                <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                  <Flame className="w-3.5 h-3.5 fill-current text-orange-500" />
                  {currentStreak} streak!
                </span>
              )}
            </span>
            <span>{progressPct}% Done</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(5, (currentIndex / deck.length) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Flashcard Display */}
      <div className="my-auto py-2 sm:py-3 flex-1 flex flex-col justify-center min-h-0">
        {currentWordItem ? (
          <div
            key={currentWordItem.id + currentIndex}
            className="group relative bg-white rounded-3xl sm:rounded-4xl p-6 sm:p-10 text-center border-4 border-amber-200/90 shadow-2xl shadow-orange-100 transition-all transform animate-pop hover:shadow-orange-200/80 my-auto flex flex-col justify-center"
          >
            {/* Top decorative badge */}
            <div className="absolute top-3.5 left-5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                Word {currentIndex + 1}
              </span>
            </div>

            {/* Pronunciation button in top-right */}
            <div className="absolute top-3.5 right-5 flex items-center gap-2">
              <button
                onClick={() => speakWord(currentWordItem.word)}
                title="Pronounce Word (or press S/P)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-medium text-xs transition-colors cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Say Word</span>
              </button>
            </div>

            {/* Giant Child-Friendly Word */}
            <div className="py-6 sm:py-10">
              <span className="font-fun text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-wide text-slate-800 select-none drop-shadow-xs">
                {currentWordItem.word}
              </span>
            </div>

            {/* Prompt for Parent */}
            <p className="text-xs sm:text-sm font-semibold text-slate-400">
              Parent: Listen as child reads, then mark below:
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 font-bold">Loading cards...</div>
        )}
      </div>

      {/* Parent Action Controls */}
      <div className="mt-2 sm:mt-3 shrink-0">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-2">
          {/* Incorrect Button */}
          <button
            onClick={() => handleAnswer(false)}
            className="group relative py-3 sm:py-4 px-4 rounded-2xl sm:rounded-3xl bg-rose-50 hover:bg-rose-100 text-rose-700 border-3 border-rose-300 hover:border-rose-400 font-fun font-bold text-lg sm:text-2xl shadow-md shadow-rose-200/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
            </div>
            <div className="text-center sm:text-left">
              <span>Try Again</span>
              <span className="block text-xs font-sans font-semibold text-rose-500">
                -1 Point <span className="hidden md:inline">(Left Arrow / X)</span>
              </span>
            </div>
          </button>

          {/* Correct Button */}
          <button
            onClick={() => handleAnswer(true)}
            className="group relative py-3 sm:py-4 px-4 rounded-2xl sm:rounded-3xl bg-emerald-500 hover:bg-emerald-600 text-white border-3 border-emerald-600 font-fun font-bold text-lg sm:text-2xl shadow-lg shadow-emerald-400/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
            </div>
            <div className="text-center sm:text-left">
              <span>Got It!</span>
              <span className="block text-xs font-sans font-semibold text-emerald-100">
                +1 Point <span className="hidden md:inline">(Right Arrow / Space)</span>
              </span>
            </div>
          </button>
        </div>

        {/* Bottom Helper Bar: Undo & Auto-pronounce */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-2 py-1">
          <button
            onClick={handleUndo}
            disabled={attempts.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors ${
              attempts.length > 0
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 cursor-pointer'
                : 'opacity-40 text-slate-400 border-transparent cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo Last (Z)</span>
          </button>

          <label className="flex items-center gap-2 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
            />
            <span className="font-medium text-slate-600">Auto-pronounce each word</span>
          </label>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-200 animate-pop">
            <h4 className="font-fun text-2xl font-bold text-slate-800 mb-2">Leave Game?</h4>
            <p className="text-sm text-slate-600 mb-6">
              You are currently at word {currentIndex + 1} of {deck.length}. Unfinished progress in this session won't be saved to stats.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
              >
                Keep Playing
              </button>
              <button
                onClick={onExitGame}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-colors cursor-pointer"
              >
                Exit Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

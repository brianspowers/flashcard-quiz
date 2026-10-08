import { useState } from 'react';
import type { ActiveTab, GameConfig, GameSummary, WordSet, WordStatsMap } from './types';
import { 
  loadSets, 
  saveSets, 
  loadStats, 
  loadGameHistory, 
  saveGameHistory, 
  recordWordResults, 
  resetAllStats 
} from './utils/storage';
import { sounds } from './utils/audio';
import { Navbar } from './components/Navbar';
import { HomeSelector } from './components/HomeSelector';
import { GameScreen } from './components/GameScreen';
import { StatsDashboard } from './components/StatsDashboard';
import { AdminPanel } from './components/AdminPanel';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('play');
  const [sets, setSets] = useState<WordSet[]>(() => loadSets());
  const [stats, setStats] = useState<WordStatsMap>(() => loadStats());
  const [history, setHistory] = useState<GameSummary[]>(() => loadGameHistory());
  const [currentGame, setCurrentGame] = useState<GameConfig | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Sync sound settings with audio engine
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
  };

  // Launch a game session
  const handleStartGame = (config: GameConfig) => {
    setCurrentGame(config);
  };

  // Finish a game session and record statistics
  const handleFinishGame = (summary: GameSummary) => {
    // 1. Update overall word statistics
    const updatedStats = recordWordResults(summary.attempts);
    setStats(updatedStats);

    // 2. Save game history summary
    const updatedHistory = [...history, summary];
    saveGameHistory(updatedHistory);
    setHistory(updatedHistory);
  };

  // Exit from active game back to selector
  const handleExitGame = () => {
    setCurrentGame(null);
  };

  // Dedicated "Practice Missed Words" launcher from game summary
  const handlePracticeMissedWords = (missedWords: string[]) => {
    if (!currentGame || missedWords.length === 0) return;

    const missedItems = missedWords.map((word, idx) => ({
      id: `missed-${idx}-${Date.now()}`,
      word,
    }));

    setCurrentGame({
      targetType: currentGame.targetType,
      setId: currentGame.setId,
      setName: currentGame.setName,
      listName: `${currentGame.listName || currentGame.setName} (Review Missed)`,
      words: missedItems,
    });
  };

  // Update sets in Admin panel
  const handleUpdateSets = (updatedSets: WordSet[]) => {
    setSets(updatedSets);
    saveSets(updatedSets);
  };

  // Reset stats
  const handleResetStats = () => {
    resetAllStats();
    setStats({});
    setHistory([]);
  };

  // Reset all data to factory defaults
  const handleDataReset = () => {
    setSets(loadSets());
    setStats(loadStats());
    setHistory(loadGameHistory());
    setCurrentGame(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col selection:bg-amber-200">
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setCurrentGame(null);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        isInGame={currentGame !== null}
      />

      <main className="flex-1 pb-12">
        {currentGame ? (
          <GameScreen
            key={currentGame.listId || currentGame.setId + '-' + currentGame.words.length + '-' + (currentGame.listName || '')}
            config={currentGame}
            onFinishGame={handleFinishGame}
            onExitGame={handleExitGame}
            onPracticeMissedWords={handlePracticeMissedWords}
          />
        ) : (
          <>
            {activeTab === 'play' && (
              <HomeSelector
                sets={sets}
                stats={stats}
                onStartGame={handleStartGame}
                onGoToAdmin={() => setActiveTab('admin')}
              />
            )}

            {activeTab === 'stats' && (
              <StatsDashboard
                sets={sets}
                stats={stats}
                history={history}
                onResetStats={handleResetStats}
              />
            )}

            {activeTab === 'admin' && (
              <AdminPanel
                sets={sets}
                onUpdateSets={handleUpdateSets}
                onDataReset={handleDataReset}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;

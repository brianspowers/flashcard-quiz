import React from 'react';
import { Volume2, VolumeX, Sparkles, Trophy, Settings, Play } from 'lucide-react';
import type { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isInGame?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  soundEnabled,
  onToggleSound,
  isInGame = false,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => !isInGame && onTabChange('play')}
          className={`flex items-center gap-3 select-none ${isInGame ? 'cursor-default' : 'cursor-pointer group'}`}
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-pink-500 flex items-center justify-center shadow-md shadow-orange-300/40 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-fun text-2xl font-bold tracking-tight bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                WordQuest
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200/80">
                Kids Edition
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block font-medium">Fun Flashcard Learning</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        {!isInGame && (
          <nav className="flex items-center gap-1.5 sm:gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => onTabChange('play')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all duration-150 ${
                activeTab === 'play'
                  ? 'bg-white text-orange-600 shadow-sm shadow-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play</span>
            </button>

            <button
              onClick={() => onTabChange('stats')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all duration-150 ${
                activeTab === 'stats'
                  ? 'bg-white text-purple-600 shadow-sm shadow-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Stats</span>
            </button>

            <button
              onClick={() => onTabChange('admin')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all duration-150 ${
                activeTab === 'admin'
                  ? 'bg-white text-emerald-600 shadow-sm shadow-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Manage Words</span>
              <span className="sm:hidden">Words</span>
            </button>
          </nav>
        )}

        {/* Sound toggle & Quick helpers */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Sound Effects Enabled (click to mute)' : 'Sound Effects Muted (click to unmute)'}
            className={`p-2.5 rounded-xl border transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              soundEnabled
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span className="text-xs font-semibold hidden md:inline">Sound On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span className="text-xs font-semibold hidden md:inline">Muted</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

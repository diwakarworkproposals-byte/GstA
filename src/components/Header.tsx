import React from 'react';
import { Sparkles, Sun, Moon, Settings, ShieldCheck, Columns2, MessageSquare, Table2, Smartphone } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  viewMode: 'split' | 'chat' | 'table';
  onChangeViewMode: (mode: 'split' | 'chat' | 'table') => void;
  onOpenSettings: () => void;
  onOpenInstallModal: () => void;
  activeTableCount: number;
  totalRecordCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  viewMode,
  onChangeViewMode,
  onOpenSettings,
  onOpenInstallModal,
  activeTableCount,
  totalRecordCount,
}) => {
  return (
    <header
      className={`border-b transition-colors duration-200 sticky top-0 z-30 backdrop-blur-md ${
        darkMode ? 'bg-zinc-950/85 border-zinc-800 text-zinc-100' : 'bg-white/85 border-zinc-200 text-zinc-800'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand logo & title */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold sm:font-semibold text-sm sm:text-lg tracking-tight bg-gradient-to-r from-blue-500 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
                GstA <span className="hidden xs:inline sm:inline">Ledger</span>
              </span>
              <span
                className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full ${
                  darkMode ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/60' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}
              >
                Offline
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 hidden md:block">
              Zero-Cloud • Dynamic Schema • IndexedDB Engine
            </p>
          </div>
        </div>

        {/* View mode switcher */}
        <div
          className={`flex items-center p-0.5 sm:p-1 rounded-xl border ${
            darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
          }`}
        >
          <button
            onClick={() => onChangeViewMode('split')}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'split'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Split Screen View"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Split</span>
          </button>
          <button
            onClick={() => onChangeViewMode('chat')}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'chat'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Chat View"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Chat</span>
          </button>
          <button
            onClick={() => onChangeViewMode('table')}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'table'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Tables View"
          >
            <Table2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tables</span>
          </button>
        </div>

        {/* Right Actions: Install PWA, Local badge, Dark Mode, Settings */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Install PWA Button */}
          <button
            onClick={onOpenInstallModal}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95 shadow-sm transition-all"
            title="Install Mobile App (PWA)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install App</span>
          </button>

          {/* 100% Local Badge */}
          <div
            className={`hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
              darkMode ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
            title={`${totalRecordCount} records stored locally across ${activeTableCount} tables`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Offline ({totalRecordCount})</span>
          </div>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleDarkMode}
            className={`p-1.5 sm:p-2 rounded-xl transition-all border ${
              darkMode
                ? 'bg-zinc-900 border-zinc-800 text-amber-400 hover:bg-zinc-800'
                : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'
            }`}
            title="Toggle Dark/Light Mode"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Settings modal trigger */}
          <button
            onClick={onOpenSettings}
            className={`p-1.5 sm:p-2 rounded-xl transition-all border ${
              darkMode
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'
            }`}
            title="Settings & Data Management"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

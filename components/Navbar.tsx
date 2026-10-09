'use client';

import React from 'react';
import { Gamepad2, Trophy, Clock, Sparkles, Plus, Flame } from 'lucide-react';

interface NavbarProps {
  activeTab: 'history' | 'backlog' | 'recommendations';
  setActiveTab: (tab: 'history' | 'backlog' | 'recommendations') => void;
  onOpenAddModal: () => void;
  stats: {
    totalCompleted: number;
    backlogCount: number;
    avgRating: string;
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  stats,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-950/40 bg-[#08090d]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 p-[1px] neon-glow-cyan">
            <div className="h-full w-full bg-[#0d0f17] rounded-[11px] flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400 font-mono">
                gamelog<span className="text-cyan-400">.gg</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Bitácora personal de videojuegos & podio
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-1.5 sm:gap-2 bg-[#0e111a] p-1.5 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,243,255,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Historial & Podio</span>
          </button>

          <button
            onClick={() => setActiveTab('backlog')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'backlog'
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(176,38,255,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Backlog</span>
            {stats.backlogCount > 0 && (
              <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-purple-900/60 text-purple-200 border border-purple-600/40">
                {stats.backlogCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'recommendations'
                ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(0,255,136,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Recomendaciones</span>
            <span className="sm:hidden">Sugeridos</span>
          </button>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-purple-600 text-black font-bold text-sm tracking-wide transition-transform hover:scale-[1.03] active:scale-[0.98] shadow-[0_0_20px_rgba(0,243,255,0.4)] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden md:inline">Agregar Juego</span>
            <span className="md:hidden">Nuevo</span>
          </button>
        </div>
      </div>
    </header>
  );
};

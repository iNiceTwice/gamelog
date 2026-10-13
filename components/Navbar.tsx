import React from 'react';
import { Trophy, Clock, Sparkles, Plus } from 'lucide-react';

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
    <header className="sticky top-0 z-40 w-full border-b border-[#2E264E] bg-[#1E1834]/95 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="ml-2 flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white font-sans">
                gamelog<span className="text-[#00CAFA]">.gg</span>
              </span>
            </div>
            <p className="text-xs text-[#9D96B8] hidden sm:block">
              Track like a tryhard
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs (Pill style like in CS:GO UI) */}
        <nav className="flex items-center gap-1.5 bg-[#141124] p-1.5 rounded-2xl border border-[#2E264E]">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-[#272041] text-white shadow-sm border border-[#3E3465]'
                : 'text-[#9D96B8] hover:text-white hover:bg-[#1E1834]'
            }`}
          >
            <Trophy className="w-4 h-4 text-[#FFBE0B]" />
            <span>Historial</span>
          </button>

          <button
            onClick={() => setActiveTab('backlog')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'backlog'
                ? 'bg-[#272041] text-white shadow-sm border border-[#3E3465]'
                : 'text-[#9D96B8] hover:text-white hover:bg-[#1E1834]'
            }`}
          >
            <Clock className="w-4 h-4 text-[#6967EB]" />
            <span>Backlog</span>
            {stats.backlogCount > 0 && (
              <span className="ml-1 text-[11px] px-2 py-0.2 rounded-full bg-[#6967EB] text-white font-bold">
                {stats.backlogCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'recommendations'
                ? 'bg-[#272041] text-white shadow-sm border border-[#3E3465]'
                : 'text-[#9D96B8] hover:text-white hover:bg-[#1E1834]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#00CAFA]" />
            <span>Recomendaciones</span>
          </button>
        </nav>

        {/* Right CTA - Add Game Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#6967EB] hover:bg-[#5856d6] text-white font-bold text-xs tracking-wide shadow-sm cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Añadir Videojuego</span>
          </button>
        </div>
      </div>
    </header>
  );
};

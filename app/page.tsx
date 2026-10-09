'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { PodiumSection } from '@/components/PodiumSection';
import { GameRow } from '@/components/GameRow';
import { BacklogView } from '@/components/BacklogView';
import { AddGameModal } from '@/components/AddGameModal';
import { RecommendationsView } from '@/components/RecommendationsView';
import { IGameEntry } from '@/models/GameEntry';
import { NormalizedGame } from '@/lib/igdb/types';
import { 
  Trophy, 
  Gamepad2, 
  Flame, 
  Star, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const [games, setGames] = useState<IGameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'backlog' | 'recommendations'>('history');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(2025);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'abandoned'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch games
  const fetchGames = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/games');
      const json = await res.json();
      if (json.success) {
        setGames(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching games:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  // Compute available years from played games
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    games.forEach((g) => {
      if (g.yearPlayed) years.add(g.yearPlayed);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [games]);

  // Played games (history)
  const playedGames = useMemo(() => {
    return games.filter((g) => g.status === 'completed' || g.status === 'abandoned' || g.status === 'playing');
  }, [games]);

  // Backlog games
  const backlogGames = useMemo(() => {
    return games.filter((g) => g.status === 'backlog');
  }, [games]);

  // Filtered played games for the list
  const filteredHistoryGames = useMemo(() => {
    return playedGames.filter((g) => {
      const matchYear = selectedYear === 'all' || g.yearPlayed === selectedYear;
      const matchStatus = statusFilter === 'all' || g.status === statusFilter;
      const matchSearch =
        !searchFilter.trim() ||
        g.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (g.customTags || []).some((t) => t.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (g.igdbGenres || []).some((t) => t.toLowerCase().includes(searchFilter.toLowerCase()));
      return matchYear && matchStatus && matchSearch;
    });
  }, [playedGames, selectedYear, statusFilter, searchFilter]);

  // Statistics
  const stats = useMemo(() => {
    const completed = games.filter((g) => g.status === 'completed');
    const withRating = completed.filter((g) => g.rating);
    const avg =
      withRating.length > 0
        ? (withRating.reduce((acc, curr) => acc + (curr.rating || 0), 0) / withRating.length).toFixed(1)
        : '0.0';

    return {
      totalCompleted: completed.length,
      backlogCount: backlogGames.length,
      avgRating: avg,
    };
  }, [games, backlogGames]);

  // Handle delete
  const handleDeleteGame = async (id: string) => {
    if (!confirm('¿Deseas eliminar este registro de gamelog.gg?')) return;
    try {
      const res = await fetch(`/api/games/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGames((prev) => prev.filter((g) => g._id.toString() !== id));
      }
    } catch (err) {
      console.error('Error deleting game:', err);
    }
  };

  // Handle status update (e.g. from backlog to playing/completed)
  const handleToggleStatus = async (game: IGameEntry, newStatus: 'playing' | 'completed') => {
    try {
      const currentYear = new Date().getFullYear();
      const res = await fetch(`/api/games/${game._id.toString()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          yearPlayed: currentYear,
          rating: newStatus === 'completed' ? 5 : undefined,
        }),
      });

      if (res.ok) {
        await fetchGames();
      }
    } catch (err) {
      console.error('Error updating game status:', err);
    }
  };

  // Add from recommendations directly into backlog
  const handleAddRecToBacklog = async (rec: NormalizedGame) => {
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: rec.title,
          coverUrl: rec.coverUrl,
          igdbId: rec.igdbId,
          igdbGenres: rec.genres,
          releaseYear: rec.releaseYear,
          status: 'backlog',
          backlogType: 'Hard',
          notes: 'Añadido desde recomendaciones explicables',
        }),
      });

      if (res.ok) {
        await fetchGames();
        setActiveTab('backlog');
      }
    } catch (err) {
      console.error('Error adding recommended game to backlog:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        stats={stats}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats Gamer Bar */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-cyan-950/60 bg-[#0e111a]/80 shadow-[0_0_15px_rgba(0,243,255,0.06)] flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-emerald-950/70 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white font-mono">{stats.totalCompleted}</div>
              <div className="text-xs text-slate-400 font-medium">Juegos Terminados</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-purple-950/60 bg-[#0e111a]/80 shadow-[0_0_15px_rgba(176,38,255,0.06)] flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-purple-950/70 text-purple-400 border border-purple-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white font-mono">{stats.backlogCount}</div>
              <div className="text-xs text-slate-400 font-medium">Pendientes (Backlog)</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-950/60 bg-[#0e111a]/80 shadow-[0_0_15px_rgba(255,190,11,0.06)] flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-amber-950/70 text-amber-400 border border-amber-500/30">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-white font-mono">{stats.avgRating} <span className="text-xs text-amber-400 font-normal">/ 5</span></div>
              <div className="text-xs text-slate-400 font-medium">Calificación Media</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-cyan-950/60 bg-[#0e111a]/80 shadow-[0_0_15px_rgba(0,243,255,0.06)] flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-cyan-950/70 text-cyan-400 border border-cyan-500/30">
              <Flame className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-white font-mono">
                {selectedYear === 'all' ? 'Histórico' : selectedYear}
              </div>
              <div className="text-xs text-slate-400 font-medium">Año en foco</div>
            </div>
          </div>
        </section>

        {/* TAB 1: HISTORY & PODIUM */}
        {activeTab === 'history' && (
          <div>
            {/* Year Selector Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto py-1">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-wider mr-2 flex items-center gap-1 shrink-0">
                  <Calendar className="w-3.5 h-3.5" /> Año:
                </span>
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold font-mono transition-all cursor-pointer ${
                      selectedYear === year
                        ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-400/60 shadow-[0_0_15px_rgba(255,190,11,0.3)]'
                        : 'bg-[#121522] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {year}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedYear('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold font-mono transition-all cursor-pointer ${
                    selectedYear === 'all'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_15px_rgba(0,243,255,0.3)]'
                      : 'bg-[#121522] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Ver Todos
                </button>
              </div>

              {/* Status Filter buttons */}
              <div className="flex items-center gap-1.5 bg-[#121522] p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    statusFilter === 'completed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Terminados
                </button>
                <button
                  onClick={() => setStatusFilter('abandoned')}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    statusFilter === 'abandoned' ? 'bg-red-950 text-red-300 border border-red-800/60' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Abandonados
                </button>
              </div>
            </div>

            {/* Podium Section for the chosen year */}
            <PodiumSection games={games} selectedYear={selectedYear} />

            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h3 className="font-mono font-bold text-lg text-white">
                  Lista Detallada {selectedYear !== 'all' ? `(${selectedYear})` : '(Histórico Completo)'}
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {filteredHistoryGames.length} títulos
                </span>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por título o género..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#121522] border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Games List Rows */}
            {filteredHistoryGames.length > 0 ? (
              <div className="space-y-3">
                {filteredHistoryGames.map((game) => (
                  <GameRow
                    key={game._id.toString()}
                    game={game}
                    onDelete={handleDeleteGame}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-[#0c0e15]/40">
                <Gamepad2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white font-mono">No se encontraron juegos</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Intenta cambiar el año o los filtros de búsqueda.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BACKLOG */}
        {activeTab === 'backlog' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-white font-mono flex items-center gap-2">
                  <Clock className="w-6 h-6 text-purple-400" />
                  <span>Backlog de Videojuegos</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tu lista de títulos pendientes para jugar, clasificados por dificultad o notas.
                </p>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-950/80 text-purple-300 border border-purple-500/50 hover:bg-purple-900/60 font-bold text-xs tracking-wide shadow-[0_0_15px_rgba(176,38,255,0.2)] cursor-pointer"
              >
                + Añadir a Pendientes
              </button>
            </div>

            <BacklogView
              games={backlogGames}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteGame}
            />
          </div>
        )}

        {/* TAB 3: RECOMMENDATIONS */}
        {activeTab === 'recommendations' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white font-mono flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-emerald-400" />
                <span>Recomendaciones Personalizadas</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Descubre nuevos títulos basados en los géneros y juegos que más disfrutaste en gamelog.gg.
              </p>
            </div>

            <RecommendationsView onAddGameToBacklog={handleAddRecToBacklog} />
          </div>
        )}
      </main>

      {/* Add Game Modal */}
      <AddGameModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onGameAdded={fetchGames}
        defaultStatus={activeTab === 'backlog' ? 'backlog' : 'completed'}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-900 bg-[#06070a] py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-600 font-mono">
          <p>
            <span className="text-cyan-500 font-bold">gamelog.gg</span> — Tu bitácora de videojuegos personal. Desarrollado con tema gamer neón & MongoDB.
          </p>
        </div>
      </footer>
    </div>
  );
}

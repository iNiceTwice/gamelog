'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { PodiumSection } from '@/components/PodiumSection';
import { GameRow } from '@/components/GameRow';
import { BacklogView } from '@/components/BacklogView';
import { AddGameModal } from '@/components/AddGameModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { RecommendationsView } from '@/components/RecommendationsView';
import { IGameEntry } from '@/models/GameEntry';
import { NormalizedGame } from '@/lib/igdb/types';
import { 
  Gamepad2, 
  Flame, 
  Star, 
  CheckCircle2, 
  Clock, 
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
  const [gameToDelete, setGameToDelete] = useState<{ id: string; title: string } | null>(null);

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

  // Handle delete via custom modal
  const handleConfirmDelete = async () => {
    if (!gameToDelete) return;
    try {
      const res = await fetch(`/api/games/${gameToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setGames((prev) => prev.filter((g) => g._id.toString() !== gameToDelete.id));
        toast.success(`"${gameToDelete.title}" fue eliminado de gamelog.gg`);
      } else {
        toast.error('No se pudo eliminar el juego');
      }
    } catch (err) {
      console.error('Error deleting game:', err);
      toast.error('Error al intentar eliminar');
    } finally {
      setGameToDelete(null);
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
        if (newStatus === 'completed') {
          toast.success(`¡"${game.title}" marcado como Terminado y trasladado al Historial ${currentYear}!`);
        } else {
          toast.info(`¡Comenzaste a jugar "${game.title}"!`);
        }
      }
    } catch (err) {
      console.error('Error updating game status:', err);
      toast.error('Error al actualizar el estado del juego');
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
        toast.success(`"${rec.title}" se agregó a tu Backlog`);
        setActiveTab('backlog');
      }
    } catch (err) {
      console.error('Error adding recommended game to backlog:', err);
      toast.error('Error al agregar el juego');
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
        {/* Quick Stats Pill Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl border border-[#352C56] bg-[#272041] flex items-center gap-3.5 shadow-sm">
            <div className="p-2.5 rounded-xl bg-[#1E1834] text-[#00CAFA] border border-[#352C56]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats.totalCompleted}</div>
              <div className="text-xs text-[#9D96B8] font-medium">Juegos Terminados</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-[#352C56] bg-[#272041] flex items-center gap-3.5 shadow-sm">
            <div className="p-2.5 rounded-xl bg-[#1E1834] text-[#6967EB] border border-[#352C56]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats.backlogCount}</div>
              <div className="text-xs text-[#9D96B8] font-medium">Pendientes (Backlog)</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-[#352C56] bg-[#272041] flex items-center gap-3.5 shadow-sm">
            <div className="p-2.5 rounded-xl bg-[#1E1834] text-[#FFBE0B] border border-[#352C56]">
              <Star className="w-5 h-5 fill-[#FFBE0B]" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">
                {stats.avgRating} <span className="text-xs text-[#FFBE0B] font-normal">/ 5</span>
              </div>
              <div className="text-xs text-[#9D96B8] font-medium">Calificación Media</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-[#352C56] bg-[#272041] flex items-center gap-3.5 shadow-sm">
            <div className="p-2.5 rounded-xl bg-[#1E1834] text-[#00CAFA] border border-[#352C56]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">
                {selectedYear === 'all' ? 'Histórico' : selectedYear}
              </div>
              <div className="text-xs text-[#9D96B8] font-medium">Año en foco</div>
            </div>
          </div>
        </section>

        {/* TAB 1: HISTORY & PODIUM */}
        {activeTab === 'history' && (
          <div>
            {/* Year Selector Tabs and Status Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#2E264E]">
              {/* Year buttons */}
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto py-1">
                <span className="text-xs font-mono text-[#9D96B8] uppercase tracking-wider mr-2 flex items-center gap-1 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-[#00CAFA]" /> Año:
                </span>
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      selectedYear === year
                        ? 'bg-[#272041] text-[#FFBE0B] border border-[#FFBE0B]/50 shadow-sm'
                        : 'bg-[#1E1834] text-[#9D96B8] hover:text-white border border-[#2E264E]'
                    }`}
                  >
                    {year}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedYear('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    selectedYear === 'all'
                      ? 'bg-[#272041] text-[#00CAFA] border border-[#00CAFA]/50 shadow-sm'
                      : 'bg-[#1E1834] text-[#9D96B8] hover:text-white border border-[#2E264E]'
                  }`}
                >
                  Ver Todos
                </button>
              </div>

              {/* Status Filter buttons */}
              <div className="flex items-center gap-1.5 bg-[#1E1834] p-1 rounded-2xl border border-[#2E264E] text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                    statusFilter === 'all' ? 'bg-[#272041] text-white shadow-sm' : 'text-[#9D96B8] hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                    statusFilter === 'completed' ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30' : 'text-[#9D96B8] hover:text-white'
                  }`}
                >
                  Terminados
                </button>
                <button
                  onClick={() => setStatusFilter('abandoned')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                    statusFilter === 'abandoned' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-[#9D96B8] hover:text-white'
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
                <Layers className="w-5 h-5 text-[#00CAFA]" />
                <h3 className="font-bold text-lg text-white">
                  Lista Detallada {selectedYear !== 'all' ? `(${selectedYear})` : '(Histórico Completo)'}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1E1834] text-[#9D96B8] border border-[#352C56]">
                  {filteredHistoryGames.length} títulos
                </span>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#9D96B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por título o género..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-xl bg-[#1E1834] border border-[#352C56] text-white placeholder-[#787196] text-xs focus:outline-none focus:border-[#6967EB]"
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
                    onDelete={(id) => setGameToDelete({ id, title: game.title })}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-[#352C56] rounded-2xl bg-[#1E1834]/40">
                <Gamepad2 className="w-10 h-10 text-[#9D96B8] mx-auto mb-3 opacity-50" />
                <h4 className="text-base font-bold text-white">No se encontraron juegos</h4>
                <p className="text-xs text-[#9D96B8] mt-1">
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
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Clock className="w-6 h-6 text-[#6967EB]" />
                  <span>Backlog de Videojuegos</span>
                </h2>
                <p className="text-xs text-[#9D96B8] mt-1">
                  Tu lista de títulos pendientes para jugar, clasificados por dificultad o notas.
                </p>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#6967EB] hover:bg-[#5856d6] text-white font-bold text-xs tracking-wide shadow-sm cursor-pointer"
              >
                + Añadir a Pendientes
              </button>
            </div>

            <BacklogView
              games={backlogGames}
              onToggleStatus={handleToggleStatus}
              onDelete={(id) => {
                const g = backlogGames.find((item) => item._id.toString() === id);
                setGameToDelete({ id, title: g?.title || 'este juego' });
              }}
            />
          </div>
        )}

        {/* TAB 3: RECOMMENDATIONS */}
        {activeTab === 'recommendations' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#00CAFA]" />
                <span>Recomendaciones Personalizadas</span>
              </h2>
              <p className="text-xs text-[#9D96B8] mt-1">
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
        onGameAdded={() => {
          fetchGames();
          toast.success('Videojuego guardado correctamente en gamelog.gg');
        }}
        defaultStatus={activeTab === 'backlog' ? 'backlog' : 'completed'}
      />

      {/* Radix UI Confirmation Modal */}
      <ConfirmModal
        isOpen={!!gameToDelete}
        onOpenChange={(open) => {
          if (!open) setGameToDelete(null);
        }}
        title="¿Eliminar videojuego?"
        description={`¿Estás seguro de que deseas eliminar "${gameToDelete?.title}" de tu biblioteca? Esta acción no se puede deshacer.`}
        confirmText="Eliminar de gamelog.gg"
        cancelText="Conservar"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-[#2E264E] bg-[#141124] py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-[#9D96B8]">
          <p>
            <span className="text-[#00CAFA] font-bold">gamelog.gg</span> — Tu bitácora de videojuegos personal. Estética gamer CS:GO & paleta Okta Neue.
          </p>
        </div>
      </footer>
    </div>
  );
}

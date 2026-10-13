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
import { CustomSelect } from '@/components/ui/CustomSelect';
import { GameFilterControls } from '@/components/GameFilterControls';
import { LoadingScreen } from '@/components/LoadingScreen';
import { IGameEntry } from '@/models/GameEntry';
import { NormalizedGame } from '@/lib/igdb/types';
import { 
  Gamepad2, 
  Flame, 
  Star, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Layers,
  Sparkles,
  Plus
} from 'lucide-react';

export default function HomePage() {
  const currentYear = new Date().getFullYear();
  const [games, setGames] = useState<IGameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'backlog' | 'recommendations'>('history');

  // Sync activeTab with URL query parameter ?activeTab=... and handle back/forward navigation
  useEffect(() => {
    const syncTabFromUrl = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('activeTab');
        if (tabParam === 'history' || tabParam === 'backlog' || tabParam === 'recommendations') {
          setActiveTab(tabParam);
        }
      }
    };

    syncTabFromUrl();
    window.addEventListener('popstate', syncTabFromUrl);
    return () => window.removeEventListener('popstate', syncTabFromUrl);
  }, []);

  const handleTabChange = (tab: 'history' | 'backlog' | 'recommendations') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('activeTab', tab);
      window.history.pushState({}, '', url.toString());
    }
  };

  const [selectedYear, setSelectedYear] = useState<number | 'all'>(currentYear);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'abandoned'>('all');
  
  // History filters (Search, Chill/Hard type, Podium, Categories multi-select)
  const [searchFilter, setSearchFilter] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'Chill' | 'Hard'>('all');
  const [historyPodiumFilter, setHistoryPodiumFilter] = useState<'all' | 'any' | 'gold' | 'silver' | 'bronze'>('all');
  const [historySelectedCategories, setHistorySelectedCategories] = useState<string[]>([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<'completed' | 'backlog'>('completed');
  const [gameToEdit, setGameToEdit] = useState<IGameEntry | null>(null);
  const [gameToDelete, setGameToDelete] = useState<{ id: string; title: string } | null>(null);

  // Fetch games
  const fetchGames = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await fetch('/api/games');
      const json = await res.json();
      if (json.success) {
        setGames(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching games:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames(true);
  }, []);

  // Compute available years from played games + include currentYear
  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    games.forEach((g) => {
      if (g.yearPlayed) years.add(g.yearPlayed);
    });

    const sortedYears = Array.from(years).sort((a, b) => b - a);

    const options = [
      ...sortedYears.map((y) => ({
        value: y.toString(),
        label: `${y}${y === currentYear ? ' (Actual)' : ''}`,
        icon: y === currentYear ? '🔥' : '🗓️',
      })),
      {
        value: 'all',
        label: 'Ver Histórico Completo',
        icon: '📚',
      },
    ];

    return options;
  }, [games, currentYear]);

  // Played games (history)
  const playedGames = useMemo(() => {
    return games.filter((g) => g.status === 'completed' || g.status === 'abandoned');
  }, [games]);

  // Backlog games
  const backlogGames = useMemo(() => {
    return games.filter((g) => g.status === 'backlog');
  }, [games]);

  // Unique categories and themes available across all played games
  const historyAvailableCategories = useMemo(() => {
    const set = new Set<string>();
    playedGames.forEach((g) => {
      (g.customTags || []).forEach((t) => t && t.trim() && set.add(t.trim()));
      (g.igdbGenres || []).forEach((t) => t && t.trim() && set.add(t.trim()));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [playedGames]);

  // Filtered played games for the history list
  const filteredHistoryGames = useMemo(() => {
    return playedGames.filter((g) => {
      const matchYear = selectedYear === 'all' || g.yearPlayed === selectedYear;
      const matchStatus = statusFilter === 'all' || g.status === statusFilter;

      // Chill / Hard filter
      if (historyTypeFilter !== 'all') {
        if (g.backlogType !== historyTypeFilter) return false;
      }

      // Podium filter
      if (historyPodiumFilter !== 'all') {
        if (historyPodiumFilter === 'any') {
          if (!g.podium) return false;
        } else {
          if (g.podium !== historyPodiumFilter) return false;
        }
      }

      // Categories multi-select filter
      if (historySelectedCategories.length > 0) {
        const gameCats = [
          ...(g.customTags || []),
          ...(g.igdbGenres || []),
        ].map((c) => c.toLowerCase().trim());

        const hasMatch = historySelectedCategories.some((sc) =>
          gameCats.includes(sc.toLowerCase().trim())
        );
        if (!hasMatch) return false;
      }

      // Search query filter (title, notes, tags)
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        const matchTitle = g.title.toLowerCase().includes(q);
        const matchNotes = (g.notes || '').toLowerCase().includes(q);
        const matchTag = [
          ...(g.customTags || []),
          ...(g.igdbGenres || []),
        ].some((t) => t.toLowerCase().includes(q));

        if (!matchTitle && !matchNotes && !matchTag) return false;
      }

      return matchYear && matchStatus;
    });
  }, [playedGames, selectedYear, statusFilter, historyTypeFilter, historyPodiumFilter, historySelectedCategories, searchFilter]);

  const handleResetHistoryFilters = () => {
    setSearchFilter('');
    setHistoryTypeFilter('all');
    setHistoryPodiumFilter('all');
    setHistorySelectedCategories([]);
  };

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

  // Handle edit
  const handleEditGame = (game: IGameEntry) => {
    setGameToEdit(game);
    setIsAddModalOpen(true);
  };

  const handleOpenAddModal = (status: 'completed' | 'backlog' = 'completed') => {
    setGameToEdit(null);
    setModalDefaultStatus(status);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setGameToEdit(null);
  };

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

  // Handle status update (from backlog to completed)
  // Preserves backlogType, downloadUrl and notes so completed games inherit them!
  const handleToggleStatus = async (game: IGameEntry, newStatus: 'completed') => {
    try {
      const activeYear = new Date().getFullYear();
      const res = await fetch(`/api/games/${game._id.toString()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          yearPlayed: activeYear,
          rating: game.rating || 5,
          backlogType: game.backlogType || 'Hard',
          downloadUrl: game.downloadUrl || '',
          notes: game.notes || '',
        }),
      });

      if (res.ok) {
        await fetchGames();
        toast.success(`¡"${game.title}" marcado como Terminado y trasladado al Historial ${activeYear}!`);
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
          notes: 'Añadido desde recomendaciones personalizadas',
        }),
      });

      if (res.ok) {
        await fetchGames();
        toast.success(`"${rec.title}" se agregó a tu Backlog`);
        // Stay on recommendations page so user can keep exploring
      }
    } catch (err) {
      console.error('Error adding recommended game to backlog:', err);
      toast.error('Error al agregar el juego');
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenAddModal={() => handleOpenAddModal(activeTab === 'backlog' ? 'backlog' : 'completed')}
        stats={stats}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-8">
        {/* TAB 1: HISTORIAL */}
        {activeTab === 'history' && (
          <div className="space-y-10">
            {/* Year selector & General Stats Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1E1834] p-4 rounded-2xl border border-[#2E264E] shadow-sm">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#00CAFA]" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Año de Juego:
                </span>
                <div className="w-60">
                  <CustomSelect
                    value={selectedYear.toString()}
                    onValueChange={(val: string) => setSelectedYear(val === 'all' ? 'all' : parseInt(val))}
                    options={yearOptions}
                  />
                </div>
              </div>

              {/* Status filter: All / Completed / Abandoned */}
              <div className="flex items-center gap-1.5 bg-[#141124] p-1 rounded-xl border border-[#2E264E]">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === 'all'
                      ? 'bg-[#272041] text-white shadow-sm'
                      : 'text-[#9D96B8] hover:text-white'
                  }`}
                >
                  Todos ({playedGames.length})
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === 'completed'
                      ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                      : 'text-[#9D96B8] hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Terminados</span>
                </button>
                <button
                  onClick={() => setStatusFilter('abandoned')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === 'abandoned'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'text-[#9D96B8] hover:text-white'
                  }`}
                >
                  <span>Abandonados</span>
                </button>
              </div>
            </div>

            {/* Podium (Top 3 games of the selected year) */}
            <PodiumSection
              games={games}
              selectedYear={selectedYear}
            />

            {/* Advanced Filters Bar for History */}
            <GameFilterControls
              searchQuery={searchFilter}
              onSearchChange={setSearchFilter}
              typeFilter={historyTypeFilter}
              onTypeChange={setHistoryTypeFilter}
              podiumFilter={historyPodiumFilter}
              onPodiumChange={setHistoryPodiumFilter}
              categories={historyAvailableCategories}
              selectedCategories={historySelectedCategories}
              onCategoriesChange={setHistorySelectedCategories}
              onResetFilters={handleResetHistoryFilters}
            />

            {/* Grid of played games (3 columns on desktop, responsive) */}
            {filteredHistoryGames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredHistoryGames.map((game) => (
                  <GameRow
                    key={game._id.toString()}
                    game={game}
                    onEdit={handleEditGame}
                    onDelete={(id) => setGameToDelete({ id, title: game.title })}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-[#352C56] rounded-2xl bg-[#1E1834]/40">
                <Gamepad2 className="w-10 h-10 text-[#9D96B8] mx-auto mb-3 opacity-50" />
                <h4 className="text-base font-bold text-white">No se encontraron juegos</h4>
                <p className="text-xs text-[#9D96B8] mt-1">
                  Intenta cambiar el año o los filtros de búsqueda aplicados.
                </p>
                <button
                  type="button"
                  onClick={handleResetHistoryFilters}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#6967EB] hover:bg-[#5856d6] transition-colors cursor-pointer"
                >
                  Restablecer filtros
                </button>
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
                onClick={() => handleOpenAddModal('backlog')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#6967EB] hover:bg-[#5856d6] text-white font-bold text-xs tracking-wide shadow-sm cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3] stroke-white" />
                <span>Añadir a Pendientes</span>
              </button>
            </div>

            <BacklogView
              games={backlogGames}
              onToggleStatus={handleToggleStatus}
              onEdit={handleEditGame}
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

      {/* Add / Edit Game Modal with key to force fresh state on edit/open */}
      <AddGameModal
        key={gameToEdit ? gameToEdit._id.toString() : `new-${modalDefaultStatus}`}
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onGameAdded={() => {
          fetchGames();
          toast.success(
            gameToEdit
              ? 'Videojuego actualizado con éxito'
              : 'Videojuego guardado correctamente en gamelog.gg'
          );
        }}
        defaultStatus={modalDefaultStatus}
        gameToEdit={gameToEdit}
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
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 text-center text-xs text-[#9D96B8]">
          <p>
            <span className="font-bold">
              <span className="text-white">gamelog</span>
              <span className="text-[#00CAFA]">.gg</span>
            </span>
            {' '}— Track like a tryhard
          </p>
        </div>
      </footer>
    </div>
  );
}

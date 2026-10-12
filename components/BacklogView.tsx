'use client';

import React, { useState, useMemo } from 'react';
import { Sparkles, Clock, Gamepad2 } from 'lucide-react';
import { IGameEntry } from '@/models/GameEntry';
import { GameRow } from '@/components/GameRow';
import { GameFilterControls } from '@/components/GameFilterControls';

interface BacklogViewProps {
  games: IGameEntry[];
  onToggleStatus: (game: IGameEntry, newStatus: 'completed') => void;
  onEdit?: (game: IGameEntry) => void;
  onDelete: (id: string) => void;
}

export const BacklogView: React.FC<BacklogViewProps> = ({
  games,
  onToggleStatus,
  onEdit,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Chill' | 'Hard'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Dynamically compute all unique categories and themes present in backlog games
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    games.forEach((g) => {
      (g.customTags || []).forEach((t) => t && t.trim() && set.add(t.trim()));
      (g.igdbGenres || []).forEach((t) => t && t.trim() && set.add(t.trim()));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [games]);

  // Filter backlog games by type, categories, and search
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      // 1. Chill / Hard filter
      if (typeFilter !== 'all') {
        if (game.backlogType !== typeFilter) return false;
      }

      // 2. Category multi-select filter
      if (selectedCategories.length > 0) {
        const gameCats = [
          ...(game.customTags || []),
          ...(game.igdbGenres || []),
        ].map((c) => c.toLowerCase().trim());

        const hasMatch = selectedCategories.some((sc) =>
          gameCats.includes(sc.toLowerCase().trim())
        );
        if (!hasMatch) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = game.title.toLowerCase().includes(q);
        const matchNotes = (game.notes || '').toLowerCase().includes(q);
        const matchTag = [
          ...(game.customTags || []),
          ...(game.igdbGenres || []),
        ].some((t) => t.toLowerCase().includes(q));

        if (!matchTitle && !matchNotes && !matchTag) return false;
      }

      return true;
    });
  }, [games, typeFilter, selectedCategories, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setSelectedCategories([]);
  };

  if (games.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-[#352C56] rounded-2xl bg-[#1E1834]/40">
        <Sparkles className="w-10 h-10 text-[#6967EB] mx-auto mb-3 opacity-60" />
        <h3 className="text-lg font-bold text-white font-sans">¡Backlog al día!</h3>
        <p className="text-sm text-[#9D96B8] mt-1 max-w-sm mx-auto">
          No tienes videojuegos pendientes por jugar en este momento. Agrega uno nuevo desde el botón superior.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Clock className="w-5 h-5 text-[#6967EB]" />
          <h3 className="font-bold text-lg text-white">
            Lista de Juegos Pendientes
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1E1834] text-[#9D96B8] border border-[#352C56]">
            {filteredGames.length === games.length
              ? `${games.length} títulos`
              : `${filteredGames.length} de ${games.length} títulos`}
          </span>
        </div>

        <GameFilterControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          categories={availableCategories}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* Grid of games or empty search result */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredGames.map((game) => (
            <GameRow
              key={game._id.toString()}
              game={game}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-[#352C56] rounded-2xl bg-[#1E1834]/40">
          <Gamepad2 className="w-10 h-10 text-[#9D96B8] mx-auto mb-3 opacity-50" />
          <h4 className="text-base font-bold text-white">No se encontraron juegos pendientes</h4>
          <p className="text-xs text-[#9D96B8] mt-1 max-w-sm mx-auto">
            No hay videojuegos que coincidan con los filtros aplicados.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#6967EB] hover:bg-[#5856d6] transition-colors cursor-pointer"
          >
            Restablecer filtros
          </button>
        </div>
      )}
    </div>
  );
};

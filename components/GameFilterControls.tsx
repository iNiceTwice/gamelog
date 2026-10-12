'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Coffee, Flame, RotateCcw, X, Trophy, ChevronDown, Check } from 'lucide-react';
import { CategoryMultiSelect } from '@/components/ui/CategoryMultiSelect';

interface GameFilterControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: 'all' | 'Chill' | 'Hard';
  onTypeChange: (type: 'all' | 'Chill' | 'Hard') => void;
  podiumFilter?: 'all' | 'any' | 'gold' | 'silver' | 'bronze';
  onPodiumChange?: (podium: 'all' | 'any' | 'gold' | 'silver' | 'bronze') => void;
  categories: string[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onResetFilters?: () => void;
}

const PODIUM_OPTIONS: { value: 'all' | 'any' | 'gold' | 'silver' | 'bronze'; label: string; icon?: string }[] = [
  { value: 'all', label: 'Todos los Podios' },
  { value: 'any', label: 'Cualquier Podio', icon: '✨' },
  { value: 'gold', label: '1º Oro (GOTY)', icon: '🥇' },
  { value: 'silver', label: '2º Plata', icon: '🥈' },
  { value: 'bronze', label: '3º Bronce', icon: '🥉' },
];

export const GameFilterControls: React.FC<GameFilterControlsProps> = ({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeChange,
  podiumFilter,
  onPodiumChange,
  categories,
  selectedCategories,
  onCategoriesChange,
  onResetFilters,
}) => {
  const [isPodiumOpen, setIsPodiumOpen] = useState(false);
  const podiumRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (podiumRef.current && !podiumRef.current.contains(event.target as Node)) {
        setIsPodiumOpen(false);
      }
    };
    if (isPodiumOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPodiumOpen]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    typeFilter !== 'all' ||
    (podiumFilter && podiumFilter !== 'all') ||
    selectedCategories.length > 0
  );

  return (
    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
      {/* Search input */}
      <div className="relative min-w-[180px] flex-1 sm:w-60 sm:flex-initial">
        <Search className="w-4 h-4 text-[#9D96B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por título..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#1E1834] border border-[#352C56] text-white placeholder-[#787196] text-xs focus:outline-none focus:border-[#6967EB] transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#9D96B8] hover:text-white transition-colors cursor-pointer"
            title="Borrar búsqueda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Chill / Hard Pill Segment Filter */}
      <div className="flex items-center bg-[#1E1834] p-1 rounded-xl border border-[#352C56] text-xs shrink-0">
        <button
          type="button"
          onClick={() => onTypeChange('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            typeFilter === 'all'
              ? 'bg-[#272041] text-white shadow-sm border border-[#352C56]'
              : 'text-[#9D96B8] hover:text-white'
          }`}
          title="Ver todos los tipos"
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => onTypeChange('Chill')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            typeFilter === 'Chill'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-[#9D96B8] hover:text-emerald-300'
          }`}
          title="Filtrar por juegos Chill"
        >
          <Coffee className="w-3.5 h-3.5 text-emerald-400" />
          <span>Chill</span>
        </button>
        <button
          type="button"
          onClick={() => onTypeChange('Hard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            typeFilter === 'Hard'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-[#9D96B8] hover:text-rose-300'
          }`}
          title="Filtrar por juegos Hard"
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>Hard</span>
        </button>
      </div>

      {/* Podium Filter Dropdown (When provided) */}
      {onPodiumChange && podiumFilter && (
        <div className="relative shrink-0" ref={podiumRef}>
          <button
            type="button"
            onClick={() => setIsPodiumOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none ${
              podiumFilter !== 'all'
                ? 'bg-[#FFBE0B]/15 border-[#FFBE0B]/50 text-[#FFBE0B] shadow-sm'
                : 'bg-[#1E1834] border-[#352C56] text-[#9D96B8] hover:text-white hover:border-[#6967EB]/60'
            }`}
            title="Filtrar por medalla del podio"
          >
            <Trophy className={`w-3.5 h-3.5 ${podiumFilter !== 'all' ? 'text-[#FFBE0B]' : 'text-[#9D96B8]'}`} />
            <span>
              {podiumFilter === 'all' && 'Podio'}
              {podiumFilter === 'any' && 'Con Podio'}
              {podiumFilter === 'gold' && '🥇 GOTY'}
              {podiumFilter === 'silver' && '🥈 Plata'}
              {podiumFilter === 'bronze' && '🥉 Bronce'}
            </span>
            {podiumFilter !== 'all' && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onPodiumChange('all');
                }}
                className="p-0.5 rounded-md hover:bg-[#352C56] text-[#FFBE0B] hover:text-white transition-colors ml-0.5"
                title="Quitar filtro de podio"
              >
                <X className="w-3 h-3" />
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                isPodiumOpen ? 'rotate-180 text-white' : 'text-[#9D96B8]'
              }`}
            />
          </button>

          {isPodiumOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#1E1834] border border-[#352C56] rounded-2xl shadow-2xl p-1.5 z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#8E87AA] px-2.5 py-1 select-none">
                Filtrar por Podio
              </div>
              {PODIUM_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onPodiumChange(opt.value);
                    setIsPodiumOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                    podiumFilter === opt.value
                      ? 'bg-[#272041] text-[#FFBE0B] font-bold'
                      : 'text-[#C5C0DC] hover:bg-[#272041]/60 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {opt.icon && <span>{opt.icon}</span>}
                    <span>{opt.label}</span>
                  </span>
                  {podiumFilter === opt.value && <Check className="w-3.5 h-3.5 text-[#FFBE0B]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Multi-Select Categories & Themes Dropdown */}
      <div className="shrink-0">
        <CategoryMultiSelect
          categories={categories}
          selected={selectedCategories}
          onChange={onCategoriesChange}
          placeholder="Categorías / Temas"
        />
      </div>

      {/* Clear/Reset button when filters are active */}
      {hasActiveFilters && onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#8E87AA] hover:text-rose-300 bg-[#1E1834] border border-[#352C56] hover:border-rose-500/40 transition-colors cursor-pointer shrink-0"
          title="Restablecer todos los filtros"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Restablecer</span>
        </button>
      )}
    </div>
  );
};

'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Tag, ChevronDown, Check, X, Search } from 'lucide-react';

interface CategoryMultiSelectProps {
  categories: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export const CategoryMultiSelect: React.FC<CategoryMultiSelectProps> = ({
  categories,
  selected,
  onChange,
  placeholder = 'Categorías / Temas',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Filter categories by inner search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase().trim();
    return categories.filter((c) => c.toLowerCase().includes(term));
  }, [categories, searchTerm]);

  const toggleCategory = (category: string) => {
    if (selected.includes(category)) {
      onChange(selected.filter((c) => c !== category));
    } else {
      onChange([...selected, category]);
    }
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none ${
          selected.length > 0
            ? 'bg-[#1E1834] border-[#6967EB] text-white shadow-sm'
            : 'bg-[#1E1834] border-[#352C56] text-[#9D96B8] hover:text-white hover:border-[#6967EB]/60'
        }`}
        title="Filtrar por categorías y temas"
      >
        <Tag className={`w-3.5 h-3.5 ${selected.length > 0 ? 'text-[#00CAFA]' : 'text-[#9D96B8]'}`} />
        <span className="truncate max-w-[140px] sm:max-w-[180px]">
          {selected.length === 0 ? (
            placeholder
          ) : (
            <span>
              Categorías{' '}
              <span className="px-1.5 py-0.5 rounded-full bg-[#6967EB]/30 text-[#00CAFA] text-[10px] font-bold border border-[#6967EB]/50 ml-0.5">
                {selected.length}
              </span>
            </span>
          )}
        </span>

        {selected.length > 0 && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClearAll}
            className="p-0.5 rounded-md hover:bg-[#352C56] text-[#9D96B8] hover:text-white transition-colors ml-0.5"
            title="Limpiar categorías seleccionadas"
          >
            <X className="w-3 h-3" />
          </span>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-white' : 'text-[#9D96B8]'
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#1E1834] border border-[#352C56] rounded-2xl shadow-2xl p-2.5 z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
          {/* Search bar inside dropdown */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-[#9D96B8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-[#141124] border border-[#352C56] text-white placeholder-[#787196] text-xs focus:outline-none focus:border-[#6967EB] transition-colors"
              autoFocus
            />
          </div>

          {/* Action Row / Counter */}
          <div className="flex items-center justify-between px-1 py-1 text-[11px] font-medium text-[#9D96B8] border-b border-[#352C56]/60 mb-1.5">
            <span>
              {categories.length} {categories.length === 1 ? 'disponible' : 'disponibles'}
            </span>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[#00CAFA] hover:underline font-semibold cursor-pointer"
              >
                Limpiar ({selected.length})
              </button>
            )}
          </div>

          {/* Categories List */}
          <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-0.5 pr-1">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => {
                const isChecked = selected.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                      isChecked
                        ? 'bg-[#272041] text-white font-semibold'
                        : 'text-[#C5C0DC] hover:bg-[#272041]/60 hover:text-white'
                    }`}
                  >
                    <span className="truncate flex-1">{category}</span>
                    <span
                      className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                        isChecked
                          ? 'bg-[#6967EB] border-[#6967EB] text-white'
                          : 'border-[#44386E] bg-[#141124]'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-[#9D96B8]">
                No se encontraron categorías
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Sparkles, Star, Plus, Check, Loader2 } from 'lucide-react';
import { NormalizedGame } from '@/lib/igdb/types';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameAdded: () => void;
  defaultStatus?: 'completed' | 'backlog';
}

export const AddGameModal: React.FC<AddGameModalProps> = ({
  isOpen,
  onClose,
  onGameAdded,
  defaultStatus = 'completed',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NormalizedGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form states
  const [selectedGame, setSelectedGame] = useState<NormalizedGame | null>(null);
  const [title, setTitle] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [igdbGenres, setIgdbGenres] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<'completed' | 'abandoned' | 'playing' | 'backlog'>(defaultStatus);
  const [yearPlayed, setYearPlayed] = useState<number>(new Date().getFullYear());
  const [rating, setRating] = useState<number>(5);
  const [podium, setPodium] = useState<'gold' | 'silver' | 'bronze' | null>(null);
  const [review, setReview] = useState('');
  const [backlogType, setBacklogType] = useState('Hard');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/igdb/search?q=${encodeURIComponent(searchQuery)}`);
        const json = await res.json();
        if (json.success) {
          setSearchResults(json.data || []);
        }
      } catch (err) {
        console.error('Error searching:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelectGame = (game: NormalizedGame) => {
    setSelectedGame(game);
    setTitle(game.title);
    setCoverUrl(game.coverUrl);
    setIgdbGenres(game.genres);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAddCustomTag = () => {
    if (tagInput.trim() && !customTags.includes(tagInput.trim())) {
      setCustomTags([...customTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveCustomTag = (tag: string) => {
    setCustomTags(customTags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Por favor ingresa o selecciona un título de videojuego.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          coverUrl,
          igdbId: selectedGame?.igdbId,
          igdbGenres,
          customTags,
          status,
          yearPlayed: status === 'completed' || status === 'abandoned' ? yearPlayed : undefined,
          rating: status === 'completed' || status === 'abandoned' ? rating : undefined,
          podium: status === 'completed' ? podium : null,
          review,
          backlogType: status === 'backlog' ? backlogType : undefined,
          notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.error || 'Error al guardar el videojuego');
        setIsSubmitting(false);
        return;
      }

      onGameAdded();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al enviar los datos');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-cyan-500/40 bg-[#0d0f18] text-slate-100 shadow-[0_0_40px_rgba(0,243,255,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#111422]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono font-bold text-lg text-white">
              Dar de Alta Videojuego en <span className="text-cyan-400">gamelog.gg</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-sm">
              {errorMsg}
            </div>
          )}

          {/* IGDB Live Search Bar */}
          <div>
            <label className="block text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2">
              1. Buscar en IGDB (Autocompletado de Portada & Géneros)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Escribe el nombre del juego (ej: Silksong, Elden Ring, Cyberpunk)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#161a28] border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm font-sans"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Results dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-700 bg-[#141824] divide-y divide-slate-800 shadow-2xl">
                {searchResults.map((game) => (
                  <button
                    key={game.igdbId}
                    type="button"
                    onClick={() => handleSelectGame(game)}
                    className="w-full p-2.5 flex items-center gap-3 text-left hover:bg-cyan-950/40 transition-colors cursor-pointer"
                  >
                    <img
                      src={game.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100'}
                      alt={game.title}
                      className="w-10 h-14 object-cover rounded border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white text-sm truncate">{game.title}</div>
                      <div className="text-xs text-slate-400">
                        {game.releaseYear ? `Año: ${game.releaseYear}` : ''} {game.genres.slice(0, 2).join(', ')}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-cyan-900/60 text-cyan-300 font-mono">
                      Seleccionar
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Game Selected preview / Manual input */}
          <div className="p-4 rounded-xl border border-slate-800 bg-[#121624]/60 flex items-center gap-4">
            <img
              src={coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200'}
              alt={title || 'Portada'}
              className="w-16 h-22 object-cover rounded-lg border border-slate-700 shadow-md shrink-0"
            />
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Título del Videojuego
              </label>
              <input
                type="text"
                placeholder="Nombre del juego..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#181d2e] border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {igdbGenres.map((g, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Status & Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                  Estado
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#161a28] border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="completed">✅ Terminado</option>
                  <option value="backlog">⏳ Pendiente (Backlog)</option>
                  <option value="playing">🕹️ Jugando actualmente</option>
                  <option value="abandoned">🚫 Abandonado</option>
                </select>
              </div>

              {(status === 'completed' || status === 'abandoned') && (
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                    Año Jugado
                  </label>
                  <input
                    type="number"
                    value={yearPlayed}
                    onChange={(e) => setYearPlayed(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-[#161a28] border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              )}

              {status === 'backlog' && (
                <div>
                  <label className="block text-xs font-mono text-purple-400 uppercase tracking-wider mb-1.5">
                    Tipo / Prioridad (Notion)
                  </label>
                  <input
                    type="text"
                    value={backlogType}
                    onChange={(e) => setBacklogType(e.target.value)}
                    placeholder="ej: Hard, Casual, Cooperativo..."
                    className="w-full px-3 py-2 rounded-xl bg-[#161a28] border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Rating & Podium (Only for completed / played) */}
            {status !== 'backlog' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-800 bg-[#121624]/40">
                {/* Rating Stars */}
                <div>
                  <label className="block text-xs font-mono text-amber-400 uppercase tracking-wider mb-1.5">
                    Calificación
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setRating(starVal)}
                        className="p-1 hover:scale-125 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            starVal <= rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-mono font-bold text-amber-300">
                      {rating} / 5
                    </span>
                  </div>
                </div>

                {/* Podium */}
                <div>
                  <label className="block text-xs font-mono text-amber-400 uppercase tracking-wider mb-1.5">
                    Podio de Honor Anual
                  </label>
                  <select
                    value={podium || 'none'}
                    onChange={(e) => setPodium(e.target.value === 'none' ? null : (e.target.value as any))}
                    className="w-full px-3 py-2 rounded-xl bg-[#161a28] border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="none">Sin medalla</option>
                    <option value="gold">🥇 Oro (1° Lugar / GOTY)</option>
                    <option value="silver">🥈 Plata (2° Lugar)</option>
                    <option value="bronze">🥉 Bronce (3° Lugar)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Custom tags (Notion style tags: Souls, FPS, Mundo Abierto) */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Etiquetas / Géneros Personalizados (Notion)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="ej: Souls, Mundo Abierto, Gestión..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#161a28] border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 cursor-pointer"
                >
                  Agregar Tag
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {customTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-[#191f33] text-cyan-300 border border-cyan-800/50"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomTag(tag)}
                      className="hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Review / Notes */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                {status === 'backlog' ? 'Notas / Links (ej: blizzboygames)' : 'Nota / Reseña Personal'}
              </label>
              <textarea
                rows={3}
                placeholder={
                  status === 'backlog'
                    ? 'Notas, links de descarga o recordatorios...'
                    : 'Escribe qué te pareció el juego, jugabilidad, apartado técnico...'
                }
                value={status === 'backlog' ? notes : review}
                onChange={(e) => {
                  if (status === 'backlog') setNotes(e.target.value);
                  else setReview(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#161a28] border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500 resize-none font-sans"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-purple-600 text-black font-extrabold text-sm tracking-wide shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 stroke-[3]" />
                )}
                <span>Guardar en gamelog.gg</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

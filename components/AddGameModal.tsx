'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Sparkles, Star, Check, Loader2, Download, Flame, Coffee, Edit3 } from 'lucide-react';
import { NormalizedGame } from '@/lib/igdb/types';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { IGameEntry } from '@/models/GameEntry';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameAdded: () => void;
  defaultStatus?: 'completed' | 'backlog';
  gameToEdit?: IGameEntry | null;
}

const STATUS_OPTIONS = [
  { value: 'completed', label: 'Terminado', icon: '✅' },
  { value: 'backlog', label: 'Pendiente (Backlog)', icon: '⏳' },
  { value: 'abandoned', label: 'Abandonado', icon: '🚫' },
];

const PODIUM_OPTIONS = [
  { value: 'none', label: 'Sin medalla' },
  { value: 'gold', label: 'Oro (1º Lugar / GOTY)', icon: '🥇' },
  { value: 'silver', label: 'Plata (2º Lugar)', icon: '🥈' },
  { value: 'bronze', label: 'Bronce (3º Lugar)', icon: '🥉' },
];

export const AddGameModal: React.FC<AddGameModalProps> = ({
  isOpen,
  onClose,
  onGameAdded,
  defaultStatus = 'completed',
  gameToEdit = null,
}) => {
  const currentYear = new Date().getFullYear();

  // Dynamic years from 2025 up to current year, defaulting to current year
  const yearSelectOptions = useMemo(() => {
    const startYear = 2025;
    const maxYear = Math.max(startYear, currentYear);
    const opts = [];
    for (let y = maxYear; y >= startYear; y--) {
      opts.push({
        value: y.toString(),
        label: `${y}${y === currentYear ? ' (Año Vigente)' : ''}`,
        icon: y === currentYear ? '🔥' : '🗓️',
      });
    }
    return opts;
  }, [currentYear]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NormalizedGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form states initialized directly from gameToEdit if present
  const [selectedGame, setSelectedGame] = useState<NormalizedGame | null>(null);
  const [title, setTitle] = useState(gameToEdit?.title || '');
  const [coverUrl, setCoverUrl] = useState(gameToEdit?.coverUrl || '');
  const [igdbGenres, setIgdbGenres] = useState<string[]>(gameToEdit?.igdbGenres || []);
  const [customTags, setCustomTags] = useState<string[]>(gameToEdit?.customTags || []);
  const [tagInput, setTagInput] = useState('');
  
  const initialStatus = (gameToEdit?.status === 'playing' ? 'completed' : gameToEdit?.status) || defaultStatus || 'completed';
  const [status, setStatus] = useState<'completed' | 'abandoned' | 'backlog'>(initialStatus);

  const [yearPlayed, setYearPlayed] = useState<number>(gameToEdit?.yearPlayed || currentYear);
  const [rating, setRating] = useState<number>(gameToEdit?.rating || 5);
  const [podium, setPodium] = useState<'gold' | 'silver' | 'bronze' | null>(gameToEdit?.podium || null);
  const [review, setReview] = useState(gameToEdit?.review || '');
  const [backlogType, setBacklogType] = useState(gameToEdit?.backlogType || 'Hard');
  const [downloadUrl, setDownloadUrl] = useState(
    gameToEdit?.downloadUrl ||
    (gameToEdit?.notes?.startsWith('http') ? gameToEdit.notes : '')
  );
  const [notes, setNotes] = useState(
    gameToEdit?.notes && !gameToEdit.notes.startsWith('http') ? gameToEdit.notes : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const resetForm = (targetStatus: 'completed' | 'abandoned' | 'backlog' = defaultStatus) => {
    setSelectedGame(null);
    setTitle('');
    setCoverUrl('');
    setIgdbGenres([]);
    setCustomTags([]);
    setTagInput('');
    setStatus(targetStatus);
    setYearPlayed(currentYear);
    setRating(5);
    setPodium(null);
    setReview('');
    setBacklogType('Hard');
    setDownloadUrl('');
    setNotes('');
    setSearchQuery('');
    setSearchResults([]);
    setErrorMsg('');
  };

  // Sync state with gameToEdit or reset on open
  useEffect(() => {
    if (!isOpen) return;

    if (gameToEdit) {
      setTitle(gameToEdit.title || '');
      setCoverUrl(gameToEdit.coverUrl || '');
      setIgdbGenres(gameToEdit.igdbGenres || []);
      setCustomTags(gameToEdit.customTags || []);
      const editStatus = gameToEdit.status === 'playing' ? 'completed' : gameToEdit.status;
      setStatus((editStatus || defaultStatus || 'completed') as any);
      setYearPlayed(gameToEdit.yearPlayed || currentYear);
      setRating(gameToEdit.rating || 5);
      setPodium(gameToEdit.podium || null);
      setReview(gameToEdit.review || '');
      setBacklogType(gameToEdit.backlogType || 'Hard');
      setDownloadUrl(
        gameToEdit.downloadUrl ||
        (gameToEdit.notes?.startsWith('http') ? gameToEdit.notes : '')
      );
      setNotes(
        gameToEdit.notes && !gameToEdit.notes.startsWith('http') ? gameToEdit.notes : ''
      );
      setSearchQuery('');
      setSearchResults([]);
      setSelectedGame(null);
      setErrorMsg('');
    } else {
      resetForm(defaultStatus);
    }
  }, [isOpen, gameToEdit, defaultStatus, currentYear]);

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

  const handleClose = () => {
    resetForm(defaultStatus);
    onClose();
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
      const isEdit = !!gameToEdit;
      const url = isEdit ? `/api/games/${gameToEdit._id}` : '/api/games';
      const method = isEdit ? 'PUT' : 'POST';

      const rawUrl = downloadUrl.trim();
      const formattedDownloadUrl = rawUrl
        ? (/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`)
        : '';

      const payload = {
        title: title.trim(),
        coverUrl,
        igdbId: selectedGame?.igdbId ?? gameToEdit?.igdbId,
        igdbGenres,
        customTags,
        status,
        yearPlayed: status === 'completed' || status === 'abandoned' ? yearPlayed : undefined,
        rating: status === 'completed' || status === 'abandoned' ? rating : undefined,
        podium: status === 'completed' ? podium : null,
        review,
        backlogType: backlogType || 'Hard',
        downloadUrl: formattedDownloadUrl,
        notes: notes.trim(),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.error || 'Error al guardar el videojuego');
        setIsSubmitting(false);
        return;
      }

      resetForm(defaultStatus);
      onGameAdded();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al enviar los datos');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = !!gameToEdit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-[#352C56] bg-[#1E1834] text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E264E] bg-[#272041]">
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <Edit3 className="w-5 h-5 text-[#00CAFA]" />
            ) : (
              <Sparkles className="w-5 h-5 text-[#00CAFA]" />
            )}
            <h3 className="font-bold text-lg text-white">
              {isEditMode ? 'Editar Videojuego en' : 'Dar de Alta Videojuego en'}{' '}
              <span className="text-[#00CAFA]">gamelog.gg</span>
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-[#9D96B8] hover:text-white p-1.5 rounded-xl hover:bg-[#1E1834] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-sm">
              {errorMsg}
            </div>
          )}

          {/* IGDB Live Search Bar */}
          <div>
            <label className="block text-xs font-mono text-[#00CAFA] uppercase tracking-wider mb-2">
              Busqueda inteligente
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#9D96B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Escribe el nombre del juego (ej: Silksong, Elden Ring, Cyberpunk)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-full bg-[#141124] border border-[#352C56] text-white placeholder-[#787196] focus:outline-none focus:border-[#6967EB] focus:ring-1 focus:ring-[#6967EB] text-sm transition-colors"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-[#00CAFA] animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Results dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-56 overflow-y-auto custom-scrollbar rounded-2xl border border-[#352C56] bg-[#272041] divide-y divide-[#352C56] shadow-xl">
                {searchResults.map((game) => (
                  <button
                    key={game.igdbId}
                    type="button"
                    onClick={() => handleSelectGame(game)}
                    className="w-full p-2.5 flex items-center gap-3 text-left hover:bg-[#322954] transition-colors cursor-pointer"
                  >
                    <img
                      src={game.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100'}
                      alt={game.title}
                      className="w-10 h-14 object-cover rounded-lg border border-white/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white text-sm truncate">{game.title}</div>
                      <div className="text-xs text-[#9D96B8]">
                        {game.releaseYear ? `Año: ${game.releaseYear}` : ''} {game.genres.slice(0, 2).join(', ')}
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#6967EB]/20 text-[#6967EB] border border-[#6967EB]/30 font-medium">
                      Elegir
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Game Selected preview / Manual input */}
          <div className="p-4 rounded-2xl border border-[#352C56] bg-[#272041] flex items-center gap-4">
            <img
              src={coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200'}
              alt={title || 'Portada'}
              className="w-16 h-22 object-cover rounded-xl border border-white/10 shadow-sm shrink-0"
            />
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-mono text-[#9D96B8] uppercase tracking-wider mb-1">
                Título del Videojuego
              </label>
              <input
                type="text"
                placeholder="Nombre del juego..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#141124] border border-[#352C56] text-white font-bold text-sm focus:outline-none focus:border-[#6967EB] focus:ring-1 focus:ring-[#6967EB] transition-colors"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {igdbGenres.map((g, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-[#1E1834] text-[#00CAFA] border border-[#352C56]"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Status & Tipo (Hard vs Chill) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#9D96B8] uppercase tracking-wider mb-1.5">
                  Estado
                </label>
                <CustomSelect
                  value={status}
                  onValueChange={(val) => setStatus(val as any)}
                  options={STATUS_OPTIONS}
                  placeholder="Selecciona el estado..."
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#00CAFA] uppercase tracking-wider mb-1.5">
                  TIPO
                </label>
                {/* Modern Chill vs Hard Segmented Toggle */}
                <div className="grid grid-cols-2 p-1 rounded-full bg-[#141124] border border-[#352C56]">
                  <button
                    type="button"
                    onClick={() => setBacklogType('Chill')}
                    className={`flex items-center justify-center gap-2 py-2 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      backlogType === 'Chill'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                        : 'text-[#9D96B8] hover:text-white'
                    }`}
                  >
                    <Coffee className="w-4 h-4" />
                    <span>Chill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBacklogType('Hard')}
                    className={`flex items-center justify-center gap-2 py-2 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      backlogType === 'Hard'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                        : 'text-[#9D96B8] hover:text-white'
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                    <span>Hard</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Año Jugado for completed / abandoned */}
            {(status === 'completed' || status === 'abandoned') && (
              <div>
                <label className="block text-xs font-mono text-[#9D96B8] uppercase tracking-wider mb-1.5">
                  Año Jugado
                </label>
                <CustomSelect
                  value={yearPlayed.toString()}
                  onValueChange={(val) => setYearPlayed(parseInt(val, 10))}
                  options={yearSelectOptions}
                  placeholder="Selecciona el año..."
                />
              </div>
            )}

            {/* Rating & Podium (Only for completed) */}
            {status !== 'backlog' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border border-[#352C56] bg-[#272041]">
                {/* Rating Stars */}
                <div>
                  <label className="block text-xs font-mono text-[#9D96B8] uppercase tracking-wider mb-2">
                    Calificación ({rating}/5)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= rating
                              ? 'fill-[#FFBE0B] text-[#FFBE0B]'
                              : 'text-[#44386E]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Podium Dropdown */}
                <div>
                  <label className="block text-xs font-mono text-[#FFBE0B] uppercase tracking-wider mb-1.5">
                    Podio de Honor Anual
                  </label>
                  <CustomSelect
                    value={podium || 'none'}
                    onValueChange={(val) => setPodium(val === 'none' ? null : (val as any))}
                    options={PODIUM_OPTIONS}
                    placeholder="Elige podio opcional..."
                  />
                </div>
              </div>
            )}

            {/* Review (for completed / abandoned) */}
            {status !== 'backlog' && (
              <div>
                <label className="block text-xs font-mono text-[#9D96B8] uppercase tracking-wider mb-1.5">
                  Reseña / Veredicto Corto
                </label>
                <textarea
                  rows={2}
                  placeholder="Escribe tus impresiones breves del videojuego..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-full bg-[#141124] border border-[#352C56] text-white text-xs focus:outline-none focus:border-[#6967EB] focus:ring-1 focus:ring-[#6967EB] transition-colors"
                />
              </div>
            )}

            {/* Download Link */}
            <div>
              <label className="block text-xs font-mono text-[#00CAFA] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Download className="w-4 h-4" />
                Link de Descarga {status !== 'backlog' ? '(Opcional)' : ''}
              </label>
              <input
                type="url"
                placeholder="https://... (enlace directo de descarga o web)"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-full bg-[#141124] border border-[#352C56] text-white text-xs focus:outline-none focus:border-[#6967EB] focus:ring-1 focus:ring-[#6967EB] transition-colors"
              />
            </div>

            {/* Notes / Clarifications */}
            <div>
              <label className="block text-xs font-mono text-[#9D96B8] uppercase tracking-wider mb-1.5">
                Notas {status !== 'backlog' ? 'Aclaratorias (Opcional)' : ''}
              </label>
              <textarea
                rows={status === 'backlog' ? 3 : 2}
                placeholder="Aclaraciones o notas del juego (ej: versión con DLCs, requiere parche, etc.)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-full bg-[#141124] border border-[#352C56] text-white text-xs focus:outline-none focus:border-[#6967EB] focus:ring-1 focus:ring-[#6967EB] transition-colors"
              />
            </div>

            {/* Custom Tags */}
            <div>
              <label className="block text-xs font-mono text-[#9D96B8] uppercase tracking-wider mb-1.5">
                Etiquetas
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Agregar etiqueta (ej: Souls, FPS, Cooperativo)..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                  className="flex-1 px-3.5 py-2 rounded-full bg-[#141124] border border-[#352C56] text-white text-xs focus:outline-none focus:border-[#6967EB] focus:ring-1 focus:ring-[#6967EB] transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="px-4 py-2 bg-[#272041] hover:bg-[#322954] text-white rounded-2xl text-xs font-semibold border border-[#352C56] transition-colors cursor-pointer"
                >
                  Agregar
                </button>
              </div>

              {customTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {customTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-[#6967EB]/20 text-[#6967EB] border border-[#6967EB]/30 font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomTag(tag)}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2E264E]">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-bold text-[#9D96B8] hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#6967EB] hover:bg-[#5856d6] text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{isEditMode ? 'Actualizar Videojuego' : 'Guardar Videojuego'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

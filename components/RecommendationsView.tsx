'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Sparkles, 
  Trophy, 
  Flame, 
  Coffee, 
  TrendingUp, 
  Loader2, 
  Gamepad2, 
  Layers, 
  CheckCircle2, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Check,
  Award,
  Calendar,
  Radar
} from 'lucide-react';
import { toast } from 'sonner';
import { NormalizedGame } from '@/lib/igdb/types';
import { RecommendationCard, RecGame } from './RecommendationCard';
import { TGA_AVAILABLE_YEARS, TGA_GOTY_DATA } from '@/lib/data/tgaGoty';

const ITEMS_PER_PAGE = 10;
const SCRAPE_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes cooldown

type FilterMode = 'all' | 'popular' | 'podium' | 'Hard' | 'Chill' | 'tga';

interface RecommendationsViewProps {
  onAddGameToBacklog: (game: NormalizedGame, type: 'Hard' | 'Chill') => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  onAddGameToBacklog,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  const [recommendations, setRecommendations] = useState<RecGame[]>([]);
  const [topGenres, setTopGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChangingPage, setIsChangingPage] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFound, setTotalFound] = useState(0);

  // Filter states
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Default to the latest year that has data (e.g. 2025)
  const [selectedTgaYear, setSelectedTgaYear] = useState<number>(2025);

  // TGA Year states (loaded dynamically from MongoDB with seed fallback)
  const [tgaYears, setTgaYears] = useState<number[]>(TGA_AVAILABLE_YEARS);
  const [tgaEditionsData, setTgaEditionsData] = useState<Record<number, { title: string; isWinner: boolean }[]>>(TGA_GOTY_DATA);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [yearSearchQuery, setYearSearchQuery] = useState('');

  // Scraper states & 30-min rate-limiting cooldown
  const [isScraping, setIsScraping] = useState(false);
  const [cooldownRemainingSeconds, setCooldownRemainingSeconds] = useState(0);

  // Dismissed count from MongoDB
  const [dismissedCount, setDismissedCount] = useState<number>(0);

  // Check 30-minute scraper cooldown
  useEffect(() => {
    const checkCooldown = () => {
      if (typeof window === 'undefined') return;
      const lastTimeStr = localStorage.getItem('tga_last_scrape_timestamp');
      if (lastTimeStr) {
        const elapsed = Date.now() - parseInt(lastTimeStr, 10);
        const remaining = Math.max(0, Math.ceil((SCRAPE_COOLDOWN_MS - elapsed) / 1000));
        setCooldownRemainingSeconds(remaining);
      } else {
        setCooldownRemainingSeconds(0);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 3000);
    return () => clearInterval(interval);
  }, []);

  // Load dynamic TGA editions and years from MongoDB (always selecting default as latest year with data)
  useEffect(() => {
    fetch('/api/tga')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          if (Array.isArray(json.data.years) && json.data.years.length > 0) {
            setTgaYears(json.data.years);
          }
          if (json.data.editions) {
            setTgaEditionsData(json.data.editions);
          }
          if (json.data.latestYearWithData) {
            setSelectedTgaYear(json.data.latestYearWithData);
          }
        }
      })
      .catch((err) => console.error('Error fetching TGA editions from DB:', err));
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target as Node)) {
        setIsYearDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRecommendations = useCallback(
    async (
      page: number,
      mode: FilterMode,
      genre: string | null,
      tgaYear: number
    ) => {
      try {
        setIsChangingPage(true);
        const params = new URLSearchParams();

        params.set('mode', mode);
        params.set('page', page.toString());
        params.set('limit', ITEMS_PER_PAGE.toString());

        if (mode === 'tga') {
          params.set('tgaYear', tgaYear.toString());
        } else if (
          genre &&
          mode !== 'podium' &&
          mode !== 'Hard' &&
          mode !== 'Chill' &&
          mode !== 'popular'
        ) {
          params.set('mode', 'genre');
          params.set('genre', genre);
        }

        const res = await fetch(`/api/recommendations?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setRecommendations(json.data.recommendations || []);
          setCurrentPage(json.data.page || page);
          setTotalPages(json.data.totalPages || 1);
          setTotalFound(json.data.totalFound || 0);
          setDismissedCount(json.data.dismissedCount || 0);

          if (json.data.topGenres && json.data.topGenres.length > 0) {
            setTopGenres(json.data.topGenres);
          }
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoading(false);
        setIsChangingPage(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchRecommendations(currentPage, filterMode, selectedGenre, selectedTgaYear);
  }, [currentPage, filterMode, selectedGenre, selectedTgaYear, fetchRecommendations]);

  // Mode button click (resets to page 1)
  const handleModeChange = (newMode: FilterMode) => {
    setLoading(true);
    setFilterMode(newMode);
    setSelectedGenre(null);
    setCurrentPage(1);
  };

  const handleTgaYearChange = (year: number) => {
    setLoading(true);
    setSelectedTgaYear(year);
    setCurrentPage(1);
  };

  const handleSelectGenre = (genre: string) => {
    setLoading(true);
    if (selectedGenre === genre) {
      setSelectedGenre(null);
      setFilterMode('all');
      setCurrentPage(1);
    } else {
      setSelectedGenre(genre);
      setFilterMode('all');
      setCurrentPage(1);
    }
  };

  // Pagination navigation
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Mark game as "Terminado" / Already played -> Saves to MongoDB table DismissedGame!
  const handleMarkAsFinished = async (game: NormalizedGame) => {
    // Immediately remove from visible list
    setRecommendations((prev) => prev.filter((r) => r.igdbId !== game.igdbId));
    setDismissedCount((prev) => prev + 1);
    toast.success(`"${game.title}" marcado como terminado en tu base de datos.`);

    try {
      await fetch('/api/recommendations/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: game.title,
          igdbId: game.igdbId,
          coverUrl: game.coverUrl,
        }),
      });
    } catch (e) {
      console.error('Error saving dismissed game:', e);
    }
  };

  // Reset dismissed games in DB
  const handleResetDismissed = async () => {
    try {
      await fetch('/api/recommendations/dismiss', { method: 'DELETE' });
      setDismissedCount(0);
      toast.success('Lista de juegos terminados restablecida');
      fetchRecommendations(1, filterMode, selectedGenre, selectedTgaYear);
    } catch (e) {
      console.error('Error resetting dismissed:', e);
    }
  };

  // Manual trigger for scraping TGA nominees
  const handleTriggerScraper = async () => {
    if (cooldownRemainingSeconds > 0 || isScraping) return;

    // Immediately record timestamp in localStorage for 30m cooldown
    if (typeof window !== 'undefined') {
      localStorage.setItem('tga_last_scrape_timestamp', Date.now().toString());
    }
    setCooldownRemainingSeconds(Math.ceil(SCRAPE_COOLDOWN_MS / 1000));
    setIsScraping(true);

    // Inform user right away as requested
    toast.info('La búsqueda fue iniciada, si encontramos algo te lo mostraremos aquí más tarde.', {
      duration: 6000,
    });

    try {
      const res = await fetch('/api/tga/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: selectedTgaYear }),
      });
      const data = await res.json();

      if (data.success && data.found) {
        toast.success(data.message || `¡Nominados de ${selectedTgaYear} encontrados y sincronizados!`);
        // Refresh TGA editions from DB
        const tgaRes = await fetch('/api/tga');
        const tgaJson = await tgaRes.json();
        if (tgaJson.success && tgaJson.data) {
          setTgaYears(tgaJson.data.years || []);
          setTgaEditionsData(tgaJson.data.editions || {});
        }
        // Fetch recommendations for this year
        fetchRecommendations(1, 'tga', null, selectedTgaYear);
      } else {
        toast.info(data.message || `Aún no se han publicado los nominados oficiales para The Game Awards ${selectedTgaYear}.`);
      }
    } catch (err) {
      console.error('Error running TGA scraper:', err);
      toast.error('Hubo un problema al consultar la información externa.');
    } finally {
      setIsScraping(false);
    }
  };

  // Ensure current year is always available in options
  const currentCalendarYear = new Date().getFullYear();
  const allAvailableYears = Array.from(new Set([currentCalendarYear, ...tgaYears])).sort((a, b) => b - a);

  // Filter years according to search input
  const filteredYears = allAvailableYears.filter((y) =>
    y.toString().includes(yearSearchQuery.trim())
  );

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header Banner - overflow-visible so the dropdown is not clipped */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#1E1834] via-[#241A45] to-[#1E1834] border border-[#352C56] p-6 shadow-xl z-20">
        {/* Background glow contained separately */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="absolute -top-16 -right-16 w-52 h-52 bg-[#6967EB]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-[#00CAFA]/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Recomendaciones Inteligentes
              </h3>
              <p className="text-xs text-[#9D96B8] mt-1 max-w-2xl">
                Equilibrio entre actualidad, popularidad global y afinidad con tu biblioteca (Podio, calificaciones y Backlog). Explora lanzamientos recientes en tendencia o gira la tarjeta en 3D para ver trailers y gameplays.
              </p>
            </div>

            {/* Quick Status Badge */}
            <div className="shrink-0 flex items-center gap-2 bg-[#141124] px-3.5 py-2 rounded-2xl border border-[#352C56]">
              {filterMode === 'tga' ? (
                <>
                  <Award className="w-4 h-4 text-[#FFBE0B]" />
                  <span className="text-xs font-mono font-bold text-white">
                    TGA GOTY {selectedTgaYear} ({recommendations.length} nominados)
                  </span>
                </>
              ) : (
                <>
                  <Gamepad2 className="w-4 h-4 text-[#00CAFA]" />
                  <span className="text-xs font-mono font-bold text-white">
                    Pág. {currentPage} de {totalPages}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Filter Bar: Mode Tabs & Genre Chips */}
          <div className="pt-4 border-t border-[#352C56] flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Mode Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#141124] p-1.5 rounded-2xl border border-[#2E264E]">
                <button
                  type="button"
                  onClick={() => handleModeChange('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    filterMode === 'all' && !selectedGenre
                      ? 'bg-[#272041] text-white shadow-sm border border-[#352C56]'
                      : 'text-[#9D96B8] hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#00CAFA]" />
                  <span>Para Ti</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('popular')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterMode === 'popular'
                      ? 'bg-gradient-to-r from-[#00CAFA]/20 to-[#6967EB]/25 text-[#00CAFA] border border-[#00CAFA]/50 shadow-sm'
                      : 'text-[#9D96B8] hover:text-[#00CAFA]'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-[#00CAFA]" />
                  <span>Popular</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('tga')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterMode === 'tga'
                      ? 'bg-gradient-to-r from-[#FFBE0B]/25 to-[#F97316]/25 text-[#FFBE0B] border border-[#FFBE0B]/50 shadow-sm'
                      : 'text-[#9D96B8] hover:text-[#FFBE0B]'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-[#FFBE0B]" />
                  <span>The Game Awards</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('podium')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    filterMode === 'podium'
                      ? 'bg-[#FFBE0B]/20 text-[#FFBE0B] border border-[#FFBE0B]/40 shadow-sm'
                      : 'text-[#9D96B8] hover:text-white'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-[#FFBE0B]" />
                  <span>Por tu Podio</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('Hard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    filterMode === 'Hard'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'text-[#9D96B8] hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Tryhard (Hard)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('Chill')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    filterMode === 'Chill'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-[#9D96B8] hover:text-white'
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Modo Chill</span>
                </button>
              </div>

              {/* Top Genres Pill Tags (when not in TGA mode) */}
              {filterMode !== 'tga' && topGenres.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full custom-scrollbar">
                  <span className="text-[11px] font-mono text-[#9D96B8] shrink-0 mr-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#6967EB]" /> Géneros:
                  </span>
                  {topGenres.slice(0, 5).map((genre) => {
                    const isSelected = selectedGenre === genre;
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => handleSelectGenre(genre)}
                        className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#6967EB] text-white border-[#6967EB] shadow-[0_0_8px_rgba(105,103,235,0.4)]'
                            : 'bg-[#1E1834] text-[#CBD5E1] border-[#352C56] hover:border-[#6967EB]/50'
                        }`}
                      >
                        #{genre}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sub-bar: The Game Awards Searchable Year Selector + Manual Scraper Button */}
            {filterMode === 'tga' && (
              <div className="flex flex-wrap items-center gap-3 py-1">
                <span className="text-xs font-mono text-[#FFBE0B] shrink-0 flex items-center gap-1.5 font-bold">
                  <Award className="w-3.5 h-3.5 text-[#FFBE0B]" /> Edición GOTY:
                </span>

                {/* Searchable Select Combobox */}
                <div className="relative" ref={yearDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsYearDropdownOpen((prev) => !prev)}
                    className="flex items-center justify-between gap-3 px-3.5 py-1.5 min-w-[155px] rounded-xl text-xs font-bold bg-[#141124] text-white border border-[#FFBE0B]/50 hover:border-[#FFBE0B] shadow-sm hover:shadow-[0_0_12px_rgba(255,190,11,0.25)] transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#FFBE0B]" />
                      <span>Año {selectedTgaYear}</span>
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#9D96B8] transition-transform duration-200 ${isYearDropdownOpen ? 'rotate-180 text-[#FFBE0B]' : ''}`} />
                  </button>

                  {/* Dropdown with search input (floats cleanly with z-50 and no clipping) */}
                  {isYearDropdownOpen && (
                    <div className="absolute left-0 top-full mt-2 w-80 max-w-[90vw] bg-[#18132B] border border-[#352C56] rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.85)] z-50 overflow-hidden backdrop-blur-md">
                      {/* Search Input */}
                      <div className="p-2.5 border-b border-[#352C56] bg-[#141124]">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9D96B8]" />
                          <input
                            type="text"
                            placeholder="Buscar año (ej: 2026, 2025)..."
                            value={yearSearchQuery}
                            onChange={(e) => setYearSearchQuery(e.target.value)}
                            className="w-full bg-[#1F1938] text-xs text-white placeholder-[#9D96B8]/70 pl-8 pr-7 py-2 rounded-lg border border-[#352C56] focus:outline-none focus:border-[#FFBE0B] transition-colors"
                            autoFocus
                          />
                          {yearSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setYearSearchQuery('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#9D96B8] hover:text-white"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Years list */}
                      <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
                        {filteredYears.length === 0 ? (
                          <div className="px-3 py-4 text-center text-xs text-[#9D96B8]">
                            No se encontró ningún año para &quot;{yearSearchQuery}&quot;
                          </div>
                        ) : (
                          filteredYears.map((year) => {
                            const isSelected = selectedTgaYear === year;
                            const nominees = tgaEditionsData[year] || [];
                            const winner = nominees.find((n) => n.isWinner);
                            const hasData = nominees.length > 0;

                            return (
                              <button
                                key={year}
                                type="button"
                                onClick={() => {
                                  handleTgaYearChange(year);
                                  setIsYearDropdownOpen(false);
                                  setYearSearchQuery('');
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#FFBE0B] text-black font-bold shadow-sm'
                                    : 'text-[#CBD5E1] hover:bg-[#251D42] hover:text-white'
                                }`}
                              >
                                <span className="flex items-center gap-2.5 min-w-0">
                                  <span className="font-mono text-xs shrink-0">{year}</span>
                                  {!hasData ? (
                                    <span className={`text-[10px] italic font-normal ${isSelected ? 'text-black/70' : 'text-[#9D96B8]'}`}>
                                      (Sin datos / Buscar)
                                    </span>
                                  ) : winner ? (
                                    <span className={`text-[11px] truncate max-w-[160px] font-normal ${isSelected ? 'text-black/80' : 'text-[#9D96B8]'}`}>
                                      🏆 {winner.title}
                                    </span>
                                  ) : (
                                    <span className={`text-[11px] font-normal ${isSelected ? 'text-black/80' : 'text-[#FFBE0B]/80'}`}>
                                      ⭐ Nominados
                                    </span>
                                  )}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-black shrink-0" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Scraper Action Button - Rate limited to once every 30 minutes */}
                <button
                  type="button"
                  disabled={isScraping || cooldownRemainingSeconds > 0}
                  onClick={handleTriggerScraper}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                    cooldownRemainingSeconds > 0
                      ? 'bg-[#18132B]/50 text-[#9D96B8]/50 border-[#352C56]/40 cursor-not-allowed opacity-70'
                      : isScraping
                      ? 'bg-[#272041] text-[#00CAFA] border-[#00CAFA]/50 cursor-wait'
                      : 'bg-[#6967EB]/20 hover:bg-[#6967EB]/30 text-[#00CAFA] border-[#6967EB]/40 hover:border-[#00CAFA] hover:shadow-[0_0_12px_rgba(0,202,250,0.25)] cursor-pointer'
                  }`}
                  title={
                    cooldownRemainingSeconds > 0
                      ? `Botón disponible en ${Math.ceil(cooldownRemainingSeconds / 60)} min`
                      : `Buscar en la web los nominados oficiales de The Game Awards ${selectedTgaYear}`
                  }
                >
                  {isScraping ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00CAFA]" />
                  ) : (
                    <Radar className="w-3.5 h-3.5 text-[#00CAFA]" />
                  )}
                  <span>
                    {isScraping
                      ? 'Buscando...'
                      : cooldownRemainingSeconds > 0
                      ? `Buscar nominados (${Math.ceil(cooldownRemainingSeconds / 60)}m)`
                      : 'Buscar nominados'}
                  </span>
                </button>

                <span className="text-[11px] text-[#9D96B8] hidden sm:inline">
                  {(tgaEditionsData[selectedTgaYear]?.length || 0) === 0
                    ? `Edición ${selectedTgaYear}: Aún sin datos guardados. Presiona "Buscar nominados".`
                    : `Mostrando nominados y ganador de The Game Awards ${selectedTgaYear}.`}
                </span>
              </div>
            )}
          </div>

          {/* Dismissed indicator (only shown when not in TGA mode, since TGA never filters them) */}
          {filterMode !== 'tga' && dismissedCount > 0 && (
            <div className="mt-3 pt-3 border-t border-[#352C56]/50 flex items-center justify-between text-xs text-[#9D96B8]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                Guardados en base de datos: <strong className="text-white">{dismissedCount}</strong> juegos terminados (filtrados de sugerencias).
              </span>
              <button
                type="button"
                onClick={handleResetDismissed}
                className="inline-flex items-center gap-1 text-[#00CAFA] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer juegos terminados</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#00CAFA] animate-spin" />
          <p className="text-white font-bold text-sm tracking-wide">
            {filterMode === 'tga'
              ? `Obteniendo todos los nominados al GOTY ${selectedTgaYear} y trailers de IGDB...`
              : filterMode === 'popular'
              ? 'Buscando lanzamientos nuevos y populares en tendencia...'
              : 'Calculando afinidad, popularidad y actualidad en IGDB...'}
          </p>
          <p className="text-[#9D96B8] text-xs">
            Extrayendo portadas oficiales, trailers y gameplays...
          </p>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="space-y-8">
          {/* ==============================================================
             2-COLUMN RESPONSIVE GRID (showing up to 10 recommendations per page)
             ============================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.igdbId}
                game={rec}
                onAddGameToBacklog={onAddGameToBacklog}
                onMarkAsFinished={handleMarkAsFinished}
              />
            ))}
          </div>

          {/* ==============================================================
             PAGINATION CONTROLS (Only for non-TGA modes, since TGA shows all nominees of that year)
             ============================================================== */}
          {filterMode !== 'tga' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#1E1834] border border-[#2E264E] shadow-sm">
              <div className="text-xs text-[#9D96B8]">
                Página <strong className="text-white">{currentPage}</strong> de{' '}
                <strong className="text-white">{totalPages}</strong> (
                <span className="text-[#00CAFA] font-medium">{totalFound}</span> títulos disponibles)
              </div>

              {/* Pagination Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1 || isChangingPage}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#272041] hover:bg-[#322954] text-white text-xs font-semibold border border-[#352C56] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                {/* Page Number Chips */}
                <div className="flex items-center gap-1">
                  {(() => {
                    const maxButtons = 5;
                    let start = 1;
                    let end = totalPages;

                    if (totalPages > maxButtons) {
                      start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
                      end = start + maxButtons - 1;
                      if (end > totalPages) {
                        end = totalPages;
                        start = Math.max(1, end - maxButtons + 1);
                      }
                    }

                    const pageNumbers: number[] = [];
                    for (let p = start; p <= end; p++) {
                      pageNumbers.push(p);
                    }

                    return pageNumbers.map((pNum) => (
                      <button
                        key={`page-btn-${pNum}`}
                        type="button"
                        disabled={isChangingPage}
                        onClick={() => handlePageChange(pNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentPage === pNum
                            ? 'bg-[#6967EB] text-white shadow-sm border border-[#6967EB]'
                            : 'bg-[#272041] text-[#9D96B8] hover:text-white border border-[#352C56]'
                        }`}
                      >
                        {pNum}
                      </button>
                    ));
                  })()}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages || isChangingPage}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#272041] hover:bg-[#322954] text-white text-xs font-semibold border border-[#352C56] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 text-center border border-dashed border-[#352C56] rounded-3xl bg-[#1E1834]/40">
          <Gamepad2 className="w-10 h-10 text-[#9D96B8] mx-auto mb-3 opacity-50" />
          <h4 className="text-base font-bold text-white">
            {filterMode === 'tga'
              ? `No hay nominados guardados para The Game Awards ${selectedTgaYear}`
              : 'No encontramos sugerencias para este filtro'}
          </h4>
          <p className="text-xs text-[#9D96B8] mt-1 max-w-sm mx-auto">
            {filterMode === 'tga'
              ? 'Puedes presionar el botón "Buscar nominados" arriba para consultar si ya fueron anunciados.'
              : 'Prueba cambiando a "Para Ti" o navega a la página 1 para ver otros títulos.'}
          </p>
          {filterMode === 'tga' ? (
            <button
              type="button"
              disabled={isScraping || cooldownRemainingSeconds > 0}
              onClick={handleTriggerScraper}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#6967EB] hover:bg-[#5856d6] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Radar className="w-4 h-4 text-[#00CAFA]" />
              <span>
                {isScraping
                  ? 'Buscando nominados...'
                  : cooldownRemainingSeconds > 0
                  ? `Buscar nominados (${Math.ceil(cooldownRemainingSeconds / 60)}m)`
                  : 'Buscar nominados ahora'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleModeChange('all')}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#6967EB] hover:bg-[#5856d6] transition-colors cursor-pointer"
            >
              Volver a Para Ti
            </button>
          )}
        </div>
      )}
    </div>
  );
};

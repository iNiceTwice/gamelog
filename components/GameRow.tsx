'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Star, 
  CheckCircle2, 
  Ban, 
  Trash2, 
  Pencil, 
  Download, 
  MessageSquare, 
  FileText,
  Flame,
  Coffee,
  Clock,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { IGameEntry } from '@/models/GameEntry';

interface GameRowProps {
  game: IGameEntry;
  onEdit?: (game: IGameEntry) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (game: IGameEntry, newStatus: 'completed') => void;
}

export const GameRow: React.FC<GameRowProps> = ({ game, onEdit, onDelete, onToggleStatus }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const isBacklog = game.status === 'backlog';

  const getStatusBadge = () => {
    switch (game.status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
            <CheckCircle2 className="w-3 h-3" />
            Terminado
          </span>
        );
      case 'abandoned':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <Ban className="w-3 h-3" />
            Abandonado
          </span>
        );
      case 'backlog':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#1E1834] text-[#9D96B8] border border-[#352C56]">
            <Clock className="w-3 h-3 text-[#6967EB]" />
            Pendiente
          </span>
        );
    }
  };

  const getPodiumBadge = () => {
    if (game.podium === 'gold') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FFBE0B] text-black shadow-md tracking-wide">
          🥇 GOTY
        </span>
      );
    }
    if (game.podium === 'silver') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-[#CBD5E1] text-black shadow-md tracking-wide">
          🥈 Plata
        </span>
      );
    }
    if (game.podium === 'bronze') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-[#F97316] text-black shadow-md tracking-wide">
          🥉 Bronce
        </span>
      );
    }
    return null;
  };

  // Hard / Chill badge with NO text, just the exact matching icons from the form toggle
  const getBacklogTypeBadge = () => {
    if (!game.backlogType) return null;
    if (game.backlogType === 'Hard') {
      return (
        <span
          title="Hard"
          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
        >
          <Flame className="w-3.5 h-3.5 text-rose-300" />
        </span>
      );
    }
    if (game.backlogType === 'Chill') {
      return (
        <span
          title="Chill"
          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
        >
          <Coffee className="w-3.5 h-3.5 text-emerald-300" />
        </span>
      );
    }
    return null;
  };

  // Combine customTags with IGDB genres and themes, without replacing them
  const displayTags = (() => {
    const custom = game.customTags || [];
    const igdb = game.igdbGenres || [];
    const combined: string[] = [];
    const seen = new Set<string>();

    [...custom, ...igdb].forEach((tag) => {
      if (!tag) return;
      const trimmed = tag.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        combined.push(trimmed);
      }
    });

    return combined;
  })();

  const shouldScrollTags = displayTags.length > 2;
  const loopTags = shouldScrollTags ? [...displayTags, ...displayTags] : displayTags;

  const cover = game.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600';

  // Extract valid download link from downloadUrl or notes fallback
  const getDownloadLink = () => {
    if (game.downloadUrl && game.downloadUrl.trim()) {
      const trimmed = game.downloadUrl.trim();
      return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
    }
    if (game.notes && game.notes.trim()) {
      const trimmedNotes = game.notes.trim();
      if (trimmedNotes.startsWith('http://') || trimmedNotes.startsWith('https://') || trimmedNotes.startsWith('www.')) {
        return trimmedNotes.startsWith('http') ? trimmedNotes : `https://${trimmedNotes}`;
      }
      const match = trimmedNotes.match(/https?:\/\/[^\s]+/i);
      if (match) return match[0];
    }
    return '';
  };

  const downloadLink = getDownloadLink();
  const isPureUrl = (str?: string) => {
    if (!str) return false;
    const t = str.trim();
    return (t.startsWith('http://') || t.startsWith('https://') || t.startsWith('www.')) && !t.includes(' ');
  };
  const showClarificationNote = Boolean(game.notes && !isPureUrl(game.notes));

  // Dynamic URLs for alternative download sources
  const piviUrl = `https://pivigames.blog/?s=${encodeURIComponent(game.title).replace(/%20/g, '+')}`;
  const elEnemigosUrl = `https://elenemigos.com/?g_name=${encodeURIComponent(game.title)}&order=last_update`;

  return (
    <div className="group relative rounded-2xl border border-[#352C56] bg-[#272041] overflow-hidden transition-all duration-200 hover:border-[#6967EB]/60 hover:bg-[#2C244C] flex flex-row items-stretch min-h-[170px] shadow-lg">
      {/* 1. Left Edge-to-Edge Cover Image: Crisp, sharp, 0 padding, 0 margin, no blur or fadeout */}
      <div className="relative w-28 sm:w-36 shrink-0 overflow-hidden bg-[#141124]">
        <img
          src={cover}
          alt={game.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />

        {/* Podium badge directly pinned on top-left of image */}
        {game.podium && (
          <div className="absolute top-2 left-2 z-10 scale-90 origin-top-left drop-shadow-md">
            {getPodiumBadge()}
          </div>
        )}
      </div>

      {/* 2. Card Content Area */}
      <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between min-w-0 gap-2">
        {/* Top Header: Title, Year, Status & Actions */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-base text-white group-hover:text-[#00CAFA] transition-colors truncate" title={game.title}>
                {game.title}
              </h4>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {game.yearPlayed && (
                  <span className="text-xs text-[#9D96B8] font-mono">
                    {game.yearPlayed}
                  </span>
                )}
                {getStatusBadge()}
                {getBacklogTypeBadge()}
              </div>
            </div>

            {/* Quick Action buttons (Edit & Delete) */}
            <div className="flex items-center gap-1 shrink-0">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(game)}
                  className="p-1.5 rounded-lg text-[#9D96B8] hover:text-[#00CAFA] hover:bg-[#1E1834] transition-colors"
                  title="Editar videojuego"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(game._id.toString())}
                  className="p-1.5 rounded-lg text-[#9D96B8] hover:text-rose-400 hover:bg-[#1E1834] transition-colors"
                  title="Eliminar videojuego"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tags Marquee Ticker & Rating (Shows combined customTags + igdb genres/themes) */}
          <div className="flex items-center justify-between gap-2 mt-2 w-full min-w-0">
            {/* Modern marquee / ticker pasarela: scrolls on card hover only */}
            <div className="relative overflow-hidden flex-1 min-w-0 py-0.5">
              <div
                className={`tags-marquee-track ${
                  shouldScrollTags ? 'tags-marquee-animate' : ''
                }`}
              >
                {loopTags.map((tag, idx) => {
                  const isCustom = (game.customTags || []).some(
                    (ct) => ct && ct.trim().toLowerCase() === tag.toLowerCase()
                  );
                  return (
                    <span
                      key={`${tag}-${idx}`}
                      className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-md whitespace-nowrap border ${
                        isCustom
                          ? 'bg-[#6967EB]/25 text-[#00CAFA] border-[#6967EB]/50'
                          : 'bg-[#1E1834] text-[#C5C0DC] border-[#352C56]/70'
                      }`}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
              {/* Fade gradient on right edge of marquee */}
              {shouldScrollTags && (
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#272041] group-hover:from-[#2C244C] to-transparent z-10 transition-colors" />
              )}
            </div>

            {game.rating && !isBacklog ? (
              <div className="flex items-center gap-0.5 text-[#FFBE0B] shrink-0 pl-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < (game.rating || 0)
                        ? 'fill-[#FFBE0B] text-[#FFBE0B]'
                        : 'text-[#44386E]'
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Middle/Bottom: Review (only for played games), Notes and Download Button */}
        <div className="space-y-2 pt-2 border-t border-[#352C56]/60">
          {/* Review note quote if available (not shown for backlog) */}
          {game.review && !isBacklog && (
            <div className="flex items-start gap-1.5 text-xs text-[#9D96B8] line-clamp-2 italic">
              <MessageSquare className="w-3.5 h-3.5 text-[#6967EB] shrink-0 mt-0.5" />
              <span>{game.review}</span>
            </div>
          )}

          {/* Bottom Row: Note on left (if any), Download Button / Split Dropdown on the RIGHT */}
          {(showClarificationNote || downloadLink || isBacklog) && (
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="min-w-0 flex-1">
                {showClarificationNote && (
                  <div className="inline-flex items-center gap-1.5 text-[11px] text-[#C5C0DC] bg-[#1E1834]/80 px-2.5 py-1 rounded-lg border border-[#352C56] max-w-full truncate">
                    <FileText className="w-3 h-3 text-[#00CAFA] shrink-0" />
                    <span className="truncate">{game.notes}</span>
                  </div>
                )}
              </div>

              {/* Backlog: Split button with Download and mini dropdown */}
              {isBacklog ? (
                <div className="shrink-0 ml-auto relative" ref={dropdownRef}>
                  <div className="inline-flex items-center rounded-xl shadow-sm">
                    {downloadLink ? (
                      <a
                        href={downloadLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-l-xl bg-[#00CAFA]/15 text-[#00CAFA] hover:bg-[#00CAFA]/25 border-y border-l border-[#00CAFA]/30 text-xs font-bold transition-all leading-none"
                        title="Descargar videojuego desde enlace asignado"
                      >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        <span className="leading-none">Descargar</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-l-xl bg-[#1E1834] text-[#8E87AA]/60 border-y border-l border-[#352C56] text-xs font-semibold cursor-not-allowed leading-none select-none"
                        title="Sin link configurado en este juego"
                      >
                        <Download className="w-3.5 h-3.5 shrink-0 opacity-40" />
                        <span className="leading-none opacity-60">Descargar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen((prev) => !prev)}
                      className={`inline-flex items-center justify-center px-1.5 py-1.5 rounded-r-xl border text-xs transition-all leading-none ${
                        isDropdownOpen
                          ? 'bg-[#00CAFA]/30 text-white border-[#00CAFA]/50 border-l border-l-[#00CAFA]/30'
                          : downloadLink
                            ? 'bg-[#00CAFA]/15 text-[#00CAFA] hover:bg-[#00CAFA]/25 border-[#00CAFA]/30 border-l border-l-[#00CAFA]/20'
                            : 'bg-[#00CAFA]/10 text-[#00CAFA] hover:bg-[#00CAFA]/20 border-[#00CAFA]/30 border-l border-l-[#352C56]'
                      }`}
                      title="Opciones de descarga adicionales"
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isDropdownOpen ? 'rotate-180 text-white' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Dropdown Menu (Opens upwards cleanly inside card) */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 bottom-full mb-1.5 z-40 min-w-[160px] bg-[#1E1834] border border-[#352C56] rounded-xl shadow-2xl p-1 backdrop-blur-md animate-in fade-in duration-150">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-[#8E87AA] px-2.5 py-1 select-none">
                        Buscar descarga en:
                      </div>
                      <a
                        href={piviUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs font-semibold text-[#C5C0DC] hover:text-[#00CAFA] hover:bg-[#272041] rounded-lg transition-colors group/item"
                      >
                        <span className="flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5 text-[#00CAFA]" />
                          <span>PiviGames</span>
                        </span>
                        <ExternalLink className="w-3 h-3 text-[#6967EB] group-hover/item:text-[#00CAFA] transition-colors" />
                      </a>
                      <a
                        href={elEnemigosUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs font-semibold text-[#C5C0DC] hover:text-[#00CAFA] hover:bg-[#272041] rounded-lg transition-colors group/item"
                      >
                        <span className="flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5 text-[#00CAFA]" />
                          <span>ElEnemigos</span>
                        </span>
                        <ExternalLink className="w-3 h-3 text-[#6967EB] group-hover/item:text-[#00CAFA] transition-colors" />
                      </a>
                    </div>
                  )}
                </div>
              ) : downloadLink ? (
                <div className="shrink-0 ml-auto flex items-center">
                  <a
                    href={downloadLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00CAFA]/15 text-[#00CAFA] hover:bg-[#00CAFA]/25 border border-[#00CAFA]/30 text-xs font-bold transition-all shadow-sm leading-none"
                    title="Descargar videojuego"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span className="leading-none">Descargar</span>
                  </a>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

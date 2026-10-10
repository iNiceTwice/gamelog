'use client';

import React from 'react';
import { Star, CheckCircle2, Ban, PlayCircle, Trash2, MessageSquare } from 'lucide-react';
import { IGameEntry } from '@/models/GameEntry';

interface GameRowProps {
  game: IGameEntry;
  onEdit?: (game: IGameEntry) => void;
  onDelete?: (id: string) => void;
}

export const GameRow: React.FC<GameRowProps> = ({ game, onEdit, onDelete }) => {
  const getStatusBadge = () => {
    switch (game.status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Terminado
          </span>
        );
      case 'abandoned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <Ban className="w-3.5 h-3.5" />
            Abandonado
          </span>
        );
      case 'playing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#00CAFA]/15 text-[#00CAFA] border border-[#00CAFA]/30">
            <PlayCircle className="w-3.5 h-3.5" />
            Jugando
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1E1834] text-[#9D96B8] border border-[#352C56]">
            Pendiente
          </span>
        );
    }
  };

  const getPodiumBadge = () => {
    if (game.podium === 'gold') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#FFBE0B] text-black shadow-md">
          🥇 Oro
        </span>
      );
    }
    if (game.podium === 'silver') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#CBD5E1] text-black shadow-md">
          🥈 Plata
        </span>
      );
    }
    if (game.podium === 'bronze') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#F97316] text-black shadow-md">
          🥉 Bronce
        </span>
      );
    }
    return null;
  };

  const displayTags = game.customTags && game.customTags.length > 0 ? game.customTags : game.igdbGenres;

  return (
    <div className="group relative rounded-2xl border border-[#352C56] bg-[#272041] overflow-hidden transition-all duration-200 hover:border-[#6967EB]/60 hover:bg-[#2C244C] flex flex-col sm:flex-row">
      {/* Left: Prominent cover art occupying the full left edge without padding or margin */}
      <div className="relative w-full sm:w-36 md:w-44 h-48 sm:h-auto shrink-0 bg-[#141124] overflow-hidden">
        <img
          src={game.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400'}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Subtle gradient overlay on mobile */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#272041] via-transparent to-transparent sm:hidden" />
        
        {/* Podium badge directly over the image */}
        {game.podium && (
          <div className="absolute top-2.5 left-2.5 z-10">
            {getPodiumBadge()}
          </div>
        )}
      </div>

      {/* Center & Right content area with proper internal spacing */}
      <div className="flex-1 p-5 flex flex-col justify-between gap-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Main Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h4 className="font-extrabold text-lg text-white group-hover:text-[#00CAFA] transition-colors truncate">
                {game.title}
              </h4>
              {game.yearPlayed && (
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#1E1834] text-[#9D96B8] border border-[#352C56]">
                  {game.yearPlayed}
                </span>
              )}
            </div>

            {/* Genres / Tags */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {displayTags?.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-[#1E1834] text-[#C5C0DC] border border-[#352C56]/70"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Review text if available */}
            {game.review && (
              <div className="mt-3 flex items-start gap-2 text-xs text-[#C5C0DC] italic bg-[#1E1834]/50 p-2.5 rounded-xl border border-[#352C56]/40">
                <MessageSquare className="w-3.5 h-3.5 text-[#6967EB] shrink-0 mt-0.5" />
                <span className="line-clamp-2">"{game.review}"</span>
              </div>
            )}
          </div>

          {/* Right Status Badge */}
          <div className="shrink-0 flex items-center sm:flex-col sm:items-end gap-3">
            {getStatusBadge()}
          </div>
        </div>

        {/* Bottom row: Rating & Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-[#352C56]/70">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5 text-[#FFBE0B]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < (game.rating || 0)
                      ? 'fill-[#FFBE0B] text-[#FFBE0B]'
                      : 'text-[#44386E]'
                  }`}
                />
              ))}
            </div>
            {game.rating && (
              <span className="ml-2 text-xs font-bold font-mono text-[#FFBE0B]">
                {game.rating}.0 / 5
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {onDelete && (
              <button
                onClick={() => onDelete(game._id.toString())}
                className="p-2 text-[#9D96B8] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                title="Eliminar registro"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

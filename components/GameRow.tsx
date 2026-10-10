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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 backdrop-blur-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Terminado
          </span>
        );
      case 'abandoned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/40 backdrop-blur-md">
            <Ban className="w-3.5 h-3.5" />
            Abandonado
          </span>
        );
      case 'playing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00CAFA]/20 text-[#00CAFA] border border-[#00CAFA]/40 backdrop-blur-md">
            <PlayCircle className="w-3.5 h-3.5" />
            Jugando
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1E1834]/80 text-[#9D96B8] border border-[#352C56] backdrop-blur-md">
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

  const displayTags = game.customTags && game.customTags.length > 0 ? game.customTags : game.igdbGenres;
  const cover = game.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600';

  return (
    <div className="group relative rounded-2xl border border-[#352C56] bg-[#272041] overflow-hidden transition-all duration-200 hover:border-[#6967EB]/60 hover:bg-[#2C244C] flex items-stretch min-h-[96px] sm:min-h-[104px]">
      {/* 1. Left Edge-to-Edge Hero Image (Compact height, 100% left corner with zero padding/margin) */}
      <div className="relative w-28 sm:w-36 md:w-44 shrink-0 overflow-hidden bg-[#141124]">
        <img
          src={cover}
          alt={game.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />

        {/* Cinematic Filter & Horizontal Fade-out directly on the image */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#272041]/40 to-[#272041]" />
        {/* Subtle dark tint over the image to enhance text legibility */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

        {/* Podium badge directly pinned on top-left of image */}
        {game.podium && (
          <div className="absolute top-2 left-2 z-10 scale-90 origin-top-left">
            {getPodiumBadge()}
          </div>
        )}
      </div>

      {/* 2. Content Row (Compact original height, seamlessly merged with the fade-out) */}
      <div className="flex-1 py-3 px-4 sm:px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0 z-10">
        {/* Center Text Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-base text-white group-hover:text-[#00CAFA] transition-colors truncate">
              {game.title}
            </h4>
            {game.yearPlayed && (
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#1E1834] text-[#9D96B8] border border-[#352C56]">
                {game.yearPlayed}
              </span>
            )}
          </div>

          {/* Genre Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {displayTags?.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#1E1834]/80 text-[#C5C0DC] border border-[#352C56]/70"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Review note quote if available */}
          {game.review && (
            <div className="mt-1.5 flex items-start gap-1.5 text-xs text-[#9D96B8] line-clamp-1 italic">
              <MessageSquare className="w-3.5 h-3.5 text-[#6967EB] shrink-0 mt-0.5" />
              <span>{game.review}</span>
            </div>
          )}
        </div>

        {/* Right Info: Rating, Status Badge & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#352C56]">
          {/* Star Rating */}
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

          {/* Status Badge */}
          <div className="shrink-0">{getStatusBadge()}</div>

          {/* Action Delete */}
          <div className="flex items-center gap-1">
            {onDelete && (
              <button
                onClick={() => onDelete(game._id.toString())}
                className="p-1.5 text-[#9D96B8] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
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

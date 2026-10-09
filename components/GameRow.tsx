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
        <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#FFBE0B] text-black shadow-sm">
          🥇 Oro
        </span>
      );
    }
    if (game.podium === 'silver') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#CBD5E1] text-black shadow-sm">
          🥈 Plata
        </span>
      );
    }
    if (game.podium === 'bronze') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#F97316] text-black shadow-sm">
          🥉 Bronce
        </span>
      );
    }
    return null;
  };

  const displayTags = game.customTags && game.customTags.length > 0 ? game.customTags : game.igdbGenres;

  return (
    <div className="group relative rounded-2xl border border-[#352C56] bg-[#272041] p-4 transition-all duration-200 hover:border-[#6967EB]/50 hover:bg-[#2C244C]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Cover & Info */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="relative shrink-0">
            <img
              src={game.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200'}
              alt={game.title}
              className="w-14 h-18 object-cover rounded-xl border border-white/10 shadow-sm"
            />
            {game.podium && (
              <div className="absolute -top-2 -left-2 scale-90">
                {getPodiumBadge()}
              </div>
            )}
          </div>

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

            {/* Genres */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
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
              <div className="mt-2 flex items-start gap-1.5 text-xs text-[#9D96B8] line-clamp-1 italic">
                <MessageSquare className="w-3.5 h-3.5 text-[#6967EB] shrink-0 mt-0.5" />
                <span>{game.review}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Rating, Status, Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#352C56]">
          {/* Rating */}
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

          {/* Actions */}
          <div className="flex items-center gap-1">
            {onDelete && (
              <button
                onClick={() => onDelete(game._id.toString())}
                className="p-2 text-[#9D96B8] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
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

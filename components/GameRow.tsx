'use client';

import React from 'react';
import { Star, CheckCircle2, Ban, PlayCircle, Trash2, Edit3, MessageSquare } from 'lucide-react';
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,136,0.15)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Terminado
          </span>
        );
      case 'abandoned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-950/60 text-red-300 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.15)]">
            <Ban className="w-3.5 h-3.5 text-red-400" />
            Abandonado
          </span>
        );
      case 'playing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,243,255,0.15)]">
            <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />
            Jugando
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            Pendiente
          </span>
        );
    }
  };

  const getPodiumBadge = () => {
    if (game.podium === 'gold') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400 shadow-[0_0_10px_rgba(255,190,11,0.4)]">
          🥇 Oro
        </span>
      );
    }
    if (game.podium === 'silver') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-slate-400/20 text-slate-200 border border-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.3)]">
          🥈 Plata
        </span>
      );
    }
    if (game.podium === 'bronze') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-orange-500/20 text-orange-300 border border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)]">
          🥉 Bronce
        </span>
      );
    }
    return null;
  };

  const displayTags = game.customTags && game.customTags.length > 0 ? game.customTags : game.igdbGenres;

  return (
    <div className="group relative rounded-xl border border-slate-800/80 bg-[#0e111a]/80 p-4 transition-all duration-200 hover:border-cyan-500/40 hover:bg-[#121624] hover:shadow-[0_0_20px_rgba(0,243,255,0.12)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Cover & Info */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="relative shrink-0">
            <img
              src={game.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200'}
              alt={game.title}
              className="w-14 h-18 object-cover rounded-lg border border-slate-700/80 shadow-md group-hover:border-cyan-500/50 transition-colors"
            />
            {game.podium && (
              <div className="absolute -top-2 -left-2 scale-90">
                {getPodiumBadge()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors truncate">
                {game.title}
              </h4>
              {game.yearPlayed && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  {game.yearPlayed}
                </span>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {displayTags?.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[11px] px-2 py-0.5 rounded bg-[#161a27] text-slate-300 border border-slate-800"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Review text if available */}
            {game.review && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-400 line-clamp-1 italic">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400/80 shrink-0 mt-0.5" />
                <span>{game.review}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Rating, Status, Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/60">
          {/* Rating */}
          <div className="flex items-center gap-0.5 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < (game.rating || 0)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-700'
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
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
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

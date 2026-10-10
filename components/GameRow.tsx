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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 backdrop-blur-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Terminado
          </span>
        );
      case 'abandoned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/40 backdrop-blur-md">
            <Ban className="w-3.5 h-3.5" />
            Abandonado
          </span>
        );
      case 'playing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#00CAFA]/20 text-[#00CAFA] border border-[#00CAFA]/40 backdrop-blur-md">
            <PlayCircle className="w-3.5 h-3.5" />
            Jugando
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1E1834]/80 text-[#9D96B8] border border-[#352C56] backdrop-blur-md">
            Pendiente
          </span>
        );
    }
  };

  const getPodiumBadge = () => {
    if (game.podium === 'gold') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-[#FFBE0B] text-black shadow-lg shadow-[#FFBE0B]/40 tracking-wide">
          🥇 GOTY
        </span>
      );
    }
    if (game.podium === 'silver') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-[#CBD5E1] text-black shadow-lg shadow-[#CBD5E1]/40 tracking-wide">
          🥈 Plata
        </span>
      );
    }
    if (game.podium === 'bronze') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-[#F97316] text-black shadow-lg shadow-[#F97316]/40 tracking-wide">
          🥉 Bronce
        </span>
      );
    }
    return null;
  };

  const displayTags = game.customTags && game.customTags.length > 0 ? game.customTags : game.igdbGenres;
  const cover = game.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600';

  return (
    <div className="group relative rounded-3xl border border-[#352C56]/80 bg-[#1A152E] overflow-hidden transition-all duration-300 hover:border-[#6967EB]/70 hover:shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-stretch min-h-[170px]">
      {/* 1. Cinematic Blurred Backdrop Layer (whole card ambient glow) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <img
          src={cover}
          alt=""
          className="w-full h-full object-cover object-center scale-135 blur-3xl opacity-20 group-hover:opacity-30 group-hover:scale-140 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-[#1A152E]/70" />
      </div>

      {/* 2. Left Edge-to-Edge Hero Image with Seamless Right Fade-Out */}
      <div className="relative w-full md:w-72 lg:w-84 shrink-0 h-48 md:h-auto overflow-hidden z-10">
        <img
          src={cover}
          alt={game.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Seamless Fade-out Gradient on the Right edge (blending into the card and text) */}
        <div className="hidden md:block absolute inset-y-0 right-0 w-32 bg-gradient-to-r from-transparent via-[#1A152E]/80 to-[#1A152E]" />

        {/* Bottom Fade-out for Mobile / Vertical layout */}
        <div className="md:hidden absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1A152E] via-[#1A152E]/70 to-transparent" />

        {/* Floating Podium Badge directly pinned to the top-left corner */}
        {game.podium && (
          <div className="absolute top-3.5 left-3.5 z-20">
            {getPodiumBadge()}
          </div>
        )}
      </div>

      {/* 3. Content Container (blended with the image fade-out) */}
      <div className="relative z-10 p-5 sm:p-6 md:pl-2 flex-1 flex flex-col justify-between gap-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Main Info */}
          <div className="min-w-0 flex-1 space-y-2">
            {/* Title */}
            <div className="flex items-center gap-3 flex-wrap">
              <h4 className="font-extrabold text-xl sm:text-2xl text-white tracking-tight group-hover:text-[#00CAFA] transition-colors truncate">
                {game.title}
              </h4>
            </div>

            {/* Pill Badges: Rating pill (★ 5.0), Year, Status */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {game.rating && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFBE0B]/20 text-[#FFBE0B] border border-[#FFBE0B]/40 font-bold backdrop-blur-md shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-[#FFBE0B]" />
                  <span>{game.rating}.0</span>
                </div>
              )}

              {game.yearPlayed && (
                <span className="px-3 py-1 rounded-full bg-[#1E1834]/90 text-[#C5C0DC] border border-[#352C56] font-mono text-xs font-semibold backdrop-blur-md">
                  {game.yearPlayed}
                </span>
              )}

              <div>{getStatusBadge()}</div>
            </div>

            {/* Genre Tags (subtle minimalist row) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {displayTags?.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium px-2.5 py-0.5 rounded-lg bg-[#272041]/80 text-[#9D96B8] border border-[#352C56]/60 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Review Note quote (styled like the plot summary in the reference) */}
            {game.review && (
              <div className="pt-2 flex items-start gap-2.5 text-xs sm:text-sm text-[#C5C0DC] leading-relaxed line-clamp-2">
                <MessageSquare className="w-4 h-4 text-[#6967EB] shrink-0 mt-0.5 opacity-80" />
                <span className="italic">"{game.review}"</span>
              </div>
            )}
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center justify-end sm:flex-col sm:justify-start gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
            {onDelete && (
              <button
                onClick={() => onDelete(game._id.toString())}
                className="p-2.5 text-[#9D96B8] hover:text-rose-400 hover:bg-rose-500/15 rounded-2xl border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                title="Eliminar de mi biblioteca"
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

'use client';

import React from 'react';
import { Trophy, Star, Sparkles, MessageSquare } from 'lucide-react';
import { IGameEntry } from '@/models/GameEntry';

interface PodiumSectionProps {
  games: IGameEntry[];
  selectedYear: number | 'all';
}

export const PodiumSection: React.FC<PodiumSectionProps> = ({ games, selectedYear }) => {
  if (selectedYear === 'all') return null;

  const goldGame = games.find((g) => g.podium === 'gold' && g.yearPlayed === selectedYear);
  const silverGame = games.find((g) => g.podium === 'silver' && g.yearPlayed === selectedYear);
  const bronzeGame = games.find((g) => g.podium === 'bronze' && g.yearPlayed === selectedYear);

  if (!goldGame && !silverGame && !bronzeGame) {
    return (
      <div className="mb-10 p-6 rounded-2xl border border-slate-800/80 bg-[#0c0e15]/60 text-center">
        <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-400 font-medium text-sm">
          Aún no has coronado tu podio para el año {selectedYear}.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Edita o agrega un juego para asignarle medalla de Oro, Plata o Bronce.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-6 w-1 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
        <h2 className="text-xl font-black tracking-wide text-white uppercase font-mono flex items-center gap-2">
          <span>Podio de Honor {selectedYear}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
            GOTY Personal
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        {/* Silver (2nd place) */}
        <div className="order-2 md:order-1">
          {silverGame ? (
            <div className="relative group rounded-2xl p-5 border border-slate-400/40 bg-gradient-to-b from-[#121520] to-[#0c0e14] neon-glow-silver transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900 border border-slate-300 text-slate-200 text-xs font-black tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(203,213,225,0.4)]">
                <span>🥈</span> 2° PUESTO
              </div>
              <div className="mt-2 flex gap-4">
                <img
                  src={silverGame.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300'}
                  alt={silverGame.title}
                  className="w-20 h-28 object-cover rounded-xl border border-slate-700 shadow-md shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-base truncate group-hover:text-cyan-300 transition-colors">
                    {silverGame.title}
                  </h3>
                  <div className="flex items-center gap-1 my-1.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < (silverGame.rating || 5)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(silverGame.customTags.length > 0 ? silverGame.customTags : silverGame.igdbGenres)
                      .slice(0, 2)
                      .map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60"
                        >
                          {t}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
              {silverGame.review && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-start gap-2 text-xs text-slate-400 italic">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <p className="line-clamp-2">"{silverGame.review}"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-44 rounded-2xl border border-dashed border-slate-800 bg-[#0a0c12]/50 flex items-center justify-center text-slate-600 text-xs">
              Sin medalla de Plata asignada
            </div>
          )}
        </div>

        {/* Gold (1st place / GOTY) - Elevated */}
        <div className="order-1 md:order-2 md:-translate-y-3">
          {goldGame ? (
            <div className="relative group rounded-2xl p-6 border-2 border-amber-400/70 bg-gradient-to-b from-[#181512] via-[#12131c] to-[#0c0e14] neon-glow-gold transition-all duration-300 hover:scale-[1.03]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 text-black text-xs font-black tracking-widest flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,190,11,0.6)]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>🥇 GOTY {selectedYear}</span>
              </div>
              <div className="mt-3 flex gap-4">
                <img
                  src={goldGame.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300'}
                  alt={goldGame.title}
                  className="w-24 h-32 object-cover rounded-xl border border-amber-500/50 shadow-xl shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                    El Mejor del Año
                  </span>
                  <h3 className="font-extrabold text-white text-lg leading-snug group-hover:text-amber-300 transition-colors">
                    {goldGame.title}
                  </h3>
                  <div className="flex items-center gap-1 my-2 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < (goldGame.rating || 5)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(goldGame.customTags.length > 0 ? goldGame.customTags : goldGame.igdbGenres)
                      .slice(0, 3)
                      .map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-950/40 text-amber-300 border border-amber-800/50"
                        >
                          {t}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
              {goldGame.review && (
                <div className="mt-4 pt-3 border-t border-amber-950/60 flex items-start gap-2 text-xs text-amber-200/80 italic">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="line-clamp-2">"{goldGame.review}"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-52 rounded-2xl border border-dashed border-amber-900/40 bg-[#0a0c12]/50 flex items-center justify-center text-amber-500/40 text-xs">
              Sin medalla de Oro asignada
            </div>
          )}
        </div>

        {/* Bronze (3rd place) */}
        <div className="order-3">
          {bronzeGame ? (
            <div className="relative group rounded-2xl p-5 border border-orange-500/40 bg-gradient-to-b from-[#1a1310] to-[#0c0e14] neon-glow-bronze transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900 border border-orange-500 text-orange-300 text-xs font-black tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(249,115,22,0.4)]">
                <span>🥉</span> 3° PUESTO
              </div>
              <div className="mt-2 flex gap-4">
                <img
                  src={bronzeGame.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300'}
                  alt={bronzeGame.title}
                  className="w-20 h-28 object-cover rounded-xl border border-orange-900/60 shadow-md shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-base truncate group-hover:text-orange-300 transition-colors">
                    {bronzeGame.title}
                  </h3>
                  <div className="flex items-center gap-1 my-1.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < (bronzeGame.rating || 5)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(bronzeGame.customTags.length > 0 ? bronzeGame.customTags : bronzeGame.igdbGenres)
                      .slice(0, 2)
                      .map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-orange-950/40 text-orange-300 border border-orange-800/40"
                        >
                          {t}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
              {bronzeGame.review && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-start gap-2 text-xs text-slate-400 italic">
                  <MessageSquare className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <p className="line-clamp-2">"{bronzeGame.review}"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-44 rounded-2xl border border-dashed border-slate-800 bg-[#0a0c12]/50 flex items-center justify-center text-slate-600 text-xs">
              Sin medalla de Bronce asignada
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

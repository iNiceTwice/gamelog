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
      <div className="mb-10 p-6 rounded-2xl border border-[#352c56]/60 bg-[#1E1834]/60 text-center">
        <Trophy className="w-8 h-8 text-[#9D96B8] mx-auto mb-2 opacity-50" />
        <p className="text-[#c5c0dc] font-medium text-sm">
          Aún no has coronado tu podio para el año {selectedYear}.
        </p>
        <p className="text-xs text-[#9D96B8] mt-1">
          Edita o agrega un juego para asignarle medalla de Oro, Plata o Bronce.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-12">
      {/* Title Header with amber accent line and badge */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-6 w-1 rounded-full bg-[#FFBE0B]" />
        <h2 className="text-xl font-black tracking-wider text-white uppercase font-mono flex items-center gap-2">
          <span>PODIO DE HONOR {selectedYear}</span>
        </h2>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FFBE0B]/10 text-[#FFBE0B] border border-[#FFBE0B]/40">
          GOTY PERSONAL
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        {/* Silver (2nd place) */}
        <div className="order-2 md:order-1">
          {silverGame ? (
            <div className="relative group rounded-2xl p-5 border border-[#3e3465] bg-[#272041] transition-all duration-300 hover:border-[#CBD5E1]/60 hover:bg-[#2c244c]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#1E1834] border border-[#CBD5E1]/70 text-[#CBD5E1] text-xs font-black tracking-wider flex items-center gap-1.5 shadow-sm">
                <span>🥈</span> 2° PUESTO
              </div>
              <div className="mt-2 flex gap-4">
                <img
                  src={silverGame.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300'}
                  alt={silverGame.title}
                  className="w-20 h-28 object-cover rounded-xl border border-white/10 shadow-md shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-base truncate group-hover:text-[#00CAFA] transition-colors">
                    {silverGame.title}
                  </h3>
                  <div className="flex items-center gap-1 my-1.5 text-[#FFBE0B]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < (silverGame.rating || 5)
                            ? 'fill-[#FFBE0B] text-[#FFBE0B]'
                            : 'text-[#44386e]'
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
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#1E1834] text-[#CBD5E1] border border-[#3E3465]"
                        >
                          {t}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
              {silverGame.review && (
                <div className="mt-4 pt-3 border-t border-[#372d5c] flex items-start gap-2 text-xs text-[#CBD5E1]/90 italic">
                  <MessageSquare className="w-3.5 h-3.5 text-[#9D96B8] shrink-0 mt-0.5" />
                  <p className="line-clamp-2">"{silverGame.review}"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-44 rounded-2xl border border-dashed border-[#352c56] bg-[#1E1834]/40 flex items-center justify-center text-[#9D96B8] text-xs">
              Sin medalla de Plata asignada
            </div>
          )}
        </div>

        {/* Gold (1st place / GOTY) - Elevated with Amber accent glow */}
        <div className="order-1 md:order-2 md:-translate-y-3">
          {goldGame ? (
            <div className="relative group rounded-2xl p-6 border-2 border-[#FFBE0B] bg-[#272041] accent-glow-gold transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#FFBE0B] to-[#F59E0B] text-black text-xs font-black tracking-widest flex items-center gap-1.5 shadow-[0_4px_15px_rgba(255,190,11,0.4)]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>🥇 GOTY {selectedYear}</span>
              </div>
              <div className="mt-3 flex gap-4">
                <img
                  src={goldGame.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300'}
                  alt={goldGame.title}
                  className="w-24 h-32 object-cover rounded-xl border border-[#FFBE0B]/40 shadow-xl shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#FFBE0B] font-bold">
                    EL MEJOR DEL AÑO
                  </span>
                  <h3 className="font-extrabold text-white text-lg leading-snug group-hover:text-[#FFBE0B] transition-colors">
                    {goldGame.title}
                  </h3>
                  <div className="flex items-center gap-1 my-2 text-[#FFBE0B]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < (goldGame.rating || 5)
                            ? 'fill-[#FFBE0B] text-[#FFBE0B]'
                            : 'text-[#44386e]'
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
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#1E1834] text-[#FFBE0B] border border-[#FFBE0B]/40"
                        >
                          {t}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
              {goldGame.review && (
                <div className="mt-4 pt-3 border-t border-[#FFBE0B]/25 flex items-start gap-2 text-xs text-[#FFBE0B]/95 italic">
                  <MessageSquare className="w-3.5 h-3.5 text-[#FFBE0B] shrink-0 mt-0.5" />
                  <p className="line-clamp-2">"{goldGame.review}"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-52 rounded-2xl border border-dashed border-[#FFBE0B]/30 bg-[#1E1834]/40 flex items-center justify-center text-[#FFBE0B]/50 text-xs">
              Sin medalla de Oro asignada
            </div>
          )}
        </div>

        {/* Bronze (3rd place) */}
        <div className="order-3">
          {bronzeGame ? (
            <div className="relative group rounded-2xl p-5 border border-[#4d3345] bg-[#272041] transition-all duration-300 hover:border-[#F97316]/60 hover:bg-[#2c244c]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#1E1834] border border-[#F97316] text-[#F97316] text-xs font-black tracking-wider flex items-center gap-1.5 shadow-sm">
                <span>🥉</span> 3° PUESTO
              </div>
              <div className="mt-2 flex gap-4">
                <img
                  src={bronzeGame.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300'}
                  alt={bronzeGame.title}
                  className="w-20 h-28 object-cover rounded-xl border border-white/10 shadow-md shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-base truncate group-hover:text-[#F97316] transition-colors">
                    {bronzeGame.title}
                  </h3>
                  <div className="flex items-center gap-1 my-1.5 text-[#FFBE0B]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < (bronzeGame.rating || 5)
                            ? 'fill-[#FFBE0B] text-[#FFBE0B]'
                            : 'text-[#44386e]'
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
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#1E1834] text-[#F97316] border border-[#F97316]/40"
                        >
                          {t}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
              {bronzeGame.review && (
                <div className="mt-4 pt-3 border-t border-[#372d5c] flex items-start gap-2 text-xs text-[#CBD5E1]/90 italic">
                  <MessageSquare className="w-3.5 h-3.5 text-[#F97316] shrink-0 mt-0.5" />
                  <p className="line-clamp-2">"{bronzeGame.review}"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-44 rounded-2xl border border-dashed border-[#352c56] bg-[#1E1834]/40 flex items-center justify-center text-[#9D96B8] text-xs">
              Sin medalla de Bronce asignada
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

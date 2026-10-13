'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  RotateCw, 
  Film, 
  Gamepad2, 
  ExternalLink, 
  Check, 
  Flame, 
  Coffee, 
  Undo2, 
  CheckCircle2,
  Trophy,
  Award
} from 'lucide-react';
import { NormalizedGame, GameVideoInfo } from '@/lib/igdb/types';

export interface RecGame extends NormalizedGame {
  matchingGenres: string[];
  matchScore: number;
  reason: string;
  suggestedType?: 'Hard' | 'Chill';
  isTgaWinner?: boolean;
  tgaYear?: number;
}

interface RecommendationCardProps {
  game: RecGame;
  onAddGameToBacklog: (game: NormalizedGame, type: 'Hard' | 'Chill') => void;
  onMarkAsFinished: (game: NormalizedGame) => void;
  isAlreadyAdded?: boolean;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  game,
  onAddGameToBacklog,
  onMarkAsFinished,
  isAlreadyAdded = false,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeTab, setActiveTab] = useState<'trailer' | 'gameplay'>('trailer');
  const [backlogType, setBacklogType] = useState<'Hard' | 'Chill'>(game.suggestedType || 'Hard');
  const [added, setAdded] = useState(isAlreadyAdded);

  // Extract trailer and gameplay videos
  const videos: GameVideoInfo[] = game.videos || [];
  const trailerVideo = videos.find((v) => v.type === 'trailer') || videos[0];
  const gameplayVideo =
    videos.find((v) => v.type === 'gameplay') ||
    videos.find((v) => v !== trailerVideo) ||
    trailerVideo;

  const currentVideo = activeTab === 'trailer' ? trailerVideo : gameplayVideo;

  // Categories for marquee
  const displayTags = game.genres || [];
  const shouldScrollTags = displayTags.length > 2;
  const loopTags = shouldScrollTags ? [...displayTags, ...displayTags] : displayTags;

  const cover = game.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600';

  const handleAdd = () => {
    onAddGameToBacklog(game, backlogType);
    setAdded(true);
  };

  const handleFinished = () => {
    onMarkAsFinished(game);
  };

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${game.title} ${activeTab === 'trailer' ? 'official trailer' : 'gameplay video'}`
  )}`;

  return (
    <div
      className={`perspective-1000 w-full transition-[height] duration-500 ease-in-out ${
        isFlipped ? 'h-[450px] sm:h-[430px]' : 'h-[210px] sm:h-[195px]'
      }`}
    >
      <div
        className={`relative w-full h-full transform-style-3d transition-transform duration-700 ease-in-out ${
          isFlipped ? 'rotate-x-180' : ''
        }`}
      >
        {/* ==============================================================
            FRONT FACE (Original compact height matching GameRow / Backlog)
           ============================================================== */}
        <div
          className={`backface-hidden absolute inset-0 rounded-2xl border bg-[#272041] overflow-hidden transition-all duration-200 hover:bg-[#2C244C] flex flex-row items-stretch shadow-lg group ${
            game.isTgaWinner
              ? 'border-[#FFBE0B]/60 shadow-[0_0_15px_rgba(255,190,11,0.2)]'
              : 'border-[#352C56] hover:border-[#6967EB]/60'
          }`}
        >
          {/* 1. Left Edge-to-Edge Cover Image */}
          <div className="relative w-28 sm:w-36 shrink-0 overflow-hidden bg-[#141124]">
            <img
              src={cover}
              alt={game.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            />

            {/* TGA Winner / Nominee badge or Match score badge */}
            <div className="absolute top-2 left-2 z-10">
              {game.isTgaWinner ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FFBE0B] text-black shadow-md">
                  <Trophy className="w-3 h-3" />
                  GOTY
                </span>
              ) : game.tgaYear ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#141124]/90 text-[#00CAFA] border border-[#00CAFA]/50 shadow-md backdrop-blur-sm">
                  <Award className="w-3 h-3 text-[#00CAFA]" />
                  Nominado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#141124]/90 text-[#00CAFA] border border-[#00CAFA]/40 shadow-md backdrop-blur-sm">
                  <Sparkles className="w-2.5 h-2.5 text-[#FFBE0B]" />
                  {game.matchScore}%
                </span>
              )}
            </div>

            {/* Community Rating on bottom of image */}
            {game.rating && (
              <div className="absolute bottom-2 left-2 z-10">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#141124]/90 text-[#FFBE0B] border border-[#352C56] backdrop-blur-sm">
                  ★ {game.rating}%
                </span>
              </div>
            )}
          </div>

          {/* 2. Content Area */}
          <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between min-w-0 gap-1.5">
            <div>
              {/* Header: Title, Year & 3D Flip Button */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4
                    className="font-bold text-base text-white group-hover:text-[#00CAFA] transition-colors truncate"
                    title={game.title}
                  >
                    {game.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    {game.releaseYear && (
                      <span className="text-xs text-[#9D96B8] font-mono">
                        {game.releaseYear}
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-medium truncate italic ${
                        game.isTgaWinner
                          ? 'text-[#FFBE0B]'
                          : game.tgaYear
                          ? 'text-[#00CAFA]'
                          : 'text-[#00CAFA]'
                      }`}
                    >
                      {game.reason}
                    </span>
                  </div>
                </div>

                {/* Vertical 3D Flip Action Button */}
                <button
                  type="button"
                  onClick={() => setIsFlipped(true)}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#6967EB]/20 hover:bg-[#6967EB]/35 text-[#CBD5E1] hover:text-white border border-[#6967EB]/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
                  title="Girar tarjeta verticalmente para ver Tráiler y Gameplay"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#00CAFA] animate-pulse" />
                  <span>Videos</span>
                </button>
              </div>

              {/* Tags Marquee Ticker */}
              <div className="relative overflow-hidden flex-1 min-w-0 py-0.5 mt-1.5">
                <div
                  className={`tags-marquee-track ${
                    shouldScrollTags ? 'tags-marquee-animate' : ''
                  }`}
                >
                  {loopTags.map((tag, idx) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-md whitespace-nowrap border bg-[#1E1834] text-[#C5C0DC] border-[#352C56]/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {shouldScrollTags && (
                  <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#272041] group-hover:from-[#2C244C] to-transparent z-10 transition-colors" />
                )}
              </div>

              {/* Synopsis preview (compact 2 lines) */}
              {game.summary && (
                <p className="text-xs text-[#9D96B8] mt-1.5 line-clamp-2 leading-relaxed">
                  {game.summary}
                </p>
              )}
            </div>

            {/* Bottom Actions Row */}
            <div className="pt-2 border-t border-[#352C56]/60 flex items-center justify-between gap-1.5">
              {/* Type Switcher (Chill / Hard) */}
              <div className="inline-flex items-center bg-[#1E1834] p-0.5 rounded-xl border border-[#352C56]">
                <button
                  type="button"
                  onClick={() => setBacklogType('Chill')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    backlogType === 'Chill'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-[#9D96B8] hover:text-white'
                  }`}
                  title="Marcar para jugar de forma relajada"
                >
                  <Coffee className="w-3 h-3 text-emerald-400" />
                  <span>Chill</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBacklogType('Hard')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    backlogType === 'Hard'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'text-[#9D96B8] hover:text-white'
                  }`}
                  title="Marcar como título desafiante o tryhard"
                >
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>Hard</span>
                </button>
              </div>

              {/* Action Buttons: "Terminado" (Filter out) & "Al Backlog" */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleFinished}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#1E1834] hover:bg-[#10B981]/15 text-[#9D96B8] hover:text-[#10B981] border border-[#352C56] hover:border-[#10B981]/40 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                  title="Ya jugué este videojuego (guardar en base de datos para no sugerir)"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Terminado</span>
                </button>

                {added ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 text-xs font-bold shadow-sm">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>En Backlog</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6967EB] hover:bg-[#5856d6] text-white text-xs font-bold transition-all shadow-sm cursor-pointer hover:shadow-[0_0_12px_rgba(105,103,235,0.4)]"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Al Backlog</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ==============================================================
            BACK FACE (Vertical 3D Flip: Expanded Theater Height for Video)
           ============================================================== */}
        <div className="backface-hidden rotate-x-180 absolute inset-0 rounded-2xl border border-[#00CAFA]/50 bg-[#19142E] p-3.5 sm:p-4 flex flex-col justify-between shadow-2xl overflow-hidden">
          {/* Top Bar: Tabs & Flip Back Button */}
          <div className="flex items-center justify-between gap-2 border-b border-[#2E264E] pb-2.5 shrink-0">
            {/* Tabs: Trailer vs Gameplay */}
            <div className="flex items-center gap-1 bg-[#141124] p-1 rounded-xl border border-[#352C56]">
              <button
                type="button"
                onClick={() => setActiveTab('trailer')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'trailer'
                    ? 'bg-[#00CAFA] text-black shadow-[0_0_10px_rgba(0,202,250,0.5)]'
                    : 'text-[#9D96B8] hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Tráiler</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('gameplay')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'gameplay'
                    ? 'bg-[#6967EB] text-white shadow-[0_0_10px_rgba(105,103,235,0.5)]'
                    : 'text-[#9D96B8] hover:text-white'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Gameplay</span>
              </button>
            </div>

            {/* Flip Back Button */}
            <button
              type="button"
              onClick={() => setIsFlipped(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#272041] hover:bg-[#322954] text-white text-xs font-bold border border-[#352C56] transition-colors cursor-pointer"
              title="Volver a la ficha"
            >
              <Undo2 className="w-3.5 h-3.5 text-[#00CAFA]" />
              <span>Volver a la ficha</span>
            </button>
          </div>

          {/* Middle: Spacious Video Player Container (Takes full 300px+ height when expanded!) */}
          <div className="relative flex-1 w-full my-2 bg-black rounded-xl overflow-hidden border border-[#352C56] shadow-inner flex items-center justify-center min-h-[250px]">
            {isFlipped && currentVideo?.youtubeId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${currentVideo.youtubeId}?autoplay=1&mute=0&rel=0`}
                title={`${game.title} - ${activeTab}`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : isFlipped ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Gamepad2 className="w-12 h-12 text-[#9D96B8] mb-3 opacity-60" />
                <h5 className="text-sm font-bold text-white mb-1">{game.title}</h5>
                <p className="text-xs text-[#9D96B8] max-w-sm mb-4">
                  No hay ${activeTab === 'trailer' ? 'tráiler' : 'gameplay'} directo en IGDB para este título. Puedes verlo directamente en YouTube con un clic:
                </p>
                <a
                  href={youtubeSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buscar en YouTube</span>
                </a>
              </div>
            ) : null}
          </div>

          {/* Bottom Bar: Title & Direct Actions */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#2E264E] shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs font-bold text-white truncate max-w-[220px]" title={game.title}>
                {game.title}
              </span>
              <a
                href={youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#9D96B8] hover:text-[#00CAFA] inline-flex items-center gap-1 shrink-0"
                title="Abrir en YouTube"
              >
                <span>YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFinished}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#1E1834] hover:bg-[#10B981]/15 text-[#9D96B8] hover:text-[#10B981] border border-[#352C56] text-xs font-semibold transition-all cursor-pointer"
                title="Marcar como ya jugado (guardar en base de datos para no sugerir)"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Terminado</span>
              </button>

              {added ? (
                <span className="text-xs font-bold text-[#10B981] flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  En Backlog
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleAdd}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#6967EB] hover:bg-[#5856d6] text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Al Backlog</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

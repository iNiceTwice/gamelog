'use client';

import React from 'react';
import { Square, Play, Trash2, ExternalLink, Sparkles, CheckSquare2 } from 'lucide-react';
import { IGameEntry } from '@/models/GameEntry';

interface BacklogViewProps {
  games: IGameEntry[];
  onToggleStatus: (game: IGameEntry, newStatus: 'playing' | 'completed') => void;
  onDelete: (id: string) => void;
}

export const BacklogView: React.FC<BacklogViewProps> = ({
  games,
  onToggleStatus,
  onDelete,
}) => {
  if (games.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-[#352C56] rounded-2xl bg-[#1E1834]/40">
        <Sparkles className="w-10 h-10 text-[#6967EB] mx-auto mb-3 opacity-60" />
        <h3 className="text-lg font-bold text-white font-sans">¡Backlog al día!</h3>
        <p className="text-sm text-[#9D96B8] mt-1 max-w-sm mx-auto">
          No tienes videojuegos pendientes por jugar en este momento. Agrega uno nuevo desde el botón superior.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-2 mb-2 text-xs font-mono text-[#9D96B8] uppercase tracking-wider">
        <span>Lista de Juegos Pendientes ({games.length})</span>
        <span>Prioridad & Acción Rápida</span>
      </div>

      <div className="divide-y divide-[#352C56] rounded-2xl border border-[#352C56] bg-[#272041] overflow-hidden shadow-sm">
        {games.map((game) => {
          const displayTags =
            game.customTags && game.customTags.length > 0
              ? game.customTags
              : game.igdbGenres;

          const isUrl = game.notes?.startsWith('http');

          return (
            <div
              key={game._id.toString()}
              className="group p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-[#2C244C]"
            >
              <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                {/* Status selector / check button */}
                <button
                  onClick={() => onToggleStatus(game, 'completed')}
                  className="mt-0.5 sm:mt-0 text-[#9D96B8] hover:text-[#00CAFA] transition-colors cursor-pointer"
                  title="Marcar como Terminado y mover al Historial"
                >
                  <Square className="w-5 h-5 rounded-md" />
                </button>

                <img
                  src={game.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200'}
                  alt={game.title}
                  className="w-12 h-16 object-cover rounded-xl border border-white/10 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-white text-base group-hover:text-[#00CAFA] transition-colors">
                      {game.title}
                    </h4>

                    {/* Notion 'Hard' / Difficulty Badge */}
                    {game.backlogType && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#6967EB]/20 text-[#6967EB] border border-[#6967EB]/40">
                        {game.backlogType}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {displayTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-[#1E1834] text-[#C5C0DC] border border-[#352C56]/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Notes / URLs */}
                  {game.notes && (
                    <div className="mt-2 text-xs text-[#9D96B8] flex items-center gap-1.5">
                      {isUrl ? (
                        <a
                          href={game.notes}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00CAFA] hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {game.notes}
                        </a>
                      ) : (
                        <span className="italic text-[#9D96B8]">{game.notes}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#352C56]">
                <button
                  onClick={() => onToggleStatus(game, 'playing')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#00CAFA]/15 text-[#00CAFA] border border-[#00CAFA]/30 hover:bg-[#00CAFA]/25 transition-all cursor-pointer"
                  title="Empezar a jugar ahora"
                >
                  <Play className="w-3.5 h-3.5 fill-[#00CAFA]" />
                  <span>Empezar a Jugar</span>
                </button>

                <button
                  onClick={() => onToggleStatus(game, 'completed')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981]/25 transition-all cursor-pointer"
                  title="Marcar como Terminado"
                >
                  <span>Terminado</span>
                </button>

                <button
                  onClick={() => onDelete(game._id.toString())}
                  className="p-2 text-[#9D96B8] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  title="Eliminar de pendientes"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

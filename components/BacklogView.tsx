'use client';

import React from 'react';
import { CheckSquare, Square, Play, Trash2, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';
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
      <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-[#0c0e15]/40">
        <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white font-mono">¡Backlog al día!</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
          No tienes videojuegos pendientes por jugar en este momento. Agrega uno nuevo desde el botón superior.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-2 mb-2 text-xs font-mono text-slate-500 uppercase tracking-wider">
        <span>Lista de Juegos Pendientes ({games.length})</span>
        <span>Prioridad & Acción Rápida</span>
      </div>

      <div className="divide-y divide-slate-800/80 rounded-2xl border border-purple-950/60 bg-[#0e111a]/90 overflow-hidden shadow-[0_0_25px_rgba(176,38,255,0.08)]">
        {games.map((game) => {
          const displayTags =
            game.customTags && game.customTags.length > 0
              ? game.customTags
              : game.igdbGenres;

          const isUrl = game.notes?.startsWith('http');

          return (
            <div
              key={game._id.toString()}
              className="group p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-[#131726]"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                {/* Status selector / check button */}
                <button
                  onClick={() => onToggleStatus(game, 'completed')}
                  className="mt-0.5 sm:mt-0 text-slate-600 hover:text-emerald-400 transition-colors cursor-pointer"
                  title="Marcar como Terminado y mover al Historial"
                >
                  <Square className="w-5 h-5" />
                </button>

                <img
                  src={game.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200'}
                  alt={game.title}
                  className="w-12 h-16 object-cover rounded-lg border border-slate-800 shrink-0 group-hover:border-purple-500/50 transition-colors"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-white text-base group-hover:text-purple-300 transition-colors">
                      {game.title}
                    </h4>

                    {/* Notion 'Hard' / Difficulty Badge */}
                    {game.backlogType && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-500/50 shadow-[0_0_10px_rgba(176,38,255,0.3)]">
                        {game.backlogType}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {displayTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded bg-[#161a27] text-slate-300 border border-slate-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Notes / URLs */}
                  {game.notes && (
                    <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
                      {isUrl ? (
                        <a
                          href={game.notes}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {game.notes}
                        </a>
                      ) : (
                        <span className="italic text-slate-400">{game.notes}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/60">
                <button
                  onClick={() => onToggleStatus(game, 'playing')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/60 hover:shadow-[0_0_12px_rgba(0,243,255,0.3)] transition-all cursor-pointer"
                  title="Empezar a jugar ahora"
                >
                  <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                  <span>Empezar a Jugar</span>
                </button>

                <button
                  onClick={() => onToggleStatus(game, 'completed')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60 hover:shadow-[0_0_12px_rgba(0,255,136,0.3)] transition-all cursor-pointer"
                  title="Marcar como Terminado"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Terminado</span>
                </button>

                <button
                  onClick={() => onDelete(game._id.toString())}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
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

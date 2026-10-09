'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Plus, Star, Tag, Loader2, ArrowRight } from 'lucide-react';
import { NormalizedGame } from '@/lib/igdb/types';

interface RecGame extends NormalizedGame {
  matchingGenres: string[];
  reason: string;
}

interface RecommendationsViewProps {
  onAddGameToBacklog: (game: NormalizedGame) => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  onAddGameToBacklog,
}) => {
  const [recommendations, setRecommendations] = useState<RecGame[]>([]);
  const [topGenres, setTopGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecs() {
      try {
        const res = await fetch('/api/recommendations');
        const json = await res.json();
        if (json.success) {
          setRecommendations(json.data.recommendations || []);
          setTopGenres(json.data.topGenres || []);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecs();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-slate-400 font-mono text-sm">
          Analizando tus títulos favoritos y generando sugerencias...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-[#0a1715] to-[#0c121e] neon-glow-emerald">
        <div className="flex items-center gap-2.5 text-emerald-400 font-mono text-xs uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Motor de Recomendaciones Explicable de gamelog.gg</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Tus géneros más jugados y valorados:
        </h3>
        <div className="flex flex-wrap gap-2">
          {topGenres.map((g) => (
            <span
              key={g}
              className="px-3 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-xs font-bold shadow-[0_0_10px_rgba(0,255,136,0.2)]"
            >
              #{g}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Las siguientes sugerencias se calculan a partir de tus títulos de 4 y 5 estrellas e historial de juego. No se agrega ningún título a tu biblioteca sin tu consentimiento.
        </p>
      </div>

      {/* Grid of Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((rec) => (
          <div
            key={rec.igdbId}
            className="group rounded-2xl border border-slate-800 bg-[#0e111a] p-5 transition-all duration-300 hover:border-emerald-500/50 hover:bg-[#121822] hover:shadow-[0_0_25px_rgba(0,255,136,0.15)] flex gap-4"
          >
            <img
              src={rec.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200'}
              alt={rec.title}
              className="w-24 h-34 object-cover rounded-xl border border-slate-700 shadow-lg shrink-0 group-hover:border-emerald-400/50 transition-colors"
            />
            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-extrabold text-base text-white group-hover:text-emerald-300 transition-colors truncate">
                    {rec.title}
                  </h4>
                  {rec.rating && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                      ★ {rec.rating}%
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {rec.genres.slice(0, 3).map((gen, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800/90 text-slate-300"
                    >
                      {gen}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                  {rec.summary}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-emerald-400/90 italic truncate pr-2">
                  {rec.reason}
                </span>

                <button
                  onClick={() => onAddGameToBacklog(rec)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-[0_0_10px_rgba(0,255,136,0.2)] hover:scale-105 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Al Backlog</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

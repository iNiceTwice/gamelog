'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Plus, Star, Loader2 } from 'lucide-react';
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
        <Loader2 className="w-8 h-8 text-[#00CAFA] animate-spin" />
        <p className="text-[#9D96B8] font-mono text-sm">
          Analizando tus títulos favoritos y generando sugerencias...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl border border-[#352C56] bg-[#272041] shadow-sm">
        <div className="flex items-center gap-2.5 text-[#00CAFA] font-mono text-xs uppercase tracking-wider mb-2">
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
              className="px-3 py-1 rounded-full bg-[#6967EB]/20 text-[#6967EB] border border-[#6967EB]/40 text-xs font-bold"
            >
              #{g}
            </span>
          ))}
        </div>
        <p className="text-xs text-[#9D96B8] mt-3">
          Las siguientes sugerencias se calculan a partir de tus títulos de 4 y 5 estrellas e historial de juego. No se agrega ningún título a tu biblioteca sin tu consentimiento.
        </p>
      </div>

      {/* Grid of Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((rec) => (
          <div
            key={rec.igdbId}
            className="group rounded-3xl border border-[#352C56] bg-[#272041] p-5 transition-all duration-300 hover:border-[#6967EB]/60 hover:bg-[#2C244C] flex gap-4"
          >
            <img
              src={rec.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200'}
              alt={rec.title}
              className="w-24 h-34 object-cover rounded-2xl border border-white/10 shadow-sm shrink-0"
            />
            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-base text-white group-hover:text-[#00CAFA] transition-colors truncate">
                    {rec.title}
                  </h4>
                  {rec.rating && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#1E1834] text-[#00CAFA] border border-[#352C56]">
                      ★ {rec.rating}%
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {rec.genres.slice(0, 3).map((gen, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-[#1E1834] text-[#C5C0DC] border border-[#352C56]"
                    >
                      {gen}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-[#9D96B8] mt-2 line-clamp-2">
                  {rec.summary}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-[#352C56] flex items-center justify-between">
                <span className="text-[11px] text-[#00CAFA] italic truncate pr-2">
                  {rec.reason}
                </span>

                <button
                  onClick={() => onAddGameToBacklog(rec)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6967EB] hover:bg-[#5856d6] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
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

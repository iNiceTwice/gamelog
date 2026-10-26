import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { getAllGameEntries } from '@/lib/store';
import { DismissedGame } from '@/models/DismissedGame';
import { getTgaNomineesForYearFromDb } from '@/lib/tgaService';
import {
  getGamesByIdsFromIGDB,
  getSimilarGameIdsForIds,
  getHardcoreGamesFromIGDB,
  getChillGamesFromIGDB,
  getPopularNewGamesFromIGDB,
  getAffinityGamesFromIGDB,
  getGamesByGenreOrThemeFromIGDB,
  getTwitchAccessToken,
  getCachedPool,
  setCachedPool,
} from '@/lib/igdb/client';

const MIN_RECOMMENDATION_YEAR = 2017; // Never recommend 15-20 year old games in standard modes
const MIN_POPULAR_TAB_YEAR = 2023; // "Popular" tab focuses on new & trending releases

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const user = await getAuthenticatedUser();

    const { searchParams } = new URL(req.url);
    // Modes: 'all' (Para Ti) | 'popular' (Nuevos Populares) | 'podium' | 'Hard' | 'Chill' | 'genre' | 'tga'
    const mode = searchParams.get('mode') || 'all';
    const genreParam = searchParams.get('genre') || '';
    const tgaYear = parseInt(searchParams.get('tgaYear') || '2025', 10);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
    const offset = (page - 1) * limit;

    // Fetch user library games from MongoDB
    const userGames = await getAllGameEntries();
    const userGameTitles = new Set(
      userGames.map((g: any) => g.title.toLowerCase().trim())
    );
    const userIgdbIds = new Set(
      userGames.map((g: any) => g.igdbId).filter(Boolean)
    );

    // Fetch dismissed/finished games directly from MongoDB table
    const dismissedDocs = await DismissedGame.find({ userId: user._id }).lean();
    const dismissedTitles = new Set(
      dismissedDocs.map((d: any) => d.title.toLowerCase().trim())
    );
    const dismissedIgdbIds = new Set(
      dismissedDocs.map((d: any) => d.igdbId).filter(Boolean)
    );

    // Strict exclusion helper
    const isExcluded = (candidate: { title: string; igdbId?: number }) => {
      const titleLower = candidate.title.toLowerCase().trim();
      if (userGameTitles.has(titleLower)) return true;
      if (candidate.igdbId && userIgdbIds.has(candidate.igdbId)) return true;
      if (dismissedTitles.has(titleLower)) return true;
      if (candidate.igdbId && dismissedIgdbIds.has(candidate.igdbId)) return true;
      return false;
    };

    // 1. Build User Affinity Profile (Podium + 4-5★ Completed + Backlog)
    const podiumGames = userGames.filter((g: any) => !!g.podium);
    const topRatedGames = userGames.filter(
      (g: any) => g.podium || (typeof g.rating === 'number' && g.rating >= 4)
    );
    const backlogGames = userGames.filter((g: any) => g.status === 'backlog');

    // Weighted genre & theme affinity
    const genreWeights: Record<string, number> = {};
    const genericUmbrellaTags = new Set(['adventure', 'indie']);

    for (const g of userGames) {
      let weight = 0;
      if (g.podium === 'gold') weight = 4.5;
      else if (g.podium === 'silver' || g.podium === 'bronze') weight = 3.8;
      else if (g.rating && g.rating >= 5) weight = 3.2;
      else if (g.rating && g.rating >= 4) weight = 2.2;
      else if (g.status === 'backlog') weight = 1.4;
      else if (g.status === 'playing') weight = 1.8;

      if (weight <= 0) continue;

      const categories = [...(g.igdbGenres || []), ...(g.customTags || [])];
      for (const rawCat of categories) {
        if (!rawCat || !rawCat.trim()) continue;
        const clean = rawCat.trim();
        const factor = genericUmbrellaTags.has(clean.toLowerCase()) ? 0.65 : 1.0;
        genreWeights[clean] = (genreWeights[clean] || 0) + weight * factor;
      }
    }

    const topGenres = Object.entries(genreWeights)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre)
      .slice(0, 8);

    const maxGenreWeight = Math.max(1, ...Object.values(genreWeights));

    let candidates: any[] = [];
    let popularityRankMap = new Map<number, number>();
    let similarSourceMap = new Map<number, { title: string; isPodium: boolean }>();

    // Helper to fetch similar games while tracking which user game inspired them
    const fetchTrackedSimilarIds = async (seedGames: any[]): Promise<number[]> => {
      const validSeeds = seedGames
        .filter((g) => typeof g.igdbId === 'number' && g.igdbId > 0)
        .slice(0, 18);
      if (validSeeds.length === 0) return [];

      const token = await getTwitchAccessToken();
      const clientId = process.env.TWITCH_CLIENT_ID;
      if (!token || !clientId) return [];

      try {
        const seedById = new Map<number, any>();
        validSeeds.forEach((g) => seedById.set(g.igdbId, g));

        const res = await fetch('https://api.igdb.com/v4/games', {
          method: 'POST',
          headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'text/plain',
          },
          body: `
            fields id, similar_games;
            where id = (${validSeeds.map((g) => g.igdbId).join(',')});
            limit 25;
          `,
        });

        if (!res.ok) return [];
        const data: Array<{ id: number; similar_games?: number[] }> = await res.json();
        const collected: number[] = [];

        for (const item of data) {
          const sourceGame = seedById.get(item.id);
          for (const simId of item.similar_games || []) {
            collected.push(simId);
            if (sourceGame && !similarSourceMap.has(simId)) {
              similarSourceMap.set(simId, {
                title: sourceGame.title,
                isPodium: !!sourceGame.podium,
              });
            }
          }
        }
        return Array.from(new Set(collected));
      } catch {
        return getSimilarGameIdsForIds(validSeeds.map((g) => g.igdbId));
      }
    };

    // ==============================================================
    // STRATEGY 1: THE GAME AWARDS (TGA) - From MongoDB
    // ==============================================================
    if (mode === 'tga') {
      const nominees = await getTgaNomineesForYearFromDb(tgaYear);
      const nomineeMap = new Map<string, { isWinner: boolean; year: number }>();
      nominees.forEach((n) =>
        nomineeMap.set(n.title.toLowerCase(), { isWinner: n.isWinner, year: tgaYear })
      );

      const token = await getTwitchAccessToken();
      const clientId = process.env.TWITCH_CLIENT_ID;

      if (token && clientId && nominees.length > 0) {
        const escapedNames = nominees
          .map((n) => `"${n.title.replace(/"/g, '')}"`)
          .join(',');
        const apicalypseQuery = `
          fields name, summary, storyline, first_release_date, cover.url, cover.image_id, genres.name, themes.name, rating, total_rating, total_rating_count, videos.name, videos.video_id;
          where name = (${escapedNames});
          limit 20;
        `;

        const res = await fetch('https://api.igdb.com/v4/games', {
          method: 'POST',
          headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'text/plain',
          },
          body: apicalypseQuery,
        });

        if (res.ok) {
          const rawGames = await res.json();
          candidates = rawGames.map((g: any) => {
            let coverUrl = '';
            if (g.cover?.image_id) {
              coverUrl = `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`;
            } else if (g.cover?.url) {
              coverUrl = g.cover.url.startsWith('//') ? `https:${g.cover.url}` : g.cover.url;
              coverUrl = coverUrl.replace('/t_thumb/', '/t_cover_big/');
            }

            const rawCategories = [
              ...(g.genres?.map((gen: any) => gen.name) || []),
              ...(g.themes?.map((thm: any) => thm.name) || []),
            ];
            const uniqueCategories = Array.from(new Set(rawCategories.filter(Boolean)));

            const videos = (g.videos || []).map((v: any) => {
              const lowerName = (v.name || '').toLowerCase();
              let type: 'trailer' | 'gameplay' | 'other' = 'trailer';
              if (lowerName.includes('gameplay')) type = 'gameplay';
              else if (lowerName.includes('trailer') || lowerName.includes('teaser')) type = 'trailer';
              return { name: v.name || 'Video', youtubeId: v.video_id, type };
            });

            const tgaInfo = nomineeMap.get(g.name.toLowerCase()) || {
              isWinner: false,
              year: tgaYear,
            };

            return {
              igdbId: g.id,
              title: g.name,
              summary: g.summary || g.storyline || '',
              coverUrl,
              genres: uniqueCategories,
              releaseYear: g.first_release_date
                ? new Date(g.first_release_date * 1000).getFullYear()
                : tgaYear,
              rating: g.rating ? Math.round(g.rating) : 90,
              videos,
              isTgaWinner: tgaInfo.isWinner,
              tgaYear: tgaInfo.year,
              reason: tgaInfo.isWinner
                ? `🏆 Ganador Oficial de Game of the Year (GOTY ${tgaYear})`
                : `⭐ Nominado Oficial al Game of the Year (GOTY ${tgaYear})`,
            };
          });

          candidates.sort((a, b) => (b.isTgaWinner ? 1 : 0) - (a.isTgaWinner ? 1 : 0));
        }
      }
    }
    // ==============================================================
    // STRATEGY 2..N: FULL POOL FETCH + DETERMINISTIC PAGINATION
    // Fetching the complete pool once per mode guarantees ZERO duplicate
    // games when navigating across Page 1, Page 2, Page 3, etc.
    // ==============================================================
    else {
      const cacheKey = `${user._id}:${mode}:${genreParam.toLowerCase()}:${topGenres.slice(0, 5).join(',')}`;
      const cached = getCachedPool(cacheKey);

      if (cached) {
        candidates = cached.games;
        popularityRankMap = cached.popularityRankMap;
        similarSourceMap = cached.similarSourceMap;
      } else {
        if (mode === 'popular') {
          const popResult = await getPopularNewGamesFromIGDB(85);
          candidates = popResult.games;
          popularityRankMap = popResult.popularityRankMap;
        } else if (mode === 'podium') {
          const seeds =
            podiumGames.length >= 3
              ? [...podiumGames, ...topRatedGames.slice(0, 8)]
              : topRatedGames;
          const allSimilarIds = await fetchTrackedSimilarIds(seeds);
          const [simGames, affinityFallback] = await Promise.all([
            allSimilarIds.length > 0
              ? getGamesByIdsFromIGDB(allSimilarIds.slice(0, 75), true)
              : Promise.resolve([]),
            getAffinityGamesFromIGDB(topGenres.slice(0, 5), 55),
          ]);
          candidates = [...simGames, ...affinityFallback];
        } else if (mode === 'Hard') {
          candidates = await getHardcoreGamesFromIGDB(85);
        } else if (mode === 'Chill') {
          candidates = await getChillGamesFromIGDB(85);
        } else if (mode === 'genre' && genreParam) {
          candidates = await getGamesByGenreOrThemeFromIGDB(genreParam, 85);
        } else {
          // mode === 'all' ("Para Ti": Blend of Similar to favorites + Affinity + Popularity + Recency)
          const seedPool = [
            ...podiumGames,
            ...topRatedGames.slice(0, 8),
            ...backlogGames.slice(0, 8),
          ];
          const [similarIds, affinityGames, popResult] = await Promise.all([
            fetchTrackedSimilarIds(seedPool),
            getAffinityGamesFromIGDB(topGenres.slice(0, 6), 65),
            getPopularNewGamesFromIGDB(45),
          ]);

          popularityRankMap = popResult.popularityRankMap;
          const similarGames =
            similarIds.length > 0
              ? await getGamesByIdsFromIGDB(similarIds.slice(0, 70), true)
              : [];

          candidates = [...similarGames, ...affinityGames, ...popResult.games];
        }

        setCachedPool(cacheKey, {
          games: candidates,
          popularityRankMap,
          similarSourceMap,
        });
      }
    }

    // Strict deduplication by BOTH igdbId and normalized title so no game ever repeats across pages
    const seenCandidateIds = new Set<number>();
    const seenCandidateTitles = new Set<string>();
    let uniqueCandidates = candidates.filter((c) => {
      if (!c.igdbId || !c.title) return false;
      const normTitle = c.title.toLowerCase().trim();
      if (seenCandidateIds.has(c.igdbId) || seenCandidateTitles.has(normTitle)) {
        return false;
      }
      seenCandidateIds.add(c.igdbId);
      seenCandidateTitles.add(normTitle);
      return true;
    });

    // Exclude games in user's library, dismissed games, and ancient games (except in TGA mode)
    if (mode !== 'tga') {
      const minYear = mode === 'popular' ? MIN_POPULAR_TAB_YEAR : MIN_RECOMMENDATION_YEAR;
      uniqueCandidates = uniqueCandidates.filter((c) => {
        if (isExcluded(c)) return false;
        if (c.releaseYear && c.releaseYear < minYear) return false;
        return true;
      });
    }

    const currentYear = new Date().getFullYear();

    // Compute composite score (Actualidad + Popularidad + Afinidad) and reasons
    const processed = uniqueCandidates.map((c) => {
      if (mode === 'tga') {
        const matchingGenres = (c.genres || []).filter((cg: string) =>
          topGenres.some((tg) => tg.toLowerCase() === cg.toLowerCase())
        );
        return {
          ...c,
          matchingGenres,
          matchScore: c.isTgaWinner ? 99 : 95,
          suggestedType: 'Hard' as const,
        };
      }

      const candidateGenres: string[] = c.genres || [];
      const matchingGenres = candidateGenres.filter((cg: string) =>
        topGenres.some((tg) => tg.toLowerCase() === cg.toLowerCase())
      );

      // 1. AFINIDAD CON EL USUARIO (0 - 40 pts)
      let affinityPoints = 0;
      for (const cg of candidateGenres) {
        const w = genreWeights[cg] || 0;
        if (w > 0) {
          affinityPoints += (w / maxGenreWeight) * 10;
        }
      }
      const similarSource = similarSourceMap.get(c.igdbId);
      if (similarSource) {
        affinityPoints += similarSource.isPodium ? 16 : 12;
      }
      affinityPoints = Math.min(40, affinityPoints);

      // 2. ACTUALIDAD / RECENCIA (0 - 25 pts)
      const relYear = c.releaseYear || 2022;
      const age = Math.max(0, currentYear - relYear);
      let recencyPoints = 10;
      if (age <= 1) recencyPoints = 25; // 2025-2026
      else if (age <= 2) recencyPoints = 22; // 2024
      else if (age <= 3) recencyPoints = 19; // 2023
      else if (age <= 5) recencyPoints = 15; // 2021-2022
      else if (age <= 7) recencyPoints = 11; // 2019-2020
      else recencyPoints = 7; // 2017-2018

      // 3. POPULARIDAD Y CALIDAD (0 - 35 pts)
      const ratingVal = c.totalRating || c.rating || 78;
      const ratingCountVal = c.totalRatingCount || c.ratingCount || 20;
      const hypesVal = c.hypes || 0;
      const popPrimitiveVal = popularityRankMap.get(c.igdbId) || 0;

      const qualityPoints = Math.max(0, Math.min(15, ((ratingVal - 68) / 28) * 15));
      let popularityVolumePoints = Math.min(
        14,
        Math.log10(Math.max(10, ratingCountVal + hypesVal * 2)) * 4.5
      );
      if (popPrimitiveVal > 0) {
        popularityVolumePoints = Math.min(20, popularityVolumePoints + 7);
      }
      const popularityPoints = Math.min(35, qualityPoints + popularityVolumePoints);

      // Weight balance depending on tab mode
      let rawComposite = 0;
      if (mode === 'popular') {
        rawComposite = popularityPoints * 1.25 + recencyPoints * 1.15 + affinityPoints * 0.65;
      } else {
        rawComposite = affinityPoints * 1.05 + popularityPoints * 0.95 + recencyPoints * 0.9;
      }

      const matchScore = Math.max(76, Math.min(99, Math.round(58 + rawComposite * 0.42)));

      // Build human-friendly, personalized explanation
      let reason = c.reason || '';
      if (!reason) {
        if (mode === 'popular') {
          if (matchingGenres.length > 0) {
            reason = `🔥 Tendencia ${relYear} • Afinidad con tus gustos en ${matchingGenres.slice(0, 2).join(' y ')}`;
          } else {
            reason = `🔥 Lanzamiento popular (${relYear}) • En tendencia global en IGDB`;
          }
        } else if (similarSource) {
          reason = similarSource.isPodium
            ? `🏆 Recomendado por tu Podio "${similarSource.title}" (${relYear})`
            : `🎯 Similar a "${similarSource.title}" • Afinidad con tu biblioteca`;
        } else if (mode === 'podium') {
          const matchingPodium = podiumGames.find((p: any) =>
            candidateGenres.some((cg: string) =>
              (p.igdbGenres || []).some((pg: string) => pg.toLowerCase() === cg.toLowerCase())
            )
          );
          reason = matchingPodium
            ? `🏆 Inspirado en tu favorito "${matchingPodium.title}" (${relYear})`
            : `🏆 Alta afinidad con tu Podio de Honor (${relYear})`;
        } else if (mode === 'Hard') {
          reason =
            matchingGenres.length > 0
              ? `⚔️ Acción intensa (${relYear}) • Afinidad con ${matchingGenres.slice(0, 2).join(' y ')}`
              : `⚔️ Título moderno de alta intensidad y desafío (${relYear})`;
        } else if (mode === 'Chill') {
          reason =
            matchingGenres.length > 0
              ? `☕ Experiencia inmersiva (${relYear}) • Afinidad con ${matchingGenres.slice(0, 2).join(' y ')}`
              : `☕ Exploración, narrativa o estrategia inmersiva (${relYear})`;
        } else if (matchingGenres.length > 0) {
          reason = `✨ Afinidad con tu gusto por ${matchingGenres.slice(0, 2).join(' y ')} • Éxito de ${relYear}`;
        } else {
          reason = `🌟 Aclamado por la comunidad (${relYear}) con ${ratingVal}% de valoración`;
        }
      }

      const hardCheck = [
        'soulslike',
        'roguelike',
        'rpg',
        'role-playing',
        'metroidvania',
        'survival',
        'horror',
        'action',
        'shooter',
        'hack and slash',
      ];
      const isHard = candidateGenres.some((g: string) =>
        hardCheck.some((h) => g.toLowerCase().includes(h))
      );
      const suggestedType: 'Hard' | 'Chill' =
        mode === 'Hard' ? 'Hard' : mode === 'Chill' ? 'Chill' : isHard ? 'Hard' : 'Chill';

      return {
        ...c,
        matchingGenres,
        matchScore,
        _compositeSort: rawComposite,
        reason,
        suggestedType,
      };
    });

    // Deterministic sort: primary by composite score, tie-breaker by igdbId
    if (mode !== 'tga') {
      processed.sort((a: any, b: any) => {
        const diff = (b._compositeSort || b.matchScore) - (a._compositeSort || a.matchScore);
        if (Math.abs(diff) > 0.0001) return diff;
        return b.igdbId - a.igdbId;
      });
    }

    const totalFound = processed.length;
    const totalPages = mode === 'tga' ? 1 : Math.max(1, Math.ceil(totalFound / limit));
    const safePage = Math.min(page, totalPages);
    const safeOffset = (safePage - 1) * limit;
    const finalRecommendations =
      mode === 'tga' ? processed : processed.slice(safeOffset, safeOffset + limit);

    return NextResponse.json({
      success: true,
      data: {
        topGenres,
        mode,
        page: safePage,
        limit,
        totalPages,
        totalFound,
        dismissedCount: dismissedDocs.length,
        recommendations: finalRecommendations,
      },
    });
  } catch (error: any) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

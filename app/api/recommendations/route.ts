import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { getAllGameEntries } from '@/lib/store';
import { DismissedGame } from '@/models/DismissedGame';
import { getTgaNomineesForYearFromDb } from '@/lib/tgaService';
import {
  searchGamesInIGDB,
  getGamesByIdsFromIGDB,
  getSimilarGameIdsForIds,
  getHardcoreGamesFromIGDB,
  getChillGamesFromIGDB,
  getTwitchAccessToken,
} from '@/lib/igdb/client';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const user = await getAuthenticatedUser();

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'all'; // 'all' | 'podium' | 'Hard' | 'Chill' | 'genre' | 'tga'
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

    // 1. Podium Titles
    const podiumGames = userGames.filter((g: any) => !!g.podium);
    const podiumIgdbIds = podiumGames
      .map((g: any) => g.igdbId)
      .filter((id): id is number => typeof id === 'number' && id > 0);

    // 2. Count top genres
    const genreCounts: Record<string, number> = {};
    for (const g of userGames) {
      if ((g.rating && g.rating >= 4) || g.podium) {
        for (const gen of [...(g.igdbGenres || []), ...(g.customTags || [])]) {
          if (gen && gen.trim()) {
            const clean = gen.trim();
            genreCounts[clean] = (genreCounts[clean] || 0) + 1;
          }
        }
      }
    }
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre)
      .slice(0, 8);

    let candidates: any[] = [];
    let totalEstimated = 60;

    // ==============================================================
    // STRATEGY: THE GAME AWARDS (TGA) - From MongoDB
    // ==============================================================
    if (mode === 'tga') {
      const nominees = await getTgaNomineesForYearFromDb(tgaYear);
      const nomineeMap = new Map<string, { isWinner: boolean; year: number }>();
      nominees.forEach((n) => nomineeMap.set(n.title.toLowerCase(), { isWinner: n.isWinner, year: tgaYear }));

      const token = await getTwitchAccessToken();
      const clientId = process.env.TWITCH_CLIENT_ID;

      if (token && clientId && nominees.length > 0) {
        const escapedNames = nominees
          .map((n) => `"${n.title.replace(/"/g, '')}"`)
          .join(',');
        const apicalypseQuery = `
          fields name, summary, storyline, first_release_date, cover.url, cover.image_id, genres.name, themes.name, rating, videos.name, videos.video_id;
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
          // Normalize & attach TGA metadata
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

            const tgaInfo = nomineeMap.get(g.name.toLowerCase()) || { isWinner: false, year: tgaYear };

            return {
              igdbId: g.id,
              title: g.name,
              summary: g.summary || g.storyline || '',
              coverUrl,
              genres: uniqueCategories,
              releaseYear: g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : tgaYear,
              rating: g.rating ? Math.round(g.rating) : 90,
              videos,
              isTgaWinner: tgaInfo.isWinner,
              tgaYear: tgaInfo.year,
              reason: tgaInfo.isWinner
                ? `🏆 Ganador Oficial de Game of the Year (GOTY ${tgaYear})`
                : `⭐ Nominado Oficial al Game of the Year (GOTY ${tgaYear})`,
            };
          });

          // Sort so winner is first
          candidates.sort((a, b) => (b.isTgaWinner ? 1 : 0) - (a.isTgaWinner ? 1 : 0));
        }
      }
      totalEstimated = candidates.length;
    }
    // ==============================================================
    // OTHER MODES (podium, Hard, Chill, genre, all)
    // ==============================================================
    else if (mode === 'podium') {
      if (podiumIgdbIds.length > 0) {
        const allSimilarIds = await getSimilarGameIdsForIds(podiumIgdbIds);
        totalEstimated = Math.max(allSimilarIds.length, 20);
        const pagedIds = allSimilarIds.slice(offset, offset + limit * 3);
        if (pagedIds.length > 0) {
          candidates = await getGamesByIdsFromIGDB(pagedIds);
        }
      }
      if (candidates.length === 0) {
        candidates = await searchGamesInIGDB(topGenres[0] || 'RPG', offset, limit * 3);
      }
    } else if (mode === 'Hard') {
      candidates = await getHardcoreGamesFromIGDB(offset, limit * 3);
      totalEstimated = 80;
    } else if (mode === 'Chill') {
      candidates = await getChillGamesFromIGDB(offset, limit * 3);
      totalEstimated = 60;
    } else if (mode === 'genre' && genreParam) {
      candidates = await searchGamesInIGDB(genreParam, offset, limit * 3);
      totalEstimated = 70;
    } else {
      candidates = await searchGamesInIGDB('', offset, limit * 3);
      totalEstimated = 100;
    }

    // Deduplicate candidates by igdbId
    const seenCandidateIds = new Set<number>();
    let uniqueCandidates = candidates.filter((c) => {
      if (!c.igdbId || seenCandidateIds.has(c.igdbId)) return false;
      seenCandidateIds.add(c.igdbId);
      return true;
    });

    // Exclude games in user's library and games marked as "Terminado"
    // EXCEPT in TGA mode, where the user requested to always see all nominees without filters
    if (mode !== 'tga') {
      uniqueCandidates = uniqueCandidates.filter((c) => !isExcluded(c));
    }

    // Compute match score and reasons for non-TGA games
    const processed = uniqueCandidates.map((c) => {
      const matchingGenres = (c.genres || []).filter((cg: string) =>
        topGenres.some((tg) => tg.toLowerCase() === cg.toLowerCase())
      );

      let score = 75;
      if (c.rating) {
        score += Math.round((c.rating - 70) * 0.4);
      }
      score += Math.min(matchingGenres.length * 5, 15);
      if (mode === 'podium') score += 8;
      if (c.isTgaWinner) score = 99;
      else if (mode === 'tga') score = 95;
      if (score > 99) score = 99;
      if (score < 74) score = 76;

      let reason = c.reason || '';
      if (!reason) {
        if (mode === 'podium') {
          const matchingPodium = podiumGames.find((p: any) =>
            (c.genres || []).some((cg: string) =>
              (p.igdbGenres || []).some((pg: string) => pg.toLowerCase() === cg.toLowerCase())
            )
          );
          reason = matchingPodium
            ? `Inspirado en tu ${matchingPodium.podium === 'gold' ? '🥇 GOTY' : '🏆 Podio'} "${matchingPodium.title}"`
            : 'Recomendado por tus elecciones del Podio de Honor';
        } else if (mode === 'Hard') {
          reason = 'Título de alta intensidad, combate o supervivencia';
        } else if (mode === 'Chill') {
          reason = 'Experiencia envolvente, exploración o puzzles relajantes';
        } else if (matchingGenres.length > 0) {
          reason = `Basado en tu gusto por: ${matchingGenres.slice(0, 2).join(' y ')}`;
        } else if (c.rating) {
          reason = `Joya aclamada con ${c.rating}% de valoración comunitaria`;
        } else {
          reason = 'Título destacado en tendencias de IGDB';
        }
      }

      const hardCheck = ['soulslike', 'roguelike', 'rpg', 'metroidvania', 'survival', 'horror', 'action', 'hack and slash'];
      const isHard = (c.genres || []).some((g: string) =>
        hardCheck.some((h) => g.toLowerCase().includes(h))
      );
      const suggestedType: 'Hard' | 'Chill' =
        mode === 'Hard' ? 'Hard' : mode === 'Chill' ? 'Chill' : isHard ? 'Hard' : 'Chill';

      return {
        ...c,
        matchingGenres,
        matchScore: score,
        reason,
        suggestedType,
      };
    });

    const finalRecommendations = mode === 'tga' ? processed : processed.slice(0, limit);
    const totalPages = mode === 'tga' ? 1 : Math.max(1, Math.ceil(totalEstimated / limit));

    return NextResponse.json({
      success: true,
      data: {
        topGenres,
        mode,
        page,
        limit,
        totalPages,
        totalFound: mode === 'tga' ? processed.length : totalEstimated,
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

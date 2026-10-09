import { NextResponse } from 'next/server';
import { getAllGameEntries } from '@/lib/store';
import { searchGamesInIGDB } from '@/lib/igdb/client';

export async function GET() {
  try {
    const { entries: userGames } = await getAllGameEntries();
    const userGameTitles = new Set(userGames.map((g) => g.title.toLowerCase().trim()));

    // Get favorite genres from 4 and 5 star games
    const genreCounts: Record<string, number> = {};
    for (const g of userGames) {
      if ((g.rating && g.rating >= 4) || g.podium) {
        for (const gen of [...(g.igdbGenres || []), ...(g.customTags || [])]) {
          genreCounts[gen] = (genreCounts[gen] || 0) + 1;
        }
      }
    }

    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre)
      .slice(0, 3);

    // Candidates pool
    const candidates = await searchGamesInIGDB('');
    const recommendations = candidates
      .filter((candidate) => !userGameTitles.has(candidate.title.toLowerCase().trim()))
      .map((candidate) => {
        const matchingGenres = candidate.genres.filter((cg) =>
          topGenres.some((tg) => tg.toLowerCase() === cg.toLowerCase())
        );
        return {
          ...candidate,
          matchingGenres,
          reason:
            matchingGenres.length > 0
              ? `Recomendado por tu afinidad con: ${matchingGenres.join(', ')}`
              : 'Basado en los títulos mejor calificados de la comunidad',
        };
      })
      .slice(0, 4);

    return NextResponse.json({
      success: true,
      data: {
        topGenres,
        recommendations,
      },
    });
  } catch (error: any) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar recomendaciones' },
      { status: 500 }
    );
  }
}

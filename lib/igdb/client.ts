import { IGDBGame, NormalizedGame } from './types';

// In-memory token cache for Twitch OAuth2
let twitchTokenCache: {
  token: string;
  expiresAt: number;
} | null = null;

export async function getTwitchAccessToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET missing');
    return null;
  }

  const now = Date.now();
  if (twitchTokenCache && twitchTokenCache.expiresAt > now + 60000) {
    return twitchTokenCache.token;
  }

  try {
    const response = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      { method: 'POST' }
    );

    if (!response.ok) {
      console.error('Failed to obtain Twitch Access Token for IGDB:', response.status);
      return null;
    }

    const data = await response.json();
    twitchTokenCache = {
      token: data.access_token,
      expiresAt: now + (data.expires_in * 1000),
    };

    return twitchTokenCache.token;
  } catch (error) {
    console.error('Error in Twitch OAuth2 negotiation:', error);
    return null;
  }
}

function normalizeIGDBGame(g: IGDBGame): NormalizedGame {
  let coverUrl = '';
  if (g.cover?.image_id) {
    coverUrl = `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`;
  } else if (g.cover?.url) {
    coverUrl = g.cover.url.startsWith('//') ? `https:${g.cover.url}` : g.cover.url;
    coverUrl = coverUrl.replace('/t_thumb/', '/t_cover_big/');
  }

  const releaseYear = g.first_release_date
    ? new Date(g.first_release_date * 1000).getFullYear()
    : undefined;

  // Merge genres and themes seamlessly to provide rich categories
  const rawCategories = [
    ...(g.genres?.map((gen) => gen.name) || []),
    ...(g.themes?.map((thm) => thm.name) || []),
  ];
  const uniqueCategories = Array.from(new Set(rawCategories.filter(Boolean)));

  return {
    igdbId: g.id,
    title: g.name,
    summary: g.summary || g.storyline || '',
    coverUrl,
    genres: uniqueCategories,
    releaseYear,
    rating: g.rating ? Math.round(g.rating) : undefined,
  };
}

export async function searchGamesInIGDB(query: string): Promise<NormalizedGame[]> {
  const trimmed = query.trim();
  const token = await getTwitchAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;

  if (!token || !clientId) {
    console.error('Twitch credentials not configured.');
    return [];
  }

  try {
    let apicalypseQuery = '';
    if (trimmed) {
      apicalypseQuery = `
        search "${trimmed.replace(/"/g, '')}";
        fields name, summary, storyline, first_release_date, cover.url, cover.image_id, genres.name, themes.name, rating, similar_games;
        limit 15;
      `;
    } else {
      // Popular top rated games for discovery when query is empty
      apicalypseQuery = `
        fields name, summary, storyline, first_release_date, cover.url, cover.image_id, genres.name, themes.name, rating, similar_games;
        where rating >= 80 & rating_count > 50 & cover != null;
        sort rating desc;
        limit 12;
      `;
    }

    const res = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: apicalypseQuery,
    });

    if (!res.ok) {
      console.error('IGDB Query Error:', res.status, await res.text());
      return [];
    }

    const rawGames: IGDBGame[] = await res.json();
    return rawGames.map(normalizeIGDBGame);
  } catch (err) {
    console.error('IGDB Live query failed:', err);
    return [];
  }
}

export async function getGameDetailsFromIGDB(igdbId: number): Promise<NormalizedGame | null> {
  const token = await getTwitchAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;

  if (!token || !clientId) return null;

  try {
    const apicalypseQuery = `
      fields name, summary, storyline, first_release_date, cover.url, cover.image_id, genres.name, themes.name, rating, similar_games.name, similar_games.cover.image_id;
      where id = ${igdbId};
      limit 1;
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

    if (!res.ok) return null;

    const rawGames: IGDBGame[] = await res.json();
    const g = rawGames[0];
    return g ? normalizeIGDBGame(g) : null;
  } catch (err) {
    console.error('IGDB Live query failed:', err);
    return null;
  }
}

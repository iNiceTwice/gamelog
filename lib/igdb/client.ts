import { IGDBGame, NormalizedGame, GameVideoInfo } from './types';

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

  // Extract trailers and gameplay videos
  const videos: GameVideoInfo[] = (g.videos || []).map((v) => {
    const lowerName = (v.name || '').toLowerCase();
    let type: 'trailer' | 'gameplay' | 'other' = 'trailer';
    if (lowerName.includes('gameplay')) {
      type = 'gameplay';
    } else if (
      lowerName.includes('trailer') ||
      lowerName.includes('teaser') ||
      lowerName.includes('reveal') ||
      lowerName.includes('launch')
    ) {
      type = 'trailer';
    } else {
      type = 'other';
    }
    return {
      name: v.name || 'Video',
      youtubeId: v.video_id,
      type,
    };
  });

  return {
    igdbId: g.id,
    title: g.name,
    summary: g.summary || g.storyline || '',
    coverUrl,
    genres: uniqueCategories,
    releaseYear,
    rating: g.rating ? Math.round(g.rating) : undefined,
    videos,
    similarGames: g.similar_games || [],
  };
}

export async function searchGamesInIGDB(
  query: string,
  offset: number = 0,
  limit: number = 12
): Promise<NormalizedGame[]> {
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
        fields name, summary, storyline, first_release_date, cover.url, cover.image_id, genres.name, themes.name, rating, videos.name, videos.video_id, similar_games;
        limit ${limit};
        offset ${offset};
      `;
    } else {
      // Popular top rated games for discovery when query is empty
      apicalypseQuery = `
        fields name, summary, storyline, first_release_date, cover.url, cover.image_id, genres.name, themes.name, rating, videos.name, videos.video_id, similar_games;
        where rating >= 80 & rating_count > 40 & cover != null;
        sort rating desc;
        limit ${limit};
        offset ${offset};
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

export async function getGamesByIdsFromIGDB(ids: number[]): Promise<NormalizedGame[]> {
  if (!ids || ids.length === 0) return [];
  const token = await getTwitchAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!token || !clientId) return [];

  try {
    const validIds = ids.slice(0, 30).join(',');
    const apicalypseQuery = `
      fields name, summary, storyline, first_release_date, cover.url, cover.image_id, genres.name, themes.name, rating, videos.name, videos.video_id, similar_games;
      where id = (${validIds}) & cover != null;
      limit 25;
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

    if (!res.ok) return [];
    const rawGames: IGDBGame[] = await res.json();
    return rawGames.map(normalizeIGDBGame);
  } catch (err) {
    console.error('IGDB getGamesByIds failed:', err);
    return [];
  }
}

export async function getSimilarGameIdsForIds(igdbIds: number[]): Promise<number[]> {
  if (!igdbIds || igdbIds.length === 0) return [];
  const token = await getTwitchAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!token || !clientId) return [];

  try {
    const validIds = igdbIds.slice(0, 15).join(',');
    const apicalypseQuery = `
      fields similar_games;
      where id = (${validIds});
      limit 15;
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

    if (!res.ok) return [];
    const games: Array<{ id: number; similar_games?: number[] }> = await res.json();
    const collected: number[] = [];
    games.forEach((g) => {
      (g.similar_games || []).forEach((simId) => collected.push(simId));
    });
    return Array.from(new Set(collected));
  } catch (err) {
    console.error('IGDB getSimilarGameIdsForIds failed:', err);
    return [];
  }
}

export async function getHardcoreGamesFromIGDB(
  offset: number = 0,
  limit: number = 12
): Promise<NormalizedGame[]> {
  const token = await getTwitchAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!token || !clientId) return [];

  try {
    const apicalypseQuery = `
      fields name, summary, storyline, first_release_date, cover.url, cover.image_id, genres.name, themes.name, rating, videos.name, videos.video_id, similar_games;
      where rating >= 80 & rating_count > 25 & cover != null & (genres = (12, 25) | themes = (19, 1));
      sort rating desc;
      limit ${limit};
      offset ${offset};
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

    if (!res.ok) return [];
    const rawGames: IGDBGame[] = await res.json();
    return rawGames.map(normalizeIGDBGame);
  } catch (err) {
    console.error('IGDB getHardcoreGames failed:', err);
    return [];
  }
}

export async function getChillGamesFromIGDB(
  offset: number = 0,
  limit: number = 12
): Promise<NormalizedGame[]> {
  const token = await getTwitchAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!token || !clientId) return [];

  try {
    const apicalypseQuery = `
      fields name, summary, storyline, first_release_date, cover.url, cover.image_id, genres.name, themes.name, rating, videos.name, videos.video_id, similar_games;
      where rating >= 75 & rating_count > 15 & cover != null & (genres = (9, 13, 32));
      sort rating desc;
      limit ${limit};
      offset ${offset};
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

    if (!res.ok) return [];
    const rawGames: IGDBGame[] = await res.json();
    return rawGames.map(normalizeIGDBGame);
  } catch (err) {
    console.error('IGDB getChillGames failed:', err);
    return [];
  }
}

export async function getGameDetailsFromIGDB(igdbId: number): Promise<NormalizedGame | null> {
  const token = await getTwitchAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;

  if (!token || !clientId) return null;

  try {
    const apicalypseQuery = `
      fields name, summary, storyline, first_release_date, cover.url, cover.image_id, genres.name, themes.name, rating, videos.name, videos.video_id, similar_games;
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

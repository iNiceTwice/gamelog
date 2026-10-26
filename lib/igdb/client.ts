import { IGDBGame, NormalizedGame, GameVideoInfo } from './types';

// In-memory token cache for Twitch OAuth2
let twitchTokenCache: {
  token: string;
  expiresAt: number;
} | null = null;

// Short-lived in-memory cache for recommendation pools so pagination is 100% consistent and fast
const poolCache = new Map<
  string,
  {
    expiresAt: number;
    games: NormalizedGame[];
    popularityRankMap: Map<number, number>;
    similarSourceMap: Map<number, { title: string; isPodium: boolean }>;
  }
>();
const POOL_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export function getCachedPool(key: string) {
  const entry = poolCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    poolCache.delete(key);
    return null;
  }
  return entry;
}

export function setCachedPool(
  key: string,
  data: {
    games: NormalizedGame[];
    popularityRankMap: Map<number, number>;
    similarSourceMap: Map<number, { title: string; isPodium: boolean }>;
  }
) {
  poolCache.set(key, {
    ...data,
    expiresAt: Date.now() + POOL_CACHE_TTL_MS,
  });
}

// Minimum release date for recommendations: Jan 1, 2017 (avoids 15-20 year old games)
export const MIN_MODERN_RELEASE_TS = 1483228800; // 2017-01-01
// Recent release window for "Popular" tab: Jan 1, 2023 onwards
export const MIN_POPULAR_NEW_RELEASE_TS = 1672531200; // 2023-01-01
// Ultra-recent window: Jan 1, 2024 onwards
export const MIN_ULTRA_RECENT_RELEASE_TS = 1704067200; // 2024-01-01

export const IGDB_GENRE_MAP: Record<string, number> = {
  'point-and-click': 2,
  'fighting': 4,
  'shooter': 5,
  'music': 7,
  'platform': 8,
  'puzzle': 9,
  'racing': 10,
  'real time strategy (rts)': 11,
  'role-playing (rpg)': 12,
  'rpg': 12,
  'simulator': 13,
  'sport': 14,
  'strategy': 15,
  'turn-based strategy (tbs)': 16,
  'tactical': 24,
  "hack and slash/beat 'em up": 25,
  'hack and slash': 25,
  'quiz/trivia': 26,
  'pinball': 30,
  'adventure': 31,
  'indie': 32,
  'arcade': 33,
  'visual novel': 34,
  'card & board game': 35,
  'moba': 36,
};

export const IGDB_THEME_MAP: Record<string, number> = {
  'action': 1,
  'fantasy': 17,
  'science fiction': 18,
  'horror': 19,
  'thriller': 20,
  'survival': 21,
  'historical': 22,
  'stealth': 23,
  'comedy': 27,
  'business': 28,
  'drama': 31,
  'non-fiction': 32,
  'sandbox': 33,
  'educational': 34,
  'kids': 35,
  'open world': 38,
  'warfare': 39,
  'party': 40,
  '4x (explore, expand, exploit, and exterminate)': 41,
  'mystery': 43,
  'romance': 44,
};

const IGDB_GAME_FIELDS =
  'fields name, summary, storyline, first_release_date, cover.url, cover.image_id, genres.name, themes.name, rating, rating_count, total_rating, total_rating_count, hypes, videos.name, videos.video_id, similar_games;';

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
      expiresAt: now + data.expires_in * 1000,
    };

    return twitchTokenCache.token;
  } catch (error) {
    console.error('Error in Twitch OAuth2 negotiation:', error);
    return null;
  }
}

export function normalizeIGDBGame(g: IGDBGame): NormalizedGame {
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

  const effectiveRating = g.rating ?? g.total_rating;

  return {
    igdbId: g.id,
    title: g.name,
    summary: g.summary || g.storyline || '',
    coverUrl,
    genres: uniqueCategories,
    releaseYear,
    rating: effectiveRating ? Math.round(effectiveRating) : undefined,
    ratingCount: g.rating_count ?? 0,
    totalRating: g.total_rating ? Math.round(g.total_rating) : undefined,
    totalRatingCount: g.total_rating_count ?? g.rating_count ?? 0,
    hypes: g.hypes ?? 0,
    videos,
    similarGames: g.similar_games || [],
  };
}

async function runIGDBGamesQuery(apicalypseQuery: string): Promise<NormalizedGame[]> {
  const token = await getTwitchAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!token || !clientId) return [];

  try {
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
    console.error('IGDB query failed:', err);
    return [];
  }
}

export async function searchGamesInIGDB(
  query: string,
  offset: number = 0,
  limit: number = 12
): Promise<NormalizedGame[]> {
  const trimmed = query.trim();

  if (trimmed) {
    const lower = trimmed.toLowerCase();
    const genreId = IGDB_GENRE_MAP[lower];
    const themeId = IGDB_THEME_MAP[lower];

    if (genreId || themeId) {
      return getGamesByGenreOrThemeFromIGDB(trimmed, limit);
    }

    const apicalypseQuery = `
      search "${trimmed.replace(/"/g, '')}";
      ${IGDB_GAME_FIELDS}
      where cover != null;
      limit ${limit};
      offset ${offset};
    `;
    return runIGDBGamesQuery(apicalypseQuery);
  }

  const apicalypseQuery = `
    ${IGDB_GAME_FIELDS}
    where first_release_date >= ${MIN_MODERN_RELEASE_TS} & total_rating >= 75 & total_rating_count >= 25 & cover != null;
    sort total_rating_count desc;
    limit ${limit};
    offset ${offset};
  `;
  return runIGDBGamesQuery(apicalypseQuery);
}

/**
 * Fetches a full pool of trending / popular new releases combining IGDB popularity_primitives
 * (Visits, Playing, Want to Play, Steam 24hr Peak, Global Top Sellers) and
 * recent high-engagement releases (2023-2026).
 */
export async function getPopularNewGamesFromIGDB(
  poolLimit: number = 85
): Promise<{ games: NormalizedGame[]; popularityRankMap: Map<number, number> }> {
  const token = await getTwitchAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;
  const popularityRankMap = new Map<number, number>();

  if (!token || !clientId) {
    return { games: [], popularityRankMap };
  }

  try {
    // 1. Fetch top trending game IDs from IGDB popularity_primitives
    const popRes = await fetch('https://api.igdb.com/v4/popularity_primitives', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: `
        fields game_id, value, popularity_type;
        where popularity_type = (1, 2, 3, 5, 9);
        sort value desc;
        limit 200;
      `,
    });

    const trendingIds: number[] = [];
    if (popRes.ok) {
      const primitives: Array<{ game_id: number; value: number }> = await popRes.json();
      for (const p of primitives) {
        if (p.game_id && !popularityRankMap.has(p.game_id)) {
          popularityRankMap.set(p.game_id, p.value);
          trendingIds.push(p.game_id);
        }
      }
    }

    const queries: Promise<NormalizedGame[]>[] = [];

    if (trendingIds.length > 0) {
      const idSlice = trendingIds.slice(0, 90).join(',');
      queries.push(
        runIGDBGamesQuery(`
          ${IGDB_GAME_FIELDS}
          where id = (${idSlice}) & first_release_date >= ${MIN_POPULAR_NEW_RELEASE_TS} & cover != null;
          limit 80;
        `)
      );
    }

    // 2. Also query recent (2024+) blockbusters sorted by community engagement
    queries.push(
      runIGDBGamesQuery(`
        ${IGDB_GAME_FIELDS}
        where first_release_date >= ${MIN_ULTRA_RECENT_RELEASE_TS} & (total_rating_count >= 12 | hypes >= 25) & cover != null;
        sort total_rating_count desc;
        limit ${poolLimit};
      `)
    );

    const results = await Promise.all(queries);
    const merged: NormalizedGame[] = [];
    const seen = new Set<number>();

    for (const list of results) {
      for (const g of list) {
        if (g.igdbId && !seen.has(g.igdbId)) {
          seen.add(g.igdbId);
          merged.push(g);
        }
      }
    }

    return { games: merged, popularityRankMap };
  } catch (err) {
    console.error('IGDB getPopularNewGamesFromIGDB failed:', err);
    return { games: [], popularityRankMap };
  }
}

/**
 * Fetches a full pool of modern, popular games matching the user's favorite genres and themes.
 */
export async function getAffinityGamesFromIGDB(
  topCategories: string[],
  poolLimit: number = 65
): Promise<NormalizedGame[]> {
  const genreIds: number[] = [];
  const themeIds: number[] = [];

  for (const cat of topCategories) {
    const lower = cat.toLowerCase().trim();
    if (IGDB_GENRE_MAP[lower] && !genreIds.includes(IGDB_GENRE_MAP[lower])) {
      genreIds.push(IGDB_GENRE_MAP[lower]);
    }
    if (IGDB_THEME_MAP[lower] && !themeIds.includes(IGDB_THEME_MAP[lower])) {
      themeIds.push(IGDB_THEME_MAP[lower]);
    }
  }

  let categoryFilter = '';
  if (genreIds.length > 0 && themeIds.length > 0) {
    categoryFilter = `& (genres = (${genreIds.slice(0, 5).join(',')}) | themes = (${themeIds.slice(0, 5).join(',')}))`;
  } else if (genreIds.length > 0) {
    categoryFilter = `& genres = (${genreIds.slice(0, 5).join(',')})`;
  } else if (themeIds.length > 0) {
    categoryFilter = `& themes = (${themeIds.slice(0, 5).join(',')})`;
  }

  const recentReleaseTs = 1609459200; // 2021-01-01
  const modernReleaseTs = 1514764800; // 2018-01-01

  const [recentMatches, modernMatches] = await Promise.all([
    runIGDBGamesQuery(`
      ${IGDB_GAME_FIELDS}
      where first_release_date >= ${recentReleaseTs} & total_rating >= 74 & total_rating_count >= 15 & cover != null ${categoryFilter};
      sort total_rating_count desc;
      limit ${poolLimit};
    `),
    runIGDBGamesQuery(`
      ${IGDB_GAME_FIELDS}
      where first_release_date >= ${modernReleaseTs} & total_rating >= 78 & total_rating_count >= 35 & cover != null ${categoryFilter};
      sort total_rating desc;
      limit ${poolLimit};
    `),
  ]);

  const merged: NormalizedGame[] = [];
  const seen = new Set<number>();
  for (const g of [...recentMatches, ...modernMatches]) {
    if (g.igdbId && !seen.has(g.igdbId)) {
      seen.add(g.igdbId);
      merged.push(g);
    }
  }
  return merged;
}

/**
 * Fetches a full pool of modern, popular games for a specific genre or theme name.
 */
export async function getGamesByGenreOrThemeFromIGDB(
  categoryName: string,
  poolLimit: number = 85
): Promise<NormalizedGame[]> {
  const lower = categoryName.toLowerCase().trim();
  const genreId = IGDB_GENRE_MAP[lower];
  const themeId = IGDB_THEME_MAP[lower];

  let filterClause = '';
  if (genreId && themeId) {
    filterClause = `& (genres = (${genreId}) | themes = (${themeId}))`;
  } else if (genreId) {
    filterClause = `& genres = (${genreId})`;
  } else if (themeId) {
    filterClause = `& themes = (${themeId})`;
  } else {
    return searchGamesInIGDB(categoryName, 0, poolLimit);
  }

  const apicalypseQuery = `
    ${IGDB_GAME_FIELDS}
    where first_release_date >= ${MIN_MODERN_RELEASE_TS} & total_rating >= 72 & total_rating_count >= 15 & cover != null ${filterClause};
    sort total_rating_count desc;
    limit ${poolLimit};
  `;

  return runIGDBGamesQuery(apicalypseQuery);
}

export async function getGamesByIdsFromIGDB(
  ids: number[],
  modernOnly: boolean = true
): Promise<NormalizedGame[]> {
  if (!ids || ids.length === 0) return [];

  const uniqueIds = Array.from(new Set(ids)).slice(0, 75);
  const validIds = uniqueIds.join(',');
  const dateFilter = modernOnly ? `& first_release_date >= ${MIN_MODERN_RELEASE_TS}` : '';

  const apicalypseQuery = `
    ${IGDB_GAME_FIELDS}
    where id = (${validIds}) & cover != null ${dateFilter};
    limit 75;
  `;

  return runIGDBGamesQuery(apicalypseQuery);
}

export async function getSimilarGameIdsForIds(igdbIds: number[]): Promise<number[]> {
  if (!igdbIds || igdbIds.length === 0) return [];
  const token = await getTwitchAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!token || !clientId) return [];

  try {
    const validIds = Array.from(new Set(igdbIds)).slice(0, 25).join(',');
    const apicalypseQuery = `
      fields similar_games;
      where id = (${validIds});
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
  poolLimit: number = 85
): Promise<NormalizedGame[]> {
  const modernReleaseTs = 1514764800; // 2018-01-01
  const apicalypseQuery = `
    ${IGDB_GAME_FIELDS}
    where first_release_date >= ${modernReleaseTs} & total_rating >= 76 & total_rating_count >= 25 & cover != null & (genres = (5, 12, 24, 25) | themes = (1, 19, 21));
    sort total_rating_count desc;
    limit ${poolLimit};
  `;

  return runIGDBGamesQuery(apicalypseQuery);
}

export async function getChillGamesFromIGDB(
  poolLimit: number = 85
): Promise<NormalizedGame[]> {
  const modernReleaseTs = 1514764800; // 2018-01-01
  const apicalypseQuery = `
    ${IGDB_GAME_FIELDS}
    where first_release_date >= ${modernReleaseTs} & total_rating >= 75 & total_rating_count >= 20 & cover != null & (genres = (2, 8, 9, 13, 31, 32, 35)) & themes != (19, 21);
    sort total_rating_count desc;
    limit ${poolLimit};
  `;

  return runIGDBGamesQuery(apicalypseQuery);
}

export async function getGameDetailsFromIGDB(igdbId: number): Promise<NormalizedGame | null> {
  const games = await runIGDBGamesQuery(`
    ${IGDB_GAME_FIELDS}
    where id = ${igdbId};
    limit 1;
  `);
  return games[0] || null;
}

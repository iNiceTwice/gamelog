import { IGDBGame, NormalizedGame } from './types';

// In-memory token cache for Twitch OAuth2
let twitchTokenCache: {
  token: string;
  expiresAt: number;
} | null = null;

const MOCK_GAMES_DATABASE: NormalizedGame[] = [
  {
    igdbId: 298532,
    title: 'Kingdom Come: Deliverance II',
    summary: 'A thrilling story-driven action-RPG with a rich open world set in 15th century Medieval Bohemia.',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co83vg.jpg',
    genres: ['Role-playing (RPG)', 'Adventure'],
    releaseYear: 2025,
    rating: 94,
  },
  {
    igdbId: 119171,
    title: 'Hollow Knight: Silksong',
    summary: 'Discover a vast, haunted kingdom in Hollow Knight: Silksong! The sequel to the award-winning action-adventure.',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2aa3.jpg',
    genres: ['Platform', 'Adventure', 'Indie'],
    releaseYear: 2025,
    rating: 96,
  },
  {
    igdbId: 19164,
    title: 'Prey',
    summary: 'In Prey, you awaken aboard Talos I, a space station orbiting the moon in the year 2032.',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x77.jpg',
    genres: ['Shooter', 'Role-playing (RPG)', 'Adventure'],
    releaseYear: 2017,
    rating: 88,
  },
  {
    igdbId: 999101,
    title: 'Berry Bury Berry',
    summary: 'A fast-paced indie management and action game with unique retro aesthetics.',
    coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    genres: ['Simulator', 'Strategy', 'Indie'],
    releaseYear: 2024,
    rating: 82,
  },
  {
    igdbId: 194426,
    title: 'Blasphemous 2',
    summary: 'Awakened in a strange new land, and displaced from his final resting place, The Penitent One is thrust back into the endless cycle of life, death, and resurrection.',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6t8h.jpg',
    genres: ['Platform', 'Hack and slash/Beat \'em up', 'Adventure'],
    releaseYear: 2023,
    rating: 85,
  },
  {
    igdbId: 11588,
    title: 'Darkwood',
    summary: 'Darkwood is a challenging survival horror that does not rely on jump scares.',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tq9.jpg',
    genres: ['Role-playing (RPG)', 'Adventure', 'Indie'],
    releaseYear: 2017,
    rating: 84,
  },
  {
    igdbId: 9927,
    title: 'Deus Ex: Mankind Divided',
    summary: 'Set in 2029, two years after Human Revolution and the Aug Incident in Panchaea which resulted in the deaths of millions.',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7h.jpg',
    genres: ['Shooter', 'Role-playing (RPG)', 'Adventure'],
    releaseYear: 2016,
    rating: 83,
  },
  {
    igdbId: 114287,
    title: 'Fear & Hunger',
    summary: 'Fear & Hunger is a horror dungeon crawler set in the dark and hopeless dungeons of fear and hunger.',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co62x9.jpg',
    genres: ['Role-playing (RPG)', 'Adventure', 'Indie'],
    releaseYear: 2018,
    rating: 86,
  },
  {
    igdbId: 1877,
    title: 'Cyberpunk 2077',
    summary: 'Cyberpunk 2077 is an open-world, action-adventure story set in Night City.',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co680u.jpg',
    genres: ['Role-playing (RPG)', 'Shooter', 'Adventure'],
    releaseYear: 2020,
    rating: 89,
  },
  {
    igdbId: 103298,
    title: 'Red Dead Redemption',
    summary: 'When federal agents threaten his family, former outlaw John Marston is forced to hunt down the gang of criminals he once called friends.',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co7dhn.jpg',
    genres: ['Shooter', 'Adventure'],
    releaseYear: 2010,
    rating: 95,
  },
  {
    igdbId: 119133,
    title: 'Elden Ring',
    summary: 'THE NEW FANTASY ACTION RPG. Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring.',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg',
    genres: ['Role-playing (RPG)', 'Adventure'],
    releaseYear: 2022,
    rating: 96,
  },
  {
    igdbId: 112875,
    title: 'Hades II',
    summary: 'Battle beyond the Underworld using dark sorcery to take on the Titan of Time in this bewitching sequel.',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co8352.jpg',
    genres: ['Hack and slash/Beat \'em up', 'Role-playing (RPG)', 'Indie'],
    releaseYear: 2024,
    rating: 93,
  },
  {
    igdbId: 1020,
    title: 'Grand Theft Auto V',
    summary: 'Los Santos is a city of bright lights, long nights and dirty secrets.',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.jpg',
    genres: ['Shooter', 'Adventure'],
    releaseYear: 2013,
    rating: 97,
  }
];

export async function getTwitchAccessToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
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

export async function searchGamesInIGDB(query: string): Promise<NormalizedGame[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const token = await getTwitchAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;

  // Real IGDB Request if credentials exist
  if (token && clientId) {
    try {
      const apicalypseQuery = `
        search "${query.replace(/"/g, '')}";
        fields name, summary, storyline, first_release_date, cover.url, cover.image_id, genres.name, rating, similar_games;
        limit 10;
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
        const rawGames: IGDBGame[] = await res.json();
        return rawGames.map((g) => {
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

          return {
            igdbId: g.id,
            title: g.name,
            summary: g.summary || g.storyline || '',
            coverUrl,
            genres: g.genres?.map((gen) => gen.name) || [],
            releaseYear,
            rating: g.rating ? Math.round(g.rating) : undefined,
          };
        });
      }
    } catch (err) {
      console.warn('IGDB Live query failed, falling back to mock database:', err);
    }
  }

  // Fallback: Rich Mock Search matching query
  return MOCK_GAMES_DATABASE.filter((game) =>
    game.title.toLowerCase().includes(trimmed) ||
    game.genres.some((genre) => genre.toLowerCase().includes(trimmed))
  );
}

export async function getGameDetailsFromIGDB(igdbId: number): Promise<NormalizedGame | null> {
  const token = await getTwitchAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;

  if (token && clientId) {
    try {
      const apicalypseQuery = `
        fields name, summary, storyline, first_release_date, cover.url, cover.image_id, genres.name, rating, similar_games.name, similar_games.cover.image_id;
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

      if (res.ok) {
        const rawGames: IGDBGame[] = await res.json();
        const g = rawGames[0];
        if (g) {
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

          return {
            igdbId: g.id,
            title: g.name,
            summary: g.summary || g.storyline || '',
            coverUrl,
            genres: g.genres?.map((gen) => gen.name) || [],
            releaseYear,
            rating: g.rating ? Math.round(g.rating) : undefined,
          };
        }
      }
    } catch (err) {
      console.warn('IGDB Live query failed, falling back to mock database:', err);
    }
  }

  const found = MOCK_GAMES_DATABASE.find((g) => g.igdbId === igdbId);
  return found || null;
}

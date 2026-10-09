export interface SeedEntry {
  title: string;
  igdbId?: number;
  coverUrl?: string;
  igdbGenres: string[];
  customTags: string[];
  releaseYear?: number;
  status: 'completed' | 'abandoned' | 'playing' | 'backlog';
  yearPlayed?: number;
  rating?: number;
  podium?: 'gold' | 'silver' | 'bronze' | null;
  review?: string;
  backlogType?: string;
  notes?: string;
}

export const NOTION_INITIAL_DATA: SeedEntry[] = [
  // 2025 - PODIO & TERMINADOS
  {
    title: 'Kingdom Come: Deliverance II',
    igdbId: 298532,
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co83vg.jpg',
    igdbGenres: ['Role-playing (RPG)', 'Adventure'],
    customTags: ['Aventura', 'RPG'],
    releaseYear: 2025,
    status: 'completed',
    yearPlayed: 2025,
    rating: 5,
    podium: 'gold',
    review: 'Mi goty, excelente diseño de mundo, misiones con profundidad inmersiva insuperable.',
  },
  {
    title: 'Hollow Knight: Silksong',
    igdbId: 119171,
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2aa3.jpg',
    igdbGenres: ['Platform', 'Adventure', 'Indie'],
    customTags: ['Plataformas', 'Souls', 'Aventura'],
    releaseYear: 2025,
    status: 'completed',
    yearPlayed: 2025,
    rating: 5,
    podium: 'silver',
    review: 'Diseño de mundo y niveles formidable, combate acrobático y banda sonora legendaria.',
  },
  {
    title: 'Prey',
    igdbId: 19164,
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x77.jpg',
    igdbGenres: ['Shooter', 'Role-playing (RPG)', 'Adventure'],
    customTags: ['Accion', 'FPS', 'RPG'],
    releaseYear: 2017,
    status: 'completed',
    yearPlayed: 2025,
    rating: 5,
    podium: 'bronze',
    review: 'Excelente mundo, historia muuy bien construida y ambientación inmersiva claustrofóbica.',
  },
  {
    title: 'Blasphemous 2',
    igdbId: 194426,
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6t8h.jpg',
    igdbGenres: ['Platform', 'Hack and slash/Beat \'em up', 'Adventure'],
    customTags: ['Accion', 'Plataformas', 'Souls'],
    releaseYear: 2023,
    status: 'completed',
    yearPlayed: 2025,
    rating: 4,
    podium: null,
    review: 'Diseño de personajes algo repetitivo hacia el final, pero la jugabilidad y pixel art son una joya.',
  },
  {
    title: 'Dark Wood',
    igdbId: 11588,
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tq9.jpg',
    igdbGenres: ['Role-playing (RPG)', 'Adventure', 'Indie'],
    customTags: ['Terror', 'Supervivencia'],
    releaseYear: 2017,
    status: 'abandoned',
    yearPlayed: 2025,
    rating: 4,
    podium: null,
    review: 'Excelente ambientación y atmósfera opresiva, pero la tensión constante me agotó a mitad de camino.',
  },
  {
    title: 'Deus Ex: Mankind Divided',
    igdbId: 9927,
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7h.jpg',
    igdbGenres: ['Shooter', 'Role-playing (RPG)', 'Adventure'],
    customTags: ['Accion', 'FPS'],
    releaseYear: 2016,
    status: 'completed',
    yearPlayed: 2025,
    rating: 4,
    podium: null,
    review: 'Bien logrado, narrativa del mundo y mecánicas de sigilo/aumento muy satisfactorias.',
  },
  // 2026 - REGISTRO
  {
    title: 'Berry Bury Berry',
    igdbId: 999101,
    coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    igdbGenres: ['Simulator', 'Strategy', 'Indie'],
    customTags: ['Gestion', 'FPS'],
    releaseYear: 2024,
    status: 'completed',
    yearPlayed: 2026,
    rating: 4,
    podium: null,
    review: 'Corto pero super adictivo y entretenido para pasar el rato en sesiones rápidas.',
  },
  // PENDIENTES / BACKLOG
  {
    title: 'Fear & Hunger 1 y 2',
    igdbId: 114287,
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co62x9.jpg',
    igdbGenres: ['Role-playing (RPG)', 'Adventure', 'Indie'],
    customTags: ['Puzzles', 'Terror'],
    releaseYear: 2018,
    status: 'backlog',
    backlogType: 'Hard',
    notes: 'Jugar con guía si me trabo con los guardados y amputaciones.',
  },
  {
    title: 'Cyberpunk 2077',
    igdbId: 1877,
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co680u.jpg',
    igdbGenres: ['Role-playing (RPG)', 'Shooter', 'Adventure'],
    customTags: ['Accion', 'Mundo Abierto', 'FPS'],
    releaseYear: 2020,
    status: 'backlog',
    backlogType: 'Hard',
    notes: 'Priorizar build de Sandevistan y katana.',
  },
  {
    title: 'Red Dead Redemption',
    igdbId: 103298,
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co7dhn.jpg',
    igdbGenres: ['Shooter', 'Adventure'],
    customTags: ['Accion', 'Mundo Abierto', 'Aventura'],
    releaseYear: 2010,
    status: 'backlog',
    backlogType: 'Hard',
    notes: 'https://www.blizzboygames.net',
  },
];

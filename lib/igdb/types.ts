export interface IGDBGameVideo {
  id: number;
  name: string;
  video_id: string; // YouTube video ID
}

export interface IGDBGame {
  id: number;
  name: string;
  summary?: string;
  storyline?: string;
  first_release_date?: number;
  cover?: {
    id: number;
    url: string;
    image_id?: string;
  };
  genres?: Array<{
    id: number;
    name: string;
    slug?: string;
  }>;
  themes?: Array<{
    id: number;
    name: string;
  }>;
  videos?: IGDBGameVideo[];
  similar_games?: number[];
  rating?: number;
  rating_count?: number;
  total_rating?: number;
  total_rating_count?: number;
  hypes?: number;
}

export interface GameVideoInfo {
  name: string;
  youtubeId: string;
  type: 'trailer' | 'gameplay' | 'other';
}

export interface NormalizedGame {
  igdbId: number;
  title: string;
  summary: string;
  coverUrl: string;
  genres: string[];
  releaseYear?: number;
  rating?: number;
  ratingCount?: number;
  totalRating?: number;
  totalRatingCount?: number;
  hypes?: number;
  videos?: GameVideoInfo[];
  similarGames?: number[];
}

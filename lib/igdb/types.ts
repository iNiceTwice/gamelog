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
  similar_games?: number[];
  rating?: number;
}

export interface NormalizedGame {
  igdbId: number;
  title: string;
  summary: string;
  coverUrl: string;
  genres: string[];
  releaseYear?: number;
  rating?: number;
}

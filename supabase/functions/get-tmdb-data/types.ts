
export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  genre_ids: number[];
  vote_average: number;
  popularity: number;
}

export interface TmdbMovieDetail extends TmdbMovie {
  genres: { id: number; name: string }[];
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbDiscoverResponse {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
}

// This is the shape of the movie object we return from our edge function
export interface AppMovie {
    id: number;
    title: string;
    description: string;
    posterUrl?: string;
    year?: number;
    genres: { id: number; name: string }[];
    vote_average: number;
}

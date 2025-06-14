
export interface TmdbGenre {
  id: number;
  name: string;
}

export interface Movie {
  id: number; // TMDB movie ID
  title: string;
  description: string;
  genres?: { id: number; name: string }[]; // Changed from category_id and category_name
  posterUrl?: string; // Full URL for the movie poster
  year?: number; // Release year
  vote_average?: number; // TMDB rating out of 10
}

// Category type for the filter component.
export type AppCategory = TmdbGenre;

// This specific type will be used by the filter state and callbacks, representing an array of genre IDs.
export type SelectedCategoryType = number[];

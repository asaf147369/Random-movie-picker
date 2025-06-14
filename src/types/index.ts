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
}

// Category type for the filter component. "All" is a special case.
// The CategoryFilter will receive an array of TmdbGenre, plus a synthetic "All" entry.
export type AppCategory = TmdbGenre | { id: "All"; name: "All" };

// This specific type will be used by the filter state and callbacks
export type SelectedCategoryType = number | "All";

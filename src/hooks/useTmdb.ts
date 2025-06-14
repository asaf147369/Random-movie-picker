
import { useQuery, QueryFunctionContext } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Movie, TmdbGenre, SelectedCategoryType } from '@/types';

// Define specific QueryKey types for better type safety
type GenresQueryKey = readonly ['tmdb', 'getGenres', undefined];
type MoviesQueryKey = readonly ['tmdb', 'getMovies', SelectedCategoryType];
type MovieByIdQueryKey = readonly ['tmdb', 'getMovieById', string | null];
type AppQueryKey = GenresQueryKey | MoviesQueryKey | MovieByIdQueryKey;

// Centralized data fetching function
const fetchTmdbData = async (context: QueryFunctionContext<AppQueryKey>) => {
  const { queryKey } = context;
  const [_key, action, param] = queryKey;
  
  let queryString = `action=${action}`;
  if (action === "getMovies") {
    if (typeof param === 'number') {
      queryString += `&genreId=${param}`;
    }
  } else if (action === "getMovieById" && typeof param === 'string') {
    queryString += `&movieId=${param}`;
  }

  const { data, error } = await supabase.functions.invoke('get-tmdb-data', {
    body: { queryString },
  });

  if (error) {
    console.error(`Error fetching ${action}:`, error);
    throw new Error(error.message);
  }
  return data;
};

// Hook to fetch genres
export const useGenres = () => {
    return useQuery<TmdbGenre[], Error, TmdbGenre[], GenresQueryKey>({
        queryKey: ['tmdb', 'getGenres', undefined],
        queryFn: fetchTmdbData,
        staleTime: Infinity,
    });
};

// Hook to fetch a list of movies by category, with manual refetching
export const useMovies = (selectedCategory: SelectedCategoryType) => {
    return useQuery<Movie[], Error, Movie[], MoviesQueryKey>({
        queryKey: ['tmdb', 'getMovies', selectedCategory],
        queryFn: fetchTmdbData,
        enabled: false, // Will be triggered manually
    });
};

// Hook to fetch a single movie by its ID
export const useMovieById = (movieId: string | null) => {
    return useQuery<Movie, Error, Movie, MovieByIdQueryKey>({
        queryKey: ['tmdb', 'getMovieById', movieId],
        queryFn: fetchTmdbData,
        enabled: !!movieId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false,
    });
};

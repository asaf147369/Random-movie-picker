import { useQuery, QueryFunctionContext } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Movie, TmdbGenre, SelectedCategoryType } from '@/types';

// Define specific QueryKey types for better type safety
type GenresQueryKey = readonly ['tmdb', 'getGenres', undefined];
type MoviesQueryKey = readonly ['tmdb', 'getMovies', SelectedCategoryType, number];
type AppQueryKey = GenresQueryKey | MoviesQueryKey;

// Centralized data fetching function
const fetchTmdbData = async (context: QueryFunctionContext<AppQueryKey>) => {
  const { queryKey } = context;
  const [_key, action, ...params] = queryKey;
  
  let queryString = `action=${action}`;
  if (action === "getMovies") {
    const [genreIds, ratingThreshold] = params as [SelectedCategoryType, number];
    if (genreIds.length > 0) {
      queryString += `&genreIds=${genreIds.join(',')}`;
    }
    if (ratingThreshold > 0) {
      queryString += `&ratingGte=${ratingThreshold}`;
    }
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
export const useMovies = (selectedCategory: SelectedCategoryType, ratingThreshold: number) => {
    return useQuery<Movie[], Error, Movie[], MoviesQueryKey>({
        queryKey: ['tmdb', 'getMovies', selectedCategory, ratingThreshold],
        queryFn: fetchTmdbData,
        enabled: false, // Will be triggered manually
    });
};

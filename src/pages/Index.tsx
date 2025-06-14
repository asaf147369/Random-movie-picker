import React, { useState, useEffect } from 'react';
import MovieCard from '@/components/MovieCard';
import CategoryFilter from '@/components/CategoryFilter';
import { Button } from '@/components/ui/button';
import { Movie, TmdbGenre, AppCategory, SelectedCategoryType } from '@/types';
import { Shuffle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { QueryFunctionContext, QueryKey, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";

// Define specific QueryKey types for better type safety and compatibility with useQuery
type GenresQueryKey = readonly ['tmdb', 'getGenres', undefined];
type MoviesQueryKey = readonly ['tmdb', 'getMovies', SelectedCategoryType];
// Create a union type for the queryKey parameter of fetchTmdbData
type AppQueryKey = GenresQueryKey | MoviesQueryKey;

// Updated fetchTmdbData function
const fetchTmdbData = async (context: QueryFunctionContext<AppQueryKey>) => {
  const { queryKey } = context;
  const [_key, action, param] = queryKey; // param is SelectedCategoryType for 'getMovies', undefined for 'getGenres'
  
  let queryString = `action=${action}`;
  // Only add genreId if it's a specific numeric genre for 'getMovies'
  // If param is "All" or undefined for 'getMovies', no genreId is added.
  // The edge function handles 'no genreId' as fetching popular/all movies.
  if (action === "getMovies" && typeof param === 'number') {
    queryString += `&genreId=${param}`;
  }

  // Supabase function invocation remains the same
  const { data, error } = await supabase.functions.invoke('get-tmdb-data', {
    body: { queryString },
  });

  if (error) {
    console.error(`Error fetching ${action}:`, error);
    toast.error(`Failed to fetch ${action === 'getGenres' ? 'categories' : 'movies'}. ${error.message}`);
    throw new Error(error.message);
  }
  // 'data' from invoke is 'any'. useQuery's TData generic will type it for the consumer.
  return data;
};


const Index = () => {
  const queryClient = useQueryClient();
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategoryType>("All");

  // Updated useQuery for genres with explicit generic arguments
  // useQuery<TQueryFnData, TError, TData, TQueryKey>
  // TQueryFnData is 'any' because fetchTmdbData returns supabase.functions.invoke().data which is 'any'
  // TData is TmdbGenre[] which is the type we want for `genres`
  const { data: genres, isLoading: isLoadingGenres } = useQuery<any, Error, TmdbGenre[], GenresQueryKey>({
    queryKey: ['tmdb', 'getGenres', undefined],
    queryFn: fetchTmdbData,
    staleTime: Infinity, // Genres don't change often
  });

  // Updated useQuery for movies with explicit generic arguments
  const { data: movies, isLoading: isLoadingMovies, isError: isMoviesError, error: moviesError, refetch: fetchMoviesForCategory } = useQuery<any, Error, Movie[], MoviesQueryKey>({
    queryKey: ['tmdb', 'getMovies', selectedCategory],
    queryFn: fetchTmdbData,
    enabled: false, // Don't fetch immediately; wait for category selection or button click
    onSuccess: (data: Movie[]) => { // data is now correctly typed as Movie[]
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setCurrentMovie(data[randomIndex]);
        // Optional: toast.success("Fetched new movies and picked one!");
      } else {
        setCurrentMovie(null);
        if (selectedCategory !== "All") {
            toast.info(`No movies found for '${displayCategories.find(c=>c.id === selectedCategory)?.name || 'this category'}'. Try "All" or another category!`);
        } else {
            toast.info(`No movies found. Please try again later.`);
        }
      }
    },
    onError: (error: Error) => {
        setCurrentMovie(null); // Clear movie on error
        toast.error(`Failed to fetch movies: ${error.message}`);
    }
  });
  
  useEffect(() => {
    // Fetch movies when the selected category changes or when genres are loaded for the first time.
    // This ensures that fetchMoviesForCategory is called which then triggers onSuccess/onError.
    if (genres || selectedCategory) { // Fetch if genres are loaded OR if a category is selected (even if genres are still loading, for "All")
        fetchMoviesForCategory();
    }
  }, [selectedCategory, genres, fetchMoviesForCategory]);


  const handleGetRandomMovie = () => {
    // movies should now be correctly typed as Movie[] | undefined
    if (movies && movies.length > 0 && !isLoadingMovies) {
      const randomIndex = Math.floor(Math.random() * movies.length);
      setCurrentMovie(movies[randomIndex]);
      toast.success("Found a random movie!");
    } else {
      fetchMoviesForCategory(); 
    }
  };

  const handleSelectCategory = (categoryId: SelectedCategoryType) => {
    setSelectedCategory(categoryId);
  };
  
  const displayCategories: AppCategory[] = genres ? [{ id: "All", name: "All" }, ...genres] : [{ id: "All", name: "All" }];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 sm:p-8 transition-colors duration-300">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold mb-3 tracking-tight" style={{ color: 'hsl(var(--app-accent))' }}>
          Random Movie Night
        </h1>
        <p className="text-xl text-muted-foreground">
          Powered by TMDB. Can't decide what to watch? Let us pick for you!
        </p>
      </header>

      <main className="w-full max-w-4xl flex flex-col items-center space-y-8">
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 mb-6">
          <CategoryFilter
            categories={displayCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            isLoading={isLoadingGenres}
          />
          <Button 
            onClick={handleGetRandomMovie} 
            className="bg-[hsl(var(--app-accent))] text-accent-foreground hover:bg-[hsl(var(--app-accent))]/90 px-8 py-6 text-lg font-semibold shadow-lg transform transition-transform duration-150 hover:scale-105"
            disabled={isLoadingMovies || isLoadingGenres}
          >
            <Shuffle size={20} className="mr-2" />
            {isLoadingMovies && !currentMovie ? 'Finding Movie...' : 'Get Random Movie'}
          </Button>
        </div>
        
        <div className="w-full flex justify-center">
          <MovieCard movie={currentMovie} isLoading={isLoadingMovies && !currentMovie && !isMoviesError} />
        </div>
      </main>

      <footer className="mt-16 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Movie Picker. All rights reserved (sort of).</p>
        <p>Powered by Randomness, React, and The Movie Database API.</p>
      </footer>
    </div>
  );
};

export default Index;

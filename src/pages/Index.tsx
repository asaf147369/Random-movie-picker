import React, { useState, useEffect, useMemo } from 'react';
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
  if (action === "getMovies" && typeof param === 'number') {
    queryString += `&genreId=${param}`;
  }

  const { data, error } = await supabase.functions.invoke('get-tmdb-data', {
    body: { queryString },
  });

  if (error) {
    console.error(`Error fetching ${action}:`, error);
    // Toast for error is handled in useQuery's onError or useEffect for more specific context
    throw new Error(error.message);
  }
  return data;
};


const Index = () => {
  const queryClient = useQueryClient();
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategoryType>("All");
  
  const { data: genres, isLoading: isLoadingGenres, isError: isGenresError, error: genresError } = useQuery<TmdbGenre[], Error, TmdbGenre[], GenresQueryKey>({
    queryKey: ['tmdb', 'getGenres', undefined],
    queryFn: fetchTmdbData,
    staleTime: Infinity,
    // onSuccess and onError are removed as per React Query v5 practices
    // Error handling will be done in a useEffect hook below
    // Successful data caching is handled automatically by React Query
  });

  // useEffect for handling genre query errors
  useEffect(() => {
    if (isGenresError && genresError) {
      toast.error(`Failed to fetch categories: ${genresError.message}`);
    }
  }, [isGenresError, genresError]);
  
  // displayCategories is now derived directly from the 'genres' state from useQuery.
  // This makes it reactive and simplifies updates.
  const displayCategories: AppCategory[] = useMemo(() => {
    return genres ? [{ id: "All", name: "All" }, ...genres] : [{ id: "All", name: "All" }];
  }, [genres]);

  const { data: movies, isLoading: isLoadingMovies, isError: isMoviesError, error: moviesError, refetch: fetchMoviesForCategory } = useQuery<Movie[], Error, Movie[], MoviesQueryKey>({
    queryKey: ['tmdb', 'getMovies', selectedCategory],
    queryFn: fetchTmdbData,
    enabled: false, 
  });
  
  useEffect(() => {
    // Fetch movies when the selected category changes.
    // `genres` being loaded isn't strictly necessary to trigger movie fetch for "All" or if genres are already cached.
    // `fetchMoviesForCategory` is stable, so selectedCategory is the main trigger.
    if (selectedCategory) {
        console.log(`Category changed to: ${selectedCategory}. Fetching movies.`);
        fetchMoviesForCategory();
    }
  }, [selectedCategory, fetchMoviesForCategory]);

  useEffect(() => {
    // This useEffect handles the results of the movie fetch operation
    if (isLoadingMovies) {
        console.log("Movies are loading...");
        return; // Don't process if still loading
    }

    if (isMoviesError && moviesError) {
      console.error("Error fetching movies:", moviesError);
      setCurrentMovie(null);
      toast.error(`Failed to fetch movies: ${moviesError.message}`);
    } else if (movies !== undefined) { // movies can be an empty array, so check for undefined
      console.log("Movies data received:", movies);
      if (movies.length > 0) {
        const randomIndex = Math.floor(Math.random() * movies.length);
        setCurrentMovie(movies[randomIndex]);
        // toast.success("Fetched new movies and picked one!"); // Potentially too noisy
      } else {
        setCurrentMovie(null);
        const categoryName = displayCategories.find(c => c.id === selectedCategory)?.name || (typeof selectedCategory === 'number' ? 'this category' : 'All');
        if (selectedCategory !== "All") {
            toast.info(`No movies found for '${categoryName}'. Try "All" or another category!`);
        } else {
            toast.info(`No movies found. Please try again later or select a specific category.`);
        }
      }
    }
  }, [movies, isLoadingMovies, isMoviesError, moviesError, selectedCategory, displayCategories]);


  const handleGetRandomMovie = () => {
    console.log("Handle get random movie clicked.");
    if (movies && movies.length > 0 && !isLoadingMovies) {
      console.log("Picking from existing movie list.");
      const randomIndex = Math.floor(Math.random() * movies.length);
      setCurrentMovie(movies[randomIndex]);
      toast.success("Found a random movie from the current list!");
    } else {
      console.log("No movies in list or still loading, re-fetching.");
      fetchMoviesForCategory(); 
    }
  };

  const handleSelectCategory = (categoryId: SelectedCategoryType) => {
    console.log("Category selected:", categoryId);
    setCurrentMovie(null); // Clear current movie when category changes
    setSelectedCategory(categoryId);
  };
  
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
            {(isLoadingMovies && !currentMovie) ? 'Finding Movie...' : 'Get Another Movie'}
          </Button>
        </div>
        
        <div className="w-full flex justify-center">
          <MovieCard movie={currentMovie} isLoading={(isLoadingMovies && !currentMovie && !isMoviesError)} />
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

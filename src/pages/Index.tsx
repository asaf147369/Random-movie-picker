import React, { useState, useEffect, useMemo } from 'react';
import MovieCard from '@/components/MovieCard';
import CategoryFilter from '@/components/CategoryFilter';
import { Button } from '@/components/ui/button';
import { Movie, TmdbGenre, AppCategory, SelectedCategoryType } from '@/types';
import { Shuffle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { QueryFunctionContext, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";
import { useSearchParams } from 'react-router-dom';

// Define specific QueryKey types for better type safety and compatibility with useQuery
type GenresQueryKey = readonly ['tmdb', 'getGenres', undefined];
type MoviesQueryKey = readonly ['tmdb', 'getMovies', SelectedCategoryType];
type MovieByIdQueryKey = readonly ['tmdb', 'getMovieById', string | null];
// Create a union type for the queryKey parameter of fetchTmdbData
type AppQueryKey = GenresQueryKey | MoviesQueryKey | MovieByIdQueryKey;

// Updated fetchTmdbData function
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
    // Toast for error is handled in useQuery's onError or useEffect for more specific context
    throw new Error(error.message);
  }
  return data;
};

const MAX_PICKS_PER_PAGE = 5;

const Index = () => {
  const queryClient = useQueryClient();
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategoryType>("All");
  const [searchParams, setSearchParams] = useSearchParams();
  const movieIdFromUrl = searchParams.get('movie');
  
  const [moviesShownFromCurrentPageCount, setMoviesShownFromCurrentPageCount] = useState(0);
  const [shownMovieIdsFromCurrentPage, setShownMovieIdsFromCurrentPage] = useState<number[]>([]);

  const { data: genres, isLoading: isLoadingGenres, isError: isGenresError, error: genresError } = useQuery<TmdbGenre[], Error, TmdbGenre[], GenresQueryKey>({
    queryKey: ['tmdb', 'getGenres', undefined],
    queryFn: fetchTmdbData,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (isGenresError && genresError) {
      toast.error(`Failed to fetch categories: ${genresError.message}`);
    }
  }, [isGenresError, genresError]);
  
  const displayCategories: AppCategory[] = useMemo(() => {
    return genres ? [{ id: "All", name: "All" }, ...genres] : [{ id: "All", name: "All" }];
  }, [genres]);

  const { data: movieFromUrl, isLoading: isLoadingMovieFromUrl, isError: isMovieFromUrlError, error: movieFromUrlError } = useQuery<Movie, Error, Movie, MovieByIdQueryKey>({
    queryKey: ['tmdb', 'getMovieById', movieIdFromUrl],
    queryFn: fetchTmdbData,
    enabled: !!movieIdFromUrl,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  useEffect(() => {
    if (movieFromUrl) {
      setCurrentMovie(movieFromUrl);
    }
  }, [movieFromUrl]);

  useEffect(() => {
    if (isMovieFromUrlError) {
      toast.error(`Movie not found or failed to load. Please try another!`);
      setSearchParams({}, { replace: true });
    }
  }, [isMovieFromUrlError, movieFromUrlError, setSearchParams]);

  const { data: movies, isLoading: isLoadingMovies, isError: isMoviesError, error: moviesError, refetch: fetchMoviesForCategory } = useQuery<Movie[], Error, Movie[], MoviesQueryKey>({
    queryKey: ['tmdb', 'getMovies', selectedCategory],
    queryFn: fetchTmdbData,
    enabled: false, 
  });
  
  useEffect(() => {
    if (selectedCategory && !movieIdFromUrl) {
        console.log(`Category changed to: ${selectedCategory}. Fetching movies.`);
        setMoviesShownFromCurrentPageCount(0);
        setShownMovieIdsFromCurrentPage([]);
        fetchMoviesForCategory();
    }
  }, [selectedCategory, fetchMoviesForCategory, movieIdFromUrl]);

  useEffect(() => {
    if (currentMovie && String(currentMovie.id) !== movieIdFromUrl) {
      setSearchParams({ movie: String(currentMovie.id) }, { replace: true });
    }
  }, [currentMovie, movieIdFromUrl, setSearchParams]);

  useEffect(() => {
    if (isLoadingMovies || isLoadingMovieFromUrl) {
        console.log("Movies are loading...");
        return; 
    }
    
    if (isMoviesError && moviesError) {
      console.error("Error fetching movies:", moviesError);
      setCurrentMovie(null);
      setMoviesShownFromCurrentPageCount(0); // Reset on error
      setShownMovieIdsFromCurrentPage([]);   // Reset on error
      toast.error(`Failed to fetch movies: ${moviesError.message}`);
    } else if (movies !== undefined && !movieFromUrl) { 
      console.log("Movies data received:", movies);
      setMoviesShownFromCurrentPageCount(0); // Reset counter for new batch
      setShownMovieIdsFromCurrentPage([]);   // Reset shown IDs for new batch

      if (movies.length > 0) {
        const randomIndex = Math.floor(Math.random() * movies.length);
        const firstMovie = movies[randomIndex];
        setCurrentMovie(firstMovie);
        setShownMovieIdsFromCurrentPage([firstMovie.id]);
        setMoviesShownFromCurrentPageCount(1);
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
  }, [movies, isLoadingMovies, isMoviesError, moviesError, selectedCategory, displayCategories, movieFromUrl, isLoadingMovieFromUrl]);


  const handleGetRandomMovie = () => {
    console.log("Handle get random movie clicked.");

    // If a movie was loaded from URL, this button should now fetch a random list.
    if (movieIdFromUrl) {
        setSearchParams({}, {replace: true});
        fetchMoviesForCategory();
        return;
    }

    if (isLoadingMovies || !movies) {
      console.log("Movies loading or no data, re-fetching.");
      fetchMoviesForCategory();
      return;
    }
  
    if (movies.length === 0) {
      console.log("No movies in list (current batch is empty), re-fetching.");
      fetchMoviesForCategory(); // Attempt to get new movies
      return;
    }

    const availableMoviesFromCurrentBatch = movies.filter(movie => !shownMovieIdsFromCurrentPage.includes(movie.id));

    if (moviesShownFromCurrentPageCount < MAX_PICKS_PER_PAGE && availableMoviesFromCurrentBatch.length > 0) {
      console.log(`Picking from existing movie list (count: ${moviesShownFromCurrentPageCount + 1}/${MAX_PICKS_PER_PAGE}).`);
      const randomIndex = Math.floor(Math.random() * availableMoviesFromCurrentBatch.length);
      const newMovie = availableMoviesFromCurrentBatch[randomIndex];
      setCurrentMovie(newMovie);
      setShownMovieIdsFromCurrentPage(prevIds => [...prevIds, newMovie.id]);
      setMoviesShownFromCurrentPageCount(prevCount => prevCount + 1);
      toast.success("Found another movie from the current batch!");
    } else {
      console.log(`Max picks (${MAX_PICKS_PER_PAGE}) reached or no new movies in current batch. Fetching new page.`);
      // Resetting counters will be handled by the useEffect when new movies data arrives from fetchMoviesForCategory
      fetchMoviesForCategory(); 
    }
  };

  const handleSelectCategory = (categoryId: SelectedCategoryType) => {
    console.log("Category selected:", categoryId);
    if (movieIdFromUrl) {
        setSearchParams({}, { replace: true });
    }
    setCurrentMovie(null); 
    setMoviesShownFromCurrentPageCount(0); // Reset for new category
    setShownMovieIdsFromCurrentPage([]);   // Reset for new category
    setSelectedCategory(categoryId);
    // fetchMoviesForCategory will be called by the useEffect watching selectedCategory
  };

  const isLoading = isLoadingMovies || isLoadingGenres || isLoadingMovieFromUrl;
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-background text-foreground p-4 sm:p-8 transition-colors duration-300">
      <header className="w-full mt-8 mb-10 text-center">
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
            disabled={isLoading}
          >
            <Shuffle size={20} className="mr-2" />
            {isLoading && !currentMovie ? 'Finding Movie...' : 'Get Another Movie'}
          </Button>
        </div>
        
        <div className="w-full flex justify-center">
          <MovieCard movie={currentMovie} isLoading={isLoading && !currentMovie && !isMovieFromUrlError} />
        </div>
      </main>

      <footer className="w-full mb-8 mt-16 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Movie Picker. All rights reserved (sort of).</p>
        <p>Powered by Randomness, React, and The Movie Database API.</p>
      </footer>
    </div>
  );
};

export default Index;

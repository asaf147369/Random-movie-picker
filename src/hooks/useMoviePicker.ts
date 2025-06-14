import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useGenres, useMovies, useMovieById } from './useTmdb';
import { Movie, SelectedCategoryType, AppCategory } from '@/types';

const MAX_PICKS_PER_PAGE = 5;

export const useMoviePicker = () => {
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategoryType>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const movieIdFromUrl = searchParams.get('movie');

  const [moviesShownFromCurrentPageCount, setMoviesShownFromCurrentPageCount] = useState(0);
  const [shownMovieIdsFromCurrentPage, setShownMovieIdsFromCurrentPage] = useState<number[]>([]);

  // Data fetching hooks
  const { data: genres, isLoading: isLoadingGenres, isError: isGenresError, error: genresError } = useGenres();
  const { data: movieFromUrl, isLoading: isLoadingMovieFromUrl, isError: isMovieFromUrlError, error: movieFromUrlError } = useMovieById(movieIdFromUrl);
  const { data: movies, isLoading: isLoadingMovies, isError: isMoviesError, error: moviesError, refetch: fetchMoviesForCategory } = useMovies(selectedCategory);

  const displayCategories: AppCategory[] = useMemo(() => {
    return genres ? [...genres] : [];
  }, [genres]);

  // Effect for handling errors
  useEffect(() => {
    if (isGenresError && genresError) {
      toast.error(`Failed to fetch categories: ${genresError.message}`);
    }
  }, [isGenresError, genresError]);

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

  useEffect(() => {
    if (!movieIdFromUrl) {
      console.log(`Category changed to: ${JSON.stringify(selectedCategory)}. Fetching movies.`);
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
      setMoviesShownFromCurrentPageCount(0);
      setShownMovieIdsFromCurrentPage([]);
      toast.error(`Failed to fetch movies: ${moviesError.message}`);
    } else if (movies !== undefined && !movieFromUrl) {
      console.log("Movies data received:", movies);
      setMoviesShownFromCurrentPageCount(0);
      setShownMovieIdsFromCurrentPage([]);

      if (movies.length > 0) {
        const randomIndex = Math.floor(Math.random() * movies.length);
        const firstMovie = movies[randomIndex];
        setCurrentMovie(firstMovie);
        setShownMovieIdsFromCurrentPage([firstMovie.id]);
        setMoviesShownFromCurrentPageCount(1);
      } else {
        setCurrentMovie(null);
        let categoryName = 'the current selection';
        if (selectedCategory.length > 0 && displayCategories.length > 0) {
            categoryName = `'${displayCategories
                .filter(c => selectedCategory.includes(c.id))
                .map(c => c.name)
                .join(', ')}'`;
        }
        toast.info(`No movies found for ${categoryName}. Try another combination!`);
      }
    }
  }, [movies, isLoadingMovies, isMoviesError, moviesError, selectedCategory, displayCategories, movieFromUrl, isLoadingMovieFromUrl]);

  const handleGetRandomMovie = () => {
    console.log("Handle get random movie clicked.");
    if (movieIdFromUrl) {
        setCurrentMovie(null);
        setSearchParams({}, {replace: true});
        return;
    }

    if (isLoadingMovies || !movies) {
      fetchMoviesForCategory();
      return;
    }
  
    const availableMoviesFromCurrentBatch = movies.filter(movie => !shownMovieIdsFromCurrentPage.includes(movie.id));

    if (movies.length > 0 && moviesShownFromCurrentPageCount < MAX_PICKS_PER_PAGE && availableMoviesFromCurrentBatch.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableMoviesFromCurrentBatch.length);
      const newMovie = availableMoviesFromCurrentBatch[randomIndex];
      setCurrentMovie(newMovie);
      setShownMovieIdsFromCurrentPage(prevIds => [...prevIds, newMovie.id]);
      setMoviesShownFromCurrentPageCount(prevCount => prevCount + 1);
      toast.success("Found another movie from the current batch!");
    } else {
      fetchMoviesForCategory(); 
    }
  };
  
  const handleApplyFilter = (genreIds: SelectedCategoryType) => {
    console.log("Applying category filter with selection:", genreIds);
    if (movieIdFromUrl) {
        setSearchParams({}, { replace: true });
    }
    setCurrentMovie(null); 
    setSelectedCategory(genreIds);
  };
  
  const isLoading = isLoadingMovies || isLoadingGenres || isLoadingMovieFromUrl;

  return {
    currentMovie,
    selectedCategory,
    displayCategories,
    isLoading,
    isLoadingGenres,
    isMovieFromUrlError,
    handleGetRandomMovie,
    handleApplyFilter,
  };
};


import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useGenres, useMovies } from './useTmdb';
import { Movie, SelectedCategoryType, AppCategory } from '@/types';

export const useMoviePicker = () => {
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategoryType>([]);
  const [ratingThreshold, setRatingThreshold] = useState<number>(0);

  // Data fetching hooks
  const { data: genres, isLoading: isLoadingGenres, isError: isGenresError, error: genresError } = useGenres();
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
    if (isLoadingMovies) {
        console.log("Movies are loading...");
        return; 
    }
    
    if (isMoviesError && moviesError) {
      console.error("Error fetching movies:", moviesError);
      setCurrentMovie(null);
      toast.error(`Failed to fetch movies: ${moviesError.message}`);
    } else if (movies !== undefined) {
      console.log("Movies data received:", movies);
      
      const filteredMovies = movies.filter(m => m.vote_average !== undefined && m.vote_average >= ratingThreshold);

      if (filteredMovies.length > 0) {
        const randomIndex = Math.floor(Math.random() * filteredMovies.length);
        const newMovie = filteredMovies[randomIndex];
        setCurrentMovie(newMovie);
      } else {
        setCurrentMovie(null);
        let categoryName = 'the current selection';
        if (selectedCategory.length > 0 && displayCategories.length > 0) {
            categoryName = `'${displayCategories
                .filter(c => selectedCategory.includes(c.id))
                .map(c => c.name)
                .join(', ')}'`;
        }
        toast.info(`No movies found for ${categoryName} with a rating of ${ratingThreshold.toFixed(1)} or higher. Try different filters!`);
      }
    }
  }, [movies, isLoadingMovies, isMoviesError, moviesError, selectedCategory, displayCategories, ratingThreshold]);

  const handleGetRandomMovie = () => {
    console.log("Handle get random movie clicked. Fetching movies...");
    fetchMoviesForCategory();
  };
  
  const handleApplyFilter = (genreIds: SelectedCategoryType) => {
    console.log("Applying category filter with selection:", genreIds);
    setSelectedCategory(genreIds);
  };

  const handleRatingChange = (value: number) => {
    setRatingThreshold(value);
  }
  
  const isLoading = isLoadingMovies;

  return {
    currentMovie,
    selectedCategory,
    ratingThreshold,
    displayCategories,
    isLoading,
    isLoadingGenres,
    handleGetRandomMovie,
    handleApplyFilter,
    handleRatingChange,
  };
};


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
  const { isFetching: isFetchingMovies, refetch: fetchMoviesForCategory } = useMovies(selectedCategory);

  const displayCategories: AppCategory[] = useMemo(() => {
    return genres ? [...genres] : [];
  }, [genres]);

  // Effect for handling errors
  useEffect(() => {
    if (isGenresError && genresError) {
      toast.error(`Failed to fetch categories: ${genresError.message}`);
    }
  }, [isGenresError, genresError]);
  
  const handleGetRandomMovie = () => {
    console.log("Handle get random movie clicked. Fetching movies...");
    fetchMoviesForCategory().then(queryResult => {
      if (queryResult.isSuccess && queryResult.data) {
        const fetchedMovies = queryResult.data;
        const filteredMovies = fetchedMovies.filter(m => m.vote_average !== undefined && m.vote_average >= ratingThreshold);

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
      } else if (queryResult.isError) {
          console.error("Error fetching movies:", queryResult.error);
          setCurrentMovie(null);
          toast.error(`Failed to fetch movies: ${queryResult.error.message}`);
      }
    });
  };
  
  const handleApplyFilter = (genreIds: SelectedCategoryType) => {
    console.log("Applying category filter with selection:", genreIds);
    setSelectedCategory(genreIds);
  };

  const handleRatingChange = (value: number) => {
    setRatingThreshold(value);
  }
  
  const isLoading = isFetchingMovies;

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

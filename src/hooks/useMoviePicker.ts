
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useGenres, useMovies } from './useTmdb';
import { Movie, SelectedCategoryType, AppCategory } from '@/types';

export const useMoviePicker = () => {
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategoryType>([]);
  const [ratingThreshold, setRatingThreshold] = useState<number>(0);
  const [onlyThisYear, setOnlyThisYear] = useState<boolean>(false);
  const [isFindingMovie, setIsFindingMovie] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Data fetching hooks
  const { data: genres, isLoading: isLoadingGenres, isError: isGenresError, error: genresError } = useGenres();
  const { isFetching: isFetchingMovies, refetch: fetchMoviesForCategory } = useMovies(selectedCategory, ratingThreshold, onlyThisYear);

  const displayCategories: AppCategory[] = useMemo(() => {
    return genres ? [...genres] : [];
  }, [genres]);

  // Effect for handling errors
  useEffect(() => {
    if (isGenresError && genresError) {
      toast.error(`Failed to fetch categories: ${genresError.message}`);
    }
  }, [isGenresError, genresError]);
  
  const handleGetRandomMovie = async () => {
    setHasSearched(true);
    console.log("Handle get random movie clicked. Attempting to find a suitable movie with current filters...");
    setIsFindingMovie(true);
    setCurrentMovie(null); // Clear movie to show loader

    let foundMovie: Movie | null = null;
    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      console.log(`Attempt ${attempt} of ${MAX_ATTEMPTS} to find a movie...`);
      const queryResult = await fetchMoviesForCategory();

      if (queryResult.isSuccess && queryResult.data) {
        const fetchedMovies = queryResult.data;
        console.log(`Fetched ${fetchedMovies.length} movies matching filters in attempt ${attempt}.`);
        
        if (fetchedMovies.length > 0) {
          const randomIndex = Math.floor(Math.random() * fetchedMovies.length);
          foundMovie = fetchedMovies[randomIndex];
          break; // Exit loop if a movie is found
        }
      } else if (queryResult.isError) {
        console.error("Error fetching movies:", queryResult.error);
        toast.error(`Failed to fetch movies: ${queryResult.error.message}`);
        break; // Stop retrying on a network error
      }
    }

    if (foundMovie) {
      setCurrentMovie(foundMovie);
    } else {
      let categoryName = 'the current selection';
      if (selectedCategory.length > 0 && displayCategories.length > 0) {
          categoryName = `'${displayCategories
              .filter(c => selectedCategory.includes(c.id))
              .map(c => c.name)
              .join(', ')}'`;
      }
      toast.info(`Could not find a movie for ${categoryName} with rating >= ${ratingThreshold.toFixed(1)} after ${MAX_ATTEMPTS} attempts. Try different filters!`);
    }
    
    setIsFindingMovie(false);
  };
  
  const handleApplyFilter = (genreIds: SelectedCategoryType) => {
    console.log("Applying category filter with selection:", genreIds);
    setSelectedCategory(genreIds);
  };

  const handleRatingChange = (value: number) => {
    setRatingThreshold(value);
  }

  const handleOnlyThisYearChange = (checked: boolean) => {
    console.log("Toggling 'Only This Year' filter to:", checked);
    setOnlyThisYear(checked);
  };
  
  const isLoading = isFetchingMovies || isFindingMovie;

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
    hasSearched,
    onlyThisYear,
    handleOnlyThisYearChange,
  };
};

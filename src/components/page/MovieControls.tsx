
import React from 'react';
import CategoryFilter from '@/components/CategoryFilter';
import { Button } from '@/components/ui/button';
import { AppCategory, SelectedCategoryType, Movie } from '@/types';
import { Shuffle } from 'lucide-react';
import RatingFilter from '@/components/RatingFilter';

interface MovieControlsProps {
  categories: AppCategory[];
  selectedCategory: SelectedCategoryType;
  ratingThreshold: number;
  onApplyFilter: (categoryIds: number[]) => void;
  onRatingChange: (value: number) => void;
  onGetRandomMovie: () => void;
  isLoading: boolean;
  isLoadingGenres: boolean;
  currentMovie: Movie | null;
}

const MovieControls: React.FC<MovieControlsProps> = ({
  categories,
  selectedCategory,
  ratingThreshold,
  onApplyFilter,
  onRatingChange,
  onGetRandomMovie,
  isLoading,
  isLoadingGenres,
  currentMovie,
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-6">
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onApplyFilter={onApplyFilter}
        isLoading={isLoadingGenres}
      />
      <RatingFilter 
        value={ratingThreshold} 
        onChange={onRatingChange}
        disabled={isLoading}
      />
      <Button
        onClick={onGetRandomMovie}
        className="bg-[hsl(var(--app-accent))] text-accent-foreground hover:bg-[hsl(var(--app-accent))]/90 px-8 py-6 text-lg font-semibold shadow-lg transform transition-transform duration-150 hover:scale-105"
        disabled={isLoading}
      >
        <Shuffle size={20} className="mr-2" />
        {isLoading && !currentMovie ? 'Finding Movie...' : 'Get a Random Movie'}
      </Button>
    </div>
  );
};

export default MovieControls;

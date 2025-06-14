
import React from 'react';
import CategoryFilter from '@/components/CategoryFilter';
import { Button } from '@/components/ui/button';
import { AppCategory, SelectedCategoryType, Movie } from '@/types';
import { Shuffle } from 'lucide-react';

interface MovieControlsProps {
  categories: AppCategory[];
  selectedCategory: SelectedCategoryType;
  onSelectCategory: (categoryId: SelectedCategoryType) => void;
  onGetRandomMovie: () => void;
  isLoading: boolean;
  isLoadingGenres: boolean;
  currentMovie: Movie | null;
}

const MovieControls: React.FC<MovieControlsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onGetRandomMovie,
  isLoading,
  isLoadingGenres,
  currentMovie,
}) => {
  return (
    <div className="w-full md:w-auto flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 mb-6">
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        isLoading={isLoadingGenres}
      />
      <Button
        onClick={onGetRandomMovie}
        className="bg-[hsl(var(--app-accent))] text-accent-foreground hover:bg-[hsl(var(--app-accent))]/90 px-8 py-6 text-lg font-semibold shadow-lg transform transition-transform duration-150 hover:scale-105"
        disabled={isLoading}
      >
        <Shuffle size={20} className="mr-2" />
        {isLoading && !currentMovie ? 'Finding Movie...' : 'Get Another Movie'}
      </Button>
    </div>
  );
};

export default MovieControls;

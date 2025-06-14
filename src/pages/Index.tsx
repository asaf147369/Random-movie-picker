
import React from 'react';
import MovieCard from '@/components/MovieCard';
import { useMoviePicker } from '@/hooks/useMoviePicker';
import Header from '@/components/page/Header';
import Footer from '@/components/page/Footer';
import MovieControls from '@/components/page/MovieControls';

const Index = () => {
  const {
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
  } = useMoviePicker();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />

      <main className="w-full max-w-7xl mx-auto flex-grow p-4 sm:p-8">
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 w-full sticky top-0 z-10 bg-background py-4">
            <MovieControls
              categories={displayCategories}
              selectedCategory={selectedCategory}
              ratingThreshold={ratingThreshold}
              onApplyFilter={handleApplyFilter}
              onRatingChange={handleRatingChange}
              onGetRandomMovie={handleGetRandomMovie}
              isLoading={isLoading}
              isLoadingGenres={isLoadingGenres}
              currentMovie={currentMovie}
              onlyThisYear={onlyThisYear}
              handleOnlyThisYearChange={handleOnlyThisYearChange}
            />
          </div>
          <div className="lg:col-span-2 w-full flex justify-center">
            <MovieCard movie={currentMovie} isLoading={isLoading && !currentMovie} hasSearched={hasSearched} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;

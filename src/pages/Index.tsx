
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
    displayCategories,
    isLoading,
    isLoadingGenres,
    isMovieFromUrlError,
    handleGetRandomMovie,
    handleSelectCategory,
  } = useMoviePicker();

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-background text-foreground p-4 sm:p-8 transition-colors duration-300">
      <Header />

      <main className="w-full max-w-4xl flex flex-col items-center space-y-8">
        <MovieControls
          categories={displayCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          onGetRandomMovie={handleGetRandomMovie}
          isLoading={isLoading}
          isLoadingGenres={isLoadingGenres}
          currentMovie={currentMovie}
        />
        
        <div className="w-full flex justify-center">
          <MovieCard movie={currentMovie} isLoading={isLoading && !currentMovie && !isMovieFromUrlError} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;

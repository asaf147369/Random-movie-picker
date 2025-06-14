
import React, { useState, useEffect } from 'react';
import MovieCard from '@/components/MovieCard';
import CategoryFilter from '@/components/CategoryFilter';
import { Button } from '@/components/ui/button';
import { sampleMovies, categories as availableCategories } from '@/data/movies';
import { Movie, Category } from '@/types';
import { Shuffle } from 'lucide-react';

const Index = () => {
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");

  const getRandomMovie = (category: Category = "All") => {
    const filteredMovies = category === "All" 
      ? sampleMovies 
      : sampleMovies.filter(movie => movie.category === category);
    
    if (filteredMovies.length === 0) {
      setCurrentMovie(null); // Or a specific message like "No movies in this category"
      console.warn(`No movies found for category: ${category}`);
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * filteredMovies.length);
    setCurrentMovie(filteredMovies[randomIndex]);
  };

  useEffect(() => {
    // Get a random movie when the component mounts or category changes
    getRandomMovie(selectedCategory);
  }, [selectedCategory]);

  const handleGetRandomMovie = () => {
    getRandomMovie(selectedCategory);
  };

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 sm:p-8 transition-colors duration-300">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold mb-3 tracking-tight" style={{ color: 'hsl(var(--app-accent))' }}>
          Random Movie Night
        </h1>
        <p className="text-xl text-muted-foreground">
          Can't decide what to watch? Let us pick for you!
        </p>
      </header>

      <main className="w-full max-w-4xl flex flex-col items-center space-y-8">
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 mb-6">
          <CategoryFilter
            categories={availableCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
          <Button 
            onClick={handleGetRandomMovie} 
            className="bg-[hsl(var(--app-accent))] text-accent-foreground hover:bg-[hsl(var(--app-accent))]/90 px-8 py-6 text-lg font-semibold shadow-lg transform transition-transform duration-150 hover:scale-105"
          >
            <Shuffle size={20} className="mr-2" />
            Get Random Movie
          </Button>
        </div>
        
        <div className="w-full flex justify-center">
          <MovieCard movie={currentMovie} />
        </div>
      </main>

      <footer className="mt-16 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Movie Picker. All rights reserved (sort of).</p>
        <p>Powered by Randomness & React.</p>
      </footer>
    </div>
  );
};

export default Index;

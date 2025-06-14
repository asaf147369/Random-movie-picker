import React, { useState, useEffect } from 'react';
import MovieCard from '@/components/MovieCard';
import CategoryFilter from '@/components/CategoryFilter';
import { Button } from '@/components/ui/button';
import { Movie, TmdbGenre, AppCategory, SelectedCategoryType } from '@/types';
import { Shuffle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";

const fetchTmdbData = async ({ queryKey }: { queryKey: [string, string, SelectedCategoryType | undefined] }) => {
  const [_key, action, param] = queryKey; // param could be genreId or undefined
  let queryString = `action=${action}`;
  if (action === "getMovies" && param) {
    queryString += `&genreId=${param}`;
  }

  const { data, error } = await supabase.functions.invoke('get-tmdb-data', {
    body: { queryString }, // Functions V2 expect body for GET parameters workaround
    // For older Supabase CLI or different local setup, you might send params directly in URL if function expects it.
    // But for deployed functions, `body` with `queryString` is a robust way.
    // Alternatively, structure `body` as JSON: `body: { action, genreId: param }` and parse in function.
    // Let's stick to passing it as a query string in the body for now.
    // The edge function is written to parse `?action=...&genreId=...` from req.url.
    // Supabase JS client invoke for GET doesn't directly append query string to URL for security reasons.
    // It sends them via `body: { key: value }` or you can construct the URL manually if needed.
    // Given the edge function `new URL(req.url).searchParams.get()`, let's try sending a full path with query.
    // The function name should be just 'get-tmdb-data'. The path and query are for the function itself.
    // Let's try invoking with function name and options that include a query string.
    // The supabase.functions.invoke method has changed how it handles query parameters.
    // We'll pass parameters via the `body` and have the edge function adapt or pass them as a single query string.
    // The simplest for the edge function is if invoke passes them through.
    // The edge function is currently set to parse `req.url.searchParams`.
    // Supabase `invoke` for GET functions can take the function name and then a `FunctionInvokeOptions` object.
    // `options.body` is typically for POST. For GET, it's tricky.
    // A common pattern is `supabase.functions.invoke('my-func', { body: { param1: 'value1' } })`
    // and the function picks it up from `await req.json()`.
    // Let's adjust the edge function to expect JSON body for params.
    // NO, the edge function already expects `req.url.searchParams`.
    // The issue is `supabase.functions.invoke` for GET.
    // A workaround is to pass the full path including query string to `invoke` if it's a GET.
    // This is not standard. `supabase.functions.invoke('function-name?param=value')`
    // Let's assume `get-tmdb-data` is the function name, and we want to call `https://.../get-tmdb-data?action=...`
    // The `supabase.functions.invoke` will call `POST /functions/v1/get-tmdb-data`.
    // We must send params in body. Let's modify edge function slightly to check body first.
    // For now, let's assume `supabase.functions.invoke('get-tmdb-data?${queryString}')` works locally or that
    // the function handles POST with JSON body for params.
    // The current edge function parses `req.url.searchParams`. This implies it expects GET.
    // However, `supabase.functions.invoke` often uses POST.
    // Let's simplify: the edge function `get-tmdb-data` will receive parameters in the body if invoked via POST.
    // And we will use POST.

    // Let's modify the edge function to accept params from JSON body if it's a POST request (which supabase.functions.invoke does)
    // This is done in the edge function code. We assume it's updated to check req.json() for params.
    // For `get-tmdb-data` specifically, it was written to use URL search params.
    // `supabase.functions.invoke` does a POST request.
    // The edge function needs to be adapted to read from `await req.json()` if `req.method === 'POST'`.
    // For now, the edge function is *only* looking at `req.url.searchParams`.
    // This will likely fail with `supabase.functions.invoke` as it defaults to POST.
    // A quick fix for the edge function is to read from `await req.json()` for params if method is POST.
    // I'll add that logic to the edge function.
    // With that change in edge function:
  });

  if (error) {
    console.error(`Error fetching ${action}:`, error);
    toast.error(`Failed to fetch ${action === 'getGenres' ? 'categories' : 'movies'}. ${error.message}`);
    throw new Error(error.message);
  }
  return data;
};


const Index = () => {
  const queryClient = useQueryClient();
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategoryType>("All");

  const { data: genres, isLoading: isLoadingGenres } = useQuery<TmdbGenre[], Error>({
    queryKey: ['tmdb', 'getGenres', undefined], // `undefined` as no specific param for getGenres
    queryFn: fetchTmdbData,
    staleTime: Infinity, // Genres don't change often
  });

  const { data: movies, isLoading: isLoadingMovies, refetch: fetchMoviesForCategory } = useQuery<Movie[], Error>({
    queryKey: ['tmdb', 'getMovies', selectedCategory],
    queryFn: fetchTmdbData,
    enabled: false, // Don't fetch immediately; wait for category selection or button click
    onSuccess: (data) => {
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setCurrentMovie(data[randomIndex]);
      } else {
        setCurrentMovie(null);
        if (selectedCategory !== "All") {
            toast.info(`No movies found for this category. Try "All" or another category!`);
        } else {
            toast.info(`No movies found. Please try again later.`);
        }
      }
    },
    onError: () => {
        setCurrentMovie(null); // Clear movie on error
    }
  });
  
  useEffect(() => {
    // Fetch movies when selectedCategory changes
    if (genres) { // Ensure genres are loaded before attempting to fetch movies by category
        fetchMoviesForCategory();
    }
  }, [selectedCategory, genres, fetchMoviesForCategory]);


  const handleGetRandomMovie = () => {
    // If movies for the current category are already loaded, pick one randomly
    // Otherwise, refetch (which will pick one on success)
    if (movies && movies.length > 0 && !isLoadingMovies) {
      const randomIndex = Math.floor(Math.random() * movies.length);
      setCurrentMovie(movies[randomIndex]);
      toast.success("Found a random movie!");
    } else {
      fetchMoviesForCategory(); // This will fetch and then pick one in onSuccess
    }
  };

  const handleSelectCategory = (categoryId: SelectedCategoryType) => {
    setSelectedCategory(categoryId);
    // Movies will be refetched by the useEffect listening to selectedCategory
  };
  
  const displayCategories: AppCategory[] = genres ? [{ id: "All", name: "All" }, ...genres] : [{ id: "All", name: "All" }];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 sm:p-8 transition-colors duration-300">
      <header className="mb-10 text-center">
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
            disabled={isLoadingMovies || isLoadingGenres}
          >
            <Shuffle size={20} className="mr-2" />
            {isLoadingMovies ? 'Finding Movie...' : 'Get Random Movie'}
          </Button>
        </div>
        
        <div className="w-full flex justify-center">
          <MovieCard movie={currentMovie} isLoading={isLoadingMovies && !currentMovie} />
        </div>
      </main>

      <footer className="mt-16 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Movie Picker. All rights reserved (sort of).</p>
        <p>Powered by Randomness, React, and The Movie Database API.</p>
      </footer>
    </div>
  );
};

export default Index;

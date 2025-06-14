
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Required for Deno Deploy

const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const MAX_TMDB_PAGES = 500; // TMDB caps results at page 500 for /discover

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  genre_ids: number[];
  vote_average: number;
  popularity: number;
}

interface TmdbMovieDetail extends TmdbMovie {
  genres: { id: number; name:string }[];
}

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbDiscoverResponse {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
}

let genresCache: TmdbGenre[] | null = null;
async function getGenresMap(): Promise<Map<number, string>> {
  if (genresCache === null) {
    if (!TMDB_API_KEY) {
      console.error("TMDB_API_KEY is not set in Edge Function environment variables.");
      throw new Error("TMDB API key not configured.");
    }
    const response = await fetch(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Failed to fetch genres from TMDB", response.status, errorBody);
      throw new Error(`Failed to fetch genres from TMDB: ${response.statusText}. Details: ${errorBody}`);
    }
    const data = await response.json();
    genresCache = data.genres as TmdbGenre[];
    if (!genresCache) {
        console.error("TMDB genre API did not return genres array:", data);
        genresCache = [];
    }
  }
  return new Map(genresCache.map(genre => [genre.id, genre.name]));
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log(`Request received: ${req.method} ${req.url}`);

  try {
    if (!TMDB_API_KEY) {
      console.error("TMDB_API_KEY is not available.");
      return new Response(JSON.stringify({ error: "TMDB API key not configured on the server." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let action: string | null = null;
    let genreIdsParam: string | null = null;
    let movieIdParam: string | null = null;
    let ratingGteParam: string | null = null;

    if (req.method === "POST") {
        try {
            const body = await req.json();
            console.log("Request body:", body);
            if (body && typeof body.queryString === 'string') {
                const params = new URLSearchParams(body.queryString);
                action = params.get("action");
                genreIdsParam = params.get("genreIds");
                movieIdParam = params.get("movieId");
                ratingGteParam = params.get("ratingGte");
            } else {
                action = body.action; // Fallback
                genreIdsParam = body.genreIds; // Fallback
                movieIdParam = body.movieId; // Fallback
                ratingGteParam = body.ratingGte; // Fallback
            }
        } catch (e) {
            console.warn("Could not parse JSON body for POST request or body.queryString not found, trying URL params.", e.message);
        }
    }
    
    if (!action) {
        const url = new URL(req.url);
        action = url.searchParams.get("action");
        genreIdsParam = url.searchParams.get("genreIds");
        movieIdParam = url.searchParams.get("movieId");
        ratingGteParam = url.searchParams.get("ratingGte");
        console.log(`Action from URL: ${action}, GenreIDs from URL: ${genreIdsParam}, MovieID from URL: ${movieIdParam}, RatingGTE from URL: ${ratingGteParam}`);
    }


    if (action === "getGenres") {
      console.log("Action: getGenres");
      await getGenresMap(); 
      return new Response(JSON.stringify(genresCache || []), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "getMovieById") {
        console.log(`Action: getMovieById, MovieID: ${movieIdParam}`);
        if (!movieIdParam) {
            return new Response(JSON.stringify({ error: "movieId is required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
        
        const tmdbUrl = `${TMDB_BASE_URL}/movie/${movieIdParam}?api_key=${TMDB_API_KEY}&language=en-US`;
        const response = await fetch(tmdbUrl);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Failed to fetch movie by ID from TMDB", response.status, errorBody);
            throw new Error(`Failed to fetch movie by ID from TMDB: ${response.statusText}. Details: ${errorBody}`);
        }

        const movieData: TmdbMovieDetail = await response.json();

        const formattedMovie = {
            id: movieData.id,
            title: movieData.title,
            description: movieData.overview,
            posterUrl: movieData.poster_path ? `${TMDB_IMAGE_BASE_URL}${movieData.poster_path}` : undefined,
            year: movieData.release_date ? parseInt(movieData.release_date.split("-")[0]) : undefined,
            genres: movieData.genres, // Already in the right format
            vote_average: movieData.vote_average,
        };

        return new Response(JSON.stringify(formattedMovie), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } else if (action === "getMovies") {
      console.log(`Action: getMovies, GenreIDs: ${genreIdsParam}, RatingGTE: ${ratingGteParam}`);
      
      // Step 1: Fetch page 1 to get total_pages
      let initialDiscoverUrl = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&vote_count.gte=100&page=1`;
      if (genreIdsParam) {
        initialDiscoverUrl += `&with_genres=${genreIdsParam}`;
      }
      if (ratingGteParam) {
        initialDiscoverUrl += `&vote_average.gte=${ratingGteParam}`;
      }
      console.log("Initial discover URL:", initialDiscoverUrl);

      const initialResponse = await fetch(initialDiscoverUrl);
      if (!initialResponse.ok) {
        const errorBody = await initialResponse.text();
        console.error("Failed to fetch initial movie data from TMDB", initialResponse.status, errorBody);
        throw new Error(`Failed to fetch initial movie data from TMDB: ${initialResponse.statusText}. Details: ${errorBody}`);
      }
      const initialData: TmdbDiscoverResponse = await initialResponse.json();
      const totalPages = initialData.total_pages;
      const totalResults = initialData.total_results;
      console.log(`Initial fetch: total_pages=${totalPages}, total_results=${totalResults}`);

      if (totalResults === 0) {
        console.log("No movies found for this criteria.");
        return new Response(JSON.stringify([]), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Step 2: Determine a random page to fetch
      const maxPagesToConsider = Math.min(totalPages, MAX_TMDB_PAGES);
      const randomPage = Math.floor(Math.random() * maxPagesToConsider) + 1;
      console.log(`Selected random page: ${randomPage} out of ${maxPagesToConsider} (actual total: ${totalPages})`);

      // Step 3: Fetch movies from the random page
      let tmdbUrl = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&vote_count.gte=100&page=${randomPage}`;
      if (genreIdsParam) {
        tmdbUrl += `&with_genres=${genreIdsParam}`;
      }
      if (ratingGteParam) {
        tmdbUrl += `&vote_average.gte=${ratingGteParam}`;
      }
      console.log("Fetching movies from random page URL:", tmdbUrl);

      const response = await fetch(tmdbUrl);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Failed to fetch movies from TMDB (random page)", response.status, errorBody);
        throw new Error(`Failed to fetch movies from TMDB (random page): ${response.statusText}. Details: ${errorBody}`);
      }
      const data: TmdbDiscoverResponse = await response.json();
      const tmdbMovies = data.results as TmdbMovie[];

      if (!tmdbMovies || tmdbMovies.length === 0) {
        console.log("No movies found on the randomly selected page.");
        return new Response(JSON.stringify([]), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const genresMap = await getGenresMap();

      const movies = tmdbMovies.map((movie) => {
        const movieGenres = movie.genre_ids && movie.genre_ids.length > 0
          ? movie.genre_ids.map(id => ({ id, name: genresMap.get(id) || "Unknown Genre" }))
          : [];
        
        return {
          id: movie.id,
          title: movie.title,
          description: movie.overview,
          posterUrl: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : undefined,
          year: movie.release_date ? parseInt(movie.release_date.split("-")[0]) : undefined,
          genres: movieGenres,
          vote_average: movie.vote_average,
        };
      }).filter(movie => movie.description && movie.title); 

      console.log(`Returning ${movies.length} movies from page ${randomPage}.`);
      return new Response(JSON.stringify(movies), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      console.log("Invalid action received:", action);
      return new Response(JSON.stringify({ error: "Invalid action specified. Received: " + action }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error in Edge Function:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

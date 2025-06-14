
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Required for Deno Deploy

const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Allow POST
};

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string; // "YYYY-MM-DD"
  genre_ids: number[];
  vote_average: number;
  popularity: number;
}

interface TmdbGenre {
  id: number;
  name: string;
}

let genresCache: TmdbGenre[] | null = null;
async function getGenresMap(): Promise<Map<number, string>> {
  if (genresCache === null) { // Check for null explicitly to allow empty array if API returns that
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
    if (!genresCache) { // If API returns unexpected structure
        console.error("TMDB genre API did not return genres array:", data);
        genresCache = []; // Avoid repeated calls if API is misbehaving
    }
  }
  return new Map(genresCache.map(genre => [genre.id, genre.name]));
}


serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!TMDB_API_KEY) {
      console.error("TMDB_API_KEY is not available in the Edge Function.");
      return new Response(JSON.stringify({ error: "TMDB API key not configured on the server." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let action: string | null = null;
    let genreIdParam: string | null = null;

    if (req.method === "POST") {
        try {
            const body = await req.json();
            // The Index.tsx sends `body: { queryString }`
            // So we parse that queryString
            if (body && typeof body.queryString === 'string') {
                const params = new URLSearchParams(body.queryString);
                action = params.get("action");
                genreIdParam = params.get("genreId");
            } else { // Fallback if body structure is different, e.g. { action: "...", genreId: "..." }
                action = body.action;
                genreIdParam = body.genreId;
            }
        } catch (e) {
            console.warn("Could not parse JSON body for POST request or body.queryString not found, trying URL params.", e.message);
            // Fall through to URL params if JSON parsing fails or body is not as expected
        }
    }
    
    // Fallback or primary for GET requests
    if (!action) {
        const url = new URL(req.url);
        action = url.searchParams.get("action");
        genreIdParam = url.searchParams.get("genreId");
    }


    if (action === "getGenres") {
      await getGenresMap(); // Ensures genresCache is populated
      return new Response(JSON.stringify(genresCache || []), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "getMovies") {
      let tmdbUrl = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&vote_count.gte=100`; // Added vote_count filter for quality
      if (genreIdParam && genreIdParam !== "All") {
        tmdbUrl += `&with_genres=${genreIdParam}`;
      }

      const response = await fetch(tmdbUrl);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Failed to fetch movies from TMDB", response.status, errorBody);
        throw new Error(`Failed to fetch movies from TMDB: ${response.statusText}. Details: ${errorBody}`);
      }
      const data = await response.json();
      const tmdbMovies = data.results as TmdbMovie[];

      if (!tmdbMovies || tmdbMovies.length === 0) {
        return new Response(JSON.stringify([]), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const genresMap = await getGenresMap();

      const movies = tmdbMovies.map((movie) => {
        const firstGenreId = movie.genre_ids && movie.genre_ids.length > 0 ? movie.genre_ids[0] : undefined;
        const categoryName = firstGenreId ? (genresMap.get(firstGenreId) || "Unknown") : "General";
        
        return {
          id: movie.id,
          title: movie.title,
          description: movie.overview,
          posterUrl: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : undefined,
          year: movie.release_date ? parseInt(movie.release_date.split("-")[0]) : undefined,
          category_id: firstGenreId,
          category_name: categoryName,
        };
      }).filter(movie => movie.description && movie.title); // Ensure essential fields are present

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

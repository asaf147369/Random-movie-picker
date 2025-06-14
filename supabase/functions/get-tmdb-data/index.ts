
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "./utils.ts";
import { handleGetGenres, handleGetMovieById, handleGetMovies } from "./handlers.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log(`Request received: ${req.method} ${req.url}`);

  try {
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
          action = body.action;
          genreIdsParam = body.genreIds;
          movieIdParam = body.movieId;
          ratingGteParam = body.ratingGte;
        }
      } catch (e) {
        console.warn("Could not parse JSON body for POST request, trying URL params.", e.message);
      }
    }
    
    if (!action) {
      const url = new URL(req.url);
      action = url.searchParams.get("action");
      genreIdsParam = url.searchParams.get("genreIds");
      movieIdParam = url.searchParams.get("movieId");
      ratingGteParam = url.searchParams.get("ratingGte");
      console.log(`Params from URL: action=${action}, genreIds=${genreIdsParam}, movieId=${movieIdParam}, ratingGte=${ratingGteParam}`);
    }

    switch (action) {
      case "getGenres":
        return await handleGetGenres();
      case "getMovieById":
        return await handleGetMovieById(movieIdParam);
      case "getMovies":
        return await handleGetMovies(genreIdsParam, ratingGteParam);
      default:
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

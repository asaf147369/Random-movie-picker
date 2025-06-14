
import { fetchGenres, fetchMovieById, discoverMovies } from "./tmdb.ts";
import { corsHeaders } from "./utils.ts";

export async function handleGetGenres() {
  const genres = await fetchGenres();
  return new Response(JSON.stringify(genres), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function handleGetMovieById(movieIdParam: string | null) {
  if (!movieIdParam) {
    return new Response(JSON.stringify({ error: "movieId is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const movie = await fetchMovieById(movieIdParam);
  return new Response(JSON.stringify(movie), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function handleGetMovies(genreIdsParam: string | null, ratingGteParam: string | null) {
  const movies = await discoverMovies(genreIdsParam, ratingGteParam);
  return new Response(JSON.stringify(movies), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

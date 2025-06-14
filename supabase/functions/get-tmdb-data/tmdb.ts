
import { TmdbGenre, TmdbDiscoverResponse, TmdbMovie, AppMovie, TmdbMovieDetail } from "./types.ts";

const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const MAX_TMDB_PAGES = 500;
const VOTE_COUNT_GTE = 500;

if (!TMDB_API_KEY) {
  throw new Error("TMDB_API_KEY is not set in Edge Function environment variables.");
}

let genresCache: TmdbGenre[] | null = null;
async function getGenresMap(): Promise<Map<number, string>> {
  if (genresCache === null) {
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

export async function fetchGenres(): Promise<TmdbGenre[]> {
    await getGenresMap(); 
    return genresCache || [];
}

export async function fetchMovieById(movieId: string): Promise<AppMovie> {
    const tmdbUrl = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`;
    const response = await fetch(tmdbUrl);

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Failed to fetch movie by ID from TMDB", response.status, errorBody);
        throw new Error(`Failed to fetch movie by ID from TMDB: ${response.statusText}. Details: ${errorBody}`);
    }

    const movieData: TmdbMovieDetail = await response.json();

    return {
        id: movieData.id,
        title: movieData.title,
        description: movieData.overview,
        posterUrl: movieData.poster_path ? `${TMDB_IMAGE_BASE_URL}${movieData.poster_path}` : undefined,
        year: movieData.release_date ? parseInt(movieData.release_date.split("-")[0]) : undefined,
        genres: movieData.genres,
        vote_average: movieData.vote_average,
    };
}

export async function discoverMovies(genreIdsParam: string | null, ratingGteParam: string | null): Promise<AppMovie[]> {
    console.log(`Discovering movies with GenreIDs: ${genreIdsParam}, RatingGTE: ${ratingGteParam}`);
    
    const today = new Date().toISOString().split('T')[0];
    let baseUrl = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&vote_count.gte=${VOTE_COUNT_GTE}&primary_release_date.lte=${today}`;
    if (genreIdsParam) baseUrl += `&with_genres=${genreIdsParam}`;
    if (ratingGteParam) baseUrl += `&vote_average.gte=${ratingGteParam}`;
      
    // Step 1: Fetch page 1 to get total_pages
    const initialDiscoverUrl = `${baseUrl}&page=1`;
    
    console.log("Initial discover URL:", initialDiscoverUrl);

    const initialResponse = await fetch(initialDiscoverUrl);
    if (!initialResponse.ok) throw new Error(`Failed to fetch initial movie data from TMDB: ${initialResponse.statusText}`);
    
    const initialData: TmdbDiscoverResponse = await initialResponse.json();
    const totalPages = initialData.total_pages;
    const totalResults = initialData.total_results;
    console.log(`Initial fetch: total_pages=${totalPages}, total_results=${totalResults}`);

    if (totalResults === 0) return [];

    // Step 2: Determine a random page to fetch
    const maxPagesToConsider = Math.min(totalPages, MAX_TMDB_PAGES);
    const randomPage = Math.floor(Math.random() * maxPagesToConsider) + 1;
    console.log(`Selected random page: ${randomPage} out of ${maxPagesToConsider} (actual total: ${totalPages})`);

    // Step 3: Fetch movies from the random page
    const tmdbUrl = `${baseUrl}&page=${randomPage}`;
    
    console.log("Fetching movies from random page URL:", tmdbUrl);
    const response = await fetch(tmdbUrl);
    if (!response.ok) throw new Error(`Failed to fetch movies from TMDB (random page): ${response.statusText}`);

    const data: TmdbDiscoverResponse = await response.json();
    const tmdbMovies = data.results as TmdbMovie[];

    if (!tmdbMovies || tmdbMovies.length === 0) return [];
    
    const genresMap = await getGenresMap();

    const movies = tmdbMovies.map((movie) => {
      const movieGenres = movie.genre_ids?.map(id => ({ id, name: genresMap.get(id) || "Unknown Genre" })) || [];
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
    return movies;
}

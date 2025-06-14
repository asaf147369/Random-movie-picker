
export interface Movie {
  id: number;
  title: string;
  description: string;
  category: string;
  posterUrl?: string; // Optional: URL for the movie poster
  year?: number;
}

export type Category = "All" | "Action" | "Comedy" | "Drama" | "Sci-Fi" | "Horror" | "Romance";

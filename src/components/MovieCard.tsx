
import React from 'react';
import { Movie } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MovieCardProps {
  movie: Movie | null;
  isLoading?: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="w-full max-w-md bg-card border-border shadow-xl p-6 text-center animate-pulse">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Loading Movie...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 bg-muted rounded-md mb-4"></div>
          <div className="h-6 bg-muted rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (!movie) {
    return (
      <Card className="w-full max-w-md bg-card border-border shadow-xl p-6 text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">No Movie Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Try a different category or click "Get Another Movie" again!</p>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="w-full max-w-md bg-card border-border shadow-xl overflow-hidden transform transition-all duration-500 hover:scale-105">
      {movie.posterUrl ? (
        <img src={movie.posterUrl} alt={movie.title} className="w-full h-72 object-cover" />
      ) : (
        <div className="w-full h-72 bg-muted flex items-center justify-center">
          <p className="text-muted-foreground">No Poster Available</p>
        </div>
      )}
      <CardHeader className="p-6">
        <CardTitle className="text-3xl font-bold text-primary mb-2">{movie.title} {movie.year && `(${movie.year})`}</CardTitle>
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2"> {/* Added mt-2 for spacing */}
            {movie.genres.map((genre) => (
              <Badge 
                key={genre.id} 
                variant="secondary" 
                className="bg-[hsl(var(--app-accent))] text-accent-foreground"
              >
                {genre.name}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <CardDescription className="text-foreground/80 leading-relaxed">
          {movie.description}
        </CardDescription>
      </CardContent>
    </Card>
  );
};

export default MovieCard;

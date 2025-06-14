
import { Movie } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Assuming you have a Badge component from shadcn/ui

interface MovieCardProps {
  movie: Movie | null;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  if (!movie) {
    return (
      <Card className="w-full max-w-md bg-card border-border shadow-xl p-6 text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">No Movie Selected</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Click the button to get a random movie suggestion!</p>
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
        <Badge variant="secondary" className="bg-[hsl(var(--app-accent))] text-accent-foreground">{movie.category}</Badge>
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

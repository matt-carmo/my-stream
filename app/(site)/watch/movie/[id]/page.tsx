import { notFound } from "next/navigation"
import Link from "next/link"
import { getMovieDetails, getImageUrl } from "@/lib/tmdb"
import { VideoPlayer } from "@/components/video-player"
import { TrackMovieWatch } from "@/components/track-watch"
import { Badge, buttonVariants } from "@/components/ui"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, StarIcon, Clock01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import Image from "next/image"

type WatchMoviePageProps = {
  params: Promise<{ id: string }>
}

export default async function WatchMoviePage({ params }: WatchMoviePageProps) {
  const { id } = await params
  const movieId = Number(id)
  if (isNaN(movieId)) notFound()

  const movie = await getMovieDetails(movieId).catch(() => null)
  if (!movie) notFound()

  const posterUrl = getImageUrl(movie.poster_path, "w342")

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/movie/${movie.id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={1.5} className="size-4" />
          Back
        </Link>
        <h1 className="text-lg font-semibold truncate">{movie.title}</h1>
      </div>

      <VideoPlayer type="movie" id={movieId} />
      <TrackMovieWatch
        id={movie.id}
        title={movie.title}
        poster_path={movie.poster_path}
        backdrop_path={movie.backdrop_path}
      />

      <div className="flex gap-4 flex-col sm:flex-row">
        {posterUrl && (
          <div className="relative w-24 shrink-0 overflow-hidden rounded-md">
            <Image src={posterUrl} alt={movie.title} width={96} height={144} className="w-full rounded-md" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">{movie.title}</h2>
          {movie.tagline && <p className="text-muted-foreground italic text-sm">{movie.tagline}</p>}
          <div className="flex flex-wrap gap-2">
            {movie.genres?.map((g) => (
              <Badge key={g.id} variant="secondary" className="text-xs">{g.name}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <HugeiconsIcon icon={StarIcon} className="size-4 text-yellow-500" strokeWidth={1.5} />
              <span className="font-semibold text-foreground">{movie.vote_average.toFixed(1)}</span>
            </div>
            {movie.runtime && (
              <div className="flex items-center gap-1">
                <HugeiconsIcon icon={Clock01Icon} className="size-4" strokeWidth={1.5} />
                {movie.runtime} min
              </div>
            )}
            {movie.release_date && (
              <span>{new Date(movie.release_date).getFullYear()}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{movie.overview}</p>
        </div>
      </div>
    </main>
  )
}

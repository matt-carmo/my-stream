import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getMovieDetails, getMovieCredits, getSimilarMovies, getMovieRecommendations, getMovieVideos, getMovieReviews, getCollection, getImageUrl } from "@/lib/tmdb"
import { Badge, Separator } from "@/components/ui"
import { HugeiconsIcon } from "@hugeicons/react"
import { StarIcon, Clock01Icon, Calendar01Icon } from "@hugeicons/core-free-icons"
import { MediaRow } from "@/components/media-row"
import { ResumeWatchButton } from "@/components/resume-watch-button"
import { AccountToggles } from "@/components/account-toggles"
import { TrailerDialog } from "@/components/trailer-dialog"
import { ReviewsSection } from "@/components/reviews-section"

type MoviePageProps = {
  params: Promise<{ id: string }>
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params
  const movieId = Number(id)
  if (isNaN(movieId)) notFound()

  const [movie, credits, similar, videos, recommendations, reviews] = await Promise.all([
    getMovieDetails(movieId).catch(() => null),
    getMovieCredits(movieId).catch(() => ({ cast: [] })),
    getSimilarMovies(movieId).catch(() => ({ results: [] })),
    getMovieVideos(movieId).catch(() => ({ results: [] })),
    getMovieRecommendations(movieId).catch(() => ({ results: [] })),
    getMovieReviews(movieId).catch(() => ({ results: [], page: 1, total_pages: 0, total_results: 0 })),
  ])

  if (!movie) notFound()

  const collection = movie.belongs_to_collection
    ? await getCollection(movie.belongs_to_collection.id).catch(() => null)
    : null

  const backdropUrl = getImageUrl(movie.backdrop_path, "original")
  const posterUrl = getImageUrl(movie.poster_path, "w342")
  const topCast = credits.cast.slice(0, 8)

  return (
    <main>
      {/* Backdrop */}
      {backdropUrl && (
        <div className="relative h-72 w-full overflow-hidden">
          <Image src={backdropUrl} alt={movie.title} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex gap-6 flex-col sm:flex-row">
          {/* Poster */}
          {posterUrl && (
            <div className="relative w-36 shrink-0 overflow-hidden rounded-lg border border-border/50 shadow-md self-start -mt-20 sm:-mt-28">
              <Image
                src={posterUrl}
                alt={movie.title}
                width={144}
                height={216}
                className="w-full"
              />
            </div>
          )}

          <div className="flex flex-col gap-3 flex-1">
            <div className="flex flex-wrap gap-2">
              {movie.genres?.map((g) => (
                <Badge key={g.id} variant="secondary">{g.name}</Badge>
              ))}
            </div>
            <h1 className="text-2xl font-bold md:text-3xl">{movie.title}</h1>
            {movie.tagline && (
              <p className="text-muted-foreground italic">{movie.tagline}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <HugeiconsIcon icon={StarIcon} className="size-4 text-yellow-500" strokeWidth={1.5} />
                <span className="font-semibold text-foreground">{movie.vote_average.toFixed(1)}</span>
                <span>({movie.vote_count.toLocaleString()})</span>
              </div>
              {movie.release_date && (
                <div className="flex items-center gap-1">
                  <HugeiconsIcon icon={Calendar01Icon} className="size-4" strokeWidth={1.5} />
                  {new Date(movie.release_date).getFullYear()}
                </div>
              )}
              {movie.runtime && (
                <div className="flex items-center gap-1">
                  <HugeiconsIcon icon={Clock01Icon} className="size-4" strokeWidth={1.5} />
                  {movie.runtime} min
                </div>
              )}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">{movie.overview}</p>
            <ResumeWatchButton
              type="movie"
              id={movie.id}
              defaultHref={`/watch/movie/${movie.id}`}
            />
            <div className="flex flex-wrap items-center gap-2">
              <TrailerDialog videos={videos.results} />
            </div>
            <AccountToggles type="movie" id={movie.id} />
          </div>
        </div>

        {topCast.length > 0 && (
          <>
            <Separator className="my-8" />
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Cast</h2>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
                {topCast.map((person) => {
                  const profileUrl = getImageUrl(person.profile_path, "w185")
                  return (
                    <Link
                      key={person.id}
                      href={`/person/${person.id}`}
                      className="group flex flex-col gap-1 items-center text-center"
                    >
                      <div className="relative size-16 overflow-hidden rounded-full bg-muted">
                        {profileUrl && (
                          <Image src={profileUrl} alt={person.name} fill sizes="64px" className="object-cover" />
                        )}
                      </div>
                      <p className="text-xs font-medium line-clamp-1 group-hover:underline">{person.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{person.character}</p>
                    </Link>
                  )
                })}
              </div>
            </section>
          </>
        )}

        {similar.results.length > 0 && (
          <>
            <Separator className="my-8" />
            <MediaRow title="Similar Movies" items={similar.results} type="movie" />
          </>
        )}

        {collection && collection.parts.length > 0 && (
          <>
            <Separator className="my-8" />
            <MediaRow
              title={`More From ${collection.name}`}
              items={collection.parts}
              type="movie"
            />
          </>
        )}

        {recommendations.results.length > 0 && (
          <>
            <Separator className="my-8" />
            <MediaRow title="You May Also Like" items={recommendations.results} type="movie" />
          </>
        )}

        {reviews.results.length > 0 && (
          <>
            <Separator className="my-8" />
            <ReviewsSection reviews={reviews.results} />
          </>
        )}
      </div>
    </main>
  )
}

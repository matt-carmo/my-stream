import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getTVDetails, getTVCredits, getSimilarTV, getTVSeason, getTVRecommendations, getTVVideos, getTVReviews, getImageUrl } from "@/lib/tmdb"
import { Badge, Separator } from "@/components/ui"
import { HugeiconsIcon } from "@hugeicons/react"
import { StarIcon, Calendar01Icon } from "@hugeicons/core-free-icons"
import { MediaRow } from "@/components/media-row"
import { SeasonEpisodeLoader } from "@/components/season-episode-loader"
import { ResumeWatchButton } from "@/components/resume-watch-button"
import { AccountToggles } from "@/components/account-toggles"
import { TrailerDialog } from "@/components/trailer-dialog"
import { ReviewsSection } from "@/components/reviews-section"

type TVPageProps = {
  params: Promise<{ id: string }>
}

export default async function TVDetailPage({ params }: TVPageProps) {
  const { id } = await params
  const tvId = Number(id)
  if (isNaN(tvId)) notFound()

  const [tv, credits, similar, videos, recommendations, reviews] = await Promise.all([
    getTVDetails(tvId).catch(() => null),
    getTVCredits(tvId).catch(() => ({ cast: [] })),
    getSimilarTV(tvId).catch(() => ({ results: [] })),
    getTVVideos(tvId).catch(() => ({ results: [] })),
    getTVRecommendations(tvId).catch(() => ({ results: [] })),
    getTVReviews(tvId).catch(() => ({ results: [], page: 1, total_pages: 0, total_results: 0 })),
  ])

  if (!tv) notFound()

  // Load first valid season episodes
  const firstSeason = tv.seasons?.find((s) => s.season_number > 0)
  const firstSeasonDetail = firstSeason
    ? await getTVSeason(tvId, firstSeason.season_number).catch(() => null)
    : null

  const backdropUrl = getImageUrl(tv.backdrop_path, "original")
  const posterUrl = getImageUrl(tv.poster_path, "w342")
  const topCast = credits.cast.slice(0, 8)

  return (
    <main>
      {backdropUrl && (
        <div className="relative h-72 w-full overflow-hidden">
          <Image src={backdropUrl} alt={tv.name} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex gap-6 flex-col sm:flex-row">
          {posterUrl && (
            <div className="relative w-36 shrink-0 overflow-hidden rounded-lg border border-border/50 shadow-md self-start -mt-20 sm:-mt-28">
              <Image src={posterUrl} alt={tv.name} width={144} height={216} className="w-full" />
            </div>
          )}

          <div className="flex flex-col gap-3 flex-1">
            <div className="flex flex-wrap gap-2">
              {tv.genres?.map((g) => (
                <Badge key={g.id} variant="secondary">{g.name}</Badge>
              ))}
            </div>
            <h1 className="text-2xl font-bold md:text-3xl">{tv.name}</h1>
            {tv.tagline && <p className="text-muted-foreground italic">{tv.tagline}</p>}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <HugeiconsIcon icon={StarIcon} className="size-4 text-yellow-500" strokeWidth={1.5} />
                <span className="font-semibold text-foreground">{tv.vote_average.toFixed(1)}</span>
                <span>({tv.vote_count.toLocaleString()})</span>
              </div>
              {tv.first_air_date && (
                <div className="flex items-center gap-1">
                  <HugeiconsIcon icon={Calendar01Icon} className="size-4" strokeWidth={1.5} />
                  {new Date(tv.first_air_date).getFullYear()}
                </div>
              )}
              {tv.number_of_seasons && (
                <span>{tv.number_of_seasons} {tv.number_of_seasons === 1 ? "season" : "seasons"}</span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">{tv.overview}</p>
            {firstSeason && (
              <ResumeWatchButton
                type="tv"
                id={tv.id}
                defaultHref={`/watch/tv/${tv.id}?season=${firstSeason.season_number}&episode=1`}
              />
            )}
            <div className="flex flex-wrap items-center gap-2">
              <TrailerDialog videos={videos.results} />
            </div>
            <AccountToggles type="tv" id={tv.id} />
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

        {tv.seasons && tv.seasons.length > 0 && (
          <>
            <Separator className="my-8" />
            <SeasonEpisodeLoader
              tvId={tvId}
              seasons={tv.seasons}
              initialSeasonNumber={firstSeason?.season_number ?? 1}
              initialEpisodes={firstSeasonDetail?.episodes ?? []}
            />
          </>
        )}

        {similar.results.length > 0 && (
          <>
            <Separator className="my-8" />
            <MediaRow title="Similar Shows" items={similar.results} type="tv" />
          </>
        )}

        {recommendations.results.length > 0 && (
          <>
            <Separator className="my-8" />
            <MediaRow title="You May Also Like" items={recommendations.results} type="tv" />
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

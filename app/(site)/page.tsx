export const dynamic = "force-dynamic"

import { HeroBanner } from "@/components/hero-banner"
import { MediaRow } from "@/components/media-row"
import { ContinueWatching } from "@/components/continue-watching"
import {
  getTrendingMovies,
  getTrendingTV,
  getPopularMovies,
  getNowPlayingMovies,
  getPopularTV,
  getMovieDetails,
} from "@/lib/tmdb"

export default async function HomePage() {
  const [
    trendingMovies,
    trendingTV,
    popularMovies,
    nowPlaying,
    popularTV,
  ] = await Promise.all([
    getTrendingMovies("week"),
    getTrendingTV("week"),
    getPopularMovies(),
    getNowPlayingMovies(),
    getPopularTV(),
  ])

  const heroMovie = trendingMovies.results[0]
  let heroDetails = null
  if (heroMovie) {
    heroDetails = await getMovieDetails(heroMovie.id)
  }

  return (
    <main>
      {heroDetails && <HeroBanner item={heroDetails} type="movie" />}
      <div className="mx-auto max-w-7xl flex flex-col gap-10 px-4 py-10">
        <ContinueWatching />
        <MediaRow
          title="Trending Movies"
          items={trendingMovies.results}
          type="movie"
          viewAllHref="/movies"
        />
        <MediaRow
          title="Trending TV Shows"
          items={trendingTV.results}
          type="tv"
          viewAllHref="/tv"
        />
        <MediaRow
          title="Now Playing"
          items={nowPlaying.results}
          type="movie"
          viewAllHref="/movies?tab=now_playing"
        />
        <MediaRow
          title="Popular TV Shows"
          items={popularTV.results}
          type="tv"
          viewAllHref="/tv"
        />
        <MediaRow
          title="Popular Movies"
          items={popularMovies.results}
          type="movie"
          viewAllHref="/movies"
        />
      </div>
    </main>
  )
}

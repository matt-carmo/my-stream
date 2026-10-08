export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { MediaCard } from "@/components/media-card"
import { FilterBar } from "@/components/filter-bar"
import { PaginationControls } from "@/components/pagination-controls"
import {
  getMovieGenres,
  discoverMovies,
  isMovieSort,
  parseGenreFilter,
} from "@/lib/tmdb"

const CATEGORY_TO_SORT: Record<string, string> = {
  popular: "popularity.desc",
  now_playing: "primary_release_date.desc",
  top_rated: "vote_average.desc",
  upcoming: "primary_release_date.asc",
}

const RUNTIME_PRESETS: Record<string, { gte?: number; lte?: number }> = {
  short: { lte: 90 },
  medium: { gte: 90, lte: 150 },
  long: { gte: 150 },
}

function toInt(value: string | undefined): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isInteger(n) ? n : undefined
}

function toFloat(value: string | undefined): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isNaN(n) ? undefined : n
}

type MoviesPageProps = {
  searchParams: Promise<{
    sort?: string
    genres?: string
    genre?: string
    year?: string
    min_rating?: string
    runtime?: string
    lang?: string
    country?: string
    release_type?: string
    page?: string
    // Legacy param from the old category tabs
    category?: string
  }>
}

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  const params = await searchParams

  // Backwards compatibility for saved links using the old ?category= tabs
  if (params.category && !params.sort) {
    const sort = CATEGORY_TO_SORT[params.category] ?? "popularity.desc"
    const next = new URLSearchParams()
    next.set("sort", sort)
    if (params.genres) next.set("genres", params.genres)
    else if (params.genre) next.set("genres", params.genre)
    redirect(`/movies?${next.toString()}`)
  }

  const sort = isMovieSort(params.sort) ? params.sort : "popularity.desc"
  const page = Math.max(1, toInt(params.page) ?? 1)
  const { ids: genreIds, mode: genreMode } = parseGenreFilter(
    params.genres,
    params.genre
  )
  const year = toInt(params.year)
  const minRating = toFloat(params.min_rating)
  const runtime = params.runtime ? RUNTIME_PRESETS[params.runtime] : undefined
  const lang = params.lang?.trim().toLowerCase() || undefined
  const country = params.country?.trim().toUpperCase() || undefined
  const releaseType = toInt(params.release_type)

  const [genresData, results] = await Promise.all([
    getMovieGenres(),
    discoverMovies({
      page,
      sortBy: sort,
      genreIds: genreIds.length > 0 ? genreIds : undefined,
      genreMode,
      year,
      minRating,
      runtimeGte: runtime?.gte,
      runtimeLte: runtime?.lte,
      lang:
        lang && /^[a-z]{2,3}$/.test(lang) ? lang : undefined,
      country:
        country && /^[A-Z]{2}$/.test(country) ? country : undefined,
      releaseType,
    }),
  ])

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Movies</h1>

      <Suspense>
        <FilterBar mode="movie" genres={genresData.genres} />
      </Suspense>

      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          {results.total_results.toLocaleString()} results &middot; page {results.page} of{" "}
          {Math.min(results.total_pages, 500).toLocaleString()}
        </p>
        {results.results.length === 0 ? (
          <p className="text-muted-foreground">
            No results found. Try clearing some filters.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
            {results.results.map((movie) => (
              <MediaCard key={movie.id} item={movie} type="movie" />
            ))}
          </div>
        )}
      </div>

      <Suspense>
        <PaginationControls currentPage={page} totalPages={results.total_pages} />
      </Suspense>
    </main>
  )
}

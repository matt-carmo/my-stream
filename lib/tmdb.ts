import type {
  Movie,
  TVShow,
  Genre,
  Season,
  SeasonDetail,
  PaginatedResponse,
  VideosResponse,
  CreditsResponse,
  SearchResult,
  ReviewsResponse,
  Collection,
  ImagesResponse,
  Person,
  PersonDetails,
} from "./types"

const BASE_URL = "https://api.themoviedb.org/3"
const IMAGE_BASE = "https://image.tmdb.org/t/p"

export function getImageUrl(
  path: string | null,
  size: "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original" = "w500"
) {
  if (!path) return null
  return `${IMAGE_BASE}/${size}${path}`
}

function getHeaders() {
  const token = process.env.TMDB_API_TOKEN
  if (!token) throw new Error("TMDB_API_TOKEN is not set")
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

async function fetcher<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  }
  const res = await fetch(url.toString(), {
    headers: getHeaders(),
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`TMDB error: ${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

// ─── Movies ───────────────────────────────────────────────────────────────────

export async function getTrendingMovies(timeWindow: "day" | "week" = "week") {
  return fetcher<PaginatedResponse<Movie>>(`/trending/movie/${timeWindow}`)
}

export async function getPopularMovies(page = 1) {
  return fetcher<PaginatedResponse<Movie>>("/movie/popular", { page: String(page) })
}

export async function getNowPlayingMovies(page = 1) {
  return fetcher<PaginatedResponse<Movie>>("/movie/now_playing", { page: String(page) })
}

export async function getTopRatedMovies(page = 1) {
  return fetcher<PaginatedResponse<Movie>>("/movie/top_rated", { page: String(page) })
}

export async function getUpcomingMovies(page = 1) {
  return fetcher<PaginatedResponse<Movie>>("/movie/upcoming", { page: String(page) })
}

export async function getMovieDetails(id: number) {
  return fetcher<Movie>(`/movie/${id}`)
}

export async function getMovieVideos(id: number) {
  return fetcher<VideosResponse>(`/movie/${id}/videos`)
}

export async function getMovieCredits(id: number) {
  return fetcher<CreditsResponse>(`/movie/${id}/credits`)
}

export async function getSimilarMovies(id: number) {
  return fetcher<PaginatedResponse<Movie>>(`/movie/${id}/similar`)
}

export async function getMovieRecommendations(id: number) {
  return fetcher<PaginatedResponse<Movie>>(`/movie/${id}/recommendations`)
}

export async function getMovieReviews(id: number) {
  return fetcher<ReviewsResponse>(`/movie/${id}/reviews`)
}

export async function getCollection(id: number) {
  return fetcher<Collection>(`/collection/${id}`)
}

export async function getMovieImages(id: number) {
  return fetcher<ImagesResponse>(`/movie/${id}/images`, {
    include_image_language: "en,null",
  })
}

// ─── TV Shows ─────────────────────────────────────────────────────────────────

export async function getTrendingTV(timeWindow: "day" | "week" = "week") {
  return fetcher<PaginatedResponse<TVShow>>(`/trending/tv/${timeWindow}`)
}

export async function getPopularTV(page = 1) {
  return fetcher<PaginatedResponse<TVShow>>("/tv/popular", { page: String(page) })
}

export async function getTopRatedTV(page = 1) {
  return fetcher<PaginatedResponse<TVShow>>("/tv/top_rated", { page: String(page) })
}

export async function getAiringTodayTV(page = 1) {
  return fetcher<PaginatedResponse<TVShow>>("/tv/airing_today", { page: String(page) })
}

export async function getTVDetails(id: number) {
  return fetcher<TVShow & { seasons: Season[] }>(`/tv/${id}`)
}

export async function getTVVideos(id: number) {
  return fetcher<VideosResponse>(`/tv/${id}/videos`)
}

export async function getTVCredits(id: number) {
  return fetcher<CreditsResponse>(`/tv/${id}/credits`)
}

export async function getSimilarTV(id: number) {
  return fetcher<PaginatedResponse<TVShow>>(`/tv/${id}/similar`)
}

export async function getTVRecommendations(id: number) {
  return fetcher<PaginatedResponse<TVShow>>(`/tv/${id}/recommendations`)
}

export async function getTVReviews(id: number) {
  return fetcher<ReviewsResponse>(`/tv/${id}/reviews`)
}

export async function getTVImages(id: number) {
  return fetcher<ImagesResponse>(`/tv/${id}/images`, {
    include_image_language: "en,null",
  })
}

export async function getTVSeason(tvId: number, seasonNumber: number) {
  return fetcher<SeasonDetail>(`/tv/${tvId}/season/${seasonNumber}`)
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchMulti(query: string, page = 1) {
  return fetcher<PaginatedResponse<SearchResult>>("/search/multi", {
    query,
    page: String(page),
  })
}

export async function searchMovies(query: string, page = 1) {
  return fetcher<PaginatedResponse<Movie>>("/search/movie", {
    query,
    page: String(page),
  })
}

export async function searchTV(query: string, page = 1) {
  return fetcher<PaginatedResponse<TVShow>>("/search/tv", {
    query,
    page: String(page),
  })
}

export async function searchPeople(query: string, page = 1) {
  return fetcher<PaginatedResponse<Person>>("/search/person", {
    query,
    page: String(page),
  })
}

// ─── People ───────────────────────────────────────────────────────────────────

export async function getPersonDetails(personId: number) {
  return fetcher<PersonDetails>(`/person/${personId}`, {
    append_to_response: "movie_credits,tv_credits",
  })
}

// ─── Genres ───────────────────────────────────────────────────────────────────

export async function getMovieGenres() {
  return fetcher<{ genres: Genre[] }>("/genre/movie/list")
}

export async function getTVGenres() {
  return fetcher<{ genres: Genre[] }>("/genre/tv/list")
}

// ─── Discover ─────────────────────────────────────────────────────────────────

export const MOVIE_SORT_OPTIONS = [
  "popularity.desc",
  "popularity.asc",
  "vote_average.desc",
  "vote_average.asc",
  "vote_count.desc",
  "vote_count.asc",
  "primary_release_date.desc",
  "primary_release_date.asc",
  "title.asc",
  "title.desc",
  "original_title.asc",
  "original_title.desc",
  "revenue.desc",
  "revenue.asc",
] as const

export type MovieSort = (typeof MOVIE_SORT_OPTIONS)[number]

export const TV_SORT_OPTIONS = [
  "popularity.desc",
  "popularity.asc",
  "vote_average.desc",
  "vote_average.asc",
  "vote_count.desc",
  "vote_count.asc",
  "first_air_date.desc",
  "first_air_date.asc",
  "name.asc",
  "name.desc",
  "original_name.asc",
  "original_name.desc",
] as const

export type TVSort = (typeof TV_SORT_OPTIONS)[number]

export function isMovieSort(value: string | undefined): value is MovieSort {
  return (MOVIE_SORT_OPTIONS as readonly string[]).includes(value ?? "")
}

export function isTVSort(value: string | undefined): value is TVSort {
  return (TV_SORT_OPTIONS as readonly string[]).includes(value ?? "")
}

export interface DiscoverMovieParams {
  page?: number
  sortBy?: string
  genreIds?: number[]
  /** "and" joins with `,` (default), "or" joins with `|` */
  genreMode?: "and" | "or"
  year?: number
  minRating?: number
  runtimeGte?: number
  runtimeLte?: number
  lang?: string
  country?: string
  releaseType?: number
}

export interface DiscoverTVParams {
  page?: number
  sortBy?: string
  genreIds?: number[]
  /** "and" joins with `,` (default), "or" joins with `|` */
  genreMode?: "and" | "or"
  year?: number
  minRating?: number
  runtimeGte?: number
  runtimeLte?: number
  lang?: string
  country?: string
  status?: string
  showType?: string
}

function sanitizeGenreIds(ids: number[] | undefined): number[] {
  if (!ids) return []
  return [...new Set(ids)].filter((id) => Number.isInteger(id) && id > 0)
}

function joinGenres(ids: number[] | undefined, mode: "and" | "or" | undefined): string | undefined {
  const clean = sanitizeGenreIds(ids)
  if (clean.length === 0) return undefined
  return clean.join(mode === "or" ? "|" : ",")
}

/**
 * Parse the `genres` URL param (comma = AND, pipe = OR) with fallback to the
 * legacy single-id `genre` param. Used by both pages (server) and FilterBar.
 */
export function parseGenreFilter(
  raw: string | null | undefined,
  legacy: string | null | undefined
): { ids: number[]; mode: "and" | "or" } {
  const src = raw || legacy || ""
  if (!src) return { ids: [], mode: "and" }
  const mode = src.includes("|") ? "or" : "and"
  const ids = [
    ...new Set(
      src
        .split(/[|,]/)
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0)
    ),
  ]
  return { ids, mode }
}

function sanitizeYear(year: number | undefined): string | undefined {
  if (year === undefined || !Number.isInteger(year)) return undefined
  if (year < 1900 || year > 2035) return undefined
  return String(year)
}

function sanitizeRating(rating: number | undefined): string | undefined {
  if (rating === undefined || Number.isNaN(rating)) return undefined
  if (rating < 0 || rating > 10) return undefined
  return String(rating)
}

function sanitizeRuntime(value: number | undefined): string | undefined {
  if (value === undefined || !Number.isInteger(value)) return undefined
  if (value < 0 || value > 1000) return undefined
  return String(value)
}

export async function discoverMovies(params: DiscoverMovieParams) {
  const sortBy = isMovieSort(params.sortBy) ? params.sortBy : "popularity.desc"
  const usesRating =
    sortBy.startsWith("vote_average") || params.minRating !== undefined
  const withGenres = joinGenres(params.genreIds, params.genreMode)

  return fetcher<PaginatedResponse<Movie>>("/discover/movie", {
    page: String(params.page ?? 1),
    sort_by: sortBy,
    // Quality gate only for rating-based sorts/filters; otherwise it would
    // hide unreleased or obscure titles (e.g. future years, upcoming sorts).
    ...(usesRating ? { "vote_count.gte": "50" } : {}),
    ...(withGenres ? { with_genres: withGenres } : {}),
    ...(sanitizeYear(params.year)
      ? { primary_release_year: sanitizeYear(params.year)! }
      : {}),
    ...(sanitizeRating(params.minRating)
      ? { "vote_average.gte": sanitizeRating(params.minRating)! }
      : {}),
    ...(sanitizeRuntime(params.runtimeGte)
      ? { "with_runtime.gte": sanitizeRuntime(params.runtimeGte)! }
      : {}),
    ...(sanitizeRuntime(params.runtimeLte)
      ? { "with_runtime.lte": sanitizeRuntime(params.runtimeLte)! }
      : {}),
    ...(params.lang ? { with_original_language: params.lang } : {}),
    ...(params.country ? { with_origin_country: params.country } : {}),
    ...(params.releaseType !== undefined &&
    Number.isInteger(params.releaseType) &&
    params.releaseType >= 1 &&
    params.releaseType <= 6
      ? { with_release_type: String(params.releaseType) }
      : {}),
  })
}

export async function discoverTV(params: DiscoverTVParams) {
  const sortBy = isTVSort(params.sortBy) ? params.sortBy : "popularity.desc"
  const usesRating =
    sortBy.startsWith("vote_average") || params.minRating !== undefined
  const withGenres = joinGenres(params.genreIds, params.genreMode)

  return fetcher<PaginatedResponse<TVShow>>("/discover/tv", {
    page: String(params.page ?? 1),
    sort_by: sortBy,
    ...(usesRating ? { "vote_count.gte": "50" } : {}),
    ...(withGenres ? { with_genres: withGenres } : {}),
    ...(sanitizeYear(params.year)
      ? { first_air_date_year: sanitizeYear(params.year)! }
      : {}),
    ...(sanitizeRating(params.minRating)
      ? { "vote_average.gte": sanitizeRating(params.minRating)! }
      : {}),
    ...(sanitizeRuntime(params.runtimeGte)
      ? { "with_runtime.gte": sanitizeRuntime(params.runtimeGte)! }
      : {}),
    ...(sanitizeRuntime(params.runtimeLte)
      ? { "with_runtime.lte": sanitizeRuntime(params.runtimeLte)! }
      : {}),
    ...(params.lang ? { with_original_language: params.lang } : {}),
    ...(params.country ? { with_origin_country: params.country } : {}),
    ...(params.status ? { with_status: params.status } : {}),
    ...(params.showType ? { with_type: params.showType } : {}),
  })
}

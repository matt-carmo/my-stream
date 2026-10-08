export interface BelongsToCollection {
  id: number
  name: string
  poster_path: string | null
  backdrop_path: string | null
}

export interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids?: number[]
  genres?: Genre[]
  runtime?: number
  tagline?: string
  status?: string
  original_language?: string
  belongs_to_collection?: BelongsToCollection | null
}

export interface TVShow {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  genre_ids?: number[]
  genres?: Genre[]
  number_of_seasons?: number
  number_of_episodes?: number
  tagline?: string
  status?: string
  original_language?: string
  episode_run_time?: number[]
}

export interface Genre {
  id: number
  name: string
}

export interface Season {
  id: number
  name: string
  season_number: number
  episode_count: number
  poster_path: string | null
  air_date: string
  overview: string
}

export interface Episode {
  id: number
  name: string
  overview: string
  episode_number: number
  season_number: number
  still_path: string | null
  air_date: string
  vote_average: number
  runtime: number | null
}

export interface SeasonDetail {
  id: number
  name: string
  season_number: number
  episodes: Episode[]
  poster_path: string | null
  air_date: string
  overview: string
}

export interface PaginatedResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export interface Video {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
}

export interface VideosResponse {
  results: Video[]
}

export interface Cast {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export interface CreditsResponse {
  cast: Cast[]
}

export interface Review {
  id: string
  author: string
  content: string
  created_at: string
  url: string
  author_details?: {
    rating?: number | null
    avatar_path?: string | null
  }
}

export interface ReviewsResponse {
  page: number
  results: Review[]
  total_pages: number
  total_results: number
}

export interface Collection {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  parts: (Movie | TVShow)[]
}

export interface CollectionImage {
  file_path: string
}

export interface ImagesResponse {
  backdrops: CollectionImage[]
  posters: CollectionImage[]
}

export type MediaType = "movie" | "tv"

export interface PersonKnownFor {
  id: number
  media_type: MediaType
  title?: string
  name?: string
}

export interface Person {
  id: number
  name: string
  profile_path: string | null
  known_for_department: string
  popularity: number
  known_for: PersonKnownFor[]
}

export type Credit<T> = T & {
  popularity: number
  character?: string
  department?: string
  job?: string
}

export interface PersonCredits<T> {
  cast: Credit<T>[]
  crew: Credit<T>[]
}

export interface PersonDetails {
  id: number
  name: string
  biography: string
  birthday: string | null
  deathday: string | null
  place_of_birth: string | null
  profile_path: string | null
  known_for_department: string
  movie_credits: PersonCredits<Movie>
  tv_credits: PersonCredits<TVShow>
}

export interface SearchResult {
  id: number
  media_type: MediaType
  title?: string
  name?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date?: string
  first_air_date?: string
  vote_average: number
  vote_count: number
  genre_ids?: number[]
  // Make discriminated union helpers
  // We alias name/title for compatibility with Movie/TVShow
}

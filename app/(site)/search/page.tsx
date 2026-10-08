export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { searchMovies, searchPeople, searchTV } from "@/lib/tmdb"
import { MediaCard } from "@/components/media-card"
import { PersonCard } from "@/components/person-card"
import { PaginationControls } from "@/components/pagination-controls"
import { PerPageSelect } from "@/components/per-page-select"
import { AccountListTabs } from "@/components/account-list-shared"
import { DEFAULT_PER_PAGE, parsePage, parsePerPage } from "@/lib/pagination"
import type { Movie, PaginatedResponse, Person, TVShow } from "@/lib/types"

const SEARCH_TABS = [
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV Shows" },
  { value: "person", label: "People" },
] as const

type SearchType = (typeof SEARCH_TABS)[number]["value"]

const TMDB_PAGE_SIZE = 20
const TMDB_MAX_PAGE = 500

type SitePage<T> = {
  results: T[]
  totalResults: number
  totalPages: number
}

type SearchPageProps = {
  searchParams: Promise<{ q?: string; type?: string; page?: string; per_page?: string }>
}

// TMDB always returns 20 items per page, so a site page of N items is
// stitched together from N / 20 consecutive TMDB pages fetched in parallel.
async function fetchSitePage<T extends { id: number }>(
  fetchPage: (page: number) => Promise<PaginatedResponse<T>>,
  page: number,
  perPage: number
): Promise<SitePage<T>> {
  const chunk = perPage / TMDB_PAGE_SIZE
  const firstTmdbPage = (page - 1) * chunk + 1
  const tmdbPages = Array.from({ length: chunk }, (_, i) => firstTmdbPage + i).filter(
    (p) => p <= TMDB_MAX_PAGE
  )

  const responses = await Promise.all(tmdbPages.map(fetchPage))

  // Popularity can shift between TMDB pages, repeating an item across them
  const seen = new Set<number>()
  const results = responses
    .flatMap((r) => r.results)
    .filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)))

  const tmdbTotalPages = Math.min(responses[0].total_pages, TMDB_MAX_PAGE)

  return {
    results,
    totalResults: responses[0].total_results,
    totalPages: Math.ceil(tmdbTotalPages / chunk),
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, type, page: pageStr, per_page: perPageStr } = await searchParams
  const query = q?.trim() ?? ""
  const searchType: SearchType = SEARCH_TABS.some((t) => t.value === type)
    ? (type as SearchType)
    : "movie"
  const perPage = parsePerPage(perPageStr)
  const maxSitePage = Math.ceil(TMDB_MAX_PAGE / (perPage / TMDB_PAGE_SIZE))
  const page = parsePage(pageStr, maxSitePage)

  let media: SitePage<Movie | TVShow> | null = null
  let people: SitePage<Person> | null = null
  if (query) {
    if (searchType === "person") {
      people = await fetchSitePage((p) => searchPeople(query, p), page, perPage)
    } else {
      const search = searchType === "tv" ? searchTV : searchMovies
      media = await fetchSitePage<Movie | TVShow>((p) => search(query, p), page, perPage)
    }
  }

  const summary = media ?? people
  const tabParams: Record<string, string> = { q: query }
  if (perPage !== DEFAULT_PER_PAGE) tabParams.per_page = String(perPage)
  const emptyLabel = SEARCH_TABS.find((t) => t.value === searchType)!.label.toLowerCase()

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">
          {query ? `Results for "${query}"` : "Search"}
        </h1>
        {summary && (
          <p className="text-muted-foreground text-sm mt-1">
            {summary.totalResults.toLocaleString()} results
            {summary.totalPages > 1 && (
              <>
                {" "}&middot; page {page} of {summary.totalPages}
              </>
            )}
          </p>
        )}
      </div>

      {!query && (
        <p className="text-muted-foreground">
          Use the search bar above to find movies, TV shows and people.
        </p>
      )}

      {query && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AccountListTabs
            base="/search"
            active={searchType}
            params={tabParams}
            tabs={SEARCH_TABS}
          />
          <Suspense>
            <PerPageSelect value={perPage} />
          </Suspense>
        </div>
      )}

      {summary && summary.results.length === 0 && (
        <p className="text-muted-foreground">
          No {emptyLabel} found for &ldquo;{query}&rdquo;.
        </p>
      )}

      {summary && summary.results.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {media?.results.map((item) => (
            <MediaCard key={item.id} item={item} type={searchType as "movie" | "tv"} />
          ))}
          {people?.results.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}

      {summary && (
        <Suspense>
          <PaginationControls currentPage={page} totalPages={summary.totalPages} />
        </Suspense>
      )}
    </main>
  )
}

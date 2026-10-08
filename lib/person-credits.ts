import type { Credit, Movie, TVShow } from "./types"

export type MediaCredit = Credit<Movie> | Credit<TVShow>

export const ACTING_ROLE = "Acting"

// Rating sort keeps titles with few votes at the end, mirroring the Discover gate
const MIN_VOTES_FOR_RATING = 50

export const CREDIT_SORT_OPTIONS = [
  { value: "popularity", label: "Most Popular" },
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "Title A–Z" },
] as const

export type CreditSort = (typeof CREDIT_SORT_OPTIONS)[number]["value"]

export const DEFAULT_CREDIT_SORT: CreditSort = "popularity"

export function parseCreditSort(value: string | undefined): CreditSort {
  return CREDIT_SORT_OPTIONS.find((o) => o.value === value)?.value ?? DEFAULT_CREDIT_SORT
}

// Cast credits become the "Acting" role and crew credits are grouped by
// department. A title appears once per role even with several jobs in it.
export function groupCreditsByRole(credits: {
  cast: MediaCredit[]
  crew: MediaCredit[]
}): Map<string, MediaCredit[]> {
  const groups = new Map<string, Map<number, MediaCredit>>()

  function add(role: string, credit: MediaCredit) {
    const group = groups.get(role) ?? new Map<number, MediaCredit>()
    if (!group.has(credit.id)) group.set(credit.id, credit)
    groups.set(role, group)
  }

  credits.cast.forEach((c) => add(ACTING_ROLE, c))
  credits.crew.forEach((c) => add(c.department ?? "Crew", c))

  return new Map(
    [...groups.entries()]
      .map(([role, group]): [string, MediaCredit[]] => [role, [...group.values()]])
      .sort(([, a], [, b]) => b.length - a.length)
  )
}

export function countUniqueTitles(credits: { cast: MediaCredit[]; crew: MediaCredit[] }) {
  return new Set([...credits.cast, ...credits.crew].map((c) => c.id)).size
}

function getTitle(credit: MediaCredit) {
  return "title" in credit ? credit.title : credit.name
}

function getDate(credit: MediaCredit) {
  return "release_date" in credit ? credit.release_date : credit.first_air_date
}

export function sortCredits(credits: MediaCredit[], sort: CreditSort): MediaCredit[] {
  const sorted = [...credits]

  switch (sort) {
    case "rating": {
      const isRated = (c: MediaCredit) => Number(c.vote_count >= MIN_VOTES_FOR_RATING)
      return sorted.sort((a, b) => isRated(b) - isRated(a) || b.vote_average - a.vote_average)
    }
    case "newest":
    case "oldest": {
      const direction = sort === "newest" ? -1 : 1
      return sorted.sort((a, b) => {
        const dateA = getDate(a)
        const dateB = getDate(b)
        // Undated titles (unannounced or unknown) always go last
        if (!dateA || !dateB) return Number(!dateA) - Number(!dateB)
        return dateA.localeCompare(dateB) * direction
      })
    }
    case "title":
      return sorted.sort((a, b) => getTitle(a).localeCompare(getTitle(b)))
    default:
      return sorted.sort((a, b) => b.popularity - a.popularity)
  }
}

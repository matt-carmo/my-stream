export const dynamic = "force-dynamic"

import Image from "next/image"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getImageUrl, getPersonDetails } from "@/lib/tmdb"
import { MediaCard } from "@/components/media-card"
import { PaginationControls } from "@/components/pagination-controls"
import { PerPageSelect } from "@/components/per-page-select"
import { ParamSelect } from "@/components/param-select"
import { AccountListTabs } from "@/components/account-list-shared"
import { DEFAULT_PER_PAGE, parsePage, parsePerPage } from "@/lib/pagination"
import {
  CREDIT_SORT_OPTIONS,
  DEFAULT_CREDIT_SORT,
  countUniqueTitles,
  groupCreditsByRole,
  parseCreditSort,
  sortCredits,
} from "@/lib/person-credits"

type PersonPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    type?: string
    role?: string
    sort?: string
    page?: string
    per_page?: string
  }>
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })
}

export default async function PersonPage({ params, searchParams }: PersonPageProps) {
  const { id } = await params
  const personId = Number(id)
  if (isNaN(personId)) notFound()

  const person = await getPersonDetails(personId).catch(() => null)
  if (!person) notFound()

  const { type, role, sort: sortStr, page: pageStr, per_page: perPageStr } = await searchParams
  const mediaType = type === "tv" ? "tv" : "movie"
  const credits = mediaType === "tv" ? person.tv_credits : person.movie_credits

  const groups = groupCreditsByRole(credits)
  const roles = [...groups.keys()]
  const defaultRole = groups.has(person.known_for_department)
    ? person.known_for_department
    : (roles[0] ?? "")
  const activeRole = role && groups.has(role) ? role : defaultRole

  const sort = parseCreditSort(sortStr)
  const items = sortCredits(groups.get(activeRole) ?? [], sort)

  const perPage = parsePerPage(perPageStr)
  const totalPages = Math.ceil(items.length / perPage)
  const page = parsePage(pageStr, totalPages)
  const pageItems = items.slice((page - 1) * perPage, page * perPage)

  const tabs = [
    { value: "movie", label: `Movies (${countUniqueTitles(person.movie_credits)})` },
    { value: "tv", label: `TV Shows (${countUniqueTitles(person.tv_credits)})` },
  ]
  const tabParams: Record<string, string> = {}
  if (sort !== DEFAULT_CREDIT_SORT) tabParams.sort = sort
  if (perPage !== DEFAULT_PER_PAGE) tabParams.per_page = String(perPage)

  const roleOptions = roles.map((r) => ({ value: r, label: `${r} (${groups.get(r)!.length})` }))
  const profileUrl = getImageUrl(person.profile_path, "w342")

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10">
      <section className="flex flex-col gap-6 sm:flex-row">
        <div className="relative aspect-2/3 w-40 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-48">
          {profileUrl ? (
            <Image
              src={profileUrl}
              alt={person.name}
              fill
              priority
              sizes="192px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-bold">{person.name}</h1>
            {person.known_for_department && (
              <p className="text-sm text-muted-foreground">{person.known_for_department}</p>
            )}
          </div>
          {(person.birthday || person.place_of_birth || person.deathday) && (
            <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
              {(person.birthday || person.place_of_birth) && (
                <p>
                  Born
                  {person.birthday && ` ${formatDate(person.birthday)}`}
                  {person.place_of_birth && ` in ${person.place_of_birth}`}
                </p>
              )}
              {person.deathday && <p>Died {formatDate(person.deathday)}</p>}
            </div>
          )}
          {person.biography && (
            <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed">
              {person.biography}
            </p>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AccountListTabs
          base={`/person/${person.id}`}
          active={mediaType}
          params={tabParams}
          tabs={tabs}
        />
        {items.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Suspense>
              <ParamSelect
                param="role"
                value={activeRole}
                defaultValue={defaultRole}
                options={roleOptions}
                className="w-48"
              />
              <ParamSelect
                param="sort"
                value={sort}
                defaultValue={DEFAULT_CREDIT_SORT}
                options={CREDIT_SORT_OPTIONS}
              />
              <PerPageSelect value={perPage} />
            </Suspense>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground">
          No {mediaType === "tv" ? "TV shows" : "movies"} found for {person.name}.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {pageItems.map((item) => (
            <MediaCard key={item.id} item={item} type={mediaType} />
          ))}
        </div>
      )}

      <Suspense>
        <PaginationControls currentPage={page} totalPages={totalPages} />
      </Suspense>
    </main>
  )
}

export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { MediaCard } from "@/components/media-card"
import { PaginationControls } from "@/components/pagination-controls"
import {
  AccountListTabs,
  ConnectTmdbPrompt,
  EmptyAccountList,
} from "@/components/account-list-shared"
import { getAccountList } from "@/lib/tmdb-account"
import { requireTmdbAccount } from "@/lib/tmdb-session"
import type { Movie, PaginatedResponse, TVShow } from "@/lib/types"

type FavoritesPageProps = {
  searchParams: Promise<{ type?: string; page?: string }>
}

export default async function FavoritesPage({ searchParams }: FavoritesPageProps) {
  const { type, page: pageStr } = await searchParams
  const mediaType = type === "tv" ? "tv" : "movie"
  const page = Math.max(1, Number(pageStr) || 1)

  const authed = await requireTmdbAccount()
  if (!authed) return <ConnectTmdbPrompt title="Favorites" />

  const data = await getAccountList<PaginatedResponse<Movie | TVShow>>(
    authed.sessionId,
    authed.account.id,
    "favorite",
    mediaType,
    page
  ).catch(() => null)

  if (!data) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-2xl font-bold">Favorites</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Could not load your favorites. Try again later.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10">
      <h1 className="text-2xl font-bold">Favorites</h1>
      <AccountListTabs base="/favorites" active={mediaType} />
      {data.results.length === 0 ? (
        <EmptyAccountList label="Use the Favorite button on any movie or show to add it here." />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
          {data.results.map((item) => (
            <MediaCard key={item.id} item={item} type={mediaType} />
          ))}
        </div>
      )}
      <Suspense>
        <PaginationControls currentPage={page} totalPages={data.total_pages} />
      </Suspense>
    </main>
  )
}

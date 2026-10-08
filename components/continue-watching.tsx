"use client"

import Image from "next/image"
import Link from "next/link"
import { getImageUrl } from "@/lib/tmdb"
import {
  getDetailHref,
  getResumeHref,
  useWatchHistory,
  type WatchItem,
} from "@/lib/watch-history"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, PlayIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { FavoriteHeartButton } from "@/components/favorite-heart-button"

function ContinueCard({
  item,
  onRemove,
}: {
  item: WatchItem
  onRemove: (type: WatchItem["type"], id: number) => void
}) {
  const title = item.type === "movie" ? item.title : item.name
  const imageUrl = getImageUrl(item.poster_path, "w342")
  const resumeHref = getResumeHref(item)
  const detailHref = getDetailHref(item)

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border/50 bg-card transition-all hover:border-border hover:shadow-lg hover:-translate-y-0.5">
      <Link href={resumeHref} className="relative aspect-2/3 w-full overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
        <FavoriteHeartButton
          type={item.type}
          id={item.id}
          title={title}
          className="absolute bottom-1.5 right-1.5 z-10"
        />
        {item.type === "tv" && (
          <span className="absolute left-2 top-2 rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
            S{item.season} E{item.episode}
          </span>
        )}
        <span className="absolute bottom-2 left-2 right-10 flex items-center gap-1.5 text-xs font-medium text-white">
          <HugeiconsIcon icon={PlayIcon} strokeWidth={1.5} className="size-3.5 shrink-0" />
          <span className="truncate">
            {item.type === "movie"
              ? "Continue movie"
              : item.episodeName ?? `Episode ${item.episode}`}
          </span>
        </span>
      </Link>
      <button
        type="button"
        aria-label={`Remove ${title} from Continue Watching`}
        onClick={() => onRemove(item.type, item.id)}
        className={cn(
          "absolute right-1.5 top-1.5 rounded-md bg-black/60 p-1.5 text-white",
          "opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 focus-visible:opacity-100"
        )}
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.5} className="size-3.5" />
      </button>
      <div className="flex flex-col gap-0.5 p-2.5">
        <Link
          href={detailHref}
          className="line-clamp-2 text-sm font-medium leading-tight hover:underline"
        >
          {title}
        </Link>
        <span className="text-xs text-muted-foreground">
          {item.type === "movie" ? "Movie" : `S${item.season} E${item.episode}`}
        </span>
      </div>
    </div>
  )
}

export function ContinueWatching() {
  const { items, mounted, remove, clear } = useWatchHistory()

  if (!mounted || items.length === 0) return null

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Continue Watching</h2>
        <button
          type="button"
          onClick={clear}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Clear all
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
        {items.slice(0, 14).map((item) => (
          <ContinueCard
            key={`${item.type}-${item.id}`}
            item={item}
            onRemove={remove}
          />
        ))}
      </div>
    </section>
  )
}

import Image from "next/image"
import Link from "next/link"
import { getImageUrl } from "@/lib/tmdb"
import { HugeiconsIcon } from "@hugeicons/react"
import { StarIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { FavoriteHeartButton } from "@/components/favorite-heart-button"
import type { Movie, TVShow } from "@/lib/types"

type MediaCardProps = {
  item: Movie | TVShow
  type: "movie" | "tv"
  className?: string
}

function isMovie(item: Movie | TVShow): item is Movie {
  return "title" in item
}

export function MediaCard({ item, type, className }: MediaCardProps) {
  const title = isMovie(item) ? item.title : item.name
  const date = isMovie(item) ? item.release_date : item.first_air_date
  const year = date ? new Date(date).getFullYear() : null
  const imageUrl = getImageUrl(item.poster_path, "w342")

  const href = `/${type}/${item.id}`

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-border/50 bg-card transition-all hover:border-border hover:shadow-lg hover:-translate-y-0.5",
        className
      )}
    >
      <Link href={href} className="relative block aspect-2/3 w-full overflow-hidden bg-muted">
        <FavoriteHeartButton
          type={type}
          id={item.id}
          title={title}
          className="absolute right-1.5 top-1.5 z-10"
        />
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
      <div className="flex flex-col gap-1 p-2.5">
        <p className="line-clamp-2 text-sm font-medium leading-tight">{title}</p>
        <div className="flex items-center justify-between gap-1">
          {year && (
            <span className="text-xs text-muted-foreground">{year}</span>
          )}
          <div className="flex items-center gap-0.5 ml-auto">
            <HugeiconsIcon icon={StarIcon} className="size-3 text-yellow-500" strokeWidth={1.5} />
            <span className="text-xs text-muted-foreground">
              {item.vote_average.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MediaCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border/50 bg-card">
      <div className="aspect-2/3 w-full bg-muted animate-pulse" />
      <div className="flex flex-col gap-2 p-2.5">
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
        <div className="h-3 w-16 rounded bg-muted animate-pulse" />
      </div>
    </div>
  )
}

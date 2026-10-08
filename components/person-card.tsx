import Image from "next/image"
import Link from "next/link"
import { getImageUrl } from "@/lib/tmdb"
import { cn } from "@/lib/utils"
import type { Person } from "@/lib/types"

type PersonCardProps = {
  person: Person
  className?: string
}

export function PersonCard({ person, className }: PersonCardProps) {
  const imageUrl = getImageUrl(person.profile_path, "w342")
  const knownFor = person.known_for
    .map((k) => k.title ?? k.name)
    .filter(Boolean)
    .slice(0, 3)

  const href = `/person/${person.id}`

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-border/50 bg-card transition-all hover:border-border hover:shadow-lg hover:-translate-y-0.5",
        className
      )}
    >
      <Link href={href} className="relative block aspect-2/3 w-full overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={person.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
      </Link>
      <div className="flex flex-col gap-1 p-2.5">
        <p className="line-clamp-2 text-sm font-medium leading-tight">{person.name}</p>
        {person.known_for_department && (
          <span className="text-xs text-muted-foreground">{person.known_for_department}</span>
        )}
        {knownFor.length > 0 && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{knownFor.join(", ")}</p>
        )}
      </div>
    </div>
  )
}

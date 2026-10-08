import Link from "next/link"
import { MediaCard } from "@/components/media-card"

export function ConnectTmdbPrompt({ title }: { title: string }) {
  return (
    <main className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 py-10">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">
        Connect your TMDB account to see your {title.toLowerCase()} here. It
        syncs with your profile on themoviedb.org.
      </p>
      <Link
        href="/api/auth/tmdb/start"
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        Connect TMDB
      </Link>
    </main>
  )
}

const MEDIA_TABS = [
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV Shows" },
] as const

export function AccountListTabs({
  base,
  active,
  params,
  tabs = MEDIA_TABS,
}: {
  base: string
  active: string
  params?: Record<string, string>
  tabs?: readonly { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <Link
          key={t.value}
          href={`${base}?${new URLSearchParams({ ...params, type: t.value })}`}
          className={
            active === t.value
              ? "inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
              : "inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
          }
        >
          {t.label}
        </Link>
      ))}
    </div>
  )
}

export function EmptyAccountList({ label }: { label: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      Nothing here yet. {label}
    </p>
  )
}

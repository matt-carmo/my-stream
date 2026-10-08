"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Input, Button, Sheet, SheetContent, SheetTitle } from "@/components/ui"
import { TmdbAuthButton, useTmdbMe } from "@/components/tmdb-auth-button"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Search01Icon,
  Tv01Icon,
  Film01Icon,
  Home01Icon,
  Menu01Icon,
  Bookmark01Icon,
  FavouriteIcon,
  Logout01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

const NAV_LINKS: { href: string; label: string; icon: IconSvgElement }[] = [
  { href: "/", label: "Home", icon: Home01Icon },
  { href: "/movies", label: "Movies", icon: Film01Icon },
  { href: "/tv", label: "TV Shows", icon: Tv01Icon },
]

const LIBRARY_LINKS: { href: string; label: string; icon: IconSvgElement }[] = [
  { href: "/watchlist", label: "Watchlist", icon: Bookmark01Icon },
  { href: "/favorites", label: "Favorites", icon: FavouriteIcon },
]

function SearchForm({
  autoFullWidth,
  onNavigate,
}: {
  autoFullWidth?: boolean
  onNavigate?: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      onNavigate?.()
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form
      onSubmit={handleSearch}
      className={cn(
        "flex items-center gap-2",
        autoFullWidth ? "w-full" : "ml-auto w-full max-w-sm"
      )}
    >
      <div className="relative flex-1">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={1.5}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies & shows..."
          className="pl-8 h-8 text-sm"
        />
      </div>
      <Button type="submit" size="sm" variant="default" className="shrink-0">
        Search
      </Button>
    </form>
  )
}

function MobileDrawer({
  open,
  onClose,
  tmdb,
}: {
  open: boolean
  onClose: () => void
  tmdb: ReturnType<typeof useTmdbMe>
}) {
  const pathname = usePathname()
  const { me, signOut } = tmdb

  async function handleSiteSignOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null)
    window.location.href = "/login"
  }

  function linkClass(href: string) {
    return cn(
      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
      pathname === href
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    )
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-72 max-w-[85vw] gap-5 p-4 md:hidden">
        <SheetTitle className="text-lg font-bold tracking-tight text-primary">
          CineStream
        </SheetTitle>

        <SearchForm autoFullWidth onNavigate={onClose} />

        <nav className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Browse
          </p>
          {NAV_LINKS.map(({ href, label, icon }) => (
            <Link key={href} href={href} onClick={onClose} className={linkClass(href)}>
              <HugeiconsIcon icon={icon} strokeWidth={1.5} className="size-5" />
              {label}
            </Link>
          ))}
        </nav>

        {me.status === "in" && (
          <nav className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              My Library
            </p>
            {LIBRARY_LINKS.map(({ href, label, icon }) => (
              <Link key={href} href={href} onClick={onClose} className={linkClass(href)}>
                <HugeiconsIcon icon={icon} strokeWidth={1.5} className="size-5" />
                {label}
              </Link>
            ))}
          </nav>
        )}

        <div className="mt-auto flex flex-col gap-2 border-t border-border/50 pt-4">
          {me.status === "in" ? (
            <>
              <p className="px-3 text-xs text-muted-foreground">
                TMDB connected as{" "}
                <span className="font-medium text-foreground">{me.username}</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={async () => {
                  await signOut()
                  onClose()
                }}
              >
                Disconnect TMDB
              </Button>
            </>
          ) : me.status === "out" ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                window.location.href = "/api/auth/tmdb/start"
              }}
            >
              Connect TMDB
            </Button>
          ) : null}
          <button
            type="button"
            onClick={handleSiteSignOut}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <HugeiconsIcon icon={Logout01Icon} strokeWidth={1.5} className="size-4" />
            Sign out of this site
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  // Single source of truth so disconnecting TMDB updates every part of the navbar
  const tmdb = useTmdbMe()
  const desktopLinks = tmdb.me.status === "in" ? [...NAV_LINKS, ...LIBRARY_LINKS] : NAV_LINKS

  // Close the drawer on navigation.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <Link href="/" className="mr-2 flex items-center gap-2 shrink-0">
            <span className="text-lg font-bold tracking-tight text-primary">
              CineStream
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {desktopLinks.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <HugeiconsIcon icon={icon} strokeWidth={1.5} className="size-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden min-w-0 flex-1 md:flex">
            <SearchForm />
          </div>

          <TmdbAuthButton {...tmdb} />

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="ml-auto rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted md:hidden"
          >
            <HugeiconsIcon icon={Menu01Icon} strokeWidth={1.5} className="size-6" />
          </button>
        </div>
      </header>

      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} tmdb={tmdb} />
    </>
  )
}

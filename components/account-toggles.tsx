"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui"
import { HugeiconsIcon } from "@hugeicons/react"
import { StarIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

type AccountTogglesProps = {
  type: "movie" | "tv"
  id: number
}

type States =
  | { connected: false }
  | { connected: true; favorite: boolean; watchlist: boolean; rated: number | null }

async function postJson(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (res.status === 401) throw new Error("auth")
  if (!res.ok) throw new Error("request")
}

export function AccountToggles({ type, id }: AccountTogglesProps) {
  const [states, setStates] = useState<States | null>(null)
  const [busy, setBusy] = useState<"favorite" | "watchlist" | "rating" | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/tmdb/states?type=${type}&id=${id}`)
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 401) {
          setStates({ connected: false })
          return
        }
        if (!res.ok) return
        const data = (await res.json()) as {
          favorite: boolean
          watchlist: boolean
          rated: number | null
        }
        setStates({ connected: true, ...data })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [type, id])

  const toggle = useCallback(
    async (action: "favorite" | "watchlist") => {
      if (!states || !states.connected || busy) return
      const prev = states[action]
      setStates({ ...states, [action]: !prev })
      setBusy(action)
      try {
        await postJson("/api/tmdb/toggle", {
          action,
          media_type: type,
          media_id: id,
          value: !prev,
        })
      } catch (e) {
        if ((e as Error).message === "auth") {
          setStates({ connected: false })
        } else {
          setStates({ ...states, [action]: prev })
        }
      } finally {
        setBusy(null)
      }
    },
    [states, busy, type, id]
  )

  const rate = useCallback(
    async (value: number | null) => {
      if (!states || !states.connected || busy) return
      const prev = states.rated
      setStates({ ...states, rated: value })
      setBusy("rating")
      try {
        await postJson("/api/tmdb/rating", {
          media_type: type,
          media_id: id,
          value,
        })
      } catch (e) {
        if ((e as Error).message === "auth") {
          setStates({ connected: false })
        } else {
          setStates({ ...states, rated: prev })
        }
      } finally {
        setBusy(null)
      }
    },
    [states, busy, type, id]
  )

  if (!states) return null

  if (!states.connected) {
    return (
      <div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            window.location.href = "/api/auth/tmdb/start"
          }}
        >
          Connect TMDB to save favorites & ratings
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={states.favorite ? "default" : "outline"}
          disabled={busy !== null}
          onClick={() => toggle("favorite")}
        >
          {states.favorite ? "Favorited" : "Favorite"}
        </Button>
        <Button
          size="sm"
          variant={states.watchlist ? "default" : "outline"}
          disabled={busy !== null}
          onClick={() => toggle("watchlist")}
        >
          {states.watchlist ? "In Watchlist" : "Add to Watchlist"}
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <span className="mr-1 text-xs text-muted-foreground">Your rating:</span>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const filled = states.rated !== null && n <= states.rated
          return (
            <button
              key={n}
              type="button"
              disabled={busy !== null}
              aria-label={`Rate ${n} out of 10`}
              aria-pressed={states.rated === n}
              onClick={() => rate(states.rated === n ? null : n)}
              className="rounded p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
            >
              <HugeiconsIcon
                icon={StarIcon}
                strokeWidth={1.5}
                fill={filled ? "currentColor" : "none"}
                className={cn("size-4", filled ? "text-yellow-500" : "text-muted-foreground")}
              />
            </button>
          )
        })}
        {states.rated !== null && (
          <span className="ml-1 text-xs font-semibold text-foreground">{states.rated}/10</span>
        )}
        {states.rated !== null && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => rate(null)}
            className="ml-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

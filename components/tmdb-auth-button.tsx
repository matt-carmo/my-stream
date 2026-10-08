"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, Logout01Icon } from "@hugeicons/core-free-icons"
import {
  Button,
  buttonVariants,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui"
import { cn } from "@/lib/utils"

export type TmdbMeState =
  | { status: "loading" }
  | { status: "out" }
  | { status: "in"; username: string }

export function useTmdbMe(): {
  me: TmdbMeState
  signOut: () => Promise<void>
} {
  const router = useRouter()
  const [me, setMe] = useState<TmdbMeState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    fetch("/api/tmdb/me")
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) {
          setMe({ status: "out" })
          return
        }
        const data = (await res.json()) as { username?: string }
        setMe({ status: "in", username: data.username ?? "TMDB" })
      })
      .catch(() => {
        if (!cancelled) setMe({ status: "out" })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const signOut = useCallback(async () => {
    await fetch("/api/auth/tmdb/logout", { method: "POST" }).catch(() => null)
    setMe({ status: "out" })
    router.refresh()
  }, [router])

  return { me, signOut }
}

export function TmdbAuthButton({ me, signOut }: ReturnType<typeof useTmdbMe>) {
  if (me.status === "loading") return null

  if (me.status === "out") {
    return (
      <Button
        size="sm"
        variant="outline"
        className="hidden shrink-0 sm:inline-flex"
        onClick={() => {
          window.location.href = "/api/auth/tmdb/start"
        }}
      >
        Connect TMDB
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "hidden max-w-40 shrink-0 text-muted-foreground sm:inline-flex"
        )}
      >
        <span className="truncate">{me.username}</span>
        <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>TMDB account</DropdownMenuLabel>
          <DropdownMenuItem variant="destructive" onClick={signOut}>
            <HugeiconsIcon icon={Logout01Icon} strokeWidth={1.5} />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

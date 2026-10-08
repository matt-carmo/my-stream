"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Button, Input } from "@/components/ui"

// Only same-origin paths are allowed after login, so a crafted ?next= link
// can't send the user to another site (e.g. "//evil.com" or "/\evil.com").
function getSafeRedirect(next: string | null) {
  if (!next) return "/"
  try {
    const url = new URL(next, window.location.origin)
    if (url.origin !== window.location.origin) return "/"
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return "/"
  }
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = (await res.json().catch(() => null)) as {
        error?: string
      } | null
      if (!res.ok) {
        setError(data?.error ?? "Wrong password")
        return
      }
      router.push(getSafeRedirect(searchParams.get("next")))
      router.refresh()
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-bold tracking-tight">
        <span className="text-primary">CineStream</span>
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This site is private. Enter the access password to continue.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Access password"
          autoComplete="current-password"
          autoFocus
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading || !password}>
          {loading ? "Checking..." : "Enter"}
        </Button>
      </form>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

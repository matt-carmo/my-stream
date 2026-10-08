import { NextResponse } from "next/server"
import { setFavorite, setWatchlist } from "@/lib/tmdb-account"
import { requireTmdbAccount } from "@/lib/tmdb-session"
import { rejectWithoutSiteSession } from "@/lib/site-session"

// POST /api/tmdb/toggle { action: "favorite" | "watchlist", media_type, media_id, value }
export async function POST(req: Request) {
  const denied = await rejectWithoutSiteSession()
  if (denied) return denied

  const authed = await requireTmdbAccount()
  if (!authed) {
    return NextResponse.json({ error: "TMDB not connected" }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as {
    action?: unknown
    media_type?: unknown
    media_id?: unknown
    value?: unknown
  } | null

  const action = body?.action
  const media_type = body?.media_type
  const media_id = Number(body?.media_id)
  const value = body?.value === true

  if (
    (action !== "favorite" && action !== "watchlist") ||
    (media_type !== "movie" && media_type !== "tv") ||
    !Number.isFinite(media_id)
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  try {
    if (action === "favorite") {
      await setFavorite(authed.sessionId, authed.account.id, media_type, media_id, value)
    } else {
      await setWatchlist(authed.sessionId, authed.account.id, media_type, media_id, value)
    }
    return NextResponse.json({ ok: true, [action]: value })
  } catch {
    return NextResponse.json({ error: "TMDB request failed" }, { status: 502 })
  }
}

import { NextResponse } from "next/server"
import { setRating } from "@/lib/tmdb-account"
import { requireTmdbAccount } from "@/lib/tmdb-session"
import { rejectWithoutSiteSession } from "@/lib/site-session"

// POST /api/tmdb/rating { media_type, media_id, value: 0.5-10 | null }
export async function POST(req: Request) {
  const denied = await rejectWithoutSiteSession()
  if (denied) return denied

  const authed = await requireTmdbAccount()
  if (!authed) {
    return NextResponse.json({ error: "TMDB not connected" }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as {
    media_type?: unknown
    media_id?: unknown
    value?: unknown
  } | null

  const media_type = body?.media_type
  const media_id = Number(body?.media_id)
  const rawValue = body?.value
  const value =
    rawValue === null || rawValue === undefined ? null : Number(rawValue)

  if (
    (media_type !== "movie" && media_type !== "tv") ||
    !Number.isFinite(media_id) ||
    (value !== null && !(value >= 0.5 && value <= 10))
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  try {
    await setRating(authed.sessionId, media_type, media_id, value)
    return NextResponse.json({ ok: true, rated: value })
  } catch {
    return NextResponse.json({ error: "TMDB request failed" }, { status: 502 })
  }
}

import { NextResponse } from "next/server"
import { getAccountList } from "@/lib/tmdb-account"
import { requireTmdbAccount } from "@/lib/tmdb-session"
import type { Movie, PaginatedResponse, TVShow } from "@/lib/types"
import { rejectWithoutSiteSession } from "@/lib/site-session"

// GET /api/tmdb/list?kind=favorite|watchlist&type=movie|tv&page=1
export async function GET(req: Request) {
  const denied = await rejectWithoutSiteSession()
  if (denied) return denied

  const authed = await requireTmdbAccount()
  if (!authed) {
    return NextResponse.json({ error: "TMDB not connected" }, { status: 401 })
  }

  const url = new URL(req.url)
  const kind = url.searchParams.get("kind")
  const type = url.searchParams.get("type")
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1)

  if (
    (kind !== "favorite" && kind !== "watchlist") ||
    (type !== "movie" && type !== "tv")
  ) {
    return NextResponse.json({ error: "Invalid kind or type" }, { status: 400 })
  }

  try {
    const data = await getAccountList<PaginatedResponse<Movie | TVShow>>(
      authed.sessionId,
      authed.account.id,
      kind,
      type,
      page
    )
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "TMDB request failed" }, { status: 502 })
  }
}

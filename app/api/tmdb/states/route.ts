import { NextResponse } from "next/server"
import { getAccountStates } from "@/lib/tmdb-account"
import { requireTmdbAccount } from "@/lib/tmdb-session"
import { rejectWithoutSiteSession } from "@/lib/site-session"

export async function GET(req: Request) {
  const denied = await rejectWithoutSiteSession()
  if (denied) return denied

  const authed = await requireTmdbAccount()
  if (!authed) {
    return NextResponse.json({ error: "TMDB not connected" }, { status: 401 })
  }

  const url = new URL(req.url)
  const type = url.searchParams.get("type")
  const id = Number(url.searchParams.get("id"))
  if ((type !== "movie" && type !== "tv") || !Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid type or id" }, { status: 400 })
  }

  try {
    const states = await getAccountStates(authed.sessionId, type, id)
    return NextResponse.json(states)
  } catch {
    return NextResponse.json({ error: "TMDB request failed" }, { status: 502 })
  }
}

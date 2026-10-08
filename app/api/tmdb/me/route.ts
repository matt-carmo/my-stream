import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { TMDB_SESSION_COOKIE, getAccount } from "@/lib/tmdb-account"
import { rejectWithoutSiteSession } from "@/lib/site-session"

export async function GET() {
  const denied = await rejectWithoutSiteSession()
  if (denied) return denied

  const sessionId = (await cookies()).get(TMDB_SESSION_COOKIE)?.value
  if (!sessionId) {
    return NextResponse.json({ connected: false }, { status: 401 })
  }
  try {
    const account = await getAccount(sessionId)
    return NextResponse.json({ connected: true, ...account })
  } catch {
    return NextResponse.json({ connected: false }, { status: 401 })
  }
}

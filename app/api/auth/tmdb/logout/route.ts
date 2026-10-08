import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import {
  TMDB_SESSION_COOKIE,
  TMDB_USER_COOKIE,
  deleteSession,
} from "@/lib/tmdb-account"
import { rejectWithoutSiteSession } from "@/lib/site-session"

export async function POST() {
  const denied = await rejectWithoutSiteSession()
  if (denied) return denied

  const store = await cookies()
  const sessionId = store.get(TMDB_SESSION_COOKIE)?.value
  if (sessionId) await deleteSession(sessionId)

  const res = NextResponse.json({ ok: true })
  const secure = process.env.NODE_ENV === "production"
  for (const name of [TMDB_SESSION_COOKIE, TMDB_USER_COOKIE]) {
    res.cookies.set(name, "", {
      httpOnly: name === TMDB_SESSION_COOKIE,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
  }
  return res
}

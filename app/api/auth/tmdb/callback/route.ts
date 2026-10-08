import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import {
  TMDB_REQUEST_TOKEN_COOKIE,
  TMDB_SESSION_COOKIE,
  TMDB_USER_COOKIE,
  createSession,
  getAccount,
} from "@/lib/tmdb-account"
import { rejectWithoutSiteSession } from "@/lib/site-session"

const THIRTY_DAYS = 60 * 60 * 24 * 30

function redirectClearingToken(url: URL) {
  const res = NextResponse.redirect(url)
  res.cookies.set(TMDB_REQUEST_TOKEN_COOKIE, "", { path: "/api/auth/tmdb", maxAge: 0 })
  return res
}

export async function GET(req: Request) {
  const denied = await rejectWithoutSiteSession()
  if (denied) return denied

  const url = new URL(req.url)
  const requestToken = url.searchParams.get("request_token")
  const expectedToken = (await cookies()).get(TMDB_REQUEST_TOKEN_COOKIE)?.value

  if (!requestToken) {
    return redirectClearingToken(new URL("/?tmdb=denied", url.origin))
  }

  // Login CSRF guard: only finish a flow this browser started
  if (!expectedToken || requestToken !== expectedToken) {
    console.warn("[tmdb-callback] - request token does not match the one issued to this browser.")
    return redirectClearingToken(new URL("/?tmdb=error", url.origin))
  }

  try {
    const sessionId = await createSession(requestToken)
    const account = await getAccount(sessionId)

    const res = redirectClearingToken(new URL("/?tmdb=connected", url.origin))
    const secure = process.env.NODE_ENV === "production"
    res.cookies.set(TMDB_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: THIRTY_DAYS,
    })
    res.cookies.set(TMDB_USER_COOKIE, account.username || `user-${account.id}`, {
      httpOnly: false,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: THIRTY_DAYS,
    })
    return res
  } catch {
    return redirectClearingToken(new URL("/?tmdb=error", url.origin))
  }
}

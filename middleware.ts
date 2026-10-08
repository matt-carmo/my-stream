import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getCookieName, verifySessionValue } from "@/lib/site-auth"

// The TMDB connect flow (/api/auth/tmdb/*) is deliberately not public: it
// spends the site's TMDB token and must only run for signed-in visitors.
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"]

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"]

// CSRF defence in depth on top of sameSite=lax cookies: browsers always send
// Origin on cross-site writes, so any write from another origin is refused.
// Requests without Origin (non-browser clients) can't carry the victim's cookies.
function isCrossOriginWrite(req: NextRequest) {
  if (SAFE_METHODS.includes(req.method)) return false
  const origin = req.headers.get("origin")
  if (!origin) return false
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
  try {
    return new URL(origin).host !== host
  } catch {
    // e.g. "Origin: null" from sandboxed or opaque contexts
    return true
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isCrossOriginWrite(req)) {
    console.warn(`[middleware] - cross-origin ${req.method} to ${pathname} blocked.`)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next()

  const secret = process.env.SITE_AUTH_SECRET
  const value = req.cookies.get(getCookieName())?.value
  const ok = secret ? await verifySessionValue(secret, value) : false

  if (ok) return NextResponse.next()

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const loginUrl = new URL("/login", req.url)
  loginUrl.searchParams.set("next", pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"],
}

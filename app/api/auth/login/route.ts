import { NextResponse } from "next/server"
import {
  SESSION_MAX_AGE_SECONDS,
  createSessionValue,
  getCookieName,
  verifyPassword,
} from "@/lib/site-auth"
import { createRateLimiter } from "@/lib/rate-limit"

const FIFTEEN_MINUTES = 15 * 60 * 1000

const attemptsPerIp = createRateLimiter({ limit: 5, windowMs: FIFTEEN_MINUTES })
// X-Forwarded-For can be spoofed when there is no trusted proxy in front, so a
// global cap still bounds brute force across all "IPs".
const attemptsGlobal = createRateLimiter({ limit: 30, windowMs: FIFTEEN_MINUTES })
const GLOBAL_KEY = "global"

function getClientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  )
}

export async function POST(req: Request) {
  const secret = process.env.SITE_AUTH_SECRET
  const expectedHash = process.env.SITE_ACCESS_PASSWORD_HASH
  if (!secret || !expectedHash) {
    return NextResponse.json(
      { error: "Site access is not configured" },
      { status: 500 }
    )
  }

  let password = ""
  try {
    const body = (await req.json()) as { password?: unknown }
    password = typeof body.password === "string" ? body.password : ""
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const ip = getClientIp(req)
  const retryAfter = Math.max(attemptsPerIp.retryAfter(ip), attemptsGlobal.retryAfter(GLOBAL_KEY))
  if (retryAfter > 0) {
    console.warn(`[auth-login] - rate limit hit for ${ip}, retry in ${retryAfter}s.`)
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  // Counted before the password check so parallel requests can't all slip
  // through while the first ones are still being verified.
  attemptsPerIp.hit(ip)
  attemptsGlobal.hit(GLOBAL_KEY)

  if (!password || !(await verifyPassword(password, expectedHash))) {
    // Generic message: do not reveal whether the gate is misconfigured.
    await new Promise((r) => setTimeout(r, 400))
    return NextResponse.json({ error: "Wrong password" }, { status: 401 })
  }

  attemptsPerIp.reset(ip)
  attemptsGlobal.reset(GLOBAL_KEY)

  const res = NextResponse.json({ ok: true })
  res.cookies.set(getCookieName(), await createSessionValue(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return res
}

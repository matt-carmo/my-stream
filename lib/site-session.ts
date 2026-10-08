import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getCookieName, verifySessionValue } from "@/lib/site-auth"

// Second line of defence behind middleware.ts: a middleware bypass must not
// be enough to reach protected pages or API routes.
export async function hasSiteSession() {
  const secret = process.env.SITE_AUTH_SECRET
  if (!secret) return false
  const value = (await cookies()).get(getCookieName())?.value
  return verifySessionValue(secret, value)
}

/** Returns a 401 response when the site cookie is missing or invalid, otherwise null. */
export async function rejectWithoutSiteSession() {
  if (await hasSiteSession()) return null
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

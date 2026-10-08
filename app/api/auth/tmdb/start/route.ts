import { NextResponse } from "next/server"
import {
  TMDB_REQUEST_TOKEN_COOKIE,
  approveUrl,
  createRequestToken,
} from "@/lib/tmdb-account"
import { rejectWithoutSiteSession } from "@/lib/site-session"

const TEN_MINUTES = 60 * 10

export async function GET(req: Request) {
  const denied = await rejectWithoutSiteSession()
  if (denied) return denied

  try {
    const token = await createRequestToken()
    const callbackUrl = new URL("/api/auth/tmdb/callback", req.url).toString()
    const res = NextResponse.redirect(approveUrl(token, callbackUrl))
    res.cookies.set(TMDB_REQUEST_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/tmdb",
      maxAge: TEN_MINUTES,
    })
    return res
  } catch {
    return NextResponse.json(
      { error: "Could not start TMDB login" },
      { status: 502 }
    )
  }
}

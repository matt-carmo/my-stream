import { NextResponse } from "next/server"
import { getTVSeason } from "@/lib/tmdb"
import { rejectWithoutSiteSession } from "@/lib/site-session"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; season: string }> }
) {
  const denied = await rejectWithoutSiteSession()
  if (denied) return denied

  const { id, season } = await params
  try {
    const data = await getTVSeason(Number(id), Number(season))
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}

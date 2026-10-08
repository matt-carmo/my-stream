// Server-side helpers for the official TMDB account flow.
// The TMDB `session_id` never leaves the server: it lives in an httpOnly
// cookie and is only used by proxy routes under /api/tmdb/*.

const TMDB_BASE = "https://api.themoviedb.org/3"

export const TMDB_SESSION_COOKIE = "tmdb-session"
export const TMDB_USER_COOKIE = "tmdb-user"
// Binds the callback to the browser that started the flow (acts as OAuth "state")
export const TMDB_REQUEST_TOKEN_COOKIE = "tmdb-request-token"

export type TmdbAccount = {
  id: number
  username: string
}

function tmdbHeaders(): HeadersInit {
  const token = process.env.TMDB_API_TOKEN
  if (!token) throw new Error("TMDB_API_TOKEN is not set")
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

async function tmdb<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${TMDB_BASE}${path}`, {
    ...init,
    headers: tmdbHeaders(),
    cache: "no-store",
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`TMDB error ${res.status}: ${detail.slice(0, 200)}`)
  }
  return (await res.json()) as T
}

/** Step 1: create a request token the user must approve on themoviedb.org. */
export async function createRequestToken(): Promise<string> {
  const data = await tmdb<{ request_token: string }>(
    "/authentication/token/new"
  )
  return data.request_token
}

/** Step 2: exchange an approved request token for a session id. */
export async function createSession(requestToken: string): Promise<string> {
  const data = await tmdb<{ session_id: string }>(
    "/authentication/session/new",
    {
      method: "POST",
      body: JSON.stringify({ request_token: requestToken }),
    }
  )
  return data.session_id
}

/** Best-effort remote logout (ignores failures: local cookies are cleared anyway). */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await tmdb("/authentication/session", {
      method: "DELETE",
      body: JSON.stringify({ session_id: sessionId }),
    })
  } catch {
    // ignore
  }
}

export async function getAccount(sessionId: string): Promise<TmdbAccount> {
  const data = await tmdb<{ id: number; username: string }>(
    `/account?session_id=${encodeURIComponent(sessionId)}`
  )
  return { id: data.id, username: data.username }
}

export function approveUrl(requestToken: string, callbackUrl: string): string {
  return `https://www.themoviedb.org/authenticate/${encodeURIComponent(
    requestToken
  )}?redirect_to=${encodeURIComponent(callbackUrl)}`
}

// ─── Account library (favorites / watchlist / ratings) ──────────────────────
// All of these require a user `session_id`; they are only ever called from
// server-side proxy routes so the session never reaches the browser.

export type MediaKind = "movie" | "tv"

export type AccountStates = {
  favorite: boolean
  watchlist: boolean
  rated: number | null
}

export async function getAccountStates(
  sessionId: string,
  mediaType: MediaKind,
  mediaId: number
): Promise<AccountStates> {
  const data = await tmdb<{ favorite: boolean; watchlist: boolean; rated: { value: number } | boolean }>(
    `/${mediaType}/${mediaId}/account_states?session_id=${encodeURIComponent(sessionId)}`
  )
  return {
    favorite: data.favorite === true,
    watchlist: data.watchlist === true,
    rated:
      typeof data.rated === "object" && data.rated !== null
        ? data.rated.value
        : null,
  }
}

async function accountAction(
  sessionId: string,
  accountId: number,
  action: "favorite" | "watchlist",
  mediaType: MediaKind,
  mediaId: number,
  value: boolean
): Promise<void> {
  await tmdb(
    `/account/${accountId}/${action}?session_id=${encodeURIComponent(sessionId)}`,
    {
      method: "POST",
      body: JSON.stringify({
        media_type: mediaType,
        media_id: mediaId,
        [action]: value,
      }),
    }
  )
}

export async function setFavorite(
  sessionId: string,
  accountId: number,
  mediaType: MediaKind,
  mediaId: number,
  value: boolean
): Promise<void> {
  await accountAction(sessionId, accountId, "favorite", mediaType, mediaId, value)
}

export async function setWatchlist(
  sessionId: string,
  accountId: number,
  mediaType: MediaKind,
  mediaId: number,
  value: boolean
): Promise<void> {
  await accountAction(sessionId, accountId, "watchlist", mediaType, mediaId, value)
}

/** value 0.5–10 to rate, null to remove the rating. */
export async function setRating(
  sessionId: string,
  mediaType: MediaKind,
  mediaId: number,
  value: number | null
): Promise<void> {
  const path = `/${mediaType}/${mediaId}/rating?session_id=${encodeURIComponent(sessionId)}`
  if (value === null) {
    await tmdb(path, { method: "DELETE" })
    return
  }
  await tmdb(path, {
    method: "POST",
    body: JSON.stringify({ value }),
  })
}

export type AccountListKind = "favorite" | "watchlist"

export async function getAccountList<T>(
  sessionId: string,
  accountId: number,
  kind: AccountListKind,
  mediaType: MediaKind,
  page = 1
): Promise<T> {
  const list = kind === "favorite" ? "favorite" : "watchlist"
  const bucket = mediaType === "movie" ? "movies" : "tv"
  return tmdb<T>(
    `/account/${accountId}/${list}/${bucket}?session_id=${encodeURIComponent(
      sessionId
    )}&page=${page}`
  )
}

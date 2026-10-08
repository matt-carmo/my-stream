# AGENTS.md — CineStream (`my-stream`)

Personal streaming front-end: browse/search TMDB movies & TV shows and watch
them through an external embed player. Single-user, private site.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- shadcn/ui (`base-mira` style) on top of `@base-ui/react` — **not Radix**.
  New primitives go in `components/ui/` mirroring `select.tsx`/`tabs.tsx`
  (`data-slot`, `cn`, Hugeicons) and must be exported from
  `components/ui/index.ts`.
- Icons: `@hugeicons/react` + `@hugeicons/core-free-icons` (British
  spelling, e.g. `FavouriteIcon`, `Cancel01Icon`).
- Data: TMDB API v3, Bearer token. Docs index: `https://developer.themoviedb.org/llms.txt`
  (append `.md` to any docs page for markdown).
- **Site UI language is English. Always.** (User speaks Portuguese in chat,
  but every user-facing string must be English.)

## Scripts & verification

- `npm run dev` / `build` / `start`; `npm run typecheck` (`tsc --noEmit`);
  `npm run lint` is **broken repo-wide** (`eslint.config.js` imports
  `@lib/eslint-config`, not installed) — pre-existing, unrelated to changes.
- After changes: run `npm run typecheck`. A dev server usually runs on
  `:3001` — **do not kill it**; it hot-reloads. But `.env` changes require a
  manual restart (ask the user).
- Smoke tests used before: `/` → 307 to `/login`; `/login` → 200;
  `/api/tmdb/me` without cookie → 401.

## Environment (`.env`, gitignored — see `.env.local.example`)

| Var | Purpose |
|---|---|
| `TMDB_API_TOKEN` | TMDB v3 Bearer token (read + account actions) |
| `SITE_ACCESS_PASSWORD_HASH` | SHA-256 hex of the single site password (raw password never stored) |
| `SITE_AUTH_SECRET` | Random secret signing the `site-auth` cookie (HMAC) |

## Auth model (two independent layers)

1. **Site gate** — single shared password, no per-user accounts.
   `middleware.ts` protects everything except `/login`, `/api/auth/login`,
   `/api/auth/logout` and `/_next/*` + `favicon.ico` (excluded by path prefix in
   `config.matcher` — never by file extension); pages → redirect
   `/login?next=…`, APIs → 401. The TMDB connect routes are **not** public.
   It also rejects (403) any non-GET request whose `Origin` isn't this host.
   Global security headers (X-Frame-Options/frame-ancestors, nosniff,
   Referrer-Policy, HSTS in prod, no X-Powered-By) live in `next.config.mjs`;
   the `/watch` CSP overrides the global one, so it repeats `frame-ancestors`.
   `POST /api/auth/login` compares SHA-256 timing-safe, is rate limited
   (`lib/rate-limit.ts`: 5/IP + 30 global per 15 min) and sets httpOnly
   `site-auth` (`v2.<rand>.<issuedAt>.<hmac>`); expiry (30d) is enforced
   server-side, so a copied cookie dies after 30d. Rotating `SITE_AUTH_SECRET`
   signs everyone out. `POST /api/auth/logout` clears it. `?next=` is
   validated as same-origin before redirecting.
   Defence in depth: `lib/site-session.ts` re-checks the cookie in
   `app/(site)/layout.tsx` and at the top of every protected API route.
   Helpers: `lib/site-auth.ts` (WebCrypto only — must stay Edge-safe for middleware).
2. **TMDB login** (optional, per browser) — official flow
   `token/new → themoviedb.org/authenticate → session/new`:
   `GET /api/auth/tmdb/start` (stores the request token in a 10-min httpOnly
   `tmdb-request-token` cookie) → `GET /api/auth/tmdb/callback` (rejects a
   token that doesn't match that cookie — login CSRF guard; stores httpOnly
   `tmdb-session` + readable `tmdb-user`, 30d) →
   `POST /api/auth/tmdb/logout` (also `DELETE /authentication/session`).
   `session_id` **never reaches the browser**; all account calls go through
   `app/api/tmdb/*` proxies (`me`, `states`, `toggle`, `rating`, `list`).
   Helpers: `lib/tmdb-account.ts`, `lib/tmdb-session.ts` (`requireTmdbAccount()`).

## State: localStorage vs TMDB (hard rules)

- **TMDB account API stores bookmarks only** (`favorite`, `watchlist`,
  `rated`). There is **no per-episode progress field** — episode checkpoints
  can never live in TMDB. Don't try.
- `Continue Watching` (movie / S+E checkpoint) → localStorage key
  `cinestream:watch-history:v1`, module `lib/watch-history.ts`
  (types, CRUD, `useWatchHistory`, `getResumeHref`). Cap 30, sorted by `updatedAt`.
- Favorites heart state (cards) → `components/favorites-provider.tsx`
  (loads fav movie+TV ids, ≤10 pages each, optimistic toggle + rollback).
- **No custom data API / no database.** Don't create `/api/*` storage
  endpoints; the user has no server beyond Next.js itself.

## Feature inventory (where things live)

- Layouts: root `app/layout.tsx` = fonts + `ThemeProvider` only. Every
  protected page lives in the route group `app/(site)/` (not part of the URL),
  whose `layout.tsx` adds `FavoritesProvider` + `Navbar`. `/login` stays
  outside the group so it renders without the navbar.
- Home `app/(site)/page.tsx`: `HeroBanner` + `ContinueWatching` + `MediaRow`s.
- Detail `app/(site)/movie/[id]/page.tsx`, `app/(site)/tv/[id]/page.tsx`: backdrop/poster
  header, `ResumeWatchButton` (shows `Continue S2 E5` from localStorage),
  `TrailerDialog`, `AccountToggles` (Favorite/Watchlist/rating via proxy,
  optimistic + `Connect TMDB` fallback), Cast, Seasons (`SeasonEpisodeLoader`
  → `/api/tv/[id]/season/[season]`), Similar → Collection (`More From …`,
  movies only) → Recommendations (`You May Also Like`) → `ReviewsSection`.
  Sections render only when data exists.
- Watch `app/(site)/watch/movie|tv/[id]/page.tsx`: external iframe player
  (`components/video-player.tsx`, vsembed) + `TrackMovieWatch`/`TrackTVWatch`
  (`components/track-watch.tsx`) which persist the checkpoint on view.
  Cross-origin iframe ⇒ **exact timestamp resume is impossible**; checkpoint
  is episode-level by design.
- Cards: `MediaCard` (all grids) + `ContinueWatching` cards both embed
  `FavoriteHeartButton` — heart top-right (bottom-right on `ContinueWatching`
  cards, whose top-right holds the remove X), **always visible** (hover-only is
  banned: broken on mobile), red filled (`fill="currentColor"`) when
  favorited; hidden entirely when TMDB not connected. Clicks
  `preventDefault` + `stopPropagation` (cards are links).
- Navbar `components/navbar.tsx`: desktop links + inline search + TMDB
  status; mobile = hamburger → right `Sheet` drawer (search, Browse,
  My Library incl. Watchlist/Favorites, TMDB connect/user, site sign-out).
  `useTmdbMe()` is called once in `Navbar` and passed down, so a TMDB
  sign-out updates every part at once. Watchlist/Favorites (desktop links
  and mobile My Library) render only when TMDB is connected. The TMDB user
  is a `DropdownMenu` (`components/ui/dropdown-menu.tsx`) with Sign out.
- `/watchlist`, `/favorites`: server pages (`force-dynamic`), `?type=` tabs
  + `PaginationControls`; logged-out → `ConnectTmdbPrompt`.
- `/movies`, `/tv`: pure-Discover server pages (`force-dynamic`), no category
  tabs. All filters live in shareable URL params (`sort`, `genres`, `year`,
  `min_rating`, `runtime`, `lang`, `country`, + `release_type` movie /
  `status`+`type` TV, `page`); invalid values fall back silently, empty
  results show a "clear filters" hint. Legacy `?category=` / `?genre=` links
  redirect to the equivalent Discover URL. `FilterBar`
  (`components/filter-bar.tsx`, `mode: "movie" | "tv"`) renders the Sort
  select + `Filters (N)` toggle with active-count badge + `Clear all` and an
  expandable panel (genre chips multi-select with Match all/any AND-OR toggle,
  year, min rating, runtime presets, language, country, release type / TV
  status+type). Every change resets `page`.
- TMDB layer `lib/tmdb.ts` (`fetcher` + 1h revalidate) covers trending,
  popular/now-playing/top-rated/upcoming/airing-today, details, credits,
  similar, recommendations, reviews, collection, images, seasons, search
  multi/movie/tv, genres, discover (`MovieSort` 14 / `TVSort` 12 enums,
  multi-genre AND `,`/OR `|` via `genreIds`+`genreMode`, year, min rating,
  runtime, language, country, release type / TV status+type;
  `parseGenreFilter` shared by pages + `FilterBar`; `vote_count.gte=50` gate
  applies only to rating sorts/filters so future-year results aren't hidden).
- Types: `lib/types.ts` (`Movie.belongs_to_collection`, `Review`,
  `Collection`, `ImagesResponse`, …).

## Working agreements

- Don't commit/push/PR unless explicitly asked. Don't touch git config.
- `lint` is broken — don't try to fix it unsolicited; `typecheck` is the gate.
- Keep UI English; keep secrets in env (hashes only, timing-safe compare).
- Reuse `MediaCard`/`MediaRow`/shadcn primitives; don't hand-roll
  modals/drawers (use `ui/dialog`, `ui/sheet`).
- Session/cookie code must stay Edge-compatible (WebCrypto, no `node:crypto`).

# CineStream

Private, single-user streaming front-end: browse and search movies and TV
shows from [TMDB](https://www.themoviedb.org/) and watch them through an
external embed player. The whole site sits behind a single shared password,
with optional TMDB login for favorites, watchlist and ratings.

## Requirements

- Node.js ≥ 20.9 (required by Next.js 16; developed on Node 24)
- [pnpm](https://pnpm.io/) — the project uses `pnpm-lock.yaml`; don't use
  `npm install`, it recreates `package-lock.json`.
- A TMDB account with an API Read Access Token

## Setup

```bash
pnpm install
cp .env.local.example .env
```

Fill in `.env`:

| Variable | What it is | How to get it |
|---|---|---|
| `TMDB_API_TOKEN` | TMDB v3 **API Read Access Token** (the long `eyJ…` one, not the short API Key) | https://www.themoviedb.org/settings/api |
| `SITE_ACCESS_PASSWORD_HASH` | SHA-256 hex of the site password — **not** the password itself | `pnpm hash-password` |
| `SITE_AUTH_SECRET` | Random secret that signs the login cookie | `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` |

`pnpm hash-password` asks for the password twice (hidden input) and prints
the ready-to-paste `SITE_ACCESS_PASSWORD_HASH=…` line. On the login page you
type the plain password; the server hashes it and compares.

Changes to `.env` only apply after restarting the server.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm typecheck` | TypeScript check (`tsc --noEmit`) |
| `pnpm hash-password` | Generate `SITE_ACCESS_PASSWORD_HASH` |
| `pnpm lint` | ESLint — currently broken (`@lib/eslint-config` is not installed) |
| `pnpm format` | Prettier — not installed as a dependency yet |

There is no test suite; `pnpm typecheck` is the verification gate.

## Dependencies

### Runtime

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.1.6 | Framework (App Router, route handlers, middleware) |
| `react` / `react-dom` | ^19.2.4 | UI library |
| `@base-ui/react` | ^1.0.0 | Headless primitives behind the shadcn/ui components in `components/ui/` |
| `@hugeicons/react` | ^1.1.6 | Icon component |
| `@hugeicons/core-free-icons` | ^4.0.0 | Icon set |
| `class-variance-authority` | ^0.7.0 | Component style variants |
| `clsx` | ^2.0.0 | Conditional class names |
| `tailwind-merge` | ^2.3.0 | Merges conflicting Tailwind classes (`cn()` in `lib/utils.ts`) |
| `next-themes` | ^0.4.6 | Light/dark theme switching |

### Development

| Package | Version | Purpose |
|---|---|---|
| `typescript` | ^5.9.3 | Type checking |
| `@tailwindcss/postcss` | ^4.1.18 | Tailwind CSS v4 via PostCSS |
| `@types/node` | ^25.1.0 | Node.js types |
| `@types/react` / `@types/react-dom` | ^19.2.10 / ^19.2.3 | React types |
| `eslint` | ^9.39.2 | Linting (config currently broken, see Scripts) |

### External services (no package)

- **TMDB API v3** — catalogue data, images (`image.tmdb.org`) and the
  optional account login.
- **Embed player** (`vsembed.ru`) — loaded in an iframe on the watch pages.

## Project docs

`AGENTS.md` describes the architecture, auth model, state rules and working
agreements in detail.

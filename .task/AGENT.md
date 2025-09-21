# AGENT OPERATIONS BRIEF — High-Signal News HUD

## Mission Snapshot
- Deliver a minimalist, high-signal personal news HUD that blends user focus with platform popularity.
- Tech stack: Next.js (App Router), Supabase (auth, Postgres, edge functions), Zustand for client state, Vercel for deploys.
- Primary data sources via user-supplied RSS feeds and Twitter/X handles; bookmarks resurface periodically.

## User Experience North Stars
- Zero-state clarity: explain empty feed and prompt for RSS/X input immediately.
- Calm reading surface: single-page HUD, gentle auto-scroll (7s cadence, pause on user interaction).
- Relevance mix: 70% user-focus by default, inject high-popularity items for serendipity.
- Fast feedback: optimistic source addition, skeleton loaders, realtime updates when new items land.

## Core Systems Overview
- **Supabase**: tables for profiles, sources, items, user_item_scores, bookmarks, jobs. RLS on user-owned rows. Scheduled functions for ingestion and bookmark resurfacing.
- **Ingestion**: RSS edge function (10 min cadence) + Twitter worker (5 min cadence, rate-limit aware). Deduplicate via content hash.
- **APIs**: `/api/sources`, `/api/feed`, `/api/bookmarks`, `/api/preferences`. Feed endpoint applies ranking formula and pagination cursor.
- **Ranking formula**: `0.7 * focusScore + 0.3 * popularityScore`; top banner cycles 2 focus-heavy then 1 popularity-heavy card.
- **State slices (Zustand)**: session, sources, feed, preferences, bookmarks. Persist local-only prefs, sync authoritative data on login.

## Build Phases & Critical Tasks
1. **Environment bootstrap**: Node ≥18, npm/bun present, deps installed, Supabase CLI configured, env vars filled.
2. **Database groundwork**: write migration for schema, indexes, RLS; document schema; enable magic-link auth; seed demo data.
3. **Ingestion scaffolding**: edge function `rss-fetch` + cron entries; Twitter worker stub with retry policy.
4. **Backend routes**: implement `/api/sources`, `/api/feed`, bookmark & preferences APIs with validation, job enqueue, and tests.
5. **Frontend shell**: layout + theme, auth guard for `/hud`, onboarding zero state.
6. **State wiring**: create Zustand slices, persistence, and Supabase sync.
7. **Feature components**: SourceManager, FeedStream (virtualized + auto-scroll banner), FeedCard, FocusControls, BookmarkShelf.
8. **Optional AI hooks**: preferences modal for OpenAI/Gemini keys, summarization toggle plumbing.
9. **Testing & QA**: Jest/unit for ranking + APIs, e2e for onboarding and feed hydration, time-travel test for bookmark resurfacing.
10. **Deployment**: Vercel project, CI enforcing `npm run build`, Supabase prod migrations, cron config; smoke test prod HUD.

## Operational Guardrails
- Favor npm for scripts; bun allowed where faster but optional. No pnpm usage.
- Maintain minimal, high-contrast UI; avoid new colors without review.
- Log ingestion failures; ensure rate-limit backoff to prevent bans.
- Treat bookmarks resurfacing as opt-out friendly (snooze state respected across sessions).
- Keep AI features behind user-provided keys; degrade gracefully if absent.

## Delivery Checklist (pre-ship)
- Local `npm run lint`, `npm run test`, `npm run build` (or bun equivalents) all green.
- Supabase migrations applied + documented; RLS verified with test users.
- Feed ranking validated with sample data covering focus/pop extremes.
- Ingestion jobs observed end-to-end (source add → job queued → items persisted → HUD update).
- Bookmark carousel surfaces after 30 min timer in dev (use mocked timers) and obeys snooze.
- Vercel preview smoke-tested: login, add RSS, view items, bookmark/unbookmark.
- Release notes drafted outlining MVP scope + known gaps.

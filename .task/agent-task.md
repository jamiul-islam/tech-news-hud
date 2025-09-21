# Agent Task List — High-Signal News HUD

## 0. Environment Bootstrap
- [x] Verify Node.js ≥ 18 plus npm and Bun availability (`node -v`, `npm -v`, `bun -v`).
- [x] Install project deps (`npm install`; optionally `bun install`).
- [x] Copy `.env.example` → `.env.local`; fill Supabase keys placeholders.
- [x] Confirm Supabase MCP server connectivity (e.g., `codex mcp list`, test `list_projects` tool).
- [x] Initialize Git hooks/commit linting if required.

## 1. Supabase Schema & Infrastructure
### 1.1 Database Structure
- [x] Create SQL migration defining `profiles`, `sources`, `items`, `user_item_scores`, `bookmarks`, `jobs` tables.
- [x] Add indexes (e.g., `items.published_at`, `bookmarks.user_id`).
- [x] Define row-level security policies for user-scoped tables.
- [x] Document schema in `/docs/schema.md`.
- [x] Apply migration via Supabase MCP (`apply_migration` tool) against target database; verify schema with `list_tables`/custom SQL.

### 1.2 Auth & Storage Setup
- [x] Enable email magic link auth using Supabase MCP (`get_project` + `update` tools or manual console note).
- [ ] Seed demo user through Supabase MCP SQL tool (`execute_sql`).
- [ ] Configure storage bucket via MCP (`execute_sql`/storage tool) or document deferral.

### 1.3 Edge Functions & Cron
- [x] Scaffold Supabase Edge function `rss-fetch` using MCP Edge Function tools; commit generated files locally.
- [ ] Register cron schedule through MCP toolset (e.g., `deploy_edge_function` + schedule API).
- [ ] Document cron cadence and failure handling.

## 2. Backend (Next.js API Routes)
### 2.1 Source Management API
- [x] Implement `POST /api/sources` validating RSS URL or X handle.
- [ ] Insert source row, enqueue job (`jobs` table) inside route (persisted via Supabase client SDK calls).
- [x] Implement `DELETE /api/sources/:id` with ownership checks.
- [ ] Write integration tests using `@testing-library/jest-dom` + mocked Supabase client.

### 2.2 Feed Retrieval API
- [x] Implement `GET /api/feed` merging items, applying ranking formula.
- [ ] Support pagination cursor and `mixRatio` query param.
- [ ] Add caching layer (in-memory for MVP) to avoid duplicate scoring.
- [ ] Unit test ranking algorithm (mock data covering focus/popularity extremes).

### 2.3 Bookmark & Preferences API
- [x] Implement `POST /api/bookmarks` + `DELETE /api/bookmarks/:id`.
- [x] Implement `POST /api/preferences` persisting focus weights, scroll speed, theme.
- [ ] Add tests verifying policies prevent cross-user access.

## 3. Ingestion Workers
### 3.1 RSS Pipeline
- [x] Implement Supabase Edge function/worker parsing RSS (`feedparser`, dedupe via hash) and deploy via MCP.
- [x] Normalize content into `items` table with focus topic classification placeholder.
- [x] Log ingestion attempts to `jobs` table; update status (verify via MCP queries).
- [ ] Add regression test for RSS parser with fixture feed.

### 3.2 Twitter/X Pipeline
- [ ] Create worker stub using `twitter-api-sdk` (user token input) and plan deployment path (MCP-managed).
- [ ] Normalize tweets into `items` table with engagement metrics.
- [ ] Handle rate-limit retries with exponential backoff; confirm via MCP-deployed worker logs (when available).
- [ ] Add mocked tests around normalization.

## 4. Frontend (App Router + Zustand)
### 4.1 Global Layout & Theme
- [x] Create `/app/layout.tsx` with minimalist styling, theme toggle.
- [x] Configure font (Inter) via `next/font`.
- [x] Implement `ThemeProvider` persisted via Zustand slice.

### 4.2 Auth & Routing
- [x] Protect `/hud` route with Supabase Auth helpers; redirect unauthenticated users.
- [x] Build `/` onboarding screen explaining zero state.
- [x] Add Supabase listener to hydrate `session` slice.

### 4.3 State Management
- [x] Set up Zustand store with slices (`session`, `sources`, `feed`, `preferences`, `bookmarks`).
- [x] Integrate `persist` middleware for local caching.
- [x] Add selectors + TypeScript types for each slice.

### 4.4 Source Manager UI
- [x] Build `SourceManager` component with tabs (RSS vs X) and validation states.
- [x] Wire to `POST /api/sources` with optimistic UI.
- [x] Display connected sources list with remove actions.
- [ ] Write storybook stories or component tests (if storybook not set up note as future).

### 4.5 Feed Stream
- [ ] Implement `FeedStream` with virtualized list (e.g., `react-virtualized` or `react-window`).
- [x] Build `FeedCard` showing title, metadata, popularity badge, actions.
- [x] Implement auto-scroll banner cycling 2 focus-heavy + 1 popularity-heavy item.
- [x] Pause auto-scroll on hover/manual scroll using Zustand state.
- [x] Add skeleton loaders for initial fetch.

### 4.6 Controls & Bookmarks
- [x] Build `FocusControls` slider component adjusting focus/popularity mix.
- [x] Implement `BookmarkShelf` carousel resurfacing every 30 minutes (timer in store).
- [ ] Add toast confirmations and snooze CTA.

### 4.7 Optional AI Settings
- [ ] Create modal allowing user to store OpenAI/Gemini API keys.
- [ ] Persist to Supabase `ai_settings` via preferences API.
- [ ] Stub summarization toggle UI.

## 5. Testing & QA
- [ ] Configure Jest/Playwright (or Cypress) for component and e2e tests.
- [ ] Write e2e test covering onboarding, adding RSS, seeing feed populated (mock network).
- [ ] Write integration test for bookmark resurfacing scheduler (time travel).
- [x] Run `npm run lint`, `npm run test`, `npm run build` (or `bun run lint`, `bun run test`, `bun run build`) before release.
- [ ] Document known gaps + manual QA checklist in `/docs/testing.md`.

## 6. Deployment Pipeline
- [ ] Configure Vercel project linked to repo; set environment variables (Supabase keys, API URLs).
- [ ] Add preview deployments per branch; enforce `npm run build` (or `bun run build`) in CI.
- [ ] Set up Supabase production project; run migrations via MCP (`apply_migration`) and verify schema.
- [ ] Configure cron/Edge functions in production environment.
- [ ] Smoke test production HUD (login, add source, view feed, bookmark).

## 7. Launch Checklist
- [ ] Ensure default curated sources toggled on for new users (cold-start mitigation).
- [ ] Verify rate limit logging/alerts active.
- [ ] Prepare minimal release notes explaining MVP scope and next steps.
- [ ] Hand off instructions for future AI summarization rollout.

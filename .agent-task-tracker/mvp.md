# High-Signal Personal News HUD — MVP

## Guiding Principles
- Keep the surface area tiny: one-page HUD optimized for reading, minimal chrome, light typography, high-contrast theme with optional dark mode.
- Ship quickly but set foundations for scale: modular ingestion pipeline, normalized data in Supabase, predictable state via Zustand.
- Default calm: avoid motion unless it amplifies focus (gentle auto-scroll, pausable interactions).

## Primary User Journey
1. **First login:** greet the user with an empty state card explaining that no sources are connected yet and provide two input tabs: `RSS URL` and `Twitter/X handle or list link`.
2. **Add source:** user pastes a link → client calls `/api/sources` to validate, normalize, and queue fetch → HUD shows loading skeleton with shimmer.
3. **Fetch & hydrate:** once feeds arrive (within ~2s optimistic), items appear in the stream ranked according to focus profile and popularity mix.
4. **Daily use:** list auto-scrolls through cards; user can pause, open detail, bookmark, or adjust focus sliders.
5. **Bookmark recall:** bookmarked items surface in a "Later" carousel that appears every ~30 minutes or on-demand from the control bar.

## MVP Feature Checklist
- Source management: add/remove RSS and X feeds, list connected sources.
- News stream: unified feed combining all sources with infinite scroll + auto-scroll top section.
- Ranking engine: blend user focus topics with global popularity metrics.
- Bookmarking: quick toggle, stored in Supabase, periodic resurfacing.
- Preferences drawer: adjust focus weights, auto-scroll speed, theme, and AI summarization toggle.
- Auth: Supabase email magic link (fastest path) with prepared tables for future OAuth.

## Frontend Architecture (Next.js + Zustand)
- **Pages/App Router:** leverage Next.js App Router with a single protected route `/hud` and a marketing/onboarding `/`.
- **Components:**
  - `SourceManager` (tabs for RSS vs X, validation feedback).
  - `FeedStream` (virtualized list with auto-scroll banner and manual scroll body).
  - `FeedCard` (title, excerpt, source metadata, popularity badge, action buttons).
  - `FocusControls` (sliders/toggles for focus areas and popular mix, persists to Supabase via mutations).
  - `BookmarkShelf` (compact carousel that surfaces every 30 minutes or when triggered).
- **Zustand store slices:**
  - `session`: auth status, user profile, AI key metadata.
  - `sources`: list, add/remove states, currently fetching.
  - `feed`: items, loading, pagination cursor, scroll position, auto-scroll state.
  - `preferences`: focus weights, scroll speed, theme.
  - `bookmarks`: saved ids, resurfacing scheduler timestamp.
- Integrate Zustand with persist middleware (localStorage) for ephemeral preferences; sync authoritative data via Supabase on login.

## Backend & Supabase Structure
- **Supabase Auth:** email magic link; store profile in `profiles` table (id, email, display_name, focus_tags JSONB, ai_settings JSONB).
- **Tables:**
  - `sources` (id, user_id, type `rss|twitter`, url, handle, display_name, last_polled_at, status).
  - `items` (id uuid, source_id, title, summary, url, published_at, metadata JSONB holding popularity metrics, focus_topics text[]).
  - `user_item_scores` (user_id, item_id, score, seen_at, dismissed boolean).
  - `bookmarks` (id, user_id, item_id, bookmarked_at, surfaced_at).
  - `jobs` (id, source_id, status, attempts, scheduled_for) for ingestion tracking.
- **Policies:** row-level security restricting rows by `user_id`; service role used by background workers.
- **Realtime:** subscribe to `items` channel for instant updates when new stories arrive.

## Ingestion & APIs
- **RSS ingestion:** edge function or cron (Supabase Scheduled Functions) hitting `GET /rss/fetch?source_id`. Parse with `feedparser`, normalize fields, store items, compute hash to avoid duplicates.
- **Twitter ingestion:** call internal worker (uses user-provided bearer token or stored app token). Extract tweet text, url, engagement counts. Cache results per handle for 5 minutes.
- **API routes:**
  - `POST /api/sources` → validate link, detect type, insert source, enqueue fetch job.
  - `GET /api/feed` → return merged, ranked items (paginated, accepts `cursor` and `mixRatio`).
  - `POST /api/bookmarks` & `DELETE /api/bookmarks/:id`.
  - `POST /api/preferences` → store focus weights, scroll speed, theme, AI options.
- **Background scheduling:**
  - RSS: refresh every 10 minutes per source; throttle heavy feeds.
  - Twitter: refresh every 5 minutes respecting rate limits.
  - Bookmark resurfacing: serverless cron identifies items older than 1 hour and pushes notifications/realtime events.

## Ranking & Mix Strategy
- Maintain focus weights per topic (`data`, `startups`, `ai-research`, etc.) derived from user-defined tags.
- Item scoring formula (normalized 0–1):
  - `focusScore = Σ(topicWeight * topicPresence)` from metadata classification (e.g., using tf-idf keyword mapping).
  - `popularityScore` by platform:
    - HackerNews: min-max normalize points + comment count.
    - Newsletters: open/click proxies unavailable → fallback to curated popularity tags or publish frequency (recency).
    - Twitter: combine likes, reposts, bookmark counts normalized by follower count.
    - Subreddits: score from upvotes + comment velocity.
  - `finalScore = 0.7 * focusScore + 0.3 * popularityScore` by default; expose slider (50–90% focus) in preferences.
- For HUD mix: top strip cycles 2 focus-heavy cards then 1 popularity-heavy card (ensures serendipity).
- Dedupe identical URLs, collapse variants, mark seen items to reduce repetition.

## Auto-Scroll & Interaction Decisions
- Default speed: advance banner card every 7 seconds; pause when hovered or when modal open.
- If the user scrolls manually, auto-advance pauses until idle for 15 seconds.
- Provide subtle progress indicator (thin bar) to signal timing without distraction.

## Bookmark Experience
- Click bookmark icon to toggle; toast confirms.
- `BookmarkShelf` surfaces automatically every 30 minutes showing up to 3 saved items not viewed in the last session; user can snooze for 2 hours.
- Background job updates `surfaced_at` to avoid repeats; Zustand keeps local countdown timer.

## AI Pipeline (Optional for MVP+)
- Settings panel lets user paste OpenAI/Gemini API keys stored encrypted in Supabase (KMS managed secrets).
- When enabled, backend summarization endpoint calls AI to produce TL;DR (cached per item per user).
- Future: allow summarization, translation, and insight tagging; ensure graceful fallback when no key provided.

## Minimalist UI Language
- Color palette: grayscale base (#0F0F0F text, #F8F8F8 background) with single accent (#4C7EFF) for focus states.
- Typography: Inter or IBM Plex Sans, 16px base, 20px line height.
- Layout: three panels — left (sources + controls), center (feed), right (bookmarks/insights). Collapse side panels on mobile.
- Animations: 150ms fade/slide for card transitions; avoid parallax or distracting motion.

## Analytics & Observability
- Track lightweight events (source added, story opened, bookmark saved) via Supabase Functions or PostHog (self-host) for future tuning.
- Log ingestion job outcomes; alert on repeated failures per source.

## MVP Milestones
1. Auth + Supabase schema laid down.
2. Source management UI and `/api/sources` integration.
3. RSS ingestion pipeline + feed rendering with auto-scroll banner.
4. Ranking logic in place with adjustable focus slider.
5. Bookmark loop & resurfacing notification.
6. Twitter ingestion (using stored credentials or user token) once base flow is stable.

## Risks & Mitigations
- **Rate limits:** cache responses and queue fetches; fallback to manual refresh when hitting limits.
- **Cold start empty feed:** maintain curated default sources that can be toggled on while user sets focus.
- **Latency:** use optimistic UI and streaming responses from `/api/feed`.
- **Data quality:** add duplication hash and length guards to avoid spammy items.

## Post-MVP Ideas
- Semantic clustering to avoid repeating similar stories.
- Email summary or daily digest generated by AI.
- Team shared focus profiles.
- Mobile PWA with offline read queue.


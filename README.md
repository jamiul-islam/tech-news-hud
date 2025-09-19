# AI Tech News HUD

An AI‑powered HUD for tracking the latest tech news. Users can add RSS feeds or X (formerly Twitter) profiles of selected tech figures and receive real‑time updates.

## Prerequisites

- Node.js 18.18+ or 20+
- npm (or bun)

## Quick Start

1. Create `.env.local` with Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_database_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_PROJECT_REF=your_supabase_project reference
NEXT_PUBLIC_DEFAULT_RSS=a_link_to_rss
NEXT_PUBLIC_DEFAULT_TWITTER_HANDLE=@your_profile_name
```

1. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — Start development server (Turbopack)
- `npm run build` — Build for production (Turbopack)
- `npm run start` — Start production server
- `npm run lint` — Lint the codebase

## Tech

- Next.js 15, React 19, TypeScript
- Tailwind CSS v4
- Supabase client (browser + server) at `src/lib/supabase`
- State: Zustand

## Project Structure

- App routes: `src/app`
- UI components: `src/components`
- Utilities: `src/lib`, `src/store`, `src/types`

## Deployment

Works on Vercel or any Next.js-compatible platform. Set required env vars in your hosting provider.

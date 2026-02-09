---
name: backend-expert
description: Backend specialist for Supabase authentication (SSR cookie-based), PostgreSQL database queries, Row Level Security policies, server-side rendering with Next.js, server actions, and API route handlers
---

# Backend Expert -- Homeschool Hub

## Stack Context

- **Supabase** with `@supabase/ssr` (v0.6.1) and `@supabase/supabase-js`
- **Next.js 15** server components, server actions, and API routes
- **PostgreSQL** via Supabase (auth, realtime, storage capabilities)

## Supabase Client Architecture

Three client variants for different execution contexts:

| Client | File | Usage |
|--------|------|-------|
| Browser | `lib/supabase/client.ts` | Client components, hooks |
| Server Component | `lib/supabase/server.ts` | Server components (read-only cookies) |
| Server Action | `lib/supabase/server-action-client.ts` | Server actions, route handlers (read/write cookies) |

Legacy client at `lib/supabaseClient.ts` -- prefer the above pattern.

## Auth Flow

- **Middleware** (`middleware.ts`) refreshes Supabase session on every request via cookie exchange
- **Auth listener** (`components/auth-listener.tsx`) syncs client-side auth state
- **Login/Signup** pages at `app/login/` and `app/signup/` with form components
- **Auth callback** at `app/auth/` handles OAuth and magic link redirects
- **Profiles** managed via `lib/profiles.ts`

## Data Layer

- **Server Actions** in `app/actions.ts` handle all data mutations (CRUD for students, assignments, courses, lessons, events, compliance)
- **Data service** at `lib/data-service.ts` provides the data fetching abstraction
- **Data sync** at `lib/services/data-sync.ts` handles real-time sync between Supabase and Zustand store
- **Hooks**: `lib/hooks/use-supabase-data.ts` for data fetching, `lib/hooks/use-data-operations.ts` for mutations

## API Routes

| Route | Purpose |
|-------|---------|
| `app/api/health/route.ts` | Health check endpoint |
| `app/api/lessons/route.ts` | Lessons CRUD operations |

## Database Entities

Core tables (based on store types): profiles, students, assignments, courses, lessons, subjects, events, compliance_logs

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` -- Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -- Supabase anonymous/public key

## Key Patterns

- Always use the appropriate Supabase client for the execution context
- RLS policies enforce data isolation per authenticated user
- Seed data available via `lib/seed-data.ts` and `components/seed-database-button.tsx`
- Database cleanup via `components/cleanup-database-button.tsx`
- Detailed schema docs in `docs/DATABASE_SCHEMA.md`

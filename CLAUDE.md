# CLAUDE.md

## What This Is

Homeschool Hub -- a comprehensive homeschool management dashboard for organizing students, assignments, courses, calendars, compliance, and transcripts. Built as a portfolio demonstration project for Blue Octopus Technology.

**Status:** PORTFOLIO -- complete, demonstrates full-stack skills.

## Stack

- **Framework:** Next.js 15.2.4 (App Router), React 18, TypeScript
- **Backend:** Supabase (PostgreSQL, Auth via `@supabase/ssr`, Row Level Security)
- **Styling:** Tailwind CSS 3, Radix UI primitives (48 components in `components/ui/`), `class-variance-authority`, `tailwind-merge`
- **State:** Zustand (single store in `lib/store.ts` with Immer)
- **Charts:** Recharts 2.15
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Other:** date-fns, cmdk (command palette), sonner (toasts), vaul (drawer), next-themes (dark mode), embla-carousel, react-resizable-panels
- **Package Manager:** pnpm

## Key Directories

```
app/                    # Next.js App Router pages
  api/health/           # Health check route
  api/lessons/          # Lessons API route
  assignments/          # Assignment management page
  auth/                 # Auth callback handling
  calendar/             # Calendar view page
  checklist/            # Daily checklist page
  compliance/           # Compliance logging page
  courses/              # Course management page
  dashboard/            # Main dashboard page
  login/                # Login page
  signup/               # Signup page
  portfolio/            # Student portfolio builder page
  profile/              # User profile page
  reports/              # Progress reports page
  settings/             # Settings page
  student/              # Single student portal
  students/             # Student management page
  transcript/           # Transcript generation page
components/             # 59 React components
  ui/                   # 48 Radix-based UI primitives (shadcn/ui pattern)
  layout.tsx            # Global app layout (sidebar + topbar)
  sidebar.tsx           # Navigation sidebar
  dashboard-view.tsx    # Dashboard with analytics
  calendar-app.tsx      # Full calendar implementation
  ...                   # Feature-specific components
lib/
  store.ts              # Zustand store (views, students, lessons, assignments, courses, events)
  data-service.ts       # Data fetching layer
  data.ts               # Static/seed data
  supabase/             # Supabase clients (client.ts, server.ts, server-action-client.ts)
  supabaseClient.ts     # Legacy Supabase client
  services/             # Data sync services
  hooks/                # Custom hooks (use-data-operations.ts, use-supabase-data.ts)
  types/                # TypeScript type definitions
  utils.ts              # Utility functions (cn helper)
styles/                 # Additional CSS (calendar-fix.css, calendar-picker.css)
middleware.ts           # Supabase auth session refresh middleware
docs/                   # Architecture, schema, features, server actions documentation
public/                 # Static assets
```

## Route Structure

| Route | Purpose |
|-------|---------|
| `/` | Root page |
| `/dashboard` | Main dashboard with analytics overview |
| `/students` | Student management (add, edit, delete) |
| `/student` | Individual student portal with checklists |
| `/assignments` | Assignment tracking and grading |
| `/courses` | Course management with terms and grading |
| `/calendar` | Visual calendar for lessons and assignments |
| `/checklist` | Daily task checklists |
| `/compliance` | Educational hours logging |
| `/portfolio` | Student work portfolio builder |
| `/reports` | Progress reports |
| `/transcript` | Academic transcript generation |
| `/profile` | User profile management |
| `/settings` | App settings |
| `/login` | Authentication login |
| `/signup` | New account registration |
| `/auth` | OAuth/magic link callback |
| `/api/health` | Health check endpoint |
| `/api/lessons` | Lessons CRUD API |

## Architecture Patterns

- **Supabase SSR auth** via middleware cookie refresh (`middleware.ts`) with three client variants: browser (`lib/supabase/client.ts`), server component (`lib/supabase/server.ts`), and server action (`lib/supabase/server-action-client.ts`)
- **Zustand store** as single source of truth for UI state and cached data, with Immer for immutable updates
- **Server Actions** in `app/actions.ts` for data mutations
- **shadcn/ui pattern** -- Radix primitives wrapped with Tailwind in `components/ui/`
- **Feature components** at `components/` root handle business logic; UI primitives in `components/ui/`

## Development

```bash
pnpm install
pnpm dev          # Next.js dev server
pnpm build        # Production build
pnpm lint         # ESLint
```

Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Available Skills

| Skill | Purpose |
|-------|---------|
| `frontend-expert` | Next.js 15 App Router, React 18, TypeScript, Tailwind, Radix UI, recharts, zustand, responsive dashboard components |
| `backend-expert` | Supabase auth, database queries, RLS policies, SSR, server actions, API routes |

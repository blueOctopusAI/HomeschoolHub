---
name: frontend-expert
description: Frontend specialist for Next.js 15 App Router, React 18, TypeScript, Tailwind CSS, Radix UI (shadcn/ui pattern), recharts data visualization, zustand + Immer state management, react-hook-form + zod validation, and responsive dashboard components with dark mode support
---

# Frontend Expert -- Homeschool Hub

## Stack Context

- **Next.js 15.2.4** with App Router (all routes under `app/`)
- **React 18** with TypeScript strict mode
- **Tailwind CSS 3** with `tailwindcss-animate`, `tailwind-merge`, and `class-variance-authority`
- **Radix UI** primitives wrapped as shadcn/ui components in `components/ui/` (48 components)
- **Zustand** store at `lib/store.ts` with Immer for immutable state updates
- **Recharts 2.15** for dashboard analytics and progress charts
- **React Hook Form** + **Zod** for form validation
- **Lucide React** icons, **sonner** toasts, **cmdk** command palette, **vaul** drawer, **next-themes** dark mode
- **date-fns** for date manipulation, **embla-carousel** for carousels, **react-resizable-panels** for layout

## Key Patterns

- Feature components live at `components/` root (e.g., `dashboard-view.tsx`, `calendar-app.tsx`, `assignments-view.tsx`)
- UI primitives follow shadcn/ui conventions in `components/ui/` -- use `cn()` from `lib/utils.ts` for class merging
- Global layout in `components/layout.tsx` with sidebar navigation (`components/sidebar.tsx`) and topbar (`components/topbar.tsx`)
- Views defined as union type in store: `"dashboard" | "students" | "calendar" | "assignments" | "checklist" | "portfolio" | "compliance" | "transcript" | "settings"`
- Nunito font loaded via `next/font/google` in root layout
- Custom hooks in `lib/hooks/` for data operations and Supabase data fetching
- Calendar uses custom grid (`calendar-grid.tsx`) with weekly view (`weekly-calendar.tsx`) and mini calendar (`mini-calendar.tsx`)
- Modal pattern: feature-specific modals (e.g., `create-assignment-modal.tsx`, `add-course-modal.tsx`) using Radix Dialog
- Print-friendly components: `printable-checklist.tsx`, `printable-transcript.tsx`

## Component Inventory (59 feature components + 48 UI primitives)

Notable feature components: `dashboard-view`, `calendar-app`, `assignments-view`, `students-view`, `compliance-view`, `portfolio-builder-view`, `progress-report-view`, `transcript-view`, `checklist-view`, `settings-view`, `student-portal-layout`

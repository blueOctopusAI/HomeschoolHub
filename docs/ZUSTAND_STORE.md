# Zustand Store Overview

This document outlines the global state management implementation in `lib/store.ts` using Zustand for the Homeschool Hub application.

## Purpose

The Zustand store now manages only global UI state and authentication context. After the architectural refactoring, server-side data (lessons, assignments, courses) is fetched directly in Server Components and passed as props, following modern Next.js patterns.

## Current State

### Authentication State
- **`authUser`** (User | null) - Current authenticated user from Supabase Auth
- **`isAuthLoading`** (boolean) - Loading state during authentication checks

### Navigation & UI Context
- **`currentView`** (View) - Active application view/page for navigation highlighting
- **`currentDate`** (Date) - Selected date for calendar and time-based filtering
- **`selectedStudent`** (string) - Currently selected student ID for filtering views

### Students
- **`students`** (Student[]) - Array of student profiles (minimal local state)

## Key Types

### View
```typescript
type View = "dashboard" | "students" | "calendar" | "assignments" | "checklist" | "portfolio" | "compliance" | "transcript" | "settings"
```

### Student
```typescript
type Student = {
  id: string
  name: string
  gradeLevel?: string
  notes?: string
  profileImage?: string
  initials?: string
}
```

## Actions

### Navigation Actions
- **`setCurrentView`** - Updates active view for UI navigation
- **`setCurrentDate`** - Changes selected date for calendar and filtering
- **`setSelectedStudent`** - Updates student filter selection
- **`setStudents`** - Updates the students array

### Authentication Actions
- **`setAuthUser`** - Updates authenticated user state
- **`setIsAuthLoading`** - Manages authentication loading state

## Architecture Changes (Refactoring Summary)

Previously, the Zustand store contained server-side data collections:
- ~~subjects~~ - Removed
- ~~lessons~~ - Removed
- ~~courses~~ - Removed
- ~~assignments~~ - Removed

These have been removed following modern Next.js patterns where:
1. **Server Components** fetch data directly from Supabase
2. **Props** are passed down to client components that need the data
3. **Server Actions** handle all data mutations
4. **The server is the single source of truth** for application data

## Usage Patterns

### Custom Hooks
The store provides specialized hooks for common access patterns:

```typescript
export const useStudents = () => useStore((state) => state.students)
export const useSelectedStudent = () => useStore((state) => state.selectedStudent)
export const useCurrentDate = () => useStore((state) => state.currentDate)
export const useAuthUser = () => useStore((state) => state.authUser)
export const useAuthLoading = () => useStore((state) => state.isAuthLoading)
export const useAuth = () => {
  const user = useAuthUser()
  const isLoading = useAuthLoading()
  return { user, isLoading }
}
```

## Best Practices

1. **Keep it minimal** - Only store UI state and authentication in Zustand
2. **Server-first** - Fetch data in Server Components whenever possible
3. **Props over global state** - Pass server data as props to client components
4. **Type safety** - Maintain strong TypeScript typing throughout

The store now serves its intended purpose: managing client-side UI state while leaving data management to the server, resulting in better performance, simpler data flow, and improved maintainability.
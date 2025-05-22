# Zustand Store Overview

This document outlines the global state management implementation in `lib/store.ts` using Zustand for the Homeschool Hub application.

## Purpose

The Zustand store manages global UI context and shared client-side state that complements server-side data fetching. It provides reactive state management for user interface interactions, navigation, and temporary data that doesn't require server persistence.

## State Slices

### Authentication State
- **`authUser`** (User | null) - Current authenticated user from Supabase Auth
- **`isAuthLoading`** (boolean) - Loading state during authentication checks

### Navigation & UI Context
- **`currentView`** (View) - Active application view/page for navigation highlighting
- **`currentDate`** (Date) - Selected date for calendar and time-based filtering
- **`selectedStudent`** (string) - Currently selected student ID for filtering views

### Data Collections
- **`students`** (Student[]) - Array of student profiles with sample data
- **`subjects`** (Subject[]) - Array of subjects with names and colors
- **`lessons`** (Lesson[]) - Array of lesson objects with scheduling and completion data
- **`courses`** (Course[]) - Array of courses for transcript management
- **`assignments`** (Assignment[]) - Array of assignments with due dates and grading

## Key Types

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

### Lesson
```typescript
type Lesson = {
  id: string
  subjectId: string
  subjectName: string
  subjectColor: string
  startDate: string
  endDate: string
  studentIds: string[]
  description?: string
  objectives?: string
  materialsNeeded?: string
  location?: string
  completed: boolean
  day_of_week?: string
}
```

### Assignment
```typescript
type Assignment = {
  id: string
  title: string
  description?: string
  studentIds: string[]
  dueDate: string
  status: "Not Started" | "Submitted" | "Graded"
  pointsPossible: number
  pointsEarned?: number
  courseId?: string | null
}
```

## Actions

### Navigation Actions
- **`setCurrentView`** - Updates active view for UI navigation
- **`setCurrentDate`** - Changes selected date for calendar and filtering
- **`setSelectedStudent`** - Updates student filter selection

### Data Management Actions
- **CRUD operations** for students, subjects, lessons, courses, and assignments
- **Bulk operations** like `markAllLessonsComplete` for efficiency
- **State synchronization** methods like `setStudents`, `setLessons` for server data integration

### Authentication Actions
- **`setAuthUser`** - Updates authenticated user state
- **`setIsAuthLoading`** - Manages authentication loading state

## Relationship to Server Data

The Zustand store serves as a **client-side complement** to server-side data management:

- **Server-side:** Persistent data stored in Supabase with RLS and validation
- **Client-side:** UI state, temporary selections, and reactive updates
- **Synchronization:** Server actions update database, then sync relevant state to Zustand
- **Sample data:** Store includes sample/mock data for development and testing

## Usage Patterns

### Custom Hooks
The store provides specialized hooks for common access patterns:

```typescript
export const useStudents = () => useStore((state) => state.students)
export const useSelectedStudent = () => useStore((state) => state.selectedStudent)
export const useAuth = () => {
  const user = useAuthUser()
  const isLoading = useAuthLoading()
  return { user, isLoading }
}
```

### State Updates
Actions follow consistent patterns for immutable updates:

```typescript
addStudent: (student) =>
  set((state) => ({
    students: [...state.students, { id: uuidv4(), ...student }],
  }))
```

## Development Features

- **Sample data** included for immediate development and testing
- **UUID generation** for client-side ID creation
- **Immutable updates** following React best practices
- **TypeScript integration** with full type safety

The store enables responsive UI updates while maintaining separation of concerns between client state management and server-side data persistence.

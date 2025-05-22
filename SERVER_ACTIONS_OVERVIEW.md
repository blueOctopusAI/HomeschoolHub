# Server Actions Overview

This document outlines the server actions implemented in the Homeschool Hub application, organized by feature area and file location.

## Core Actions (`app/actions.ts`)

### `updateMyProfile`
Updates the current user's profile information including name, timezone, and avatar URL with validation.

### `seedDatabaseAction`
Comprehensive database seeding function that creates sample students, courses, assignments, and lessons for the current user. Safe to run multiple times due to upsert operations.

## Authentication Actions (`app/auth/actions.ts`)

### `login`
Handles user authentication with email/password validation and redirects to dashboard on success.

### `signup`
Creates new user accounts with email/password validation and optional full name.

### `signOut` / `logout`
Securely logs out users and redirects to login page.

## Assignment Management (`app/assignments/actions.ts`)

### `createAssignment`
Creates new assignments with title, description, due date, points, and student assignments. Supports course association.

### `updateAssignment`
Updates existing assignments including reassigning students and handling graded status with points earned.

### `deleteAssignment`
Removes assignments and associated student relationships with proper authorization checks.

### `updateAssignmentStatus`
Quick status updates for assignments (Not Started, Submitted, Graded) with validation.

## Calendar/Lesson Management (`app/calendar/actions.ts`)

### `addSampleLessons`
Creates sample lesson data for demonstration and testing purposes with student associations.

### `createLesson`
Creates new lessons with subject, timing, student assignments, and learning objectives.

### `updateLesson`
Updates existing lessons including rescheduling and reassigning students.

### `deleteLesson`
Removes lessons and associated student relationships with authorization checks.

### `toggleLessonComplete`
Toggles completion status of individual lessons for progress tracking.

## Course Management (`app/courses/actions.ts`)

### `createCourse`
Creates new courses with name, category, term, grade, credits, and academic year for transcript purposes.

### `updateCourse`
Updates existing course information while maintaining student ownership validation.

### `deleteCourse`
Removes courses with proper authorization and data integrity checks.

## Compliance Management (`app/compliance/actions.ts`)

### `logHours`
Records educational hours for specific students and subjects with date and notes for compliance tracking.

### `deleteLoggedHours`
Removes logged hour entries with proper user ownership validation.

## Checklist Management (`app/checklist/actions.ts`)

### `markMultipleLessonsComplete`
Batch operation to mark multiple lessons as complete based on date range (today/week) and student selection. Supports filtering by specific student or "all students" option.

## Common Patterns

All server actions follow consistent patterns:

- **Authentication:** Verify user authentication before processing
- **Validation:** Use Zod schemas for input validation with detailed error messages
- **Authorization:** Ensure users can only access/modify their own data
- **Error Handling:** Comprehensive try/catch blocks with proper error logging
- **Revalidation:** Cache invalidation for affected pages using `revalidatePath`
- **Type Safety:** Strong TypeScript typing with ActionResult interface
- **Data Integrity:** Proper foreign key handling and cascade operations

## ActionResult Interface

All server actions return a consistent `ActionResult` interface:

```typescript
interface ActionResult {
  success: boolean;
  message: string | null;
  errors?: { [key: string]: string[] | undefined };
}
```

This provides standardized error handling and user feedback across the application.

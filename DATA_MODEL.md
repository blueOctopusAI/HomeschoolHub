# Data Model

This document outlines the Supabase database schema for the Homeschool Hub application, including table structures, relationships, and security policies.

## Security Overview

All tables implement Row Level Security (RLS) based on the `user_id` column, ensuring users can only access their own data. CASCADE DELETE relationships are configured to maintain data integrity when parent records are removed.

## Tables

### `profiles`
**Purpose:** Extended user profile information linked to Supabase Auth users.

**Key Columns:**
- `id` (UUID, Primary Key) - Links to auth.users.id
- `full_name` (text) - User's display name  
- `timezone` (text) - User's timezone preference
- `avatar_url` (text) - Profile image URL
- `created_at` (timestamp) - Account creation date
- `updated_at` (timestamp) - Last profile update

**Relationships:** Root table - deletion cascades to all user data.

### `students`
**Purpose:** Student profiles managed by the authenticated user.

**Key Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key) - Links to profiles.id
- `name` (text) - Student's full name
- `grade_level` (text) - Current grade level
- `initials` (text) - Display initials
- `notes` (text) - Additional student information
- `profile_image` (text) - Student photo URL

**Relationships:** Deleting a student cascades to lessons, assignments, courses, and logged hours.

### `lessons`
**Purpose:** Scheduled learning sessions with subject, timing, and completion tracking.

**Key Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key) - Links to profiles.id
- `subject_name` (text) - Lesson subject
- `subject_color` (text) - Display color for subject
- `start_date` (timestamp) - Lesson start time
- `end_date` (timestamp) - Lesson end time
- `day_of_week` (text) - Day of the week
- `completed` (boolean) - Completion status
- `description` (text) - Lesson content description
- `objectives` (text) - Learning objectives
- `materials_needed` (text) - Required materials
- `location` (text) - Where lesson takes place

**Relationships:** Links to students via lesson_students junction table.

### `lesson_students`
**Purpose:** Junction table linking lessons to assigned students (many-to-many relationship).

**Key Columns:**
- `lesson_id` (UUID, Foreign Key) - Links to lessons.id
- `student_id` (UUID, Foreign Key) - Links to students.id

**Relationships:** CASCADE DELETE when either lesson or student is removed.

### `assignments`
**Purpose:** Academic assignments with due dates, grading, and completion tracking.

**Key Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key) - Links to profiles.id
- `title` (text) - Assignment name
- `description` (text) - Assignment details
- `due_date` (timestamp) - When assignment is due
- `status` (enum) - 'Not Started', 'Submitted', 'Graded'
- `points_possible` (integer) - Maximum points
- `points_earned` (integer) - Points awarded (when graded)
- `course_id` (UUID, Foreign Key) - Optional link to courses.id

**Relationships:** Links to students via assignment_students junction table.

### `assignment_students`
**Purpose:** Junction table linking assignments to assigned students (many-to-many relationship).

**Key Columns:**
- `assignment_id` (UUID, Foreign Key) - Links to assignments.id
- `student_id` (UUID, Foreign Key) - Links to students.id

**Relationships:** CASCADE DELETE when either assignment or student is removed.

### `courses`
**Purpose:** Academic courses for transcript and GPA calculation.

**Key Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key) - Links to profiles.id
- `student_id` (UUID, Foreign Key) - Links to students.id
- `name` (text) - Course name
- `category` (text) - Subject category
- `term` (enum) - 'Fall Semester', 'Spring Semester', 'Full Year', etc.
- `grade` (enum) - Letter grade (A+, A, A-, B+, B, etc.)
- `credits` (decimal) - Credit hours
- `academic_year` (text) - Academic year (e.g., "2023-2024")

**Relationships:** CASCADE DELETE when student is removed.

### `logged_hours`
**Purpose:** Educational hour tracking for compliance reporting.

**Key Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key) - Links to profiles.id
- `student_id` (UUID, Foreign Key) - Links to students.id
- `subject_name` (text) - Subject for logged hours
- `log_date` (date) - Date of instruction
- `hours_spent` (decimal) - Number of hours logged
- `notes` (text) - Additional notes about the session

**Relationships:** CASCADE DELETE when student is removed.

## Data Integrity Notes

- All foreign key relationships use CASCADE DELETE to maintain referential integrity
- RLS policies prevent users from accessing data belonging to other users
- Timestamps are stored in UTC and converted for display based on user timezone preferences
- Enum values are enforced at the database level for consistent data entry

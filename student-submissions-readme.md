# Student Submissions & Grades Feature

## Overview
The Student Submissions & Grades feature allows students to view their submitted assignments, grades, and teacher feedback in a centralized location within the homeschool hub.

## Features

### 1. Submissions & Grades Tab
- Located in the Students section
- Shows a comprehensive view of all assignments for a selected student
- Displays submission status, grades, and feedback

### 2. Statistics Dashboard
- **Total Assignments**: Count of all assignments assigned to the student
- **Submitted**: Number of assignments submitted
- **Graded**: Number of assignments that have been graded
- **Overall Grade**: Calculated percentage and letter grade across all graded assignments

### 3. Assignment List
- Filterable by status (Not Started, Submitted, Graded)
- Filterable by course
- Shows key information:
  - Assignment title and description
  - Course name
  - Due date
  - Submission date (if submitted)
  - Points earned/possible
  - Grade percentage and letter grade
  - Teacher feedback

### 4. Detailed View
- Click "View" to see full submission details
- Shows submission text
- Links to download attached files
- Displays complete teacher feedback

## Database Schema

To fully implement this feature, you'll need to create an `assignment_students` junction table:

```sql
CREATE TABLE assignment_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  submission_text TEXT,
  file_url TEXT,
  grade NUMERIC(5,2),
  feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(assignment_id, student_id)
);
```

## Grade Calculation

The system uses standard grade scales:
- A: 90-100%
- B: 80-89%
- C: 70-79%
- D: 60-69%
- F: Below 60%

Overall grades are calculated by:
1. Summing all points earned across graded assignments
2. Dividing by total points possible
3. Converting to percentage

## Usage

1. Navigate to the Students section
2. Click on the "Submissions & Grades" tab
3. Select a student from the dropdown (or use the student selector)
4. View assignments and grades
5. Use filters to narrow down results
6. Click "View" to see detailed submission information

## Integration Points

This feature integrates with:
- **Assignments**: Pulls assignment data and updates
- **Students**: Maps submissions to specific students
- **Courses**: Groups assignments by course
- **Database**: Real-time data fetching from Supabase

## Future Enhancements

Consider adding:
- Export functionality for grade reports
- Email notifications for new grades
- Student portal access for direct student viewing
- Grade history and trends visualization
- Comments/notes on individual assignments
- File upload directly from this interface

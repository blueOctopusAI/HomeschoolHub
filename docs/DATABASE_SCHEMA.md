# Database Schema

This document provides the complete SQL schema for the Homeschool Hub application, including tables, relationships, indexes, and Row Level Security (RLS) policies.

## Tables

### profiles
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  avatar_url TEXT,
  school_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);
```

### students
```sql
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  grade_level TEXT,
  initials TEXT,
  notes TEXT,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_students_user_id ON students(user_id);

-- RLS Policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own students" 
  ON students FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own students" 
  ON students FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own students" 
  ON students FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own students" 
  ON students FOR DELETE 
  USING (auth.uid() = user_id);
```

### subjects
```sql
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subjects_user_id ON subjects(user_id);

-- RLS Policies
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subjects" 
  ON subjects FOR ALL 
  USING (auth.uid() = user_id);
```

### lessons
```sql
CREATE TABLE lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  subject_name TEXT NOT NULL,
  subject_color TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_date - start_date)) / 60
  ) STORED,
  day_of_week TEXT,
  completed BOOLEAN DEFAULT FALSE,
  location TEXT,
  materials_needed TEXT,
  objectives TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lessons_user_id ON lessons(user_id);
CREATE INDEX idx_lessons_start_date ON lessons(start_date);
CREATE INDEX idx_lessons_subject_id ON lessons(subject_id);

-- RLS Policies
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lessons" 
  ON lessons FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lessons" 
  ON lessons FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lessons" 
  ON lessons FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lessons" 
  ON lessons FOR DELETE 
  USING (auth.uid() = user_id);
```

### lesson_students (Junction Table)
```sql
CREATE TABLE lesson_students (
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (lesson_id, student_id)
);

-- Indexes
CREATE INDEX idx_lesson_students_lesson_id ON lesson_students(lesson_id);
CREATE INDEX idx_lesson_students_student_id ON lesson_students(student_id);

-- RLS Policies
ALTER TABLE lesson_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own lesson students" 
  ON lesson_students FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM lessons 
      WHERE lessons.id = lesson_students.lesson_id 
      AND lessons.user_id = auth.uid()
    )
  );
```

### courses
```sql
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  term TEXT NOT NULL CHECK (term IN ('Fall Semester', 'Spring Semester', 'Full Year', 'Summer', 'Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4')),
  grade TEXT NOT NULL,
  credits DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  academic_year TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_courses_student_id ON courses(student_id);
CREATE INDEX idx_courses_academic_year ON courses(academic_year);

-- RLS Policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own courses" 
  ON courses FOR ALL 
  USING (auth.uid() = user_id);
```

### assignments
```sql
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'Submitted', 'Graded')),
  points_possible INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_assignments_status ON assignments(status);

-- RLS Policies
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own assignments" 
  ON assignments FOR ALL 
  USING (auth.uid() = user_id);
```

### assignment_students (Junction Table)
```sql
CREATE TABLE assignment_students (
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (assignment_id, student_id)
);

-- Indexes
CREATE INDEX idx_assignment_students_assignment_id ON assignment_students(assignment_id);
CREATE INDEX idx_assignment_students_student_id ON assignment_students(student_id);

-- RLS Policies
ALTER TABLE assignment_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own assignment students" 
  ON assignment_students FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM assignments 
      WHERE assignments.id = assignment_students.assignment_id 
      AND assignments.user_id = auth.uid()
    )
  );
```

### logged_hours
```sql
CREATE TABLE logged_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  subject_name TEXT NOT NULL,
  log_date DATE NOT NULL,
  hours_spent DECIMAL(4,2) NOT NULL CHECK (hours_spent > 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_logged_hours_user_id ON logged_hours(user_id);
CREATE INDEX idx_logged_hours_student_id ON logged_hours(student_id);
CREATE INDEX idx_logged_hours_log_date ON logged_hours(log_date);

-- Unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX idx_logged_hours_unique ON logged_hours(user_id, student_id, subject_name, log_date);

-- RLS Policies
ALTER TABLE logged_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own logged hours" 
  ON logged_hours FOR ALL 
  USING (auth.uid() = user_id);
```

## Functions & Triggers

### Update Timestamp Trigger
```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Profile Creation Trigger
```sql
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## Performance Considerations

1. **Indexes**: All foreign keys and frequently queried columns are indexed
2. **Composite Indexes**: Junction tables use composite primary keys for optimal performance
3. **Generated Columns**: Lesson duration is computed and stored for efficient queries
4. **Partial Indexes**: Could be added for filtered queries (e.g., incomplete lessons)

## Migration Notes

- All tables use UUID primary keys for better distributed system compatibility
- Timestamps use TIMESTAMPTZ for proper timezone handling
- CHECK constraints enforce data integrity at the database level
- CASCADE deletes maintain referential integrity automatically
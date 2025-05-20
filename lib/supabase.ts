import { createClient } from "@supabase/supabase-js"

// Types for our database tables
export type Student = {
  id: string
  name: string
  grade_level?: string
  notes?: string
  profile_image?: string
  initials?: string
  created_at?: string
  updated_at?: string
}

export type Lesson = {
  id: string
  subject_name: string
  description?: string
  start_date: string
  end_date: string
  duration: number
  completed: boolean
  materials_needed?: string
  location?: string
  objectives?: string
  day?: string
  created_at?: string
  updated_at?: string
}

export type StudentLesson = {
  student_id: string
  lesson_id: string
}

export type Course = {
  id: string
  name: string
  category: string
  term: string
  grade?: string
  credits: number
  student_id: string
  academic_year?: string
  created_at?: string
  updated_at?: string
}

export type Assignment = {
  id: string
  title: string
  description?: string
  due_date: string
  status: string
  points_possible: number
  points_earned?: number
  course_id?: string
  created_at?: string
  updated_at?: string
}

export type StudentAssignment = {
  student_id: string
  assignment_id: string
}

// For client-side usage (singleton pattern to prevent multiple instances)
let supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }
  return supabaseClient
}

// For server-side usage
export const createServerSupabaseClient = () => {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

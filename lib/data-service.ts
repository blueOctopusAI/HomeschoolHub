import { getSupabaseClient } from "./supabase"
import type { Student, Lesson, Course, Assignment, StudentLesson, StudentAssignment } from "./supabase"

// Student services
export const fetchStudents = async (): Promise<Student[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("students").select("*").order("name")

  if (error) {
    console.error("Error fetching students:", error)
    return []
  }

  // Add the "all" student option
  const allStudentsOption: Student = {
    id: "all",
    name: "All Students",
  }

  return [allStudentsOption, ...data]
}

export const createStudent = async (
  student: Omit<Student, "id" | "created_at" | "updated_at">,
): Promise<Student | null> => {
  const supabase = getSupabaseClient()

  // Generate initials if not provided
  if (!student.initials && student.name) {
    const nameParts = student.name.split(" ")
    student.initials = nameParts.map((part) => part[0]).join("")
  }

  const { data, error } = await supabase.from("students").insert(student).select().single()

  if (error) {
    console.error("Error creating student:", error)
    return null
  }

  return data
}

export const updateStudent = async (id: string, updates: Partial<Student>): Promise<Student | null> => {
  const supabase = getSupabaseClient()

  // Don't update special "all" student
  if (id === "all") return null

  const { data, error } = await supabase
    .from("students")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating student:", error)
    return null
  }

  return data
}

export const deleteStudent = async (id: string): Promise<boolean> => {
  const supabase = getSupabaseClient()

  // Don't delete special "all" student
  if (id === "all") return false

  const { error } = await supabase.from("students").delete().eq("id", id)

  if (error) {
    console.error("Error deleting student:", error)
    return false
  }

  return true
}

// Lesson services
export const fetchLessons = async (): Promise<Lesson[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("lessons").select("*").order("start_date")

  if (error) {
    console.error("Error fetching lessons:", error)
    return []
  }

  return data
}

export const fetchLessonStudents = async (): Promise<StudentLesson[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("student_lessons").select("*")

  if (error) {
    console.error("Error fetching lesson students:", error)
    return []
  }

  return data
}

export const createLesson = async (
  lesson: Omit<Lesson, "id" | "created_at" | "updated_at">,
  studentIds: string[],
): Promise<Lesson | null> => {
  const supabase = getSupabaseClient()

  // Start a transaction
  const { data, error } = await supabase.from("lessons").insert(lesson).select().single()

  if (error) {
    console.error("Error creating lesson:", error)
    return null
  }

  // Add student relationships
  if (studentIds.length > 0 && studentIds[0] !== "all") {
    const studentLessons = studentIds.map((studentId) => ({
      student_id: studentId,
      lesson_id: data.id,
    }))

    const { error: relationError } = await supabase.from("student_lessons").insert(studentLessons)

    if (relationError) {
      console.error("Error creating student-lesson relationships:", relationError)
      // Consider rolling back the lesson creation here in a real app
    }
  }

  return data
}

export const updateLesson = async (
  id: string,
  updates: Partial<Lesson>,
  studentIds?: string[],
): Promise<Lesson | null> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("lessons")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating lesson:", error)
    return null
  }

  // Update student relationships if provided
  if (studentIds) {
    // First delete existing relationships
    const { error: deleteError } = await supabase.from("student_lessons").delete().eq("lesson_id", id)

    if (deleteError) {
      console.error("Error deleting student-lesson relationships:", deleteError)
    }

    // Then add new relationships
    if (studentIds.length > 0 && studentIds[0] !== "all") {
      const studentLessons = studentIds.map((studentId) => ({
        student_id: studentId,
        lesson_id: id,
      }))

      const { error: insertError } = await supabase.from("student_lessons").insert(studentLessons)

      if (insertError) {
        console.error("Error creating student-lesson relationships:", insertError)
      }
    }
  }

  return data
}

export const toggleLessonComplete = async (id: string, completed: boolean): Promise<boolean> => {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from("lessons")
    .update({
      completed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Error toggling lesson completion:", error)
    return false
  }

  return true
}

export const deleteLesson = async (id: string): Promise<boolean> => {
  const supabase = getSupabaseClient()

  // Delete the lesson (student_lessons will be deleted via cascade)
  const { error } = await supabase.from("lessons").delete().eq("id", id)

  if (error) {
    console.error("Error deleting lesson:", error)
    return false
  }

  return true
}

// Course services
export const fetchCourses = async (): Promise<Course[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("courses").select("*").order("name")

  if (error) {
    console.error("Error fetching courses:", error)
    return []
  }

  return data
}

export const createCourse = async (
  course: Omit<Course, "id" | "created_at" | "updated_at">,
): Promise<Course | null> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("courses").insert(course).select().single()

  if (error) {
    console.error("Error creating course:", error)
    return null
  }

  return data
}

export const updateCourse = async (id: string, updates: Partial<Course>): Promise<Course | null> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("courses")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating course:", error)
    return null
  }

  return data
}

export const deleteCourse = async (id: string): Promise<boolean> => {
  const supabase = getSupabaseClient()

  const { error } = await supabase.from("courses").delete().eq("id", id)

  if (error) {
    console.error("Error deleting course:", error)
    return false
  }

  return true
}

// Assignment services
export const fetchAssignments = async (): Promise<Assignment[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("assignments").select("*").order("due_date")

  if (error) {
    console.error("Error fetching assignments:", error)
    return []
  }

  return data
}

export const fetchAssignmentStudents = async (): Promise<StudentAssignment[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("student_assignments").select("*")

  if (error) {
    console.error("Error fetching assignment students:", error)
    return []
  }

  return data
}

export const createAssignment = async (
  assignment: Omit<Assignment, "id" | "created_at" | "updated_at">,
  studentIds: string[],
): Promise<Assignment | null> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("assignments").insert(assignment).select().single()

  if (error) {
    console.error("Error creating assignment:", error)
    return null
  }

  // Add student relationships
  if (studentIds.length > 0 && studentIds[0] !== "all") {
    const studentAssignments = studentIds.map((studentId) => ({
      student_id: studentId,
      assignment_id: data.id,
    }))

    const { error: relationError } = await supabase.from("student_assignments").insert(studentAssignments)

    if (relationError) {
      console.error("Error creating student-assignment relationships:", relationError)
    }
  }

  return data
}

export const updateAssignment = async (
  id: string,
  updates: Partial<Assignment>,
  studentIds?: string[],
): Promise<Assignment | null> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("assignments")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating assignment:", error)
    return null
  }

  // Update student relationships if provided
  if (studentIds) {
    // First delete existing relationships
    const { error: deleteError } = await supabase.from("student_assignments").delete().eq("assignment_id", id)

    if (deleteError) {
      console.error("Error deleting student-assignment relationships:", deleteError)
    }

    // Then add new relationships
    if (studentIds.length > 0 && studentIds[0] !== "all") {
      const studentAssignments = studentIds.map((studentId) => ({
        student_id: studentId,
        assignment_id: id,
      }))

      const { error: insertError } = await supabase.from("student_assignments").insert(studentAssignments)

      if (insertError) {
        console.error("Error creating student-assignment relationships:", insertError)
      }
    }
  }

  return data
}

export const deleteAssignment = async (id: string): Promise<boolean> => {
  const supabase = getSupabaseClient()

  const { error } = await supabase.from("assignments").delete().eq("id", id)

  if (error) {
    console.error("Error deleting assignment:", error)
    return false
  }

  return true
}

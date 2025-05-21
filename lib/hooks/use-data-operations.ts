import { useCallback } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useStore } from "@/lib/store"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-data"

/**
 * Hook that provides data operations with automatic Supabase sync
 */
export function useDataOperations() {
  /**
   * Toggle a lesson's completed status
   */
  const toggleLessonComplete = useCallback(async (id: string) => {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error("User not authenticated")
      }
      
      // First, fetch the current lesson
      const { data: lesson, error: fetchError } = await supabase
        .from('lessons')
        .select('completed')
        .eq('id', id)
        .single()
      
      if (fetchError) {
        throw fetchError
      }
      
      // Then update with the opposite status
      const { error: updateError } = await supabase
        .from('lessons')
        .update({ completed: !lesson.completed })
        .eq('id', id)
      
      if (updateError) {
        throw updateError
      }
      
      return true
    } catch (error) {
      console.error("Error toggling lesson completion:", error)
      throw error
    }
  }, [])
  
  /**
   * Mark multiple lessons as complete
   */
  const markAllLessonsComplete = useCallback(async (ids: string[]) => {
    try {
      const supabase = createSupabaseBrowserClient()
      
      // Update all lessons to completed
      const { error } = await supabase
        .from('lessons')
        .update({ completed: true })
        .in('id', ids)
      
      if (error) {
        throw error
      }
      
      return true
    } catch (error) {
      console.error("Error marking lessons as complete:", error)
      throw error
    }
  }, [])
  
  /**
   * Add a new lesson
   */
  const addLesson = useCallback(async (lesson: {
    subject_name: string
    subject_color: string
    start_date: string
    end_date: string
    studentIds: string[]
    description?: string
    objectives?: string
    materials_needed?: string
    location?: string
    day_of_week?: string
  }) => {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error("User not authenticated")
      }
      
      // Insert lesson
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          subject_name: lesson.subject_name,
          subject_color: lesson.subject_color,
          start_date: lesson.start_date,
          end_date: lesson.end_date,
          description: lesson.description,
          objectives: lesson.objectives,
          materials_needed: lesson.materials_needed,
          location: lesson.location,
          day_of_week: lesson.day_of_week,
          completed: false,
          user_id: user.id
        })
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      // Add student relationships
      if (lesson.studentIds.length > 0) {
        const studentRelationships = lesson.studentIds.map(studentId => ({
          lesson_id: data.id,
          student_id: studentId
        }))
        
        const { error: relError } = await supabase
          .from('lesson_students')
          .insert(studentRelationships)
        
        if (relError) {
          throw relError
        }
      }
      
      return data
    } catch (error) {
      console.error("Error adding lesson:", error)
      throw error
    }
  }, [])
  
  /**
   * Add a new assignment
   */
  const addAssignment = useCallback(async (assignment: {
    title: string
    description?: string
    due_date: string
    studentIds: string[]
    course_id?: string
    status?: string
    points_possible?: number
  }) => {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error("User not authenticated")
      }
      
      // Insert assignment
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          title: assignment.title,
          description: assignment.description,
          due_date: assignment.due_date,
          course_id: assignment.course_id,
          status: assignment.status || "Not Started",
          points_possible: assignment.points_possible || 100,
          user_id: user.id
        })
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      // Add student relationships
      if (assignment.studentIds.length > 0) {
        const studentRelationships = assignment.studentIds.map(studentId => ({
          assignment_id: data.id,
          student_id: studentId
        }))
        
        const { error: relError } = await supabase
          .from('assignment_students')
          .insert(studentRelationships)
        
        if (relError) {
          throw relError
        }
      }
      
      return data
    } catch (error) {
      console.error("Error adding assignment:", error)
      throw error
    }
  }, [])
  
  /**
   * Add a new student
   */
  const addStudent = useCallback(async (student: {
    name: string
    grade?: string
    notes?: string
  }) => {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error("User not authenticated")
      }
      
      // Insert student
      const { data, error } = await supabase
        .from('students')
        .insert({
          name: student.name,
          grade: student.grade,
          notes: student.notes,
          user_id: user.id
        })
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      return data
    } catch (error) {
      console.error("Error adding student:", error)
      throw error
    }
  }, [])
  
  // Return all operations
  return {
    toggleLessonComplete,
    markAllLessonsComplete,
    addLesson,
    addAssignment,
    addStudent
  }
}

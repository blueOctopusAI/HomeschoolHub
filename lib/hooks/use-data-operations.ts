import { useCallback } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useStore, type Student, type Lesson, type Course, type Assignment } from "@/lib/store"
import { useDataSync } from "@/lib/services/data-sync"
import { v4 as uuidv4 } from "uuid"

/**
 * Hook that provides data operations with automatic Supabase sync
 */
export function useDataOperations() {
  const { refreshData } = useDataSync()
  
  /**
   * Add a student to the database
   */
  const addStudent = useCallback(async (student: Omit<Student, "id">) => {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error("User not authenticated")
      }
      
      // Insert student into Supabase
      const { data, error } = await supabase
        .from('students')
        .insert({
          name: student.name,
          grade: student.gradeLevel,
          notes: student.notes,
          user_id: user.id
        })
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      // Refresh data to update the store
      await refreshData()
      
      return data
    } catch (error) {
      console.error("Error adding student:", error)
      throw error
    }
  }, [refreshData])
  
  /**
   * Update a student in the database
   */
  const updateStudent = useCallback(async (id: string, updates: Partial<Student>) => {
    try {
      const supabase = createSupabaseBrowserClient()
      
      // Insert student into Supabase
      const { data, error } = await supabase
        .from('students')
        .update({
          name: updates.name,
          grade: updates.gradeLevel,
          notes: updates.notes
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      // Refresh data to update the store
      await refreshData()
      
      return data
    } catch (error) {
      console.error("Error updating student:", error)
      throw error
    }
  }, [refreshData])
  
  /**
   * Delete a student from the database
   */
  const deleteStudent = useCallback(async (id: string) => {
    try {
      const supabase = createSupabaseBrowserClient()
      
      // Delete student from Supabase
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id)
      
      if (error) {
        throw error
      }
      
      // Refresh data to update the store
      await refreshData()
      
      return true
    } catch (error) {
      console.error("Error deleting student:", error)
      throw error
    }
  }, [refreshData])
  
  /**
   * Add a lesson to the database
   */
  const addLesson = useCallback(async (lesson: Omit<Lesson, "id">) => {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error("User not authenticated")
      }
      
      // Insert lesson into Supabase
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          subject_id: lesson.subjectId,
          subject_name: lesson.subjectName,
          subject_color: lesson.subjectColor,
          start_date: lesson.startDate,
          end_date: lesson.endDate,
          description: lesson.description,
          objectives: lesson.objectives,
          materials_needed: lesson.materialsNeeded,
          location: lesson.location,
          completed: lesson.completed,
          day_of_week: lesson.day_of_week,
          user_id: user.id
        })
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      // Insert student associations
      if (lesson.studentIds.length > 0) {
        const studentLessons = lesson.studentIds.map(studentId => ({
          lesson_id: data.id,
          student_id: studentId
        }))
        
        const { error: relError } = await supabase
          .from('lesson_students')
          .insert(studentLessons)
        
        if (relError) {
          throw relError
        }
      }
      
      // Refresh data to update the store
      await refreshData()
      
      return data
    } catch (error) {
      console.error("Error adding lesson:", error)
      throw error
    }
  }, [refreshData])
  
  /**
   * Update a lesson in the database
   */
  const updateLesson = useCallback(async (id: string, updates: Partial<Lesson>) => {
    try {
      const supabase = createSupabaseBrowserClient()
      
      // Begin a transaction
      const updateData: Record<string, any> = {}
      
      // Add fields that are present in the updates
      if (updates.subjectName !== undefined) updateData.subject_name = updates.subjectName
      if (updates.subjectColor !== undefined) updateData.subject_color = updates.subjectColor
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.objectives !== undefined) updateData.objectives = updates.objectives
      if (updates.materialsNeeded !== undefined) updateData.materials_needed = updates.materialsNeeded
      if (updates.location !== undefined) updateData.location = updates.location
      if (updates.completed !== undefined) updateData.completed = updates.completed
      if (updates.day_of_week !== undefined) updateData.day_of_week = updates.day_of_week
      
      // Update the lesson
      const { data, error } = await supabase
        .from('lessons')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      // Update student associations if provided
      if (updates.studentIds) {
        // First, delete existing relationships
        const { error: deleteError } = await supabase
          .from('lesson_students')
          .delete()
          .eq('lesson_id', id)
        
        if (deleteError) {
          throw deleteError
        }
        
        // Then, insert new relationships
        if (updates.studentIds.length > 0) {
          const studentLessons = updates.studentIds.map(studentId => ({
            lesson_id: id,
            student_id: studentId
          }))
          
          const { error: insertError } = await supabase
            .from('lesson_students')
            .insert(studentLessons)
          
          if (insertError) {
            throw insertError
          }
        }
      }
      
      // Refresh data to update the store
      await refreshData()
      
      return data
    } catch (error) {
      console.error("Error updating lesson:", error)
      throw error
    }
  }, [refreshData])
  
  /**
   * Toggle a lesson's completed status
   */
  const toggleLessonComplete = useCallback(async (id: string) => {
    try {
      // Get the current lessons
      const lessons = useStore.getState().lessons
      const lesson = lessons.find(l => l.id === id)
      
      if (!lesson) {
        throw new Error("Lesson not found")
      }
      
      // Update the lesson with the opposite completed status
      await updateLesson(id, { completed: !lesson.completed })
      
      return true
    } catch (error) {
      console.error("Error toggling lesson completion:", error)
      throw error
    }
  }, [updateLesson])
  
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
      
      // Refresh data to update the store
      await refreshData()
      
      return true
    } catch (error) {
      console.error("Error marking lessons as complete:", error)
      throw error
    }
  }, [refreshData])
  
  // Return all data operations
  return {
    addStudent,
    updateStudent,
    deleteStudent,
    addLesson,
    updateLesson,
    toggleLessonComplete,
    markAllLessonsComplete,
    refreshData,
  }
}

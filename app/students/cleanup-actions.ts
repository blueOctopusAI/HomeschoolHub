'use server'

import { createSupabaseServerActionClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface CleanupResult {
  success: boolean
  message: string
  details?: {
    orphanedLessons?: number
    orphanedAssignments?: number
    orphanedCourses?: number
    orphanedHours?: number
  }
}

/**
 * Clean up orphaned data (lessons, assignments, etc. without valid students)
 */
export async function cleanupOrphanedData(): Promise<CleanupResult> {
  try {
    const supabase = await createSupabaseServerActionClient()
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        success: false,
        message: "User not authenticated."
      }
    }
    
    // Get all valid student IDs for this user
    const { data: validStudents } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
    
    const validStudentIds = validStudents?.map(s => s.id) || []
    
    let orphanedLessons = 0
    let orphanedAssignments = 0
    let orphanedCourses = 0
    let orphanedHours = 0
    
    // Clean up lesson_students entries
    if (validStudentIds.length > 0) {
      // First, get all lessons for this user
      const { data: userLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('user_id', user.id)
      
      if (userLessons && userLessons.length > 0) {
        const lessonIds = userLessons.map(l => l.id)
        
        // Delete lesson_students entries where student doesn't exist
        const { count: deletedLessonStudents } = await supabase
          .from('lesson_students')
          .delete()
          .in('lesson_id', lessonIds)
          .not('student_id', 'in', `(${validStudentIds.join(',')})`)
          .select('*', { count: 'exact', head: true })
        
        orphanedLessons = deletedLessonStudents || 0
      }
      
      // Clean up assignment_students entries
      const { data: userAssignments } = await supabase
        .from('assignments')
        .select('id')
        .eq('user_id', user.id)
      
      if (userAssignments && userAssignments.length > 0) {
        const assignmentIds = userAssignments.map(a => a.id)
        
        // Delete assignment_students entries where student doesn't exist
        const { count: deletedAssignmentStudents } = await supabase
          .from('assignment_students')
          .delete()
          .in('assignment_id', assignmentIds)
          .not('student_id', 'in', `(${validStudentIds.join(',')})`)
          .select('*', { count: 'exact', head: true })
        
        orphanedAssignments = deletedAssignmentStudents || 0
      }
      
      // Clean up courses for non-existent students
      const { count: deletedCourses } = await supabase
        .from('courses')
        .delete()
        .eq('user_id', user.id)
        .not('student_id', 'in', `(${validStudentIds.join(',')})`)
        .select('*', { count: 'exact', head: true })
      
      orphanedCourses = deletedCourses || 0
      
      // Clean up logged hours for non-existent students
      const { count: deletedHours } = await supabase
        .from('logged_hours')
        .delete()
        .eq('user_id', user.id)
        .not('student_id', 'in', `(${validStudentIds.join(',')})`)
        .select('*', { count: 'exact', head: true })
      
      orphanedHours = deletedHours || 0
    } else {
      // If no valid students, clean up ALL student-related data
      // Delete all lesson_students for this user's lessons
      const { data: userLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('user_id', user.id)
      
      if (userLessons && userLessons.length > 0) {
        const lessonIds = userLessons.map(l => l.id)
        const { count } = await supabase
          .from('lesson_students')
          .delete()
          .in('lesson_id', lessonIds)
          .select('*', { count: 'exact', head: true })
        orphanedLessons = count || 0
      }
      
      // Delete all assignment_students for this user's assignments
      const { data: userAssignments } = await supabase
        .from('assignments')
        .select('id')
        .eq('user_id', user.id)
      
      if (userAssignments && userAssignments.length > 0) {
        const assignmentIds = userAssignments.map(a => a.id)
        const { count } = await supabase
          .from('assignment_students')
          .delete()
          .in('assignment_id', assignmentIds)
          .select('*', { count: 'exact', head: true })
        orphanedAssignments = count || 0
      }
      
      // Delete all courses for this user
      const { count: coursesCount } = await supabase
        .from('courses')
        .delete()
        .eq('user_id', user.id)
        .select('*', { count: 'exact', head: true })
      orphanedCourses = coursesCount || 0
      
      // Delete all logged hours for this user
      const { count: hoursCount } = await supabase
        .from('logged_hours')
        .delete()
        .eq('user_id', user.id)
        .select('*', { count: 'exact', head: true })
      orphanedHours = hoursCount || 0
    }
    
    // Revalidate all pages
    revalidatePath('/dashboard')
    revalidatePath('/students')
    revalidatePath('/assignments')
    revalidatePath('/calendar')
    revalidatePath('/checklist')
    revalidatePath('/transcript')
    revalidatePath('/compliance')
    
    const totalCleaned = orphanedLessons + orphanedAssignments + orphanedCourses + orphanedHours
    
    return {
      success: true,
      message: totalCleaned > 0 
        ? `Successfully cleaned up ${totalCleaned} orphaned records.`
        : "No orphaned data found. Your database is clean!",
      details: {
        orphanedLessons,
        orphanedAssignments,
        orphanedCourses,
        orphanedHours
      }
    }
  } catch (error) {
    console.error("Cleanup error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred during cleanup."
    }
  }
}

/**
 * Get a summary of potentially orphaned data
 */
export async function checkOrphanedData(): Promise<{
  success: boolean
  message: string
  orphanedData?: {
    lessonStudents: number
    assignmentStudents: number
    courses: number
    loggedHours: number
  }
}> {
  try {
    const supabase = await createSupabaseServerActionClient()
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        success: false,
        message: "User not authenticated."
      }
    }
    
    // Get all valid student IDs for this user
    const { data: validStudents } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
    
    const validStudentIds = validStudents?.map(s => s.id) || []
    
    let orphanedData = {
      lessonStudents: 0,
      assignmentStudents: 0,
      courses: 0,
      loggedHours: 0
    }
    
    if (validStudentIds.length === 0) {
      // If no students, check if there's any student-related data
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      const { count: hoursCount } = await supabase
        .from('logged_hours')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      orphanedData.courses = coursesCount || 0
      orphanedData.loggedHours = hoursCount || 0
    } else {
      // Check for orphaned courses
      const { count: orphanedCoursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('student_id', 'in', `(${validStudentIds.join(',')})`)
      
      orphanedData.courses = orphanedCoursesCount || 0
      
      // Check for orphaned logged hours
      const { count: orphanedHoursCount } = await supabase
        .from('logged_hours')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('student_id', 'in', `(${validStudentIds.join(',')})`)
      
      orphanedData.loggedHours = orphanedHoursCount || 0
    }
    
    const totalOrphaned = Object.values(orphanedData).reduce((sum, count) => sum + count, 0)
    
    return {
      success: true,
      message: totalOrphaned > 0 
        ? `Found ${totalOrphaned} orphaned records that can be cleaned up.`
        : "No orphaned data found.",
      orphanedData
    }
  } catch (error) {
    console.error("Check orphaned data error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred."
    }
  }
}
'use server'

import { createSupabaseServerActionClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ActionResult } from "@/app/actions"
import { z } from "zod"

// Define a schema for validation
const markMultipleLessonsSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  currentDateISO: z.string().refine(value => {
    try {
      return !isNaN(new Date(value).getTime());
    } catch (e) {
      return false;
    }
  }, "Current date must be a valid ISO string"),
  datePeriodType: z.enum(["today", "week"], { 
    errorMap: () => ({ message: "Date period must be either 'today' or 'week'" })
  }),
})

/**
 * Mark multiple lessons as complete based on date range and student
 */
export async function markMultipleLessonsComplete(formData: FormData): Promise<ActionResult> {
  try {
    // Create Supabase client
    const supabase = await createSupabaseServerActionClient()
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Check if user is authenticated
    if (!user) {
      return {
        success: false,
        message: "User not authenticated."
      }
    }
    
    // Ensure formData exists
    if (!formData) {
      return {
        success: false,
        message: "No form data provided."
      }
    }
    
    // Extract and validate form data
    const formValues = {
      studentId: formData.get('studentId')?.toString() || '',
      currentDateISO: formData.get('currentDateISO')?.toString() || '',
      datePeriodType: formData.get('datePeriodType')?.toString() || '',
    }

    
    // Validate the data
    const validationResult = markMultipleLessonsSchema.safeParse(formValues)
    
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors
      return {
        success: false,
        message: "Please correct the errors below.",
        errors
      }
    }
    
    const { studentId, currentDateISO, datePeriodType } = validationResult.data
    const currentDate = new Date(currentDateISO)
    
    // Build the query based on the date period type
    let query = supabase
      .from('lessons')
      .update({ completed: true })
      .eq('user_id', user.id)
      .eq('completed', false) // Only update lessons that aren't already completed
    
    // Date range filtering
    if (datePeriodType === "today") {
      // For today, get the start and end of the day
      const startOfDay = new Date(currentDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(currentDate)
      endOfDay.setHours(23, 59, 59, 999)
      
      query = query
        .gte('start_date', startOfDay.toISOString())
        .lte('start_date', endOfDay.toISOString())
    } else if (datePeriodType === "week") {
      // For week, get the start and end of the week (Monday to Sunday)
      const dayOfWeek = currentDate.getDay() // 0 = Sunday, 1 = Monday, etc.
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Adjust to get Monday (0 for Monday)
      
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - diff)
      startOfWeek.setHours(0, 0, 0, 0)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6) // Add 6 days to get to Sunday
      endOfWeek.setHours(23, 59, 59, 999)
      
      query = query
        .gte('start_date', startOfWeek.toISOString())
        .lte('start_date', endOfWeek.toISOString())
    }
    
    // Filter by student if not "all"
    if (studentId !== "all") {
      // We need to join with lesson_students to filter by student ID
      const { data: lessonIds } = await supabase
        .from('lesson_students')
        .select('lesson_id')
        .eq('student_id', studentId)
      
      if (!lessonIds || lessonIds.length === 0) {
        return {
          success: true,
          message: "0 lessons marked as complete. No lessons found for the selected student."
        }
      }
      
      // Extract the lesson IDs
      const ids = lessonIds.map(item => item.lesson_id)
      
      // Add to our query
      query = query.in('id', ids)
    }
    
    // Execute the update
    const { error, count } = await query
    
    if (error) {
      console.error("Error marking lessons as complete:", error)
      return {
        success: false,
        message: error.message || "Failed to mark lessons as complete."
      }
    }


    
    // Revalidate the checklist page
    revalidatePath('/checklist')
    
    return {
      success: true,
      message: `${count || 0} lessons marked as complete.`
    }
  } catch (error) {
    console.error("Error marking lessons as complete:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred."
    }
  }
}

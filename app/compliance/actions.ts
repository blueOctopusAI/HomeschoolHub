'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerActionClient } from '@/lib/supabase/server-action-client'
import { ActionResult } from '@/lib/types'

// Zod schema for logHours validation
const LogHoursSchema = z.object({
  studentId: z.string().uuid('Student ID must be a valid UUID'),
  subjectName: z.string().min(1, 'Subject name is required'),
  logDate: z.string().refine(
    (date) => {
      // Ensure the date string can be parsed correctly
      const parsedDate = new Date(date)
      return !isNaN(parsedDate.getTime())
    }, 
    { message: 'Date must be a valid format' }
  ),
  hoursSpent: z.coerce
    .number()
    .positive('Hours must be greater than 0')
    .max(24, 'Hours cannot exceed 24 per day'),
  notes: z.string().optional(),
})

type LogHoursInput = z.infer<typeof LogHoursSchema>

/**
 * Server action to log hours for a specific student
 * 
 * This will insert a new row into the logged_hours table
 * with proper validation and ownership checks
 */
export async function logHours(
  prevState: ActionResult | undefined, 
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerActionClient()
    
    if (!supabase || !supabase.auth) {
      return {
        success: false,
        message: 'Authentication service is unavailable',
      }
    }
    
    // Authenticate the user
    const { data, error: authError } = await supabase.auth.getUser()
    
    if (authError || !data.user) {
      return {
        success: false,
        message: 'You must be logged in to log hours',
      }
    }

    const user = data.user

    // Extract and parse form data
    const rawInput = {
      studentId: formData.get('studentId'),
      subjectName: formData.get('subjectName'),
      logDate: formData.get('logDate'),
      hoursSpent: formData.get('hoursSpent'),
      notes: formData.get('notes') || '',
    }

    // Validate form data
    const validationResult = LogHoursSchema.safeParse(rawInput)
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Invalid form data',
        errors: validationResult.error.format(),
      }
    }

    const { studentId, subjectName, logDate, hoursSpent, notes } = validationResult.data

    // Student ownership check
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('id', studentId)
      .eq('user_id', user.id)
      .single()

    if (studentError || !studentData) {
      return {
        success: false,
        message: 'You do not have permission to log hours for this student',
      }
    }

    // Create ISO date string for storage (YYYY-MM-DD)
    const dateObj = new Date(logDate)
    const formattedDate = dateObj.toISOString().split('T')[0]

    // Insert log entry
    const { error: insertError } = await supabase
      .from('logged_hours')
      .insert({
        user_id: user.id,
        student_id: studentId,
        subject_name: subjectName,
        log_date: formattedDate,
        hours_spent: hoursSpent,
        notes,
      })

    if (insertError) {
      console.error('Error logging hours:', insertError)
      return {
        success: false,
        message: 'Failed to log hours. Please try again.',
        errors: insertError,
      }
    }

    // Revalidate the compliance page to show the updated data
    revalidatePath('/compliance')

    return {
      success: true,
      message: 'Hours logged successfully',
    }
  } catch (error) {
    console.error('Unexpected error logging hours:', error)
    return {
      success: false,
      message: 'An unexpected error occurred',
      errors: error,
    }
  }
}

/**
 * Server action to delete a logged hours entry
 * 
 * Includes authentication and ownership verification through RLS
 */
export async function deleteLoggedHours(
  prevState: ActionResult | undefined, 
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerActionClient()
    
    if (!supabase || !supabase.auth) {
      return {
        success: false,
        message: 'Authentication service is unavailable',
      }
    }
    
    // Authenticate the user
    const { data, error: authError } = await supabase.auth.getUser()
    
    if (authError || !data.user) {
      return {
        success: false,
        message: 'You must be logged in to delete logged hours',
      }
    }

    const user = data.user

    // Get the logged hours entry ID
    const loggedHourId = formData.get('loggedHourId')
    if (!loggedHourId || typeof loggedHourId !== 'string') {
      return {
        success: false,
        message: 'Invalid logged hour ID',
      }
    }

    // Attempt to delete the entry
    // RLS policies will ensure this only works if the user owns the entry
    const { error, count } = await supabase
      .from('logged_hours')
      .delete({ count: 'exact' })
      .eq('id', loggedHourId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting logged hours:', error)
      return {
        success: false,
        message: 'Failed to delete logged hours',
        errors: error,
      }
    }

    if (count === 0) {
      return {
        success: false,
        message: 'No matching logged hours entry found or you do not have permission to delete it',
      }
    }

    // Revalidate the compliance page to show the updated data
    revalidatePath('/compliance')

    return {
      success: true,
      message: 'Logged hours deleted successfully',
    }
  } catch (error) {
    console.error('Unexpected error deleting logged hours:', error)
    return {
      success: false,
      message: 'An unexpected error occurred',
      errors: error,
    }
  }
}

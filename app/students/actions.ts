'use server'

import { createSupabaseServerActionClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ActionResult } from "@/app/actions"

// Schema for student validation
const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gradeLevel: z.string().optional(),
  notes: z.string().optional(),
})

/**
 * Create a new student
 */
export async function createStudent(
  prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  try {
    // Create Supabase client
    const supabase = await createSupabaseServerActionClient()
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        success: false,
        message: "User not authenticated."
      }
    }
    
    // Extract student data from form
    const studentData = {
      name: formData.get('name')?.toString() || '',
      gradeLevel: formData.get('gradeLevel')?.toString() || undefined,
      notes: formData.get('notes')?.toString() || undefined,
    }
    
    // Validate the student data
    const validationResult = studentSchema.safeParse(studentData)
    
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors
      return {
        success: false,
        message: "Please correct the errors below.",
        errors
      }
    }
    
    // Generate initials from name
    const initials = validationResult.data.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    
    // Create the student in the database
    const { error } = await supabase
      .from('students')
      .insert({
        user_id: user.id,
        name: validationResult.data.name,
        grade_level: validationResult.data.gradeLevel,
        notes: validationResult.data.notes,
        initials: initials
      })
    
    if (error) {
      console.error("Error creating student:", error)
      return {
        success: false,
        message: error.message || "Failed to create student."
      }
    }
    
    // Revalidate the students page
    revalidatePath('/students')
    revalidatePath('/dashboard')
    revalidatePath('/assignments')
    revalidatePath('/calendar')
    revalidatePath('/checklist')
    
    return {
      success: true,
      message: "Student created successfully."
    }
  } catch (error) {
    console.error("Student creation error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred."
    }
  }
}

/**
 * Update an existing student
 */
export async function updateStudent(
  prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  try {
    // Create Supabase client
    const supabase = await createSupabaseServerActionClient()
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        success: false,
        message: "User not authenticated."
      }
    }
    
    const studentId = formData.get('studentId')?.toString()
    if (!studentId) {
      return {
        success: false,
        message: "Student ID is required."
      }
    }
    
    // Extract student data from form
    const studentData = {
      name: formData.get('name')?.toString() || '',
      gradeLevel: formData.get('gradeLevel')?.toString() || undefined,
      notes: formData.get('notes')?.toString() || undefined,
    }
    
    // Validate the student data
    const validationResult = studentSchema.safeParse(studentData)
    
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors
      return {
        success: false,
        message: "Please correct the errors below.",
        errors
      }
    }
    
    // Generate initials from name
    const initials = validationResult.data.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    
    // Update the student in the database
    const { error } = await supabase
      .from('students')
      .update({
        name: validationResult.data.name,
        grade_level: validationResult.data.gradeLevel,
        notes: validationResult.data.notes,
        initials: initials,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId)
      .eq('user_id', user.id)
    
    if (error) {
      console.error("Error updating student:", error)
      return {
        success: false,
        message: error.message || "Failed to update student."
      }
    }
    
    // Revalidate relevant pages
    revalidatePath('/students')
    revalidatePath('/dashboard')
    revalidatePath('/assignments')
    revalidatePath('/calendar')
    revalidatePath('/checklist')
    
    return {
      success: true,
      message: "Student updated successfully."
    }
  } catch (error) {
    console.error("Student update error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred."
    }
  }
}

/**
 * Delete a student
 */
export async function deleteStudent(formData: FormData) {
  try {
    // Create Supabase client
    const supabase = await createSupabaseServerActionClient()
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        success: false,
        message: "User not authenticated."
      }
    }
    
    const studentId = formData.get('studentId')?.toString()
    if (!studentId) {
      return {
        success: false,
        message: "Student ID is required."
      }
    }
    
    // Delete the student (cascading deletes will handle related records)
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId)
      .eq('user_id', user.id)
    
    if (error) {
      console.error("Error deleting student:", error)
      return {
        success: false,
        message: error.message || "Failed to delete student."
      }
    }
    
    // Revalidate relevant pages
    revalidatePath('/students')
    revalidatePath('/dashboard')
    revalidatePath('/assignments')
    revalidatePath('/calendar')
    revalidatePath('/checklist')
    
    return {
      success: true,
      message: "Student deleted successfully."
    }
  } catch (error) {
    console.error("Student deletion error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred."
    }
  }
}
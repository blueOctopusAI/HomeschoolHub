'use server'

import { createSupabaseServerActionClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ActionResult } from "@/app/actions"

// Define a schema for assignment validation
const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  studentIds: z.string().min(1, "At least one student must be selected"),
  dueDate: z.string().min(1, "Due date is required"),
  pointsPossible: z.coerce.number().min(1, "Points must be greater than 0"),
  status: z.enum(["Not Started", "Submitted", "Graded"]).default("Not Started"),
  courseId: z.string().nullable().optional(),
});

/**
 * Creates a new assignment in the database
 */
export async function createAssignment(
  prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
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
    
    // Extract assignment fields from form data
    const assignmentData = {
      title: formData.get('title')?.toString() || '',
      description: formData.get('description')?.toString() || '',
      studentIds: formData.get('studentIds')?.toString() || '',
      dueDate: formData.get('dueDate')?.toString() || '',
      pointsPossible: formData.get('pointsPossible')?.toString() || '0',
      status: formData.get('status')?.toString() || 'Not Started',
      courseId: formData.get('courseId')?.toString() || null,
    }
    
    // Validate the assignment data
    const validationResult = assignmentSchema.safeParse(assignmentData)
    
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors
      return {
        success: false,
        message: "Please correct the errors below.",
        errors
      }
    }
    
    // Prepare the validated data for insertion
    const { studentIds, ...restOfData } = validationResult.data
    
    // Split the comma-separated student IDs
    const studentIdArray = studentIds.split(',').filter(Boolean)
    
    if (studentIdArray.length === 0) {
      return {
        success: false,
        message: "At least one student must be selected.",
        errors: {
          studentIds: ["At least one student must be selected."]
        }
      }
    }
    
    // Insert the assignment into the database
    const { data: newAssignment, error } = await supabase
      .from('assignments')
      .insert({
        user_id: user.id,
        title: restOfData.title,
        description: restOfData.description,
        due_date: restOfData.dueDate,
        status: restOfData.status,
        points_possible: restOfData.pointsPossible,
        course_id: restOfData.courseId === 'none' ? null : restOfData.courseId,
      })
      .select('id')
      .single()
    
    if (error) {
      console.error("Error creating assignment:", error)
      return {
        success: false,
        message: error.message || "Failed to create assignment."
      }
    }
    
    // Insert the student assignments
    const assignmentStudentPromises = studentIdArray.map(studentId => {
      return supabase
        .from('assignment_students')
        .insert({
          assignment_id: newAssignment.id,
          student_id: studentId
        })
    })
    
    // Wait for all student assignments to be created
    const studentResults = await Promise.all(assignmentStudentPromises)
    
    // Check if any student assignment insertions failed
    const studentErrors = studentResults.filter(result => result.error)
    if (studentErrors.length > 0) {
      console.error("Errors creating student assignments:", studentErrors)
      return {
        success: false,
        message: "Assignment created but some student associations failed."
      }
    }
    
    // Revalidate the assignments page
    revalidatePath('/assignments')
    
    return {
      success: true,
      message: "Assignment created successfully."
    }
  } catch (error) {
    console.error("Assignment creation error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred."
    }
  }
}
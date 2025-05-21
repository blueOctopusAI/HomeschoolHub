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
        course_id: (!restOfData.courseId || restOfData.courseId === 'None' || restOfData.courseId === 'none') ? null : restOfData.courseId,
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

/**
 * Updates an existing assignment in the database
 */
export async function updateAssignment(
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
    
    // Extract assignment ID
    const assignmentId = formData.get('assignmentId')?.toString()
    if (!assignmentId) {
      return {
        success: false,
        message: "Assignment ID is required.",
        errors: {
          assignmentId: ["Assignment ID is required."]
        }
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
    
    // Handle points earned if status is 'Graded'
    if (assignmentData.status === 'Graded') {
      const pointsEarned = formData.get('pointsEarned')?.toString()
      if (!pointsEarned) {
        return {
          success: false,
          message: "Points earned are required for graded assignments.",
          errors: {
            pointsEarned: ["Points earned are required for graded assignments."]
          }
        }
      }
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
    
    // Prepare the validated data for update
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
    
    // Check if the assignment exists and belongs to the user
    const { data: existingAssignment, error: existingError } = await supabase
      .from('assignments')
      .select('id')
      .eq('id', assignmentId)
      .eq('user_id', user.id)
      .single()
    
    if (existingError || !existingAssignment) {
      console.error("Error fetching assignment:", existingError)
      return {
        success: false,
        message: "Assignment not found or not authorized to update."
      }
    }
    
    // Prepare update data
    const updateData = {
      title: restOfData.title,
      description: restOfData.description,
      due_date: restOfData.dueDate,
      status: restOfData.status,
      points_possible: restOfData.pointsPossible,
      course_id: (!restOfData.courseId || restOfData.courseId === 'None' || restOfData.courseId === 'none') ? null : restOfData.courseId,
    }
    
    // Add points earned if status is 'Graded'
    if (restOfData.status === 'Graded') {
      const pointsEarned = formData.get('pointsEarned')?.toString() || '0'
      // @ts-ignore - We're adding a potentially missing property
      updateData.points_earned = Number(pointsEarned)
    } else {
      // @ts-ignore - We're adding a potentially missing property
      updateData.points_earned = null
    }
    
    // Update the assignment
    const { error: updateError } = await supabase
      .from('assignments')
      .update(updateData)
      .eq('id', assignmentId)
      .eq('user_id', user.id)
    
    if (updateError) {
      console.error("Error updating assignment:", updateError)
      return {
        success: false,
        message: updateError.message || "Failed to update assignment."
      }
    }
    
    // Get current student assignments for this assignment
    const { data: currentStudentAssignments, error: fetchError } = await supabase
      .from('assignment_students')
      .select('student_id')
      .eq('assignment_id', assignmentId)
    
    if (fetchError) {
      console.error("Error fetching current student assignments:", fetchError)
      return {
        success: false,
        message: "Failed to update student assignments."
      }
    }
    
    // Get current student IDs
    const currentStudentIds = currentStudentAssignments.map(sa => sa.student_id)
    
    // Determine students to add and remove
    const studentsToRemove = currentStudentIds.filter(id => !studentIdArray.includes(id))
    const studentsToAdd = studentIdArray.filter(id => !currentStudentIds.includes(id))
    
    // Handle removals
    if (studentsToRemove.length > 0) {
      const { error: removeError } = await supabase
        .from('assignment_students')
        .delete()
        .eq('assignment_id', assignmentId)
        .in('student_id', studentsToRemove)
      
      if (removeError) {
        console.error("Error removing student assignments:", removeError)
        return {
          success: false,
          message: "Failed to update some student assignments."
        }
      }
    }
    
    // Handle additions
    if (studentsToAdd.length > 0) {
      const assignmentStudentData = studentsToAdd.map(studentId => ({
        assignment_id: assignmentId,
        student_id: studentId
      }))
      
      const { error: addError } = await supabase
        .from('assignment_students')
        .insert(assignmentStudentData)
      
      if (addError) {
        console.error("Error adding student assignments:", addError)
        return {
          success: false,
          message: "Assignment updated but some student associations failed."
        }
      }
    }
    
    // Revalidate the assignments page
    revalidatePath('/assignments')
    
    return {
      success: true,
      message: "Assignment updated successfully."
    }
  } catch (error) {
    console.error("Assignment update error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred."
    }
  }
}

/**
 * Deletes an existing assignment from the database
 */
export async function deleteAssignment(formData: FormData): Promise<ActionResult> {
  try {
    if (!formData) {
      return {
        success: false,
        message: "No form data provided."
      }
    }
    
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
    
    // Extract assignment ID
    const assignmentId = formData.get('assignmentId')?.toString()
    if (!assignmentId) {
      return {
        success: false,
        message: "Assignment ID is required."
      }
    }
    
    // Delete the assignment (related assignment_students will be deleted via ON DELETE CASCADE)
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId)
      .eq('user_id', user.id)
    
    if (error) {
      console.error("Error deleting assignment:", error)
      return {
        success: false,
        message: error.message || "Failed to delete assignment."
      }
    }
    
    // Revalidate the assignments page
    revalidatePath('/assignments')
    
    return {
      success: true,
      message: "Assignment deleted successfully."
    }
  } catch (error) {
    console.error("Assignment deletion error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred."
    }
  }
}
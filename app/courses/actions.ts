'use server'

import { createSupabaseServerActionClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ActionResult } from "@/app/actions"

// Define a schema for course validation
const courseSchema = z.object({
  studentId: z.string().uuid("Invalid student ID format").min(1, "Student ID is required"),
  name: z.string().min(1, "Course name is required"),
  category: z.string().min(1, "Category is required"),
  term: z.enum(["Fall Semester", "Spring Semester", "Full Year"], {
    errorMap: () => ({ message: "Term must be Fall Semester, Spring Semester, or Full Year" })
  }),
  grade: z.string().min(1, "Grade is required"),
  credits: z.coerce.number().nonnegative("Credits must be non-negative").max(5, "Credits cannot exceed 5"),
  academicYear: z.string().optional(),
});

/**
 * Creates a new course in the database
 */
export async function createCourse(
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
    
    // Extract course fields from form data
    const courseData = {
      studentId: formData.get('studentId')?.toString() || '',
      name: formData.get('name')?.toString() || '',
      category: formData.get('category')?.toString() || '',
      term: formData.get('term')?.toString() || '',
      grade: formData.get('grade')?.toString() || '',
      credits: formData.get('credits')?.toString() || '0',
      academicYear: formData.get('academicYear')?.toString() || undefined,
    }
    
    // Validate the course data
    const validationResult = courseSchema.safeParse(courseData)
    
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors
      return {
        success: false,
        message: "Please correct the errors below.",
        errors
      }
    }
    
    // Verify that the studentId belongs to the currently authenticated user
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('id', validationResult.data.studentId)
      .eq('user_id', user.id)
      .single()
    
    if (studentError || !studentData) {
      console.error("Error verifying student ownership:", studentError)
      return {
        success: false,
        message: "You can only create courses for students that belong to you.",
        errors: {
          studentId: ["Student not found or doesn't belong to you."]
        }
      }
    }
    
    // Insert the course into the database
    const { data: newCourse, error } = await supabase
      .from('courses')
      .insert({
        user_id: user.id,
        student_id: validationResult.data.studentId,
        name: validationResult.data.name,
        category: validationResult.data.category,
        term: validationResult.data.term,
        grade: validationResult.data.grade,
        credits: validationResult.data.credits,
        academic_year: validationResult.data.academicYear,
      })
      .select('id')
      .single()
    
    if (error) {
      console.error("Error creating course:", error)
      return {
        success: false,
        message: error.message || "Failed to create course."
      }
    }
    
    // Revalidate the transcript page
    revalidatePath('/transcript')
    
    return {
      success: true,
      message: "Course created successfully.",
      data: newCourse
    }
  } catch (error) {
    console.error("Course creation error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred."
    }
  }
}

/**
 * Updates an existing course in the database
 */
export async function updateCourse(
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
    
    // Extract course ID
    const courseId = formData.get('courseId')?.toString()
    if (!courseId) {
      return {
        success: false,
        message: "Course ID is required.",
        errors: {
          courseId: ["Course ID is required."]
        }
      }
    }
    
    // Extract course fields from form data
    const courseData = {
      name: formData.get('name')?.toString() || '',
      category: formData.get('category')?.toString() || '',
      term: formData.get('term')?.toString() || '',
      grade: formData.get('grade')?.toString() || '',
      credits: formData.get('credits')?.toString() || '0',
      academicYear: formData.get('academicYear')?.toString() || undefined,
      // Note: We don't include studentId as it shouldn't be updatable for existing courses
    }
    
    // Create a modified schema without studentId for updates
    const updateCourseSchema = courseSchema.omit({ studentId: true });
    
    // Validate the course data
    const validationResult = updateCourseSchema.safeParse(courseData)
    
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors
      return {
        success: false,
        message: "Please correct the errors below.",
        errors
      }
    }
    
    // Update the course and check ownership in one operation
    const { data, error, count } = await supabase
      .from('courses')
      .update({
        name: validationResult.data.name,
        category: validationResult.data.category,
        term: validationResult.data.term,
        grade: validationResult.data.grade,
        credits: validationResult.data.credits,
        academic_year: validationResult.data.academicYear,
      })
      .eq('id', courseId)
      .eq('user_id', user.id)
      .select()
    
    if (error) {
      console.error("Error updating course:", error)
      return {
        success: false,
        message: error.message || "Failed to update course."
      }
    }
    
    // Check if any rows were updated
    if (!data || data.length === 0) {
      return {
        success: false,
        message: "Course not found or you don't have permission to update it."
      }
    }
    
    // Revalidate the transcript page
    revalidatePath('/transcript')
    
    return {
      success: true,
      message: "Course updated successfully.",
      data: data[0]
    }
  } catch (error) {
    console.error("Course update error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred."
    }
  }
}

/**
 * Deletes an existing course from the database
 */
export async function deleteCourse(
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
    
    // Extract course ID
    const courseId = formData.get('courseId')?.toString()
    if (!courseId) {
      return {
        success: false,
        message: "Course ID is required."
      }
    }
    
    // Delete the course and check ownership in one operation
    const { error, count } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
      .eq('user_id', user.id)
    
    if (error) {
      console.error("Error deleting course:", error)
      return {
        success: false,
        message: error.message || "Failed to delete course."
      }
    }
    
    // Check if any rows were deleted
    if (count === 0) {
      return {
        success: false,
        message: "Course not found or you don't have permission to delete it."
      }
    }
    
    // Revalidate the transcript page
    revalidatePath('/transcript')
    
    return {
      success: true,
      message: "Course deleted successfully."
    }
  } catch (error) {
    console.error("Course deletion error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred."
    }
  }
}
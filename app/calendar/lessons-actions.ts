'use server'

import { createSupabaseServerActionClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ActionResult } from "@/app/actions"

// Define a schema for lesson validation
const lessonSchema = z.object({
  subjectName: z.string().min(1, "Subject name is required"),
  subjectColor: z.string().min(1, "Subject color is required"),
  startDate: z.string().refine(value => {
    try {
      return !isNaN(new Date(value).getTime());
    } catch (e) {
      return false;
    }
  }, "Start date must be a valid ISO string"),
  endDate: z.string().refine(value => {
    try {
      return !isNaN(new Date(value).getTime());
    } catch (e) {
      return false;
    }
  }, "End date must be a valid ISO string"),
  studentIds: z.string().min(1, "At least one student must be selected"),
  description: z.string().optional().nullable().transform(val => val || ''),
  objectives: z.string().optional().nullable().transform(val => val || ''),
  materialsNeeded: z.string().optional().nullable().transform(val => val || ''),
  location: z.string().optional().nullable().transform(val => val || ''),
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).optional().nullable().or(z.literal('')),
});

/**
 * Creates a new lesson in the database
 */
export async function createLesson(
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
    
    // Extract lesson fields from form data
    const lessonData = {
      subjectName: formData.get('subjectName')?.toString() || '',
      subjectColor: formData.get('subjectColor')?.toString() || '',
      startDate: formData.get('startDate')?.toString() || '',
      endDate: formData.get('endDate')?.toString() || '',
      studentIds: formData.get('studentIds')?.toString() || '',
      description: formData.get('description')?.toString() || '',
      objectives: formData.get('objectives')?.toString() || '',
      materialsNeeded: formData.get('materialsNeeded')?.toString() || '',
      location: formData.get('location')?.toString() || '',
      dayOfWeek: formData.get('dayOfWeek')?.toString() || '',
    }
    
    // Validate the lesson data
    const validationResult = lessonSchema.safeParse(lessonData)
    
    if (!validationResult.success) {
      console.error("Validation errors:", validationResult.error.flatten());
      const errors = validationResult.error.flatten().fieldErrors
      return {
        success: false,
        message: "Please correct the errors below.",
        errors
      }
    }
    
    // Validate that endDate is after startDate
    const startDate = new Date(validationResult.data.startDate)
    const endDate = new Date(validationResult.data.endDate)
    
    if (endDate <= startDate) {
      return {
        success: false,
        message: "End date must be after start date.",
        errors: {
          endDate: ["End date must be after start date."]
        }
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
    
    // Get the day of the week if not provided or empty
    let day = restOfData.dayOfWeek
    if (!day || day === '') {
      day = new Date(startDate).toLocaleDateString('en-US', { weekday: 'long' })
    }
    
    // Insert the lesson into the database
    const { data: newLesson, error } = await supabase
    .from('lessons')
    .insert({
    user_id: user.id,
    subject_name: restOfData.subjectName,
    subject_color: restOfData.subjectColor,
    description: restOfData.description,
    start_date: restOfData.startDate,
    end_date: restOfData.endDate,
    day_of_week: day,
    completed: false,
    location: restOfData.location,
    materials_needed: restOfData.materialsNeeded,
    objectives: restOfData.objectives
    })
    .select('id')
    .single()
    
    if (error) {
      console.error("Error creating lesson:", error)
      return {
        success: false,
        message: error.message || "Failed to create lesson."
      }
    }
    
    // Insert the student lessons
    const lessonStudentPromises = studentIdArray.map(studentId => {
      return supabase
        .from('lesson_students')
        .insert({
          lesson_id: newLesson.id,
          student_id: studentId
        })
    })
    
    // Wait for all student lessons to be created
    const studentResults = await Promise.all(lessonStudentPromises)
    
    // Check if any student lesson insertions failed
    const studentErrors = studentResults.filter(result => result.error)
    if (studentErrors.length > 0) {
      console.error("Errors creating student lessons:", studentErrors)
      return {
        success: false,
        message: "Lesson created but some student associations failed."
      }
    }
    
    // Revalidate the calendar page
    revalidatePath('/calendar')
    
    return {
      success: true,
      message: "Lesson created successfully."
    }
  } catch (error) {
    console.error("Lesson creation error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred."
    }
  }
}

/**
 * Updates an existing lesson in the database
 */
export async function updateLesson(
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
    
    // Extract lesson ID
    const lessonId = formData.get('lessonId')?.toString()
    if (!lessonId) {
      console.error("Missing lessonId in formData")
      return {
        success: false,
        message: "Lesson ID is required.",
        errors: {
          lessonId: ["Lesson ID is required."]
        }
      }
    }
    
    // Log incoming formData entries for debugging
    console.log("Received form data for update:")
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`)
    }
    
    // Extract lesson fields from form data
    const lessonData = {
      subjectName: formData.get('subjectName')?.toString() || '',
      subjectColor: formData.get('subjectColor')?.toString() || '',
      startDate: formData.get('startDate')?.toString() || '',
      endDate: formData.get('endDate')?.toString() || '',
      studentIds: formData.get('studentIds')?.toString() || '',
      description: formData.get('description')?.toString() || '',
      objectives: formData.get('objectives')?.toString() || '',
      materialsNeeded: formData.get('materialsNeeded')?.toString() || '',
      location: formData.get('location')?.toString() || '',
      dayOfWeek: formData.get('dayOfWeek')?.toString() || '',
    }
    
    // Log extracted data for debugging
    console.log("Extracted lesson data:", lessonData)
    
    // Validate the lesson data
    const validationResult = lessonSchema.safeParse(lessonData)
    
    if (!validationResult.success) {
      console.error("Update validation errors:", validationResult.error.flatten());
      const errors = validationResult.error.flatten().fieldErrors
      return {
        success: false,
        message: "Please correct the errors below.",
        errors
      }
    }
    
    // Validate that endDate is after startDate
    const startDate = new Date(validationResult.data.startDate)
    const endDate = new Date(validationResult.data.endDate)
    
    if (endDate <= startDate) {
      return {
        success: false,
        message: "End date must be after start date.",
        errors: {
          endDate: ["End date must be after start date."]
        }
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
    
    // Check if the lesson exists and belongs to the user
    const { data: existingLesson, error: existingError } = await supabase
      .from('lessons')
      .select('id')
      .eq('id', lessonId)
      .eq('user_id', user.id)
      .single()
    
    if (existingError || !existingLesson) {
      console.error("Error fetching lesson:", existingError)
      return {
        success: false,
        message: "Lesson not found or not authorized to update."
      }
    }
    
    // Get the day of the week if not provided or empty
    let day = restOfData.dayOfWeek
    if (!day || day === '') {
      day = new Date(startDate).toLocaleDateString('en-US', { weekday: 'long' })
    }
    
    // Update the lesson
    const { error: updateError } = await supabase
    .from('lessons')
    .update({
    subject_name: restOfData.subjectName,
    subject_color: restOfData.subjectColor,
    description: restOfData.description,
    start_date: restOfData.startDate,
    end_date: restOfData.endDate,
    day_of_week: day,
    location: restOfData.location,
    materials_needed: restOfData.materialsNeeded,
    objectives: restOfData.objectives
    })
    .eq('id', lessonId)
    .eq('user_id', user.id)
    
    if (updateError) {
      console.error("Error updating lesson:", updateError)
      return {
        success: false,
        message: updateError.message || "Failed to update lesson."
      }
    }
    
    // Get current student lessons for this lesson
    const { data: currentStudentLessons, error: fetchError } = await supabase
      .from('lesson_students')
      .select('student_id')
      .eq('lesson_id', lessonId)
    
    if (fetchError) {
      console.error("Error fetching current student lessons:", fetchError)
      return {
        success: false,
        message: "Failed to update student associations."
      }
    }
    
    // Get current student IDs
    const currentStudentIds = currentStudentLessons.map(sl => sl.student_id)
    
    // Determine students to add and remove
    const studentsToRemove = currentStudentIds.filter(id => !studentIdArray.includes(id))
    const studentsToAdd = studentIdArray.filter(id => !currentStudentIds.includes(id))
    
    // Handle removals
    if (studentsToRemove.length > 0) {
      const { error: removeError } = await supabase
        .from('lesson_students')
        .delete()
        .eq('lesson_id', lessonId)
        .in('student_id', studentsToRemove)
      
      if (removeError) {
        console.error("Error removing student lessons:", removeError)
        return {
          success: false,
          message: "Failed to update some student associations."
        }
      }
    }
    
    // Handle additions
    if (studentsToAdd.length > 0) {
      const lessonStudentData = studentsToAdd.map(studentId => ({
        lesson_id: lessonId,
        student_id: studentId
      }))
      
      const { error: addError } = await supabase
        .from('lesson_students')
        .insert(lessonStudentData)
      
      if (addError) {
        console.error("Error adding student lessons:", addError)
        return {
          success: false,
          message: "Lesson updated but some student associations failed."
        }
      }
    }
    
    // Revalidate the calendar page
    revalidatePath('/calendar')
    
    return {
      success: true,
      message: "Lesson updated successfully."
    }
  } catch (error) {
    console.error("Lesson update error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred."
    }
  }
}

/**
 * Deletes an existing lesson from the database
 */
export async function deleteLesson(
  prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
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
    
    // Extract lesson ID
    const lessonId = formData.get('lessonId')?.toString()
    if (!lessonId) {
      return {
        success: false,
        message: "Lesson ID is required."
      }
    }
    
    // First check if the lesson exists and belongs to the user
    const { data: existingLesson, error: checkError } = await supabase
      .from('lessons')
      .select('id')
      .eq('id', lessonId)
      .eq('user_id', user.id)
      .single()
    
    if (checkError || !existingLesson) {
      return {
        success: false,
        message: "Lesson not found or not authorized to delete."
      }
    }
    
    // Delete the lesson (related lesson_students will be deleted via ON DELETE CASCADE)
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId)
      .eq('user_id', user.id)
    
    if (error) {
      console.error("Error deleting lesson:", error)
      return {
        success: false,
        message: error.message || "Failed to delete lesson."
      }
    }
    
    // Revalidate the calendar page
    revalidatePath('/calendar')
    
    return {
      success: true,
      message: "Lesson deleted successfully."
    }
  } catch (error) {
    console.error("Lesson deletion error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred."
    }
  }
}

/**
 * Toggles the completion status of a lesson
 */
export async function toggleLessonComplete(
  prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
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
    
    // Extract lesson ID
    const lessonId = formData.get('lessonId')?.toString()
    if (!lessonId) {
      return {
        success: false,
        message: "Lesson ID is required."
      }
    }
    
    // Get the new completed status
    const newCompletedStatus = formData.get('completed')?.toString() === 'true'
    
    // First check if the lesson exists and belongs to the user
    const { data: existingLesson, error: checkError } = await supabase
      .from('lessons')
      .select('id, completed')
      .eq('id', lessonId)
      .eq('user_id', user.id)
      .single()
    
    if (checkError || !existingLesson) {
      return {
        success: false,
        message: "Lesson not found or not authorized to update."
      }
    }
    
    // Update the lesson's completed status
    const { error } = await supabase
      .from('lessons')
      .update({ completed: newCompletedStatus })
      .eq('id', lessonId)
      .eq('user_id', user.id)
    
    if (error) {
      console.error("Error updating lesson completion status:", error)
      return {
        success: false,
        message: error.message || "Failed to update lesson completion status."
      }
    }
    
    // Revalidate the calendar page
    revalidatePath('/calendar')
    
    return {
      success: true,
      message: `Lesson marked as ${newCompletedStatus ? 'completed' : 'incomplete'}.`
    }
  } catch (error) {
    console.error("Lesson completion toggle error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred."
    }
  }
}
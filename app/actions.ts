'use server'

import { createSupabaseServerActionClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Define the ActionResult interface
export interface ActionResult {
  success: boolean;
  message: string | null;
  errors?: { [key: string]: string[] | undefined };
}

// Define a schema for profile validation
const profileSchema = z.object({
  full_name: z.string().min(1, "Name cannot be empty"),
  timezone: z.string().optional(),
  avatar_url: z.string().optional(),
})

/**
 * Update the current user's profile
 */
export async function updateMyProfile(
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
    
    // Extract profile fields from form data
    const profileData = {
      full_name: formData.get('full_name')?.toString() || '',
      timezone: formData.get('timezone')?.toString() || '',
      avatar_url: formData.get('avatar_url')?.toString() || undefined,
    }
    
    // Validate the profile data
    const validationResult = profileSchema.safeParse(profileData)
    
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors
      return {
        success: false,
        message: "Please correct the errors below.",
        errors
      }
    }
    
    // Update the profile in the database
    const { error } = await supabase
      .from('profiles')
      .update(validationResult.data)
      .eq('id', user.id)
    
    if (error) {
      console.error("Error updating profile:", error)
      return {
        success: false,
        message: error.message || "Failed to update profile."
      }
    }
    
    // Revalidate the profile page
    revalidatePath('/profile')
    
    return {
      success: true,
      message: "Profile updated successfully."
    }
  } catch (error) {
    console.error("Profile update error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred."
    }
  }
}

/**
 * Seeds the database with sample data for the current user
 */
export async function seedDatabaseAction(): Promise<ActionResult> {
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
    
    // Create sample students
    const sampleStudents = [
      { name: "Emma Johnson", grade: "3rd Grade", user_id: user.id },
      { name: "Noah Williams", grade: "5th Grade", user_id: user.id },
      { name: "Olivia Davis", grade: "1st Grade", user_id: user.id },
    ]
    
    const { data: createdStudents, error: studentsError } = await supabase
      .from('students')
      .upsert(sampleStudents, { onConflict: 'user_id,name' })
      .select('id, name')
    
    if (studentsError) {
      console.error("Error creating sample students:", studentsError)
      return {
        success: false,
        message: "Failed to create sample students."
      }
    }
    
    // Create sample courses
    const sampleCourses = [
      { name: "Mathematics", description: "Elementary math curriculum", user_id: user.id },
      { name: "Science", description: "Basic scientific concepts", user_id: user.id },
      { name: "Language Arts", description: "Reading and writing skills", user_id: user.id },
      { name: "History", description: "World and US history", user_id: user.id },
    ]
    
    const { data: createdCourses, error: coursesError } = await supabase
      .from('courses')
      .upsert(sampleCourses, { onConflict: 'user_id,name' })
      .select('id, name')
    
    if (coursesError) {
      console.error("Error creating sample courses:", coursesError)
      return {
        success: false,
        message: "Failed to create sample courses."
      }
    }
    
    // Create sample assignments
    if (createdStudents && createdStudents.length > 0 && createdCourses && createdCourses.length > 0) {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)
      
      const sampleAssignments = [
        {
          title: "Multiplication Practice",
          description: "Complete worksheet on multiplication tables 1-10",
          due_date: tomorrow.toISOString(),
          status: "Not Started",
          points_possible: 20,
          user_id: user.id,
          course_id: createdCourses[0].id, // Math course
        },
        {
          title: "Plant Life Cycle Report",
          description: "Write a one-page report on the plant life cycle",
          due_date: nextWeek.toISOString(),
          status: "Not Started",
          points_possible: 50,
          user_id: user.id,
          course_id: createdCourses[1].id, // Science course
        },
        {
          title: "Vocabulary Test",
          description: "Study the vocabulary list for Friday's test",
          due_date: nextWeek.toISOString(),
          status: "Not Started",
          points_possible: 25,
          user_id: user.id,
          course_id: createdCourses[2].id, // Language Arts course
        },
      ]
      
      // Insert assignments
      for (const assignment of sampleAssignments) {
        const { data: createdAssignment, error: assignmentError } = await supabase
          .from('assignments')
          .insert(assignment)
          .select('id')
          .single()
        
        if (assignmentError) {
          console.error("Error creating assignment:", assignmentError)
          continue // Continue with the next assignment
        }
        
        // Assign to all students
        for (const student of createdStudents) {
          await supabase
            .from('assignment_students')
            .insert({
              assignment_id: createdAssignment.id,
              student_id: student.id
            })
        }
      }
    }
    
    // Create sample lessons
    if (createdStudents && createdStudents.length > 0) {
      // Get the current week's dates (Monday to Friday)
      const today = new Date()
      const monday = new Date(today)
      monday.setDate(today.getDate() - (today.getDay() - 1)) // Get the Monday of current week
      monday.setHours(9, 0, 0, 0) // 9:00 AM
      
      const subjectColors = {
        "Math": "#3b82f6", // blue
        "Science": "#10b981", // green
        "Reading": "#f59e0b", // amber
        "Writing": "#8b5cf6", // purple
        "History": "#ef4444", // red
      }
      
      // Create one lesson per day
      const subjects = Object.keys(subjectColors)
      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      
      for (let i = 0; i < 5; i++) { // Monday to Friday
        const currentDay = new Date(monday)
        currentDay.setDate(monday.getDate() + i)
        
        // Morning lesson
        const morningStart = new Date(currentDay)
        morningStart.setHours(9, 0, 0, 0)
        
        const morningEnd = new Date(currentDay)
        morningEnd.setHours(10, 30, 0, 0)
        
        const subject = subjects[i % subjects.length]
        
        const { data: newLesson, error } = await supabase
          .from('lessons')
          .upsert({
            user_id: user.id,
            subject_name: subject,
            subject_color: subjectColors[subject as keyof typeof subjectColors],
            description: `${subject} lesson for ${weekdays[i]}`,
            start_date: morningStart.toISOString(),
            end_date: morningEnd.toISOString(),
            day_of_week: weekdays[i],
            completed: false,
            location: "Home Classroom",
            materials_needed: `Textbook, notebook, pencils`,
            objectives: `Learn key concepts in ${subject}`
          }, { onConflict: 'user_id,subject_name,start_date' })
          .select('id')
          .single()
        
        if (error) {
          console.error(`Error creating ${subject} lesson:`, error)
          continue
        }
        
        // Assign lesson to all students
        for (const student of createdStudents) {
          await supabase
            .from('lesson_students')
            .upsert({
              lesson_id: newLesson.id,
              student_id: student.id
            }, { onConflict: 'lesson_id,student_id' })
        }
        
        // Afternoon lesson (different subject)
        const afternoonStart = new Date(currentDay)
        afternoonStart.setHours(13, 0, 0, 0)
        
        const afternoonEnd = new Date(currentDay)
        afternoonEnd.setHours(14, 30, 0, 0)
        
        const afternoonSubject = subjects[(i + 2) % subjects.length]
        
        const { data: afternoonLesson, error: afternoonError } = await supabase
          .from('lessons')
          .upsert({
            user_id: user.id,
            subject_name: afternoonSubject,
            subject_color: subjectColors[afternoonSubject as keyof typeof subjectColors],
            description: `${afternoonSubject} lesson for ${weekdays[i]} afternoon`,
            start_date: afternoonStart.toISOString(),
            end_date: afternoonEnd.toISOString(),
            day_of_week: weekdays[i],
            completed: false,
            location: "Home Classroom",
            materials_needed: "Textbook, notebook, pencils",
            objectives: `Learn key concepts in ${afternoonSubject}`
          }, { onConflict: 'user_id,subject_name,start_date' })
          .select('id')
          .single()
        
        if (afternoonError) {
          console.error(`Error creating ${afternoonSubject} lesson:`, afternoonError)
          continue
        }
        
        // Assign afternoon lesson to all students
        for (const student of createdStudents) {
          await supabase
            .from('lesson_students')
            .upsert({
              lesson_id: afternoonLesson.id,
              student_id: student.id
            }, { onConflict: 'lesson_id,student_id' })
        }
      }
    }
    
    // Revalidate the pages
    revalidatePath('/students')
    revalidatePath('/courses')
    revalidatePath('/assignments')
    revalidatePath('/calendar')
    
    return {
      success: true,
      message: "Database seeded successfully with sample data!"
    }
  } catch (error) {
    console.error("Error seeding database:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred"
    }
  }
}

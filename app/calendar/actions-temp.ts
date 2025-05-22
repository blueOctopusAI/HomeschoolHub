'use server'

import { createSupabaseServerActionClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Adds sample lessons for the current user
 */
export async function addSampleLessons(): Promise<{ success: boolean, message: string }> {
  try {
    // Create Supabase client
    const supabase = await createSupabaseServerActionClient()
    
    // Get the current user
    const { data, error } = await supabase.auth.getUser()
    
    if (error || !data.user) {
      return {
        success: false,
        message: "User not authenticated."
      }
    }
    
    const user = data.user
    
    // Get user's students to associate with lessons
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
    
    if (studentsError) {
      console.error("Error fetching students:", studentsError)
      return {
        success: false,
        message: "Error fetching students."
      }
    }
    
    // If no students, create some sample students first
    if (!students || students.length === 0) {
      const sampleStudents = [
        {
          user_id: user.id,
          name: "Emma Johnson",
          grade_level: "3rd Grade",
          initials: "EJ"
        },
        {
          user_id: user.id,
          name: "Noah Williams",
          grade_level: "5th Grade",
          initials: "NW"
        },
        {
          user_id: user.id,
          name: "Olivia Davis",
          grade_level: "7th Grade",
          initials: "OD"
        }
      ]
      
      // Insert sample students
      const { data: newStudents, error: createStudentsError } = await supabase
        .from('students')
        .insert(sampleStudents)
        .select('id')
      
      if (createStudentsError) {
        console.error("Error creating sample students:", createStudentsError)
        return {
          success: false,
          message: "Error creating sample students."
        }
      }
      
      // Use newly created students
      students.push(...(newStudents || []))
    }
    
    // Get student IDs for association
    const studentIds = students.map(student => student.id)
    
    // Create date objects for lessons this week (Monday to Friday)
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 (Sunday) to 6 (Saturday)
    const monday = new Date(today)
    monday.setDate(today.getDate() - dayOfWeek + 1) // Move to Monday
    
    // Create sample lessons for this week
    const sampleLessons = [
      // Monday
      {
        user_id: user.id,
        subject_id: "subject1",
        subject_name: "Math",
        subject_color: "#4CAF50",
        description: "Multiplication and division practice",
        start_date: new Date(monday).setHours(9, 0, 0, 0),
        end_date: new Date(monday).setHours(10, 0, 0, 0),
        duration: 60,
        day: "Monday",
        completed: false,
        materials_needed: "Workbook, pencils, calculator",
        location: "Dining room",
        objectives: "Master multiplication tables 1-12"
      },
      // Tuesday
      {
        user_id: user.id,
        subject_id: "subject2",
        subject_name: "Science",
        subject_color: "#2196F3",
        description: "Plant life cycles",
        start_date: new Date(new Date(monday).setDate(monday.getDate() + 1)).setHours(10, 30, 0, 0),
        end_date: new Date(new Date(monday).setDate(monday.getDate() + 1)).setHours(11, 30, 0, 0),
        duration: 60,
        day: "Tuesday",
        completed: true,
        materials_needed: "Seeds, soil, pots, water",
        location: "Kitchen",
        objectives: "Understand the stages of plant growth"
      },
      // Wednesday
      {
        user_id: user.id,
        subject_id: "subject3",
        subject_name: "Language Arts",
        subject_color: "#9C27B0",
        description: "Reading comprehension",
        start_date: new Date(new Date(monday).setDate(monday.getDate() + 2)).setHours(9, 0, 0, 0),
        end_date: new Date(new Date(monday).setDate(monday.getDate() + 2)).setHours(10, 0, 0, 0),
        duration: 60,
        day: "Wednesday",
        completed: false,
        materials_needed: "Book, notebook, pencils",
        location: "Living room",
        objectives: "Identify main ideas and supporting details"
      },
      // Thursday
      {
        user_id: user.id,
        subject_id: "subject4",
        subject_name: "History",
        subject_color: "#FF9800",
        description: "Ancient civilizations",
        start_date: new Date(new Date(monday).setDate(monday.getDate() + 3)).setHours(13, 0, 0, 0),
        end_date: new Date(new Date(monday).setDate(monday.getDate() + 3)).setHours(14, 0, 0, 0),
        duration: 60,
        day: "Thursday",
        completed: false,
        materials_needed: "Textbook, map, timeline",
        location: "Office",
        objectives: "Compare and contrast ancient Egypt and Mesopotamia"
      },
      // Friday
      {
        user_id: user.id,
        subject_id: "subject5",
        subject_name: "Art",
        subject_color: "#E91E63",
        description: "Watercolor painting",
        start_date: new Date(new Date(monday).setDate(monday.getDate() + 4)).setHours(14, 0, 0, 0),
        end_date: new Date(new Date(monday).setDate(monday.getDate() + 4)).setHours(15, 0, 0, 0),
        duration: 60,
        day: "Friday",
        completed: false,
        materials_needed: "Watercolor paints, paper, brushes, water cups",
        location: "Dining room",
        objectives: "Learn basic watercolor techniques"
      },
    ]
    
    // Convert Date objects to ISO strings for Supabase
    const lessonsToInsert = sampleLessons.map(lesson => ({
      ...lesson,
      start_date: new Date(lesson.start_date).toISOString(),
      end_date: new Date(lesson.end_date).toISOString()
    }))
    
    // Insert sample lessons
    const { data: newLessons, error: lessonError } = await supabase
      .from('lessons')
      .insert(lessonsToInsert)
      .select('id')
    
    if (lessonError) {
      console.error("Error creating sample lessons:", lessonError)
      return {
        success: false,
        message: "Error creating sample lessons."
      }
    }
    
    // Associate lessons with students
    if (newLessons && newLessons.length > 0) {
      // Create student associations
      const lessonStudentAssociations = []
      
      // For each lesson, associate with different combinations of students
      for (let i = 0; i < newLessons.length; i++) {
        const lessonId = newLessons[i].id
        
        // Associate with different combinations of students
        if (i === 0 && studentIds.length >= 2) {
          // First lesson: Associate with first two students if available
          lessonStudentAssociations.push(
            { lesson_id: lessonId, student_id: studentIds[0] },
            { lesson_id: lessonId, student_id: studentIds[1] }
          )
        } else if (i === 1 && studentIds.length >= 2) {
          // Second lesson: Associate with first and last student if available
          lessonStudentAssociations.push(
            { lesson_id: lessonId, student_id: studentIds[0] },
            { lesson_id: lessonId, student_id: studentIds[studentIds.length - 1] }
          )
        } else if (i === 2 && studentIds.length >= 1) {
          // Third lesson: Associate with second student if available
          if (studentIds.length > 1) {
            lessonStudentAssociations.push(
              { lesson_id: lessonId, student_id: studentIds[1] }
            )
          } else {
            lessonStudentAssociations.push(
              { lesson_id: lessonId, student_id: studentIds[0] }
            )
          }
        } else {
          // Other lessons: Associate with all students
          studentIds.forEach(studentId => {
            lessonStudentAssociations.push({ lesson_id: lessonId, student_id: studentId })
          })
        }
      }
      
      // Insert all lesson-student associations
      if (lessonStudentAssociations.length > 0) {
        const { error: associationError } = await supabase
          .from('lesson_students')
          .insert(lessonStudentAssociations)
        
        if (associationError) {
          console.error("Error creating lesson-student associations:", associationError)
          return {
            success: false,
            message: "Lessons created but student associations failed."
          }
        }
      }
    }
    
    // Revalidate the calendar page
    revalidatePath('/calendar')
    
    return {
      success: true,
      message: "Sample lessons added successfully."
    }
  } catch (error) {
    console.error("Error adding sample lessons:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred."
    }
  }
}

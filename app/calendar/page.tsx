import { CalendarView } from "@/components/calendar-view"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { type Lesson, type Student } from "@/lib/store"

// Force dynamic rendering due to cookies usage
export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  try {
    // Create Supabase client
    const supabase = await createSupabaseServerComponentClient()
    
    // Get the current user
    const { data, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error("Error fetching user:", error)
      redirect('/login')
    }
    
    const user = data.user
    
    // Redirect if user is not authenticated
    if (!user) {
      redirect("/login")
    }
    
    // Fetch user's lessons with student assignments
    const { data: lessonsWithStudents, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        *,
        lesson_students (
          student_id
        )
      `)
      .eq('user_id', user.id)
    
    if (lessonsError) {
      console.error("Error fetching lessons:", lessonsError)
      return <div>Error loading lessons. Please try again later.</div>
    }
    
    // Fetch user's students
    const { data: userStudents, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', user.id)
    
    if (studentsError) {
      console.error("Error fetching students:", studentsError)
      return <div>Error loading students. Please try again later.</div>
    }
    
    // Transform lessons data to match the expected Lesson type
    const transformedLessons: Lesson[] = (lessonsWithStudents || []).map(lesson => {
      const studentIds = lesson.lesson_students ? 
        lesson.lesson_students.map((s: { student_id: string }) => s.student_id) : 
        []
      
      return {
        id: lesson.id,
        subjectId: lesson.subject_id,
        subjectName: lesson.subject_name,
        subjectColor: lesson.subject_color,
        description: lesson.description,
        studentIds: studentIds,
        startDate: lesson.start_date,
        endDate: lesson.end_date,
        completed: lesson.completed || false,
        day_of_week: lesson.day_of_week,
        duration: lesson.duration,
        location: lesson.location,
        materialsNeeded: lesson.materials_needed,
        objectives: lesson.objectives
      }
    })
    
    // Transform students data to match the expected Student type
    const transformedStudents: Student[] = [
      // Add the "All Students" option
      { id: "all", name: "All Students" },
      // Add the user's students
      ...(userStudents || []).map(student => ({
        id: student.id,
        name: student.name,
        gradeLevel: student.grade_level,
        notes: student.notes,
        profileImage: student.profile_image,
        initials: student.initials || student.name.split(' ').map(n => n[0]).join('')
      }))
    ]
    
    return <CalendarView initialLessons={transformedLessons} userStudents={transformedStudents} />
  } catch (error) {
    console.error("Error in CalendarPage:", error)
    return <div>Error loading calendar. Please try again later.</div>
  }
}
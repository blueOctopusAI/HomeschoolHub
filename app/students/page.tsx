import { redirect } from "next/navigation"
import { StudentsView } from "@/components/students-view"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { Student } from "@/lib/store"

// Force dynamic rendering due to cookies usage
export const dynamic = 'force-dynamic'

export default async function StudentsPage() {
  try {
    // Create Supabase server client
    const supabase = await createSupabaseServerComponentClient()
    
    // Fetch the current authenticated user
    const { data, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error("Error fetching user:", userError)
      redirect('/login')
    }
    
    const user = data.user
    
    // If no user is authenticated, redirect to login
    if (!user) {
      redirect('/login')
    }
    
    // Fetch students for the authenticated user
    const { data: userStudents, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (studentsError) {
      console.error("Error fetching students:", studentsError)
    }
    
    // Transform students to match the Student type
    const transformedStudents = userStudents?.map(student => ({
      id: student.id,
      name: student.name,
      gradeLevel: student.grade_level || undefined,
      notes: student.notes || undefined,
      profileImage: student.profile_image_url || undefined,
      initials: student.initials || undefined
    } as Student)) || []
    
    return (
      <StudentsView 
        initialStudents={transformedStudents}
      />
    )
  } catch (error) {
    console.error("Unhandled error in StudentsPage:", error)
    return <div>Error loading students. Please check the console for details.</div>
  }
}
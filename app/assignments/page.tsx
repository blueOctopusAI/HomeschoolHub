import { redirect } from "next/navigation"
import { AssignmentsView } from "@/components/assignments-view"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { Assignment, Student, Course } from "@/lib/store"

// Force dynamic rendering due to cookies usage
export const dynamic = 'force-dynamic'

export default async function AssignmentsPage() {
  
  try {
    // Create Supabase server client
    const supabase = await createSupabaseServerComponentClient()
    
    // Fetch the current authenticated user
    const { data, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error("Error fetching user:", userError);
      redirect('/login');
    }
    
    const user = data.user;
    
    // If no user is authenticated, redirect to login
    if (!user) {
      redirect('/login');
    }
    

    // Fetch assignments for the authenticated user
    const { data: assignmentsWithStudents, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        assignment_students (
          student_id
        )
      `)
      .eq('user_id', user.id);
    
    if (assignmentsError) {
      console.error("Error fetching assignments:", assignmentsError);
    }
    
    // Fetch students for the authenticated user
    const { data: userStudents, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', user.id);
    
    if (studentsError) {
      console.error("Error fetching students:", studentsError);
    }
    
    // Fetch courses for the authenticated user
    const { data: userCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', user.id);
    
    if (coursesError) {
      console.error("Error fetching courses:", coursesError);
    }
    
    // Transform assignments to include studentIds as an array of strings
    const transformedAssignments = assignmentsWithStudents?.map(assignment => {
      // Extract student_ids from assignment_students relation
      const studentIds = assignment.assignment_students?.map(
        (relation: { student_id: string }) => relation.student_id
      ) || [];
      
      // Create a new assignment object with the correct structure
      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        studentIds: studentIds,
        dueDate: assignment.due_date,
        status: assignment.status as "Not Started" | "Submitted" | "Graded",
        pointsPossible: assignment.points_possible,
        pointsEarned: assignment.points_earned,
        courseId: assignment.course_id
      } as Assignment;
    }) || [];
    
    return (
      <AssignmentsView 
        initialAssignments={transformedAssignments} 
        userStudents={userStudents as Student[] || []} 
        userCourses={userCourses as Course[] || []} 
      />
    );
  } catch (error) {
    console.error("Unhandled error in AssignmentsPage:", error);
    return <div>Error loading assignments. Please check the console for details.</div>;
  }
}
import { redirect } from "next/navigation"
import { AssignmentsView } from "@/components/assignments-view"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { Assignment, Student, Course } from "@/lib/store"

export default async function AssignmentsPage() {
  console.log("AssignmentsPage component is rendering");
  
  try {
    // Create Supabase server client
    const supabase = await createSupabaseServerComponentClient()
    console.log("Supabase client created successfully");
    
    // Fetch the current authenticated user
    const { data, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error("Error fetching user:", userError);
      redirect('/login');
    }
    
    const user = data.user;
    console.log("Current authenticated user:", user?.id, user?.email);
    
    // If no user is authenticated, redirect to login
    if (!user) {
      console.log("No authenticated user, redirecting to login");
      redirect('/login');
    }
    
    // Try fetching all assignments without filtering by user_id to debug
    const { data: allAssignments, error: allAssignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(10);
    
    console.log("All assignments (first 10):", allAssignments);
    console.log("All assignments error:", allAssignmentsError);
    
    // Now fetch assignments for the authenticated user
    const { data: assignmentsWithStudents, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        assignment_students (
          student_id
        )
      `)
      .eq('user_id', user.id);
    
    console.log("Assignments for user:", assignmentsWithStudents);
    console.log("Assignments error:", assignmentsError);
    
    if (assignmentsError) {
      console.error("Error fetching assignments:", assignmentsError);
    }
    
    // Test query for specific user we know has data
    const testUserId = 'f09f3943-4e2e-450a-a73d-ed5e12c883e6';
    const { data: testUserAssignments, error: testError } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', testUserId)
      .limit(10);
    
    console.log(`Assignments for test user (${testUserId}):`, testUserAssignments);
    console.log("Test query error:", testError);
    
    // Fetch students for the authenticated user
    const { data: userStudents, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', user.id);
    
    console.log("Students for user:", userStudents);
    console.log("Students error:", studentsError);
    
    if (studentsError) {
      console.error("Error fetching students:", studentsError);
    }
    
    // Fetch courses for the authenticated user
    const { data: userCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', user.id);
    
    console.log("Courses for user:", userCourses);
    console.log("Courses error:", coursesError);
    
    if (coursesError) {
      console.error("Error fetching courses:", coursesError);
    }
    
    // Transform assignments to include studentIds as an array of strings
    const transformedAssignments = assignmentsWithStudents?.map(assignment => {
      // Extract student_ids from assignment_students relation
      const studentIds = assignment.assignment_students?.map(
        (relation: { student_id: string }) => relation.student_id
      ) || [];
      
      console.log(`Assignment ${assignment.id} student IDs:`, studentIds);
      
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
    
    console.log("Final transformed assignments:", transformedAssignments);
    
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
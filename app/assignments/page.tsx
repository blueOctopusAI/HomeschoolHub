import { redirect } from "next/navigation"
import { AssignmentsLessonsView } from "@/components/assignments-lessons-view"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { Assignment, Student, Course, Lesson } from "@/lib/store"

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
    
    // Fetch lessons for the authenticated user
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
    }
    
    // Transform lessons to match the Lesson type
    const transformedLessons = lessonsWithStudents?.map(lesson => {
      // Extract student_ids from lesson_students relation
      const studentIds = lesson.lesson_students?.map(
        (relation: { student_id: string }) => relation.student_id
      ) || []
      
      return {
        id: lesson.id,
        subjectId: lesson.subject_id || '',
        subjectName: lesson.subject_name,
        subjectColor: lesson.subject_color,
        startDate: lesson.start_date,
        endDate: lesson.end_date,
        studentIds: studentIds,
        description: lesson.description,
        objectives: lesson.objectives,
        materialsNeeded: lesson.materials_needed,
        location: lesson.location,
        completed: lesson.completed,
        day_of_week: lesson.day_of_week
      } as Lesson
    }) || []
    
    return (
      <AssignmentsLessonsView 
        initialAssignments={transformedAssignments} 
        initialLessons={transformedLessons}
        userStudents={userStudents as Student[] || []} 
        userCourses={userCourses as Course[] || []} 
      />
    );
  } catch (error) {
    console.error("Unhandled error in AssignmentsPage:", error);
    return <div>Error loading assignments. Please check the console for details.</div>;
  }
}
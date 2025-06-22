import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import StudentPortalLayout from "@/components/student-portal-layout";
import StudentChecklistWithActions from "@/components/student-checklist-with-actions";
import StudentAssignmentActions from "@/components/student-assignment-actions";
import { KidFriendlyGrades } from "@/components/kid-friendly-grades";

// Force dynamic rendering due to cookies usage
export const dynamic = 'force-dynamic'

interface StudentPortalPageProps {
  params: {
    studentId: string;
  };
}

export default async function StudentPortalPage({ params }: StudentPortalPageProps) {
  // Authentication and authorization checks
  const supabase = await createSupabaseServerComponentClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Extract and await the studentId - required in Next.js 15+
  const { studentId } = await params;

  // Type-safe access to studentId using the awaited value
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, name, grade_level, initials") 
    .eq("id", studentId) 
    .eq("user_id", user.id)
    .single();

  if (studentError || !student) {
    notFound(); // Return 404 if student not found or doesn't belong to parent
  }

  // Fetch today's lessons for the student
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day
  const tomorrow = new Date(new Date(today)); // Clone the date properly
  tomorrow.setDate(today.getDate() + 1); // Start of tomorrow





  // First get the lesson_ids for this student using lesson_students table
  const { data: studentLessons, error: studentLessonsError } = await supabase
    .from("lesson_students")
    .select("lesson_id")
    .eq("student_id", student.id);

  // Log any errors
  if (studentLessonsError) {
    console.error("Error fetching student lessons:", studentLessonsError);
  }
    
  // Get array of lesson IDs
  const lessonIds = studentLessons ? studentLessons.map(sl => sl.lesson_id) : [];

  // If no lessons are associated with this student, try fetching all lessons for today
  let todaysLessons = [];
  let lessonsError = null;

  if (lessonIds.length > 0) {
    // Fetch lessons with the specific IDs
    const { data, error } = await supabase
      .from("lessons")
      .select(`
        id, 
        subject_name,
        subject_color,
        description,
        start_date,
        end_date,
        completed,
        objectives,
        materials_needed,
        location
      `)
      .eq("user_id", user.id) // Parent owns the lesson
      .in("id", lessonIds) // Use the actual lesson IDs
      .order('start_date', { ascending: true });
    
    // Check if any of these lessons are for today
    let todaysFilteredLessons = [];
    if (data && data.length > 0) {
      todaysFilteredLessons = data.filter(lesson => {
        const lessonDate = new Date(lesson.start_date);
        return lessonDate >= today && lessonDate < tomorrow;
      });
    }
    
    todaysLessons = todaysFilteredLessons.length > 0 ? todaysFilteredLessons : data || [];
    lessonsError = error;

  } else {
    // If no lesson IDs found, fetch all lessons for today
    const { data, error } = await supabase
      .from("lessons")
      .select(`
        id, 
        subject_name,
        subject_color,
        description,
        start_date,
        end_date,
        completed,
        objectives,
        materials_needed,
        location
      `)
      .eq("user_id", user.id) // Parent owns the lesson
      .gte("start_date", today.toISOString())
      .lt("start_date", tomorrow.toISOString())
      .order('start_date', { ascending: true });
    
    todaysLessons = data || [];
    lessonsError = error;

  }

  // Handle any errors in lesson fetching
  if (lessonsError) {
    console.error("Error fetching lessons:", lessonsError);
  }

  // Fetch upcoming assignments for the student

  // Get assignments associated with this student
  const { data: studentAssignments, error: studentAssignmentsError } = await supabase
    .from("assignment_students")
    .select("assignment_id")
    .eq("student_id", student.id);

  if (studentAssignmentsError) {
    console.error("Error fetching student assignments:", studentAssignmentsError);
  }

  // Get array of assignment IDs
  const assignmentIds = studentAssignments ? studentAssignments.map(sa => sa.assignment_id) : [];

  // Fetch assignments for the student
  let upcomingAssignments = [];

  if (assignmentIds.length > 0) {
    // Fetch assignments - grades are stored directly in the assignments table
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from("assignments")
      .select(`
        id, 
        title,
        description,
        due_date,
        status,
        points_possible,
        points_earned,
        course_id
      `)
      .eq("user_id", user.id)
      .in("id", assignmentIds)
      .order('due_date', { ascending: false })
      .limit(10);

    if (assignmentsError) {
      console.error("Error fetching assignments:", assignmentsError);
    } else if (assignmentsData) {
      upcomingAssignments = assignmentsData;
      console.log("Assignments data:", assignmentsData);
    }
  }
  
  return (
    <StudentPortalLayout studentName={student.name}>
      <div className="student-portal-container">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-purple-400 to-blue-500 rounded-2xl p-8 mb-8 text-white shadow-lg">
          <h2 className="text-3xl font-bold mb-2">Hi, {student.name}! 👋</h2>
          <p className="text-lg opacity-90">Ready for an awesome day of learning?</p>
        </div>
        
        {/* Today's Checklist with integrated component */}
        <div className="mb-8 bg-white p-6 rounded-2xl shadow-lg border-2 border-purple-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Today's Adventures</h3>
          </div>
          <StudentChecklistWithActions lessons={todaysLessons} studentId={student.id} />
        </div>

        {/* Assignments */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 border-2 border-blue-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">My Assignments</h3>
          </div>
          <StudentAssignmentActions assignments={upcomingAssignments} studentId={student.id} />
        </div>
        
        {/* My Grades Section */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-green-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">My Achievements</h3>
          </div>
          <KidFriendlyGrades studentId={student.id} studentName={student.name} />
        </div>
      </div>
    </StudentPortalLayout>
  );
}

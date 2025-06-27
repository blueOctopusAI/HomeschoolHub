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





  // Fetch today's lessons for the student in a single query
  const { data: todaysLessons, error: lessonsError } = await supabase
    .from('lessons')
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
      location,
      lesson_students!inner(student_id)
    `)
    .eq('lesson_students.student_id', student.id) // Filter by student
    .eq('user_id', user.id) // Ensure parent owns the lesson
    .gte('start_date', today.toISOString()) // Filter for today
    .lt('start_date', tomorrow.toISOString())
    .order('start_date', { ascending: true });
  
  if (lessonsError) {
    console.error("Error fetching today's lessons:", lessonsError);
  }

  // Fetch upcoming assignments for the student

  // Fetch upcoming assignments for the student in a single query
  const { data: upcomingAssignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select(`
      id,
      title,
      description,
      due_date,
      status,
      points_possible,
      points_earned,
      course_id,
      assignment_students!inner(student_id)
    `)
    .eq('assignment_students.student_id', student.id)
    .eq('user_id', user.id)
    .order('due_date', { ascending: true }) // Changed to ascending for a more natural "upcoming" order
    .limit(10);

  if (assignmentsError) {
    console.error("Error fetching assignments:", assignmentsError);
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

import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import StudentPortalLayout from "@/components/student-portal-layout";
import StudentChecklistView from "@/components/student-checklist-view";

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
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
  
  // First get the lesson_ids for this student
  const { data: studentLessons } = await supabase
    .from("lesson_students")
    .select("lesson_id")
    .eq("student_id", student.id); // Use the validated student.id instead of params
    
  // Get array of lesson IDs
  const lessonIds = studentLessons ? studentLessons.map(sl => sl.lesson_id) : [];
  
  // Now fetch lessons with these IDs
  const { data: todaysLessons, error: lessonsError } = await supabase
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
    .in("id", lessonIds.length > 0 ? lessonIds : ['no-matching-id']) // Handle empty array case
    .order('start_date', { ascending: true });
  
  // Handle any errors in lesson fetching
  if (lessonsError) {
    console.error("Error fetching lessons:", lessonsError);
    // Continue rendering, but with empty lessons array
  }

  // TODO: Fetch upcoming assignments for the student (for Task 11.4)
  
  return (
    <StudentPortalLayout studentName={student.name}>
      <div className="student-portal-container">
        <h2 className="text-2xl text-sage-600 mb-6">Welcome, {student.name}!</h2>
        
        {/* Today's Checklist with integrated component */}
        <div className="mb-8 bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-sage-700 mb-3">Today's Checklist</h3>
          <StudentChecklistView lessons={todaysLessons || []} />
        </div>

        {/* Placeholder for Upcoming Assignments */}
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-sage-700 mb-3">Upcoming Assignments</h3>
          <p className="text-gray-500 italic">Upcoming assignments will appear here.</p>
        </div>
      </div>
    </StudentPortalLayout>
  );
}

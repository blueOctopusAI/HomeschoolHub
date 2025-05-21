import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import StudentPortalLayout from "@/components/student-portal-layout";
import StudentChecklistWithActions from "@/components/student-checklist-with-actions";
import StudentAssignmentActions from "@/components/student-assignment-actions";

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

  console.log(`Fetching lessons for student ${student.id} (${student.name}) between ${today.toISOString()} and ${tomorrow.toISOString()}`);

  // Debug info
  console.log(`StudentID: ${student.id}, UserID: ${user.id}`);

  // First get the lesson_ids for this student using lesson_students table
  const { data: studentLessons, error: studentLessonsError } = await supabase
    .from("lesson_students")
    .select("lesson_id")
    .eq("student_id", student.id);

  // Log any errors or the result
  if (studentLessonsError) {
    console.error("Error fetching student lessons:", studentLessonsError);
  } else {
    console.log(`Found ${studentLessons?.length || 0} lessons associated with student`);
  }
    
  // Get array of lesson IDs
  const lessonIds = studentLessons ? studentLessons.map(sl => sl.lesson_id) : [];
  console.log("Lesson IDs:", lessonIds);

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
    
    console.log(`Found ${todaysLessons.length} lessons (${todaysFilteredLessons.length} for today)`);
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
    
    console.log(`Found ${todaysLessons.length} lessons for today using date range`);
  }

  // Handle any errors in lesson fetching
  if (lessonsError) {
    console.error("Error fetching lessons:", lessonsError);
  }

  // Fetch upcoming assignments for the student
  console.log("Fetching upcoming assignments for student:", student.id);

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
  console.log("Assignment IDs:", assignmentIds);

  // Fetch assignments with these IDs
  let upcomingAssignments = [];
  let assignmentsError = null;

  if (assignmentIds.length > 0) {
    const { data, error } = await supabase
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
      .gte("due_date", today.toISOString()) // Only future assignments
      .order('due_date', { ascending: true })
      .limit(5); // Limit to 5 upcoming assignments
    
    upcomingAssignments = data || [];
    assignmentsError = error;
    
    console.log(`Found ${upcomingAssignments.length} upcoming assignments`);
  }

  // Handle any errors in assignment fetching
  if (assignmentsError) {
    console.error("Error fetching assignments:", assignmentsError);
  }
  
  return (
    <StudentPortalLayout studentName={student.name}>
      <div className="student-portal-container">
        <h2 className="text-2xl text-sage-600 mb-6">Welcome, {student.name}!</h2>
        
        {/* Today's Checklist with integrated component */}
        <div className="mb-8 bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-sage-700 mb-3">Today's Checklist</h3>
          <StudentChecklistWithActions lessons={todaysLessons} studentId={student.id} />
        </div>

        {/* Upcoming Assignments */}
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-sage-700 mb-3">Upcoming Assignments</h3>
          <StudentAssignmentActions assignments={upcomingAssignments} studentId={student.id} />
        </div>
      </div>
    </StudentPortalLayout>
  );
}

import { useEffect, useRef } from "react"
import { useStore } from "@/lib/store"
import { 
  useStudentsData, 
  useLessonsData, 
  useCoursesData, 
  useAssignmentsData 
} from "@/lib/hooks/use-supabase-data"

/**
 * Hook that synchronizes Supabase data with the Zustand store
 * This provides centralized data loading and keeps the Zustand store in sync
 */
export function useSyncStoreWithSupabase() {
  // Get data using our custom Supabase hooks
  const { data: students, loading: loadingStudents, error: studentsError } = useStudentsData()
  const { data: lessons, loading: loadingLessons, error: lessonsError } = useLessonsData()
  const { data: courses, loading: loadingCourses, error: coursesError } = useCoursesData()
  const { data: assignments, loading: loadingAssignments, error: assignmentsError } = useAssignmentsData()
  
  // Get store setters
  const setStudents = useStore(state => state.setStudents)
  const setLessons = useStore(state => state.setLessons)
  const setCourses = useStore(state => state.setCourses)
  const setAssignments = useStore(state => state.setAssignments)
  
  // Use refs to track previous data to avoid unnecessary updates
  const prevStudentsRef = useRef<any>(null)
  const prevLessonsRef = useRef<any>(null)
  const prevCoursesRef = useRef<any>(null)
  const prevAssignmentsRef = useRef<any>(null)
  
  // Update students in the store when they change in Supabase
  useEffect(() => {
    if (students && !loadingStudents && !studentsError && students !== prevStudentsRef.current) {
      prevStudentsRef.current = students
      
      // Add the "all" option to students
      const storeStudents = [
        { id: "all", name: "All Students" },
        ...(students || []).map((student: any) => ({
          id: student.id,
          name: student.name,
          gradeLevel: student.grade || "",
          notes: student.notes || "",
          initials: student.name.split(' ').map((n: string) => n[0]).join(''),
        }))
      ]
      
      setStudents(storeStudents)
    }
  }, [students, loadingStudents, studentsError, setStudents])
  
  // Update lessons in the store when they change in Supabase
  useEffect(() => {
    if (lessons && !loadingLessons && !lessonsError && lessons !== prevLessonsRef.current) {
      prevLessonsRef.current = lessons
      
      // Transform lessons to match store structure
      const storeLessons = (lessons || []).map((lesson: any) => ({
        id: lesson.id,
        subjectId: lesson.subject_id || "",
        subjectName: lesson.subject_name || "",
        subjectColor: lesson.subject_color || "#000000",
        startDate: lesson.start_date,
        endDate: lesson.end_date,
        studentIds: lesson.studentIds || [],
        description: lesson.description || "",
        objectives: lesson.objectives || "",
        materialsNeeded: lesson.materials_needed || "",
        location: lesson.location || "",
        completed: lesson.completed || false,
        day_of_week: lesson.day_of_week || "",
      }))
      
      setLessons(storeLessons)
    }
  }, [lessons, loadingLessons, lessonsError, setLessons])
  
  // Update courses in the store when they change in Supabase
  useEffect(() => {
    if (courses && !loadingCourses && !coursesError && courses !== prevCoursesRef.current) {
      prevCoursesRef.current = courses
      
      // Transform courses to match store structure
      const storeCourses = (courses || []).map((course: any) => ({
        id: course.id,
        name: course.name,
        category: course.category || "General",
        term: course.term || "Full Year",
        grade: course.grade || "A",
        credits: course.credits || 1.0,
        studentId: course.student_id,
        academicYear: course.academic_year || "",
      }))
      
      setCourses(storeCourses)
    }
  }, [courses, loadingCourses, coursesError, setCourses])
  
  // Update assignments in the store when they change in Supabase
  useEffect(() => {
    if (assignments && !loadingAssignments && !assignmentsError && assignments !== prevAssignmentsRef.current) {
      prevAssignmentsRef.current = assignments
      
      // Transform assignments to match store structure
      const storeAssignments = (assignments || []).map((assignment: any) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description || "",
        studentIds: assignment.studentIds || [],
        dueDate: assignment.due_date,
        status: assignment.status || "Not Started",
        pointsPossible: assignment.points_possible || 0,
        pointsEarned: assignment.points_earned || 0,
        courseId: assignment.course_id || null,
      }))
      
      setAssignments(storeAssignments)
    }
  }, [assignments, loadingAssignments, assignmentsError, setAssignments])
  
  // Return loading state and any errors
  return {
    loading: loadingStudents || loadingLessons || loadingCourses || loadingAssignments,
    errors: {
      students: studentsError,
      lessons: lessonsError,
      courses: coursesError,
      assignments: assignmentsError
    },
    hasErrors: !!(studentsError || lessonsError || coursesError || assignmentsError)
  }
}

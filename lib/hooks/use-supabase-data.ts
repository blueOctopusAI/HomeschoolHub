import { useState, useEffect, useCallback, useRef } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/store"

/**
 * Generic hook for loading data from Supabase with automatic fetching,
 * error handling, and loading states.
 * 
 * @param fetchFunction - The function that contains the Supabase query logic
 * @param dependencies - Array of dependencies that should trigger a refetch
 * @returns Object with data, loading state, error state, and refetch function
 */
export function useSupabaseQuery<T>(
  fetchFunction: (supabase: ReturnType<typeof createSupabaseBrowserClient>, userId: string | undefined) => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  
  // Use a ref to store the fetch function to avoid dependency issues
  const fetchFunctionRef = useRef(fetchFunction);
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
  }, [fetchFunction]);
  
  // Use refs to store dependencies to avoid infinite loops
  const dependenciesRef = useRef(dependencies);
  useEffect(() => {
    dependenciesRef.current = dependencies;
  }, [dependencies]);

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createSupabaseBrowserClient()
      const userId = user?.id
      
      const result = await fetchFunctionRef.current(supabase, userId)
      setData(result)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
    // We deliberately don't include dependencies here because we're using refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData])

  const refetch = useCallback(() => {
    return fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
}

/**
 * Hook to fetch students data for the current user
 */
export function useStudentsData() {
  return useSupabaseQuery(async (supabase, userId) => {
    if (!userId) return []
    
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (error) throw error
    return data || []
  }, [])
}

/**
 * Hook to fetch lessons data for the current user
 */
export function useLessonsData() {
  return useSupabaseQuery(async (supabase, userId) => {
    if (!userId) return []
    
    const { data, error } = await supabase
      .from('lessons')
      .select('*, lesson_students(student_id)')
      .eq('user_id', userId)

    if (error) throw error

    // Transform data to include studentIds array
    return (data || []).map((lesson: any) => ({
      ...lesson,
      studentIds: lesson.lesson_students ? lesson.lesson_students.map((rel: any) => rel.student_id) : []
    }))
  }, [])
}

/**
 * Hook to fetch data for a specific lesson
 */
export function useLessonData(lessonId: string) {
  return useSupabaseQuery(async (supabase, userId) => {
    if (!lessonId || !userId) return null

    const { data, error } = await supabase
      .from('lessons')
      .select('*, lesson_students(student_id)')
      .eq('id', lessonId)
      .eq('user_id', userId)
      .single()

    if (error) throw error

    // Transform data to include studentIds array
    return {
      ...data,
      studentIds: data.lesson_students ? data.lesson_students.map((rel: any) => rel.student_id) : []
    }
  }, [lessonId])
}

/**
 * Hook to fetch courses data for the current user
 */
export function useCoursesData() {
  return useSupabaseQuery(async (supabase, userId) => {
    if (!userId) return []
    
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (error) throw error
    return data || []
  }, [])
}

/**
 * Hook to fetch courses for a specific student
 */
export function useStudentCoursesData(studentId: string) {
  return useSupabaseQuery(async (supabase, userId) => {
    if (!userId || !studentId || studentId === 'all') return []

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', userId)
      .eq('student_id', studentId)
      .order('name')

    if (error) throw error
    return data || []
  }, [studentId])
}

/**
 * Hook to fetch assignments data for the current user
 */
export function useAssignmentsData() {
  return useSupabaseQuery(async (supabase, userId) => {
    if (!userId) return []
    
    const { data, error } = await supabase
      .from('assignments')
      .select('*, assignment_students(student_id)')
      .eq('user_id', userId)
      .order('due_date')

    if (error) throw error

    // Transform data to include studentIds array
    return (data || []).map((assignment: any) => ({
      ...assignment,
      studentIds: assignment.assignment_students 
        ? assignment.assignment_students.map((rel: any) => rel.student_id) 
        : []
    }))
  }, [])
}

/**
 * Hook to fetch lessons for the current day
 */
export function useTodaysLessonsData(studentId: string, date: Date) {
  const dateString = date.toISOString().split('T')[0] // YYYY-MM-DD format

  return useSupabaseQuery(async (supabase, userId) => {
    if (!userId) return []
    
    // First query the lessons for today - using proper timestamp comparison
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*, lesson_students(student_id)')
      .eq('user_id', userId)
      .gte('start_date', `${dateString}T00:00:00`) 
      .lt('start_date', `${dateString}T23:59:59`)

    if (error) throw error

    // Transform data and filter by student
    const transformedLessons = (lessons || []).map((lesson: any) => ({
      ...lesson,
      studentIds: lesson.lesson_students ? lesson.lesson_students.map((rel: any) => rel.student_id) : []
    }))

    // Filter by student if necessary
    if (studentId === 'all') {
      return transformedLessons
    } else {
      return transformedLessons.filter((lesson: any) => 
        lesson.studentIds.includes(studentId)
      )
    }
  }, [studentId, dateString])
}

/**
 * Hook to fetch upcoming assignments within a date range
 */
export function useUpcomingAssignmentsData(studentId: string, startDate: Date, endDate: Date) {
  const startDateString = startDate.toISOString()
  const endDateString = endDate.toISOString()

  return useSupabaseQuery(async (supabase, userId) => {
    if (!userId) return []
    
    // Query assignments within the date range
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('*, assignment_students(student_id)')
      .eq('user_id', userId)
      .gte('due_date', startDateString) // Greater than or equal to start date
      .lte('due_date', endDateString)   // Less than or equal to end date
      .order('due_date')

    if (error) throw error

    // Transform and filter by student
    const transformedAssignments = (assignments || []).map((assignment: any) => ({
      ...assignment,
      studentIds: assignment.assignment_students 
        ? assignment.assignment_students.map((rel: any) => rel.student_id) 
        : []
    }))

    // Filter by student if necessary
    if (studentId === 'all') {
      return transformedAssignments
    } else {
      return transformedAssignments.filter((assignment: any) => 
        assignment.studentIds.includes(studentId)
      )
    }
  }, [studentId, startDateString, endDateString])
}

/**
 * Hook to fetch profile data for the current user
 */
export function useProfileData() {
  return useSupabaseQuery(async (supabase, userId) => {
    if (!userId) return null
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }, [])
}

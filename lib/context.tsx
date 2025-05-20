"use client"

import { createContext, useState, useContext, type ReactNode, useCallback, useMemo, useEffect } from "react"
import {
  fetchStudents,
  fetchLessons,
  fetchLessonStudents,
  fetchCourses,
  fetchAssignments,
  fetchAssignmentStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  createLesson,
  updateLesson,
  toggleLessonComplete,
  deleteLesson,
  createCourse,
  updateCourse,
  deleteCourse,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "./data-service"
import type { Student, Lesson, Course, Assignment } from "./supabase"

// Define the context type
interface AppContextType {
  // Data
  students: Student[]
  lessons: Array<Lesson & { studentIds: string[] }>
  courses: Course[]
  assignments: Array<Assignment & { studentIds: string[] }>

  // UI state
  selectedStudent: string
  currentDate: Date
  currentView:
    | "dashboard"
    | "calendar"
    | "checklist"
    | "transcript"
    | "settings"
    | "assignments"
    | "reports"
    | "portfolio"
    | "compliance"
  isLoading: boolean

  // Actions
  setSelectedStudent: (id: string) => void
  setCurrentDate: (date: Date) => void
  setCurrentView: (view: AppContextType["currentView"]) => void
  addStudent: (student: Omit<Student, "id" | "created_at" | "updated_at">) => Promise<void>
  updateStudentData: (id: string, student: Partial<Student>) => Promise<void>
  removeStudent: (id: string) => Promise<void>
  addLesson: (lesson: Omit<Lesson, "id" | "created_at" | "updated_at">, studentIds: string[]) => Promise<void>
  updateLessonData: (id: string, lesson: Partial<Lesson>, studentIds?: string[]) => Promise<void>
  toggleLessonCompleted: (id: string) => Promise<void>
  removeLesson: (id: string) => Promise<void>
  addCourse: (course: Omit<Course, "id" | "created_at" | "updated_at">) => Promise<void>
  updateCourseData: (id: string, course: Partial<Course>) => Promise<void>
  removeCourse: (id: string) => Promise<void>
  addAssignment: (
    assignment: Omit<Assignment, "id" | "created_at" | "updated_at">,
    studentIds: string[],
  ) => Promise<void>
  updateAssignmentData: (id: string, assignment: Partial<Assignment>, studentIds?: string[]) => Promise<void>
  removeAssignment: (id: string) => Promise<void>
  refreshData: () => Promise<void>
}

// Create the context with a default value
const AppContext = createContext<AppContextType | null>(null)

// Create a provider component
export function AppProvider({ children }: { children: ReactNode }) {
  // Data state
  const [studentsData, setStudentsData] = useState<Student[]>([])
  const [lessonsData, setLessonsData] = useState<Lesson[]>([])
  const [lessonStudentsData, setLessonStudentsData] = useState<{ student_id: string; lesson_id: string }[]>([])
  const [coursesData, setCoursesData] = useState<Course[]>([])
  const [assignmentsData, setAssignmentsData] = useState<Assignment[]>([])
  const [assignmentStudentsData, setAssignmentStudentsData] = useState<{ student_id: string; assignment_id: string }[]>(
    [],
  )
  const [isLoading, setIsLoading] = useState(true)

  // UI state
  const [selectedStudent, setSelectedStudent] = useState("all")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<AppContextType["currentView"]>("dashboard")

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [students, lessons, lessonStudents, courses, assignments, assignmentStudents] = await Promise.all([
          fetchStudents(),
          fetchLessons(),
          fetchLessonStudents(),
          fetchCourses(),
          fetchAssignments(),
          fetchAssignmentStudents(),
        ])

        setStudentsData(students)
        setLessonsData(lessons)
        setLessonStudentsData(lessonStudents)
        setCoursesData(courses)
        setAssignmentsData(assignments)
        setAssignmentStudentsData(assignmentStudents)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Refresh data function
  const refreshData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [students, lessons, lessonStudents, courses, assignments, assignmentStudents] = await Promise.all([
        fetchStudents(),
        fetchLessons(),
        fetchLessonStudents(),
        fetchCourses(),
        fetchAssignments(),
        fetchAssignmentStudents(),
      ])

      setStudentsData(students)
      setLessonsData(lessons)
      setLessonStudentsData(lessonStudents)
      setCoursesData(courses)
      setAssignmentsData(assignments)
      setAssignmentStudentsData(assignmentStudents)
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Student actions
  const addStudent = useCallback(
    async (student: Omit<Student, "id" | "created_at" | "updated_at">) => {
      try {
        await createStudent(student)
        await refreshData()
      } catch (error) {
        console.error("Error adding student:", error)
      }
    },
    [refreshData],
  )

  const updateStudentData = useCallback(
    async (id: string, student: Partial<Student>) => {
      try {
        await updateStudent(id, student)
        await refreshData()
      } catch (error) {
        console.error("Error updating student:", error)
      }
    },
    [refreshData],
  )

  const removeStudent = useCallback(
    async (id: string) => {
      try {
        await deleteStudent(id)
        await refreshData()
      } catch (error) {
        console.error("Error removing student:", error)
      }
    },
    [refreshData],
  )

  // Lesson actions
  const addLesson = useCallback(
    async (lesson: Omit<Lesson, "id" | "created_at" | "updated_at">, studentIds: string[]) => {
      try {
        await createLesson(lesson, studentIds)
        await refreshData()
      } catch (error) {
        console.error("Error adding lesson:", error)
      }
    },
    [refreshData],
  )

  const updateLessonData = useCallback(
    async (id: string, lesson: Partial<Lesson>, studentIds?: string[]) => {
      try {
        await updateLesson(id, lesson, studentIds)
        await refreshData()
      } catch (error) {
        console.error("Error updating lesson:", error)
      }
    },
    [refreshData],
  )

  const toggleLessonCompleted = useCallback(
    async (id: string) => {
      try {
        const lesson = lessonsData.find((l) => l.id === id)
        if (lesson) {
          await toggleLessonComplete(id, !lesson.completed)
          await refreshData()
        }
      } catch (error) {
        console.error("Error toggling lesson completion:", error)
      }
    },
    [lessonsData, refreshData],
  )

  const removeLesson = useCallback(
    async (id: string) => {
      try {
        await deleteLesson(id)
        await refreshData()
      } catch (error) {
        console.error("Error removing lesson:", error)
      }
    },
    [refreshData],
  )

  // Course actions
  const addCourse = useCallback(
    async (course: Omit<Course, "id" | "created_at" | "updated_at">) => {
      try {
        await createCourse(course)
        await refreshData()
      } catch (error) {
        console.error("Error adding course:", error)
      }
    },
    [refreshData],
  )

  const updateCourseData = useCallback(
    async (id: string, course: Partial<Course>) => {
      try {
        await updateCourse(id, course)
        await refreshData()
      } catch (error) {
        console.error("Error updating course:", error)
      }
    },
    [refreshData],
  )

  const removeCourse = useCallback(
    async (id: string) => {
      try {
        await deleteCourse(id)
        await refreshData()
      } catch (error) {
        console.error("Error removing course:", error)
      }
    },
    [refreshData],
  )

  // Assignment actions
  const addAssignment = useCallback(
    async (assignment: Omit<Assignment, "id" | "created_at" | "updated_at">, studentIds: string[]) => {
      try {
        await createAssignment(assignment, studentIds)
        await refreshData()
      } catch (error) {
        console.error("Error adding assignment:", error)
      }
    },
    [refreshData],
  )

  const updateAssignmentData = useCallback(
    async (id: string, assignment: Partial<Assignment>, studentIds?: string[]) => {
      try {
        await updateAssignment(id, assignment, studentIds)
        await refreshData()
      } catch (error) {
        console.error("Error updating assignment:", error)
      }
    },
    [refreshData],
  )

  const removeAssignment = useCallback(
    async (id: string) => {
      try {
        await deleteAssignment(id)
        await refreshData()
      } catch (error) {
        console.error("Error removing assignment:", error)
      }
    },
    [refreshData],
  )

  // Combine lessons with their student IDs
  const lessonsWithStudentIds = useMemo(() => {
    return lessonsData.map((lesson) => {
      const studentIds = lessonStudentsData.filter((ls) => ls.lesson_id === lesson.id).map((ls) => ls.student_id)

      return {
        ...lesson,
        studentIds,
      }
    })
  }, [lessonsData, lessonStudentsData])

  // Combine assignments with their student IDs
  const assignmentsWithStudentIds = useMemo(() => {
    return assignmentsData.map((assignment) => {
      const studentIds = assignmentStudentsData
        .filter((as) => as.assignment_id === assignment.id)
        .map((as) => as.student_id)

      return {
        ...assignment,
        studentIds,
      }
    })
  }, [assignmentsData, assignmentStudentsData])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo<AppContextType>(
    () => ({
      students: studentsData,
      lessons: lessonsWithStudentIds,
      courses: coursesData,
      assignments: assignmentsWithStudentIds,
      selectedStudent,
      currentDate,
      currentView,
      isLoading,
      setSelectedStudent,
      setCurrentDate,
      setCurrentView,
      addStudent,
      updateStudentData,
      removeStudent,
      addLesson,
      updateLessonData,
      toggleLessonCompleted,
      removeLesson,
      addCourse,
      updateCourseData,
      removeCourse,
      addAssignment,
      updateAssignmentData,
      removeAssignment,
      refreshData,
    }),
    [
      studentsData,
      lessonsWithStudentIds,
      coursesData,
      assignmentsWithStudentIds,
      selectedStudent,
      currentDate,
      currentView,
      isLoading,
      setSelectedStudent,
      setCurrentDate,
      setCurrentView,
      addStudent,
      updateStudentData,
      removeStudent,
      addLesson,
      updateLessonData,
      toggleLessonCompleted,
      removeLesson,
      addCourse,
      updateCourseData,
      removeCourse,
      addAssignment,
      updateAssignmentData,
      removeAssignment,
      refreshData,
    ],
  )

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
}

// Create a custom hook to use the context
export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}

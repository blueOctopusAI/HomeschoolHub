import { create } from "zustand"
import { v4 as uuidv4 } from "uuid"
import { User } from '@supabase/supabase-js'

// Define types
export type View = "dashboard" | "students" | "calendar" | "assignments" | "checklist" | "portfolio" | "compliance" | "transcript" | "settings"

export type Student = {
  id: string
  name: string
  gradeLevel?: string
  notes?: string
  profileImage?: string
  initials?: string
}

export type Subject = {
  id: string
  name: string
  color: string
}

export type Lesson = {
  id: string
  subjectId: string
  subjectName: string
  subjectColor: string
  startDate: string
  endDate: string
  studentIds: string[]
  description?: string
  objectives?: string
  materialsNeeded?: string
  location?: string
  completed: boolean
  day_of_week?: string
}

export type Course = {
  id: string
  name: string
  category: string
  term: "Fall Semester" | "Spring Semester" | "Full Year"
  grade: string
  credits: number
  studentId: string
  academicYear?: string
}

export type Assignment = {
  id: string
  title: string
  description?: string
  studentIds: string[]
  dueDate: string
  status: "Not Started" | "Submitted" | "Graded"
  pointsPossible: number
  pointsEarned?: number
  courseId?: string | null
}

// Define store
type Store = {
  // State
  currentView: View
  currentDate: Date
  selectedStudent: string
  students: Student[]
  subjects: Subject[]
  lessons: Lesson[]
  courses: Course[]
  assignments: Assignment[]

  
  // Auth state
  authUser: User | null
  isAuthLoading: boolean
  setStudents: (students: Student[]) => void
  setLessons: (lessons: Lesson[]) => void
  setCourses: (courses: Course[]) => void
  setAssignments: (assignments: Assignment[]) => void

  // Actions
  setCurrentView: (view: View) => void
  setCurrentDate: (date: Date) => void
  setSelectedStudent: (studentId: string) => void
  importLessons: () => void
  addStudent: (student: Omit<Student, "id">) => void
  updateStudent: (id: string, updates: Partial<Student>) => void
  deleteStudent: (id: string) => void
  addSubject: (subject: Omit<Subject, "id">) => void
  updateSubject: (id: string, updates: Partial<Subject>) => void
  deleteSubject: (id: string) => void
  addLesson: (lesson: Omit<Lesson, "id">) => void
  updateLesson: (id: string, updates: Partial<Lesson>) => void
  deleteLesson: (id: string) => void
  toggleLessonComplete: (id: string) => void
  markAllLessonsComplete: (ids: string[]) => void
  addCourse: (course: Omit<Course, "id">) => void
  updateCourse: (id: string, updates: Partial<Course>) => void
  deleteCourse: (id: string) => void
  addAssignment: (assignment: Omit<Assignment, "id">) => void
  updateAssignment: (id: string, updates: Partial<Assignment>) => void
  deleteAssignment: (id: string) => void
  
  // Auth actions
  setAuthUser: (user: User | null) => void
  setIsAuthLoading: (isLoading: boolean) => void
}

// Initial data - will be populated from database
const initialStudents: Student[] = [
  { id: "all", name: "All Students" }
]

const initialSubjects: Subject[] = []

const initialLessons: Lesson[] = []

const initialCourses: Course[] = []

const initialAssignments: Assignment[] = []

// Create store
export const useStore = create<Store>((set) => ({
  // Initial state
  currentView: "dashboard",
  currentDate: new Date(),
  selectedStudent: "all",
  students: initialStudents,
  subjects: initialSubjects,
  lessons: initialLessons,
  courses: initialCourses,
  assignments: initialAssignments,

  
  // Auth state (new)
  authUser: null,
  isAuthLoading: true,

  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  setCurrentDate: (date) => set({ currentDate: date }),
  setSelectedStudent: (studentId) => set({ selectedStudent: studentId }),
  importLessons: () => {
    // Placeholder for the lesson import functionality
    console.log("Import lessons action triggered from Zustand store")
    // In a real implementation, this would handle file uploads or data imports
  },

  // Student actions
  addStudent: (student) =>
    set((state) => ({
      students: [...state.students, { id: uuidv4(), ...student }],
    })),
  updateStudent: (id, updates) =>
    set((state) => ({
      students: state.students.map((student) => (student.id === id ? { ...student, ...updates } : student)),
    })),
  deleteStudent: (id) =>
    set((state) => ({
      students: state.students.filter((student) => student.id !== id),
    })),

  // Subject actions
  addSubject: (subject) =>
    set((state) => ({
      subjects: [...state.subjects, { id: uuidv4(), ...subject }],
    })),
  updateSubject: (id, updates) =>
    set((state) => ({
      subjects: state.subjects.map((subject) => (subject.id === id ? { ...subject, ...updates } : subject)),
    })),
  deleteSubject: (id) =>
    set((state) => ({
      subjects: state.subjects.filter((subject) => subject.id !== id),
    })),

  // Lesson actions
  addLesson: (lesson) =>
    set((state) => ({
      lessons: [...state.lessons, { id: uuidv4(), ...lesson }],
    })),
  updateLesson: (id, updates) =>
    set((state) => ({
      lessons: state.lessons.map((lesson) => (lesson.id === id ? { ...lesson, ...updates } : lesson)),
    })),
  deleteLesson: (id) =>
    set((state) => ({
      lessons: state.lessons.filter((lesson) => lesson.id !== id),
    })),
  toggleLessonComplete: (id) =>
    set((state) => ({
      lessons: state.lessons.map((lesson) => (lesson.id === id ? { ...lesson, completed: !lesson.completed } : lesson)),
    })),
    
  markAllLessonsComplete: (ids) =>
    set((state) => ({
      lessons: state.lessons.map((lesson) =>
        ids.includes(lesson.id) ? { ...lesson, completed: true } : lesson
      ),
    })),

  // Course actions
  addCourse: (course) =>
    set((state) => ({
      courses: [...state.courses, { id: uuidv4(), ...course }],
    })),
  updateCourse: (id, updates) =>
    set((state) => ({
      courses: state.courses.map((course) => (course.id === id ? { ...course, ...updates } : course)),
    })),
  deleteCourse: (id) =>
    set((state) => ({
      courses: state.courses.filter((course) => course.id !== id),
    })),

  // Assignment actions
  addAssignment: (assignment) =>
    set((state) => ({
      assignments: [...state.assignments, { id: uuidv4(), ...assignment }],
    })),
  updateAssignment: (id, updates) =>
    set((state) => ({
      assignments: state.assignments.map((assignment) =>
        assignment.id === id ? { ...assignment, ...updates } : assignment,
      ),
    })),
  deleteAssignment: (id) =>
    set((state) => ({
      assignments: state.assignments.filter((assignment) => assignment.id !== id),
    })),
    
  // Auth actions (new)
  setAuthUser: (user) => set({ authUser: user }),
  setIsAuthLoading: (isLoading) => set({ isAuthLoading: isLoading }),
  setStudents: (students) => set({ students }),
  setLessons: (lessons) => set({ lessons }),
  setCourses: (courses) => set({ courses }),
  setAssignments: (assignments) => set({ assignments }),
  
}))

// Helper functions
export const useStudents = () => useStore((state) => state.students)
export const useSelectedStudent = () => useStore((state) => state.selectedStudent)
export const useCourses = () => useStore((state) => state.courses)
export const useAssignments = () => useStore((state) => state.assignments)
export const useCurrentDate = () => useStore((state) => state.currentDate)

// Split auth selectors to avoid memoization issues
export const useAuthUser = () => useStore((state) => state.authUser)
export const useAuthLoading = () => useStore((state) => state.isAuthLoading)

// Combined auth hook
export const useAuth = () => {
  const user = useAuthUser()
  const isLoading = useAuthLoading()
  return { user, isLoading }
}

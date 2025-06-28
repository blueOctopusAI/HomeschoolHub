import { create } from "zustand"
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

export type Lesson = {
  id: string
  subjectId?: string
  subjectName: string
  subjectColor?: string
  description?: string
  studentIds: string[]
  startDate: string
  endDate: string
  completed: boolean
  day_of_week?: string
  duration?: number
  location?: string
  materialsNeeded?: string
  objectives?: string
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
  courseId?: string
}

// Define store
type Store = {
  // State
  currentView: View
  currentDate: Date
  selectedStudent: string
  students: Student[]
  lessons: Lesson[]
  assignments: Assignment[]
  
  // Auth state
  authUser: User | null
  isAuthLoading: boolean

  // Actions
  setCurrentView: (view: View) => void
  setCurrentDate: (date: Date) => void
  setSelectedStudent: (studentId: string) => void
  setStudents: (students: Student[]) => void
  setLessons: (lessons: Lesson[]) => void
  setAssignments: (assignments: Assignment[]) => void
  addLesson: (lesson: Lesson) => void
  updateLesson: (lesson: Lesson) => void
  deleteLesson: (lessonId: string) => void
  toggleLessonComplete: (lessonId: string) => void
  importLessons: () => void
  
  // Auth actions
  setAuthUser: (user: User | null) => void
  setIsAuthLoading: (isLoading: boolean) => void
}

// Initial data
const initialStudents: Student[] = [
  { id: "all", name: "All Students" }
]

// Create store
export const useStore = create<Store>((set) => ({
  // Initial state
  currentView: "dashboard",
  currentDate: new Date(),
  selectedStudent: "all",
  students: initialStudents,
  lessons: [],
  assignments: [],
  
  // Auth state
  authUser: null,
  isAuthLoading: true,

  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  setCurrentDate: (date) => set({ currentDate: date }),
  setSelectedStudent: (studentId) => set({ selectedStudent: studentId }),
  setStudents: (students) => set({ students }),
  setLessons: (lessons) => set({ lessons }),
  setAssignments: (assignments) => set({ assignments }),
  addLesson: (lesson) => set((state) => ({ lessons: [...state.lessons, lesson] })),
  updateLesson: (lesson) => set((state) => ({
    lessons: state.lessons.map(l => l.id === lesson.id ? lesson : l)
  })),
  deleteLesson: (lessonId) => set((state) => ({
    lessons: state.lessons.filter(l => l.id !== lessonId)
  })),
  toggleLessonComplete: (lessonId) => set((state) => ({
    lessons: state.lessons.map(l => l.id === lessonId ? { ...l, completed: !l.completed } : l)
  })),
  importLessons: () => {
    // Placeholder for import functionality
    console.log("Import lessons functionality")
  },
    
  // Auth actions
  setAuthUser: (user) => set({ authUser: user }),
  setIsAuthLoading: (isLoading) => set({ isAuthLoading: isLoading }),
}))

// Helper functions
export const useStudents = () => useStore((state) => state.students)
export const useSelectedStudent = () => useStore((state) => state.selectedStudent)
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
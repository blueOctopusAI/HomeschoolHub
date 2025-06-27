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

// Define store
type Store = {
  // State
  currentView: View
  currentDate: Date
  selectedStudent: string
  students: Student[]
  
  // Auth state
  authUser: User | null
  isAuthLoading: boolean

  // Actions
  setCurrentView: (view: View) => void
  setCurrentDate: (date: Date) => void
  setSelectedStudent: (studentId: string) => void
  setStudents: (students: Student[]) => void
  
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
  
  // Auth state
  authUser: null,
  isAuthLoading: true,

  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  setCurrentDate: (date) => set({ currentDate: date }),
  setSelectedStudent: (studentId) => set({ selectedStudent: studentId }),
  setStudents: (students) => set({ students }),
    
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
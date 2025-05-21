import { create } from "zustand"
import { v4 as uuidv4 } from "uuid"
import { User } from '@supabase/supabase-js'

// Define types
export type View = "dashboard" | "calendar" | "assignments" | "checklist" | "reports" | "portfolio" | "compliance" | "transcript" | "settings"

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

// Sample data
const sampleStudents: Student[] = [
  { id: "all", name: "All Students" },
  { id: "student1", name: "Emma Johnson", gradeLevel: "3rd Grade", initials: "EJ" },
  { id: "student2", name: "Noah Williams", gradeLevel: "5th Grade", initials: "NW" },
  { id: "student3", name: "Olivia Davis", gradeLevel: "7th Grade", initials: "OD" },
]

const sampleSubjects: Subject[] = [
  { id: "subject1", name: "Math", color: "#4CAF50" },
  { id: "subject2", name: "Science", color: "#2196F3" },
  { id: "subject3", name: "Language Arts", color: "#9C27B0" },
  { id: "subject4", name: "History", color: "#FF9800" },
  { id: "subject5", name: "Art", color: "#E91E63" },
  { id: "subject6", name: "Music", color: "#00BCD4" },
]

const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)
const yesterday = new Date(today)
yesterday.setDate(today.getDate() - 1)

const sampleLessons: Lesson[] = [
  {
    id: "lesson1",
    subjectId: "subject1",
    subjectName: "Math",
    subjectColor: "#4CAF50",
    startDate: new Date(today.setHours(9, 0, 0, 0)).toISOString(),
    endDate: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
    studentIds: ["student1", "student2"],
    description: "Multiplication and division practice",
    objectives: "Master multiplication tables 1-12",
    materialsNeeded: "Workbook, pencils, calculator",
    completed: false,
    day_of_week: "Monday",
  },
  {
    id: "lesson2",
    subjectId: "subject2",
    subjectName: "Science",
    subjectColor: "#2196F3",
    startDate: new Date(today.setHours(10, 30, 0, 0)).toISOString(),
    endDate: new Date(today.setHours(11, 30, 0, 0)).toISOString(),
    studentIds: ["student1", "student3"],
    description: "Plant life cycles",
    objectives: "Understand the stages of plant growth",
    materialsNeeded: "Seeds, soil, pots, water",
    completed: true,
    day_of_week: "Tuesday",
  },
  {
    id: "lesson3",
    subjectId: "subject3",
    subjectName: "Language Arts",
    subjectColor: "#9C27B0",
    startDate: new Date(tomorrow.setHours(9, 0, 0, 0)).toISOString(),
    endDate: new Date(tomorrow.setHours(10, 0, 0, 0)).toISOString(),
    studentIds: ["student2"],
    description: "Reading comprehension",
    objectives: "Identify main ideas and supporting details",
    materialsNeeded: "Book, notebook, pencils",
    completed: false,
    day_of_week: "Wednesday",
  },
  {
    id: "lesson4",
    subjectId: "subject4",
    subjectName: "History",
    subjectColor: "#FF9800",
    startDate: new Date(yesterday.setHours(13, 0, 0, 0)).toISOString(),
    endDate: new Date(yesterday.setHours(14, 0, 0, 0)).toISOString(),
    studentIds: ["student1", "student2", "student3"],
    description: "Ancient civilizations",
    objectives: "Compare and contrast ancient Egypt and Mesopotamia",
    materialsNeeded: "Textbook, map, timeline",
    completed: true,
    day_of_week: "Thursday",
  },
]

const sampleCourses: Course[] = [
  {
    id: "course1",
    name: "Algebra I",
    category: "Mathematics",
    term: "Full Year",
    grade: "A",
    credits: 1.0,
    studentId: "student1",
    academicYear: "2023-2024",
  },
  {
    id: "course2",
    name: "Biology",
    category: "Science",
    term: "Full Year",
    grade: "B+",
    credits: 1.0,
    studentId: "student1",
    academicYear: "2023-2024",
  },
  {
    id: "course3",
    name: "World Literature",
    category: "Language Arts",
    term: "Fall Semester",
    grade: "A-",
    credits: 0.5,
    studentId: "student2",
    academicYear: "2023-2024",
  },
  {
    id: "course4",
    name: "American History",
    category: "Social Studies",
    term: "Spring Semester",
    grade: "B",
    credits: 0.5,
    studentId: "student2",
    academicYear: "2023-2024",
  },
  {
    id: "course5",
    name: "Pre-Calculus",
    category: "Mathematics",
    term: "Full Year",
    grade: "A",
    credits: 1.0,
    studentId: "student3",
    academicYear: "2024-2025",
  },
  {
    id: "course6",
    name: "Chemistry",
    category: "Science",
    term: "Full Year",
    grade: "B+",
    credits: 1.0,
    studentId: "student3",
    academicYear: "2024-2025",
  },
]

const sampleAssignments: Assignment[] = [
  {
    id: "assignment1",
    title: "Math Worksheet: Fractions",
    description: "Complete problems 1-20 on fractions worksheet",
    studentIds: ["student1", "student2"],
    dueDate: new Date(today.setDate(today.getDate() + 2)).toISOString(),
    status: "Not Started",
    pointsPossible: 100,
    courseId: "course1",
  },
  {
    id: "assignment2",
    title: "Science Lab Report: Plant Growth",
    description: "Write a lab report on the plant growth experiment",
    studentIds: ["student1", "student3"],
    dueDate: new Date(today.setDate(today.getDate() + 5)).toISOString(),
    status: "Not Started",
    pointsPossible: 50,
    courseId: "course2",
  },
  {
    id: "assignment3",
    title: "Book Report: To Kill a Mockingbird",
    description: "Write a 3-page report analyzing the main themes",
    studentIds: ["student2"],
    dueDate: new Date(today.setDate(today.getDate() - 1)).toISOString(),
    status: "Submitted",
    pointsPossible: 100,
    courseId: "course3",
  },
  {
    id: "assignment4",
    title: "History Essay: Civil War",
    description: "Write a 5-page essay on the causes of the Civil War",
    studentIds: ["student2", "student3"],
    dueDate: new Date(today.setDate(today.getDate() - 5)).toISOString(),
    status: "Graded",
    pointsPossible: 100,
    pointsEarned: 92,
    courseId: "course4",
  },
]

// Create store
export const useStore = create<Store>((set) => ({
  // Initial state
  currentView: "dashboard",
  currentDate: new Date(),
  selectedStudent: "all",
  students: sampleStudents,
  subjects: sampleSubjects,
  lessons: sampleLessons,
  courses: sampleCourses,
  assignments: sampleAssignments,

  
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

// This file contains sample data for the application
// In a real application, this would be replaced with API calls to a backend

// Student data
export const students = [
  {
    id: "all",
    name: "All Students",
    gradeLevel: "",
    initials: "All",
  },
  {
    id: "1",
    name: "Emma Johnson",
    gradeLevel: "3rd Grade",
    profileImage: "/diverse-students-studying.png",
    notes: "Loves reading and science experiments.",
    initials: "EJ",
  },
  {
    id: "2",
    name: "Noah Smith",
    gradeLevel: "5th Grade",
    profileImage: "/diverse-students-studying.png",
    notes: "Strong in math, needs help with writing.",
    initials: "NS",
  },
  {
    id: "3",
    name: "Olivia Williams",
    gradeLevel: "1st Grade",
    profileImage: "/diverse-students-studying.png",
    notes: "Very creative, enjoys art and music.",
    initials: "OW",
  },
]

// Helper function to get student by ID
export function getStudentById(id: string) {
  return students.find((student) => student.id === id)
}

// Lesson data
export const lessons = [
  {
    id: "1",
    subjectName: "Math",
    description: "Multiplication tables practice",
    studentIds: ["1"],
    startDate: "2023-05-15T09:00:00.000Z",
    endDate: "2023-05-15T10:00:00.000Z",
    duration: 60,
    completed: false,
    materialsNeeded: "Workbook, pencils, multiplication flash cards",
    location: "Dining room",
  },
  {
    id: "2",
    subjectName: "Science",
    description: "Plant growth experiment",
    studentIds: ["2"],
    startDate: "2023-05-15T10:30:00.000Z",
    endDate: "2023-05-15T11:30:00.000Z",
    duration: 60,
    completed: false,
    materialsNeeded: "Seeds, soil, cups, water, science journal",
    location: "Kitchen",
  },
  {
    id: "3",
    subjectName: "Reading",
    description: "Phonics practice and story time",
    studentIds: ["3"],
    startDate: "2023-05-15T13:00:00.000Z",
    endDate: "2023-05-15T14:00:00.000Z",
    duration: 60,
    completed: true,
    materialsNeeded: "Phonics workbook, storybooks",
    location: "Living room",
  },
  {
    id: "4",
    subjectName: "Art",
    description: "Watercolor painting techniques",
    studentIds: ["1", "2", "3"],
    startDate: "2023-05-15T14:30:00.000Z",
    endDate: "2023-05-15T15:30:00.000Z",
    duration: 60,
    completed: false,
    materialsNeeded: "Watercolor paints, brushes, paper, water cups",
    location: "Dining room",
  },
  {
    id: "5",
    subjectName: "History",
    description: "Ancient Egypt study",
    studentIds: ["2"],
    startDate: "2023-05-16T09:00:00.000Z",
    endDate: "2023-05-16T10:00:00.000Z",
    duration: 60,
    completed: false,
    materialsNeeded: "History textbook, notebook",
    location: "Dining room",
  },
]

// Helper function to get lessons by student ID
export function getLessonsByStudentId(studentId: string) {
  return lessons.filter((lesson) => lesson.studentIds.includes(studentId))
}

// Helper function to get lessons for a specific day
export function getLessonsForDay(date: Date) {
  return lessons.filter((lesson) => {
    const lessonDate = new Date(lesson.startDate)
    return lessonDate.toDateString() === date.toDateString()
  })
}

// Course data for transcripts
export const courses = [
  {
    id: "1",
    name: "Algebra I",
    category: "Mathematics",
    term: "Full Year",
    grade: "A",
    credits: 1.0,
    studentId: "2",
  },
  {
    id: "2",
    name: "Biology",
    category: "Science",
    term: "Full Year",
    grade: "B+",
    credits: 1.0,
    studentId: "2",
  },
  {
    id: "3",
    name: "Reading Fundamentals",
    category: "English",
    term: "Fall Semester",
    grade: "A-",
    credits: 0.5,
    studentId: "1",
  },
]

// Helper function to get courses by student ID
export function getCoursesByStudentId(studentId: string) {
  return courses.filter((course) => course.studentId === studentId)
}

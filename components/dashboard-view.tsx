"use client"

import { memo, useMemo } from "react"
import { useStore } from "@/lib/store"
import { format, addDays } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CalendarDays, BookOpen, CheckSquare, GraduationCap, Loader2 } from "lucide-react"
import { useDataOperations } from "@/lib/hooks/use-data-operations"
import { 
  useTodaysLessonsData, 
  useUpcomingAssignmentsData, 
  useStudentCoursesData, 
  useStudentsData 
} from "@/lib/hooks/use-supabase-data"

export const DashboardView = memo(function DashboardView() {
  // Get minimal state from Zustand store
  const currentDate = useStore((state) => state.currentDate)
  const selectedStudent = useStore((state) => state.selectedStudent)
  
  // Use our data loading hooks
  const { data: students, loading: loadingStudents } = useStudentsData()
  const { data: todaysLessons, loading: loadingLessons, error: lessonError } = useTodaysLessonsData(selectedStudent, currentDate)
  
  // Calculate the date range for upcoming assignments (next 7 days)
  const nextWeek = addDays(currentDate, 7)
  const { data: upcomingAssignments, loading: loadingAssignments } = useUpcomingAssignmentsData(
    selectedStudent, 
    currentDate, 
    nextWeek
  )
  
  // Get courses for the selected student (for GPA calculation)
  const { data: studentCourses, loading: loadingCourses } = useStudentCoursesData(selectedStudent)
  
  const { toggleLessonComplete } = useDataOperations()

  // Get selected student name
  const student = useMemo(() => {
    if (selectedStudent === "all") return { name: "All Students", gradeLevel: "" }
    
    if (!students) return { name: "Loading...", gradeLevel: "" }
    
    const foundStudent = students.find(s => s.id === selectedStudent)
    return foundStudent 
      ? { name: foundStudent.name, gradeLevel: foundStudent.grade || "" }
      : { name: "All Students", gradeLevel: "" }
  }, [selectedStudent, students])

  // Calculate weekly progress
  const weeklyProgress = useMemo(() => {
    if (!todaysLessons) {
      return { total: 0, completed: 0, percentage: 0 }
    }
    
    const totalLessons = todaysLessons.length
    const completedLessons = todaysLessons.filter(lesson => lesson.completed).length
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    return {
      total: totalLessons,
      completed: completedLessons,
      percentage: progressPercentage,
    }
  }, [todaysLessons])

  // Calculate GPA if available
  const gpaData = useMemo(() => {
    if (selectedStudent === "all" || !studentCourses || studentCourses.length === 0) {
      return null
    }

    const gradePoints: Record<string, number> = {
      "A+": 4.0,
      A: 4.0,
      "A-": 3.7,
      "B+": 3.3,
      B: 3.0,
      "B-": 2.7,
      "C+": 2.3,
      C: 2.0,
      "C-": 1.7,
      "D+": 1.3,
      D: 1.0,
      "D-": 0.7,
      F: 0.0,
    }

    let totalPoints = 0
    let totalCredits = 0

    studentCourses.forEach(course => {
      const points = gradePoints[course.grade as keyof typeof gradePoints] || 0
      totalPoints += points * (course.credits || 1)
      totalCredits += (course.credits || 1)
    })

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "N/A"

    return {
      gpa,
      courses: studentCourses.length,
    }
  }, [studentCourses, selectedStudent])

  // Handle toggling a lesson's completion status
  const handleToggleCompletion = async (lessonId: string) => {
    try {
      await toggleLessonComplete(lessonId)
    } catch (error) {
      console.error("Failed to toggle lesson completion:", error)
    }
  }
  
  // Loading state
  const isLoading = loadingStudents || loadingLessons || loadingAssignments || loadingCourses
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5e8b7e] mx-auto mb-4" />
          <p className="text-[#5e8b7e]">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with student info */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#5e8b7e]">{student.name}'s Dashboard</h1>
        {student.gradeLevel && <p className="text-[#5e8b7e]/70">{student.gradeLevel}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Today's Focus */}
        <Card className="bg-white shadow-sm rounded-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-[#5e8b7e]">Today's Focus</CardTitle>
              <BookOpen className="h-5 w-5 text-[#5e8b7e]" />
            </div>
            <p className="text-sm text-[#5e8b7e]/70">{format(currentDate, "EEEE, MMMM d")}</p>
          </CardHeader>
          <CardContent>
            {todaysLessons && todaysLessons.length > 0 ? (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {todaysLessons.map((lesson) => (
                  <div key={lesson.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <div className="font-medium text-[#5e8b7e]">{lesson.subject_name}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(lesson.start_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -
                          {new Date(lesson.end_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        {lesson.description && <div className="text-sm mt-1">{lesson.description}</div>}
                      </div>
                      <Badge
                        variant="outline"
                        className={`mt-2 w-fit ${lesson.completed ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}
                        onClick={() => handleToggleCompletion(lesson.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {lesson.completed ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <CalendarDays className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                <p className="text-gray-500">No lessons scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card className="bg-white shadow-sm rounded-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-[#5e8b7e]">Upcoming Assignments</CardTitle>
              <CheckSquare className="h-5 w-5 text-[#5e8b7e]" />
            </div>
            <p className="text-sm text-[#5e8b7e]/70">Due in the next 7 days</p>
          </CardHeader>
          <CardContent>
            {upcomingAssignments && upcomingAssignments.length > 0 ? (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {upcomingAssignments.map((assignment) => (
                  <div key={assignment.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <div className="font-medium text-[#5e8b7e]">{assignment.title}</div>
                        <div className="text-sm text-gray-500">
                          Due: {format(new Date(assignment.due_date), "MMM d, yyyy")}
                        </div>
                        {assignment.description && (
                          <div className="text-sm mt-1 line-clamp-2">{assignment.description}</div>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`mt-2 w-fit ${assignment.status === "Graded" ? "bg-green-50 text-green-700 border-green-200" : assignment.status === "Submitted" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}
                      >
                        {assignment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <CheckSquare className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                <p className="text-gray-500">No upcoming assignments</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Summary */}
        <Card className="bg-white shadow-sm rounded-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-[#5e8b7e]">Progress Summary</CardTitle>
              <GraduationCap className="h-5 w-5 text-[#5e8b7e]" />
            </div>
            <p className="text-sm text-[#5e8b7e]/70">Weekly progress and stats</p>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Weekly Lesson Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-[#5e8b7e]">Weekly Lessons</h3>
                  <span className="text-sm font-medium">
                    {weeklyProgress.completed}/{weeklyProgress.total}
                  </span>
                </div>
                <Progress value={weeklyProgress.percentage} className="h-2" />
                <p className="text-sm text-gray-500">{weeklyProgress.percentage}% of lessons completed</p>
              </div>

              {/* Additional stats */}
              <div className="grid grid-cols-2 gap-4 h-fit">
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <div className="text-2xl font-semibold text-[#5e8b7e]">
                    {todaysLessons ? todaysLessons.length : 0}
                  </div>
                  <div className="text-xs text-gray-500">Today's Lessons</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <div className="text-2xl font-semibold text-[#5e8b7e]">
                    {upcomingAssignments ? upcomingAssignments.length : 0}
                  </div>
                  <div className="text-xs text-gray-500">Due Soon</div>
                </div>
              </div>

              {/* GPA if available */}
              {gpaData && (
                <div className="pt-4 border-t border-gray-100 sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-[#5e8b7e]">Current GPA</h3>
                    <span className="text-xl font-semibold text-[#5e8b7e]">{gpaData.gpa}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Based on {gpaData.courses} course{gpaData.courses !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})
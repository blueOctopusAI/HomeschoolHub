"use client"

import { useState, useMemo, useEffect } from "react"
import { useStore, type Student, type Course, type Lesson, type Assignment } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, isWithinInterval, parseISO } from "date-fns"
import { CalendarIcon, Printer, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface ProgressReportViewProps {
  userStudents?: Student[]
}

export function ProgressReportView({ userStudents }: ProgressReportViewProps) {
  // Get data from Zustand store
  const students = useStore((state) => state.students)
  const courses = useStore((state) => state.courses)
  const lessons = useStore((state) => state.lessons)
  const assignments = useStore((state) => state.assignments)
  const selectedStudentId = useStore((state) => state.selectedStudent)
  const setSelectedStudent = useStore((state) => state.setSelectedStudent)
  const setStudents = useStore((state) => state.setStudents)

  // Local state for date range
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())

  // Update the store's students with the ones from the database if provided
  useEffect(() => {
    if (userStudents && userStudents.length > 0) {
      // Add the "All Students" option if it doesn't exist in userStudents
      const allStudentsIncluded = userStudents.some(s => s.id === "all")
      const updatedStudents = allStudentsIncluded 
        ? userStudents 
        : [{ id: "all", name: "All Students" }, ...userStudents]
      
      // Update the store with the database students
      setStudents(updatedStudents)
    }
  }, [userStudents, setStudents])

  // Get selected student and check if all students are selected
  const selectedStudent = useMemo(() => 
    students.find((student) => student.id === selectedStudentId)
  , [students, selectedStudentId])
  
  const isAllStudentsSelected = selectedStudentId === "all"

  // Filter out the "all" student for the student selection cards
  const individualStudents = students.filter(student => student.id !== "all")

  // Handle student card click
  const handleStudentCardClick = (studentId: string) => {
    setSelectedStudent(studentId)
  }

  // Filter lessons and assignments based on date range and selected student
  const filteredLessons = useMemo(() => lessons.filter((lesson) => {
    if (!startDate || !endDate || !lesson.startDate) return false
    if (isAllStudentsSelected) return false
    if (!lesson.studentIds.includes(selectedStudentId)) return false

    const lessonDate = parseISO(lesson.startDate)
    return isWithinInterval(lessonDate, { start: startDate, end: endDate })
  }), [lessons, startDate, endDate, selectedStudentId, isAllStudentsSelected])

  const filteredAssignments = useMemo(() => assignments.filter((assignment) => {
    if (!startDate || !endDate || !assignment.dueDate) return false
    if (isAllStudentsSelected) return false
    if (!assignment.studentIds.includes(selectedStudentId)) return false

    const dueDate = parseISO(assignment.dueDate)
    return isWithinInterval(dueDate, { start: startDate, end: endDate })
  }), [assignments, startDate, endDate, selectedStudentId, isAllStudentsSelected])

  // Calculate statistics
  const totalLessons = filteredLessons.length
  const completedLessons = filteredLessons.filter((lesson) => lesson.completed).length
  const incompleteLessons = totalLessons - completedLessons

  // Calculate GPA if available
  const studentCourses = useMemo(() => 
    courses.filter((course) => course.studentId === selectedStudentId)
  , [courses, selectedStudentId])
  
  const hasGrades = studentCourses.some((course) => course.grade !== undefined)

  const gpa = useMemo(() => {
    if (!hasGrades) return 0
    
    const gradePoints = studentCourses.reduce((total, course) => {
      if (course.grade === undefined) return total

      // Handle both string and number grade formats
      let numericGrade: number
      if (typeof course.grade === 'string') {
        // Parse letter grades to points
        const gradeMap: Record<string, number> = {
          "A+": 4.0, "A": 4.0, "A-": 3.7,
          "B+": 3.3, "B": 3.0, "B-": 2.7,
          "C+": 2.3, "C": 2.0, "C-": 1.7,
          "D+": 1.3, "D": 1.0, "D-": 0.7,
          "F": 0.0
        }
        numericGrade = gradeMap[course.grade] || 0
      } else {
        // Process numeric grades
        if (course.grade >= 90) numericGrade = 4.0
        else if (course.grade >= 80) numericGrade = 3.0
        else if (course.grade >= 70) numericGrade = 2.0
        else if (course.grade >= 60) numericGrade = 1.0
        else numericGrade = 0.0
      }

      return total + numericGrade
    }, 0)

    return studentCourses.length > 0 ? gradePoints / studentCourses.length : 0
  }, [hasGrades, studentCourses])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="p-6 bg-[#faf9f5] print:bg-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-[#5e8b7e] mb-4 md:mb-0">Progress Report</h1>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full md:w-[180px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full md:w-[180px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>End date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <Button onClick={handlePrint} className="bg-[#5e8b7e] hover:bg-[#4a6e63]" disabled={isAllStudentsSelected}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        </div>
      </div>

      {isAllStudentsSelected ? (
        <div>
          <div className="bg-white rounded-md shadow-sm p-4 mb-6">
            <p className="text-gray-600 mb-4">Select a student to view their progress report</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {individualStudents.map(student => (
              <Card 
                key={student.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleStudentCardClick(student.id)}
              >
                <CardContent className="p-6 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-[#5e8b7e]/10 flex items-center justify-center mb-4">
                    {student.profileImage ? (
                      <img 
                        src={student.profileImage} 
                        alt={student.name} 
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#5e8b7e]/20 flex items-center justify-center text-[#5e8b7e] text-xl font-semibold">
                        {student.initials || student.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-[#5e8b7e] text-center">{student.name}</h3>
                  {student.gradeLevel && (
                    <p className="text-sm text-gray-500 mt-1">{student.gradeLevel}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : selectedStudent && startDate && endDate ? (
        <div className="bg-white rounded-md shadow-sm p-4 mb-4 print:shadow-none">
          {/* Report Header */}
          <div className="border-b pb-4 mb-6">
            <div className="flex items-center mb-2">
              <span className="inline-block px-3 py-1 bg-[#e2f0e6] text-[#5e8b7e] rounded-full text-sm font-medium mr-2">
                Selected Student
              </span>
              <h2 className="text-xl font-bold">{selectedStudent.name}'s Progress Report</h2>
            </div>
            <p className="text-gray-600">
              Grade: {selectedStudent.gradeLevel || "Not specified"} | Period: {format(startDate, "MMM d, yyyy")} -{" "}
              {format(endDate, "MMM d, yyyy")}
            </p>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#f0f5f2] rounded-md p-4">
              <h3 className="font-medium text-[#5e8b7e] mb-2">Lessons</h3>
              <p className="text-2xl font-bold">{totalLessons}</p>
              <p className="text-sm text-gray-600">Total lessons assigned</p>
            </div>

            <div className="bg-[#f0f5f2] rounded-md p-4">
              <h3 className="font-medium text-[#5e8b7e] mb-2">Completion</h3>
              <p className="text-2xl font-bold">
                {completedLessons} / {totalLessons}
              </p>
              <p className="text-sm text-gray-600">
                {totalLessons > 0
                  ? `${Math.round((completedLessons / totalLessons) * 100)}% complete`
                  : "No lessons assigned"}
              </p>
            </div>

            <div className="bg-[#f0f5f2] rounded-md p-4">
              <h3 className="font-medium text-[#5e8b7e] mb-2">GPA</h3>
              <p className="text-2xl font-bold">{hasGrades ? gpa.toFixed(2) : "N/A"}</p>
              <p className="text-sm text-gray-600">
                {hasGrades ? "Current grade point average" : "No grades available"}
              </p>
            </div>
          </div>

          {/* Assignments Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-[#5e8b7e] mb-4">Assignments</h3>

            {filteredAssignments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#f0f5f2]">
                      <th className="text-left p-2 border-b">Title</th>
                      <th className="text-left p-2 border-b">Course</th>
                      <th className="text-left p-2 border-b">Due Date</th>
                      <th className="text-left p-2 border-b">Status</th>
                      <th className="text-left p-2 border-b">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map((assignment) => {
                      const course = courses.find((c) => c.id === assignment.courseId)
                      return (
                        <tr key={assignment.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">{assignment.title}</td>
                          <td className="p-2">{course?.name || "Unknown"}</td>
                          <td className="p-2">
                            {assignment.dueDate ? format(parseISO(assignment.dueDate), "MMM d, yyyy") : "No date"}
                          </td>
                          <td className="p-2">
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                assignment.status === "Completed"
                                  ? "bg-green-100 text-green-800"
                                  : assignment.status === "In Progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : assignment.status === "Graded"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-gray-100 text-gray-800",
                              )}
                            >
                              {assignment.status || "Pending"}
                            </span>
                          </td>
                          <td className="p-2">
                            {assignment.pointsEarned !== undefined
                              ? `${assignment.pointsEarned}/${assignment.pointsPossible}`
                              : `0/${assignment.pointsPossible}`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">No assignments found in the selected date range.</p>
            )}
          </div>

          {/* Lessons Section */}
          <div>
            <h3 className="text-lg font-bold text-[#5e8b7e] mb-4">Lessons</h3>

            {filteredLessons.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#f0f5f2]">
                      <th className="text-left p-2 border-b">Title</th>
                      <th className="text-left p-2 border-b">Course</th>
                      <th className="text-left p-2 border-b">Date</th>
                      <th className="text-left p-2 border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLessons.map((lesson) => {
                      const course = courses.find((c) => c.id === lesson.subjectId)
                      return (
                        <tr key={lesson.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">{lesson.subjectName}</td>
                          <td className="p-2">{course?.name || "Unknown"}</td>
                          <td className="p-2">
                            {lesson.startDate ? format(parseISO(lesson.startDate), "MMM d, yyyy") : "No date"}
                          </td>
                          <td className="p-2">
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                lesson.completed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800",
                              )}
                            >
                              {lesson.completed ? "Completed" : "Incomplete"}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">No lessons found in the selected date range.</p>
            )}
          </div>

          {/* Print Footer */}
          <div className="mt-8 text-center text-gray-500 text-sm hidden print:block">
            <p>Generated on {format(new Date(), "MMMM d, yyyy")} | HomeschoolHub</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
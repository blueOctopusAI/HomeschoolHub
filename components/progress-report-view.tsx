"use client"

import { useState } from "react"
import { useAppContext } from "@/lib/context"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, isWithinInterval, parseISO } from "date-fns"
import { CalendarIcon, Printer, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"

export function ProgressReportView() {
  const { students, courses, lessons, assignments, selectedStudentId } = useAppContext()

  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())

  const selectedStudent = students.find((student) => student.id === selectedStudentId)
  const isAllStudentsSelected = selectedStudentId === "all"

  // Filter lessons and assignments based on date range and selected student
  const filteredLessons = lessons.filter((lesson) => {
    if (!startDate || !endDate || !lesson.date) return false
    if (isAllStudentsSelected) return false
    if (lesson.studentId !== selectedStudentId) return false

    const lessonDate = parseISO(lesson.date)
    return isWithinInterval(lessonDate, { start: startDate, end: endDate })
  })

  const filteredAssignments = assignments.filter((assignment) => {
    if (!startDate || !endDate || !assignment.dueDate) return false
    if (isAllStudentsSelected) return false
    if (assignment.studentId !== selectedStudentId) return false

    const dueDate = parseISO(assignment.dueDate)
    return isWithinInterval(dueDate, { start: startDate, end: endDate })
  })

  // Calculate statistics
  const totalLessons = filteredLessons.length
  const completedLessons = filteredLessons.filter((lesson) => lesson.completed).length
  const incompleteLessons = totalLessons - completedLessons

  // Calculate GPA if available
  const studentCourses = courses.filter((course) => course.studentId === selectedStudentId)
  const hasGrades = studentCourses.some((course) => course.grade !== undefined)

  let gpa = 0
  if (hasGrades) {
    const gradePoints = studentCourses.reduce((total, course) => {
      if (course.grade === undefined) return total

      // Convert letter grade to GPA points
      let points = 0
      if (course.grade >= 90) points = 4.0
      else if (course.grade >= 80) points = 3.0
      else if (course.grade >= 70) points = 2.0
      else if (course.grade >= 60) points = 1.0

      return total + points
    }, 0)

    gpa = gradePoints / studentCourses.length
  }

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
        <div className="bg-white rounded-md shadow-sm p-6 text-center">
          <UserRound className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-medium text-gray-700 mb-2">Select a student to view a report</h2>
          <p className="text-gray-500">
            Please select a specific student from the sidebar to generate a progress report.
          </p>
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
              Grade: {selectedStudent.grade || "Not specified"} | Period: {format(startDate, "MMM d, yyyy")} -{" "}
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
                      const course = courses.find((c) => c.id === lesson.courseId)
                      return (
                        <tr key={lesson.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">{lesson.title}</td>
                          <td className="p-2">{course?.name || "Unknown"}</td>
                          <td className="p-2">
                            {lesson.date ? format(parseISO(lesson.date), "MMM d, yyyy") : "No date"}
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

"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, FileDown, Filter } from "lucide-react"
import { useStudents, useSelectedStudent, useCourses } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define Course type
export type Course = {
  id: string
  name: string
  category: string
  term: "Fall Semester" | "Spring Semester" | "Full Year"
  grade: string
  credits: number
  studentId: string
  academicYear?: string // Added academic year field
}

// GPA calculation helper
const gradeToPoints = (grade: string): number => {
  const gradeMap: Record<string, number> = {
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

  return gradeMap[grade] || 0
}

export function TranscriptView() {
  const students = useStudents()
  const selectedStudentId = useSelectedStudent()
  const courses = useCourses()
  const [yearFilter, setYearFilter] = useState<string>("all")

  // Get the selected student
  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || null
  }, [students, selectedStudentId])

  // Filter courses by selected student
  const studentCourses = useMemo(() => {
    if (selectedStudentId === "all") return []
    return courses.filter((course) => course.studentId === selectedStudentId)
  }, [courses, selectedStudentId])

  // Group courses by academic year
  const coursesByYear = useMemo(() => {
    const grouped: Record<string, typeof studentCourses> = {}

    studentCourses.forEach((course) => {
      const year = course.academicYear || "2024-2025" // Default to current year if not specified
      if (!grouped[year]) {
        grouped[year] = []
      }
      grouped[year].push(course)
    })

    return grouped
  }, [studentCourses])

  // Calculate GPA and credits by year
  const yearlyStats = useMemo(() => {
    const stats: Record<string, { gpa: number; credits: number }> = {}

    Object.entries(coursesByYear).forEach(([year, yearCourses]) => {
      let totalPoints = 0
      let totalCredits = 0

      yearCourses.forEach((course) => {
        const points = gradeToPoints(course.grade)
        totalPoints += points * course.credits
        totalCredits += course.credits
      })

      stats[year] = {
        gpa: totalCredits > 0 ? totalPoints / totalCredits : 0,
        credits: totalCredits,
      }
    })

    return stats
  }, [coursesByYear])

  // Calculate cumulative GPA and total credits
  const cumulativeStats = useMemo(() => {
    let totalPoints = 0
    let totalCredits = 0

    studentCourses.forEach((course) => {
      const points = gradeToPoints(course.grade)
      totalPoints += points * course.credits
      totalCredits += course.credits
    })

    return {
      gpa: totalCredits > 0 ? totalPoints / totalCredits : 0,
      credits: totalCredits,
    }
  }, [studentCourses])

  // Get years for filter
  const academicYears = useMemo(() => {
    return Object.keys(coursesByYear).sort().reverse()
  }, [coursesByYear])

  // Filter courses by selected year
  const filteredCoursesByYear = useMemo(() => {
    if (yearFilter === "all") return coursesByYear
    return { [yearFilter]: coursesByYear[yearFilter] || [] }
  }, [coursesByYear, yearFilter])

  // Handle print functionality
  const handlePrint = () => {
    window.print()
  }

  // Handle PDF export
  const handleExportPDF = () => {
    alert("PDF export functionality would be implemented here")
  }

  if (selectedStudentId === "all") {
    return (
      <div className="p-6">
        <Card className="bg-white rounded-md shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#5e8b7e]">Academic Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-[#5e8b7e] mb-4">
                <Filter className="h-12 w-12 mx-auto opacity-50" />
                <h3 className="mt-2 text-lg font-medium">No Student Selected</h3>
              </div>
              <p className="text-[#5e8b7e]/70 max-w-md">
                Please select a specific student from the dropdown menu above to view their academic transcript.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#5e8b7e]">Academic Transcript</h1>
          <p className="text-[#5e8b7e]/70">
            {selectedStudent?.name} • {selectedStudent?.gradeLevel}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#5e8b7e]">Academic Year:</span>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[180px] border-[#5e8b7e]/20 bg-white">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {academicYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7]"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7]"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {Object.keys(filteredCoursesByYear).length > 0 ? (
            Object.entries(filteredCoursesByYear)
              .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
              .map(([year, yearCourses]) => (
                <Card key={year} className="bg-white rounded-md shadow-sm overflow-hidden">
                  <CardHeader className="bg-[#e9f1e7] py-3 px-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-[#5e8b7e] text-lg">{year} Academic Year</CardTitle>
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="text-[#5e8b7e]/70">GPA: </span>
                          <span className="font-medium text-[#5e8b7e]">
                            {yearlyStats[year]?.gpa.toFixed(2) || "0.00"}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-[#5e8b7e]/70">Credits: </span>
                          <span className="font-medium text-[#5e8b7e]">
                            {yearlyStats[year]?.credits.toFixed(1) || "0.0"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#5e8b7e]/10">
                            <th className="text-left py-3 px-4 font-medium text-[#5e8b7e]">Course Name</th>
                            <th className="text-left py-3 px-4 font-medium text-[#5e8b7e]">Subject</th>
                            <th className="text-left py-3 px-4 font-medium text-[#5e8b7e]">Grade</th>
                            <th className="text-left py-3 px-4 font-medium text-[#5e8b7e]">Credits</th>
                            <th className="text-left py-3 px-4 font-medium text-[#5e8b7e]">Term</th>
                          </tr>
                        </thead>
                        <tbody>
                          {yearCourses.length > 0 ? (
                            yearCourses.map((course) => (
                              <tr key={course.id} className="border-b border-[#5e8b7e]/10 hover:bg-[#e9f1e7]/10">
                                <td className="py-3 px-4">{course.name}</td>
                                <td className="py-3 px-4">{course.category}</td>
                                <td className="py-3 px-4">
                                  <Badge
                                    className={`font-medium ${
                                      course.grade.startsWith("A")
                                        ? "bg-green-100 text-green-800"
                                        : course.grade.startsWith("B")
                                          ? "bg-blue-100 text-blue-800"
                                          : course.grade.startsWith("C")
                                            ? "bg-yellow-100 text-yellow-800"
                                            : course.grade.startsWith("D")
                                              ? "bg-orange-100 text-orange-800"
                                              : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {course.grade}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">{course.credits.toFixed(1)}</td>
                                <td className="py-3 px-4">{course.term}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-[#5e8b7e]/60 italic">
                                No courses found for this academic year.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : (
            <Card className="bg-white rounded-md shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-[#5e8b7e]/70">No courses have been added to this student's transcript yet.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="bg-white rounded-md shadow-sm sticky top-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#5e8b7e] text-lg">Transcript Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-[#5e8b7e] mb-2">Student Information</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-[#5e8b7e]/70">Name:</span> {selectedStudent?.name}
                    </p>
                    <p>
                      <span className="text-[#5e8b7e]/70">Grade Level:</span> {selectedStudent?.gradeLevel}
                    </p>
                    <p>
                      <span className="text-[#5e8b7e]/70">Student ID:</span> {selectedStudent?.id}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[#5e8b7e] mb-2">Academic Summary</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-[#5e8b7e]/70">Total Courses:</span> {studentCourses.length}
                    </p>
                    <p>
                      <span className="text-[#5e8b7e]/70">Total Credits:</span> {cumulativeStats.credits.toFixed(1)}
                    </p>
                    <p>
                      <span className="text-[#5e8b7e]/70">Cumulative GPA:</span> {cumulativeStats.gpa.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[#5e8b7e] mb-2">GPA by Year</h3>
                  <div className="space-y-2">
                    {Object.entries(yearlyStats)
                      .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
                      .map(([year, stats]) => (
                        <div key={year} className="flex justify-between items-center text-sm">
                          <span className="text-[#5e8b7e]/70">{year}:</span>
                          <span className="font-medium text-[#5e8b7e]">{stats.gpa.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#5e8b7e]/10">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#5e8b7e]">Cumulative GPA:</span>
                    <span className="font-bold text-lg text-[#5e8b7e]">{cumulativeStats.gpa.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

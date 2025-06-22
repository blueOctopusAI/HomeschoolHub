"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useStore } from "@/lib/store"
import { format } from "date-fns"
import { FileText, CheckCircle2, Clock, Award, TrendingUp, Calendar, Filter, Download, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

interface Assignment {
  id: string
  title: string
  description?: string
  due_date: string
  status: string
  points_possible: number
  points_earned?: number
  grade_percentage?: number
  feedback?: string
  submitted_at?: string
  graded_at?: string
  course_name?: string
  course_id?: string
  file_url?: string
  submission_text?: string
}

interface StudentSubmissionsProps {
  studentId?: string
}

export function StudentSubmissions({ studentId }: StudentSubmissionsProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCourse, setFilterCourse] = useState<string>("all")
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([])
  
  // Get selected student from store if not provided
  const selectedStudentFromStore = useStore((state) => state.selectedStudent)
  const students = useStore((state) => state.students)
  const effectiveStudentId = studentId || selectedStudentFromStore

  // Get student name
  const studentName = useMemo(() => {
    if (effectiveStudentId === "all") return "All Students"
    const student = students.find(s => s.id === effectiveStudentId)
    return student?.name || "Student"
  }, [effectiveStudentId, students])

  // Fetch assignments and grades
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!effectiveStudentId || effectiveStudentId === "all") {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      
      try {
        const supabase = createSupabaseBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setIsLoading(false)
          return
        }

        // Get real student ID from database
        const { data: dbStudents } = await supabase
          .from('students')
          .select('id, name')
          .eq('user_id', user.id)

        if (!dbStudents || dbStudents.length === 0) {
          setIsLoading(false)
          return
        }

        // Find matching student
        const studentFromStore = students.find(s => s.id === effectiveStudentId)
        const dbStudent = dbStudents.find(s => 
          s.name.toLowerCase() === studentFromStore?.name.toLowerCase()
        ) || dbStudents[0]

        if (!dbStudent) {
          setIsLoading(false)
          return
        }

        // Fetch assignments with student associations
        const { data: assignmentsData, error } = await supabase
          .from('assignments')
          .select(`
            *,
            assignment_students!inner (
              student_id,
              submitted_at,
              submission_text,
              file_url,
              grade,
              feedback,
              graded_at
            ),
            courses (
              id,
              name
            )
          `)
          .eq('assignment_students.student_id', dbStudent.id)
          .order('due_date', { ascending: false })

        if (error) {
          console.error("Error fetching assignments:", error)
          setIsLoading(false)
          return
        }

        // Transform assignments data
        const transformedAssignments = assignmentsData?.map(assignment => {
          const studentData = assignment.assignment_students[0]
          const gradePercentage = studentData.grade && assignment.points_possible > 0
            ? (studentData.grade / assignment.points_possible) * 100
            : undefined

          return {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            due_date: assignment.due_date,
            status: assignment.status,
            points_possible: assignment.points_possible,
            points_earned: studentData.grade,
            grade_percentage: gradePercentage,
            feedback: studentData.feedback,
            submitted_at: studentData.submitted_at,
            graded_at: studentData.graded_at,
            course_name: assignment.courses?.name,
            course_id: assignment.course_id,
            file_url: studentData.file_url,
            submission_text: studentData.submission_text
          }
        }) || []

        setAssignments(transformedAssignments)

        // Extract unique courses
        const uniqueCourses = Array.from(
          new Map(
            transformedAssignments
              .filter(a => a.course_id && a.course_name)
              .map(a => [a.course_id, { id: a.course_id!, name: a.course_name! }])
          ).values()
        )
        setCourses(uniqueCourses)

      } catch (error) {
        console.error("Failed to fetch assignments:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssignments()
  }, [effectiveStudentId, students])

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const statusMatch = filterStatus === "all" || assignment.status === filterStatus
      const courseMatch = filterCourse === "all" || assignment.course_id === filterCourse
      return statusMatch && courseMatch
    })
  }, [assignments, filterStatus, filterCourse])

  // Calculate statistics
  const stats = useMemo(() => {
    const submitted = assignments.filter(a => a.status === "Submitted" || a.status === "Graded").length
    const graded = assignments.filter(a => a.status === "Graded").length
    const pending = assignments.filter(a => a.status === "Not Started").length
    
    const gradedAssignments = assignments.filter(a => a.points_earned !== undefined)
    const totalPointsEarned = gradedAssignments.reduce((sum, a) => sum + (a.points_earned || 0), 0)
    const totalPointsPossible = gradedAssignments.reduce((sum, a) => sum + a.points_possible, 0)
    const overallGrade = totalPointsPossible > 0 ? (totalPointsEarned / totalPointsPossible) * 100 : 0

    return {
      total: assignments.length,
      submitted,
      graded,
      pending,
      overallGrade: overallGrade.toFixed(1)
    }
  }, [assignments])

  // Get grade letter
  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return "A"
    if (percentage >= 80) return "B"
    if (percentage >= 70) return "C"
    if (percentage >= 60) return "D"
    return "F"
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Graded":
        return "bg-green-100 text-green-800 border-green-200"
      case "Submitted":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Not Started":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-[#5e8b7e]">Loading submissions and grades...</div>
        </div>
      </div>
    )
  }

  if (effectiveStudentId === "all") {
    return (
      <div className="p-6">
        <Card className="border-[#5e8b7e]/20 bg-[#faf9f5]">
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-[#5e8b7e]/30 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-[#5e8b7e] mb-2">Select a Student</h3>
            <p className="text-[#5e8b7e]/70">
              Please select a specific student to view their submissions and grades.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#5e8b7e]">Submissions & Grades</h1>
          <p className="text-[#5e8b7e]/70">{studentName}'s assignment progress and grades</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] border-[#5e8b7e]/20">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Not Started">Not Started</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Graded">Graded</SelectItem>
            </SelectContent>
          </Select>

          {courses.length > 0 && (
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-[180px] border-[#5e8b7e]/20">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[#5e8b7e]/20 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5e8b7e]/70">Total Assignments</p>
                <p className="text-2xl font-semibold text-[#5e8b7e]">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-[#5e8b7e]/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#5e8b7e]/20 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5e8b7e]/70">Submitted</p>
                <p className="text-2xl font-semibold text-[#5e8b7e]">{stats.submitted}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#5e8b7e]/20 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5e8b7e]/70">Graded</p>
                <p className="text-2xl font-semibold text-[#5e8b7e]">{stats.graded}</p>
              </div>
              <Award className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#5e8b7e]/20 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5e8b7e]/70">Overall Grade</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-semibold text-[#5e8b7e]">{stats.overallGrade}%</p>
                  <Badge className="bg-[#5e8b7e] text-white">
                    {getGradeLetter(parseFloat(stats.overallGrade))}
                  </Badge>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-[#5e8b7e]/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <Card className="border-[#5e8b7e]/20 bg-[#faf9f5]">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-[#5e8b7e]">All Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-[#5e8b7e]/30 mx-auto mb-4" />
              <p className="text-[#5e8b7e]/70">No assignments found matching the selected filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map(assignment => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-lg border border-[#5e8b7e]/10 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-[#5e8b7e]">{assignment.title}</h3>
                          {assignment.course_name && (
                            <p className="text-sm text-[#5e8b7e]/70">{assignment.course_name}</p>
                          )}
                        </div>
                        <Badge className={cn("ml-2", getStatusColor(assignment.status))}>
                          {assignment.status}
                        </Badge>
                      </div>

                      {assignment.description && (
                        <p className="text-sm text-[#333] mb-3">{assignment.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1 text-[#5e8b7e]/70">
                          <Calendar className="h-4 w-4" />
                          Due: {format(new Date(assignment.due_date), "MMM d, yyyy")}
                        </div>

                        {assignment.submitted_at && (
                          <div className="flex items-center gap-1 text-[#5e8b7e]/70">
                            <CheckCircle2 className="h-4 w-4" />
                            Submitted: {format(new Date(assignment.submitted_at), "MMM d, yyyy")}
                          </div>
                        )}

                        {assignment.points_earned !== undefined && (
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4 text-[#5e8b7e]" />
                            <span className="font-medium text-[#5e8b7e]">
                              {assignment.points_earned} / {assignment.points_possible} pts
                            </span>
                            {assignment.grade_percentage !== undefined && (
                              <Badge className="ml-2 bg-[#5e8b7e] text-white">
                                {assignment.grade_percentage.toFixed(1)}% ({getGradeLetter(assignment.grade_percentage)})
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {assignment.feedback && (
                        <div className="mt-3 p-3 bg-[#e9f1e7] rounded-md">
                          <p className="text-sm font-medium text-[#5e8b7e] mb-1">Teacher Feedback:</p>
                          <p className="text-sm text-[#333]">{assignment.feedback}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {(assignment.submission_text || assignment.file_url) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7]"
                          onClick={() => setSelectedAssignment(assignment)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}
                      {assignment.file_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7]"
                          onClick={() => window.open(assignment.file_url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          File
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Submission Dialog */}
      <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
        <DialogContent className="max-w-2xl bg-[#faf9f5]">
          <DialogHeader>
            <DialogTitle className="text-[#5e8b7e]">{selectedAssignment?.title}</DialogTitle>
            <DialogDescription className="text-[#5e8b7e]/70">
              Submission details and feedback
            </DialogDescription>
          </DialogHeader>

          {selectedAssignment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-[#5e8b7e]">Status</p>
                  <Badge className={cn("mt-1", getStatusColor(selectedAssignment.status))}>
                    {selectedAssignment.status}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-[#5e8b7e]">Grade</p>
                  {selectedAssignment.points_earned !== undefined ? (
                    <p className="mt-1">
                      {selectedAssignment.points_earned} / {selectedAssignment.points_possible} pts
                      {selectedAssignment.grade_percentage !== undefined && (
                        <span className="ml-2 text-[#5e8b7e]">
                          ({selectedAssignment.grade_percentage.toFixed(1)}%)
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="mt-1 text-[#5e8b7e]/70">Not graded yet</p>
                  )}
                </div>
              </div>

              {selectedAssignment.submission_text && (
                <div>
                  <p className="font-medium text-[#5e8b7e] mb-2">Submission</p>
                  <div className="p-4 bg-white rounded-md border border-[#5e8b7e]/20">
                    <p className="text-sm text-[#333] whitespace-pre-wrap">
                      {selectedAssignment.submission_text}
                    </p>
                  </div>
                </div>
              )}

              {selectedAssignment.feedback && (
                <div>
                  <p className="font-medium text-[#5e8b7e] mb-2">Teacher Feedback</p>
                  <div className="p-4 bg-[#e9f1e7] rounded-md">
                    <p className="text-sm text-[#333] whitespace-pre-wrap">
                      {selectedAssignment.feedback}
                    </p>
                  </div>
                </div>
              )}

              {selectedAssignment.file_url && (
                <div>
                  <p className="font-medium text-[#5e8b7e] mb-2">Attached File</p>
                  <Button
                    variant="outline"
                    className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7]"
                    onClick={() => window.open(selectedAssignment.file_url, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Attachment
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

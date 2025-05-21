"use client"

import { useState, useMemo } from "react"
import { format, isAfter, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Calendar, Filter, Plus, Search, Edit, Trash2, SlidersHorizontal } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreateAssignmentModal } from "./create-assignment-modal"
import { UpdateAssignmentModal } from "./update-assignment-modal"
import { useStore, type Assignment, type Student, type Course } from "@/lib/store"

// Define prop types for AssignmentsView
interface AssignmentsViewProps {
  initialAssignments: Array<Assignment & { studentIds: string[] }>;
  userStudents: Student[];
  userCourses: Course[];
}

export function AssignmentsView({ initialAssignments, userStudents, userCourses }: AssignmentsViewProps) {
  // Get selected student and deleteAssignment action from Zustand store
  const selectedStudent = useStore((state) => state.selectedStudent)
  const deleteAssignment = useStore((state) => state.deleteAssignment)
  
  // Use the props instead of Zustand store for assignments, students, and courses
  const assignments = initialAssignments
  const students = userStudents
  const courses = userCourses

  // Local state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState<{
    field: string
    direction: "asc" | "desc"
  }>({
    field: "dueDate",
    direction: "asc",
  })

  // Filter assignments based on selected student and filters
  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      // Filter by student
      const studentMatch = selectedStudent === "all" || assignment.studentIds.includes(selectedStudent)

      // Filter by status
      const statusMatch = statusFilter === "all" || assignment.status === statusFilter

      // Filter by search query
      const searchMatch = searchQuery === "" || assignment.title.toLowerCase().includes(searchQuery.toLowerCase())

      return studentMatch && statusMatch && searchMatch
    })
  }, [assignments, selectedStudent, statusFilter, searchQuery])

  // Sort assignments
  const sortedAssignments = useMemo(() => {
    return [...filteredAssignments].sort((a, b) => {
      if (sortBy.field === "dueDate") {
        const dateA = new Date(a.dueDate)
        const dateB = new Date(b.dueDate)
        return sortBy.direction === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
      }

      if (sortBy.field === "title") {
        return sortBy.direction === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
      }

      if (sortBy.field === "status") {
        return sortBy.direction === "asc" ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status)
      }

      if (sortBy.field === "points") {
        return sortBy.direction === "asc" ? a.pointsPossible - b.pointsPossible : b.pointsPossible - a.pointsPossible
      }

      return 0
    })
  }, [filteredAssignments, sortBy])

  // Handle sorting
  const handleSort = (field: string) => {
    setSortBy((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }))
  }

  // Handle edit assignment
  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment)
    setIsUpdateModalOpen(true)
  }

  // Handle delete assignment
  const handleDeleteAssignment = (assignmentId: string) => {
    if (confirm("Are you sure you want to delete this assignment?")) {
      deleteAssignment(assignmentId)
      // Note: This will update the Zustand store but not the prop-driven list
      // This will be addressed in a subsequent task (2.5)
    }
  }

  // Get student names for display
  const getStudentNames = (studentIds: string[]) => {
    return studentIds.map((id) => students.find((s) => s.id === id)?.name.split(" ")[0]).filter(Boolean)
  }

  // Get course name for display
  const getCourseName = (courseId: string | null) => {
    if (!courseId) return null
    return courses.find((c) => c.id === courseId)?.name || null
  }

  // Check if assignment is overdue
  const isOverdue = (dueDate: string, status: string) => {
    return status === "Not Started" && isAfter(new Date(), parseISO(dueDate))
  }

  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    if (status === "Graded") return "bg-green-100 text-green-800"
    if (status === "Submitted") return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-800"
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#5e8b7e]">Assignments</h1>
          <p className="text-[#5e8b7e]/70">
            {selectedStudent === "all"
              ? "Showing assignments for all students"
              : `Showing assignments for ${students.find((s) => s.id === selectedStudent)?.name || "Selected Student"}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#5e8b7e] hover:bg-[#4a6e63]">
            <Plus className="mr-2 h-4 w-4" />
            New Assignment
          </Button>
        </div>
      </div>

      <Card className="bg-white rounded-md shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-[#5e8b7e]">Assignment List</CardTitle>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5e8b7e]/50" />
                <Input
                  placeholder="Search assignments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 border-[#5e8b7e]/20 w-full sm:w-[200px]"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px] border-[#5e8b7e]/20">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4 text-[#5e8b7e]/50" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Graded">Graded</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-[#5e8b7e]/20">
                    <SlidersHorizontal className="mr-2 h-4 w-4 text-[#5e8b7e]/50" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSort("title")}>
                    By Title {sortBy.field === "title" && (sortBy.direction === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("dueDate")}>
                    By Due Date {sortBy.field === "dueDate" && (sortBy.direction === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("status")}>
                    By Status {sortBy.field === "status" && (sortBy.direction === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("points")}>
                    By Points {sortBy.field === "points" && (sortBy.direction === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {sortedAssignments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Assignment</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAssignments.map((assignment) => (
                    <TableRow
                      key={assignment.id}
                      className={isOverdue(assignment.dueDate, assignment.status) ? "bg-red-50" : undefined}
                    >
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium text-[#5e8b7e]">{assignment.title}</div>
                          {assignment.courseId && (
                            <div className="text-xs text-[#5e8b7e]/70 flex items-center mt-1">
                              <BookOpen className="h-3 w-3 mr-1" />
                              {getCourseName(assignment.courseId)}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getStudentNames(assignment.studentIds).map((name, index) => (
                            <Badge key={index} className="bg-[#e2f0e6] text-[#5e8b7e] rounded-full text-xs px-2 py-0.5">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-[#5e8b7e]/70" />
                          <span
                            className={
                              isOverdue(assignment.dueDate, assignment.status) ? "text-red-600 font-medium" : ""
                            }
                          >
                            {format(parseISO(assignment.dueDate), "MMM d, yyyy")}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge className={getStatusBadgeClass(assignment.status)}>{assignment.status}</Badge>
                      </TableCell>

                      <TableCell>
                        {assignment.status === "Graded" && assignment.pointsEarned !== undefined ? (
                          <span className="font-medium">
                            {assignment.pointsEarned} / {assignment.pointsPossible}
                          </span>
                        ) : (
                          <span>{assignment.pointsPossible} pts</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAssignment(assignment)}
                            className="h-8 w-8 p-0 text-[#5e8b7e]"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="h-8 w-8 p-0 text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-[#5e8b7e] mb-4">
                <BookOpen className="h-12 w-12 mx-auto opacity-50" />
                <h3 className="mt-2 text-lg font-medium">No assignments found</h3>
              </div>
              <p className="text-[#5e8b7e]/70 max-w-md">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters to see more assignments."
                  : "Get started by creating your first assignment."}
              </p>
              {(searchQuery || statusFilter !== "all") && (
                <Button
                  variant="outline"
                  className="mt-4 border-[#5e8b7e] text-[#5e8b7e]"
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("all")
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateAssignmentModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />

      <UpdateAssignmentModal
        open={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
        assignment={editingAssignment}
      />
    </div>
  )
}

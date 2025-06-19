"use client"

import { useState, useMemo } from "react"
import { format, parseISO, isAfter } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, Filter, Plus, Search, Edit, Trash2, Clock, MapPin, CheckCircle2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LessonModal } from "./lesson-modal"
import { useStore, type Lesson, type Student } from "@/lib/store"
import { deleteLesson, toggleLessonComplete } from "@/app/calendar/actions"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface LessonsViewProps {
  initialLessons: Lesson[]
  userStudents: Student[]
}

export function LessonsView({ initialLessons, userStudents }: LessonsViewProps) {
  const router = useRouter()
  const selectedStudent = useStore((state) => state.selectedStudent)
  
  const lessons = initialLessons
  const students = userStudents

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [completionFilter, setCompletionFilter] = useState("all")
  const [subjectFilter, setSubjectFilter] = useState("all")

  // Get unique subjects from lessons
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set(lessons.map(lesson => lesson.subjectName))
    return Array.from(subjects).sort()
  }, [lessons])

  // Filter lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      // Filter by student
      const studentMatch = selectedStudent === "all" || lesson.studentIds.includes(selectedStudent)

      // Filter by completion status
      const completionMatch = 
        completionFilter === "all" || 
        (completionFilter === "completed" && lesson.completed) ||
        (completionFilter === "incomplete" && !lesson.completed)

      // Filter by subject
      const subjectMatch = subjectFilter === "all" || lesson.subjectName === subjectFilter

      // Filter by search query
      const searchMatch = 
        searchQuery === "" || 
        lesson.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lesson.description && lesson.description.toLowerCase().includes(searchQuery.toLowerCase()))

      return studentMatch && completionMatch && subjectMatch && searchMatch
    })
  }, [lessons, selectedStudent, completionFilter, subjectFilter, searchQuery])

  // Sort lessons by date (most recent first)
  const sortedLessons = useMemo(() => {
    return [...filteredLessons].sort((a, b) => {
      return parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime()
    })
  }, [filteredLessons])

  // Handle creating a new lesson
  const handleCreateLesson = () => {
    setEditingLesson(null)
    setSelectedDate(new Date())
    setIsModalOpen(true)
  }

  // Handle editing a lesson
  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setSelectedDate(parseISO(lesson.startDate))
    setIsModalOpen(true)
  }

  // Handle deleting a lesson
  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) {
      return
    }

    const formData = new FormData()
    formData.append('lessonId', lessonId)
    
    try {
      await deleteLesson(undefined, formData)
      router.refresh()
    } catch (error) {
      console.error("Error deleting lesson:", error)
    }
  }

  // Handle toggling lesson completion
  const handleToggleComplete = async (lessonId: string, currentStatus: boolean) => {
    const formData = new FormData()
    formData.append('lessonId', lessonId)
    formData.append('completed', (!currentStatus).toString())
    
    try {
      await toggleLessonComplete(undefined, formData)
      router.refresh()
    } catch (error) {
      console.error("Error toggling lesson status:", error)
    }
  }

  // Get student names for display
  const getStudentNames = (studentIds: string[]) => {
    return studentIds.map((id) => students.find((s) => s.id === id)?.name.split(" ")[0]).filter(Boolean)
  }

  // Check if lesson is past due
  const isPastDue = (endDate: string, completed: boolean) => {
    return !completed && isAfter(new Date(), parseISO(endDate))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#5e8b7e]">Lessons</h2>
          <p className="text-[#5e8b7e]/70">
            {selectedStudent === "all"
              ? "Showing lessons for all students"
              : `Showing lessons for ${students.find((s) => s.id === selectedStudent)?.name || "Selected Student"}`}
          </p>
        </div>

        <Button onClick={handleCreateLesson} className="bg-[#5e8b7e] hover:bg-[#4a6e63]">
          <Plus className="mr-2 h-4 w-4" />
          New Lesson
        </Button>
      </div>

      <Card className="bg-white rounded-md shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-[#5e8b7e]">Lesson List</CardTitle>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5e8b7e]/50" />
                <Input
                  placeholder="Search lessons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 border-[#5e8b7e]/20 w-full sm:w-[200px]"
                />
              </div>

              <Select value={completionFilter} onValueChange={setCompletionFilter}>
                <SelectTrigger className="w-full sm:w-[150px] border-[#5e8b7e]/20">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4 text-[#5e8b7e]/50" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lessons</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                </SelectContent>
              </Select>

              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-full sm:w-[150px] border-[#5e8b7e]/20">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {uniqueSubjects.map(subject => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {sortedLessons.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Lesson</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLessons.map((lesson) => (
                    <TableRow
                      key={lesson.id}
                      className={cn(
                        isPastDue(lesson.endDate, lesson.completed) && "bg-red-50",
                        lesson.completed && "bg-green-50"
                      )}
                    >
                      <TableCell className="font-medium">
                        <div>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: lesson.subjectColor }}
                            />
                            <span className="font-medium text-[#5e8b7e]">{lesson.subjectName}</span>
                          </div>
                          {lesson.description && (
                            <p className="text-xs text-[#5e8b7e]/70 mt-1 line-clamp-1">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getStudentNames(lesson.studentIds).map((name, index) => (
                            <Badge key={index} className="bg-[#e2f0e6] text-[#5e8b7e] rounded-full text-xs px-2 py-0.5">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1 text-[#5e8b7e]/70" />
                            {format(parseISO(lesson.startDate), "MMM d, yyyy")}
                          </div>
                          <div className="flex items-center text-xs text-[#5e8b7e]/70">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(parseISO(lesson.startDate), "h:mm a")} - {format(parseISO(lesson.endDate), "h:mm a")}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {lesson.location && (
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 mr-1 text-[#5e8b7e]/70" />
                            {lesson.location}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleComplete(lesson.id, lesson.completed)}
                          className={cn(
                            "h-8 px-2",
                            lesson.completed 
                              ? "text-green-600 hover:text-green-700" 
                              : "text-gray-400 hover:text-green-600"
                          )}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          {lesson.completed ? "Completed" : "Mark Complete"}
                        </Button>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditLesson(lesson)}
                            className="h-8 w-8 p-0 text-[#5e8b7e]"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLesson(lesson.id)}
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
                <Calendar className="h-16 w-16 mx-auto opacity-60" />
                <h3 className="mt-3 text-xl font-medium">
                  {searchQuery || completionFilter !== "all" || subjectFilter !== "all"
                    ? "No lessons match your filters"
                    : "No lessons scheduled yet!"}
                </h3>
              </div>
              <p className="text-[#5e8b7e]/70 max-w-md mb-6">
                {searchQuery || completionFilter !== "all" || subjectFilter !== "all"
                  ? "Try adjusting your filters to see more lessons."
                  : "Start planning your educational journey by creating your first lesson."}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {(searchQuery || completionFilter !== "all" || subjectFilter !== "all") && (
                  <Button
                    variant="outline"
                    className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e2f0e6]"
                    onClick={() => {
                      setSearchQuery("")
                      setCompletionFilter("all")
                      setSubjectFilter("all")
                    }}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
                {!searchQuery && completionFilter === "all" && subjectFilter === "all" && (
                  <Button 
                    onClick={handleCreateLesson}
                    className="bg-[#5e8b7e] hover:bg-[#4a6e63] text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Lesson
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <LessonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        editingLesson={editingLesson}
        students={students}
      />
    </div>
  )
}
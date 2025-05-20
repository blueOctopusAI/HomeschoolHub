"use client"

import { useState, useCallback, useMemo } from "react"
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns"
import { Plus } from "lucide-react"
import { Button } from "./ui/button"
import { useAppContext } from "@/lib/context"
import { LessonModal } from "./lesson-modal"
import { cn } from "@/lib/utils"
import { Badge } from "./ui/badge"

// Colors from the flower logo
const logoColors = {
  monday: { bg: "bg-[#e9f1e7]", border: "border-[#d8e8d2]", text: "text-[#5e8b7e]" },
  tuesday: { bg: "bg-[#f5e6d8]", border: "border-[#f0d7c2]", text: "text-[#b38867]" },
  wednesday: { bg: "bg-[#e6f0f9]", border: "border-[#d0e4f5]", text: "text-[#5a87ad]" },
  thursday: { bg: "bg-[#f9e6eb]", border: "border-[#f5d0da]", text: "text-[#c25e7c]" },
  friday: { bg: "bg-[#f0e6f5]", border: "border-[#e5d0f0]", text: "text-[#8a5aad]" },
}

export function CalendarView() {
  const { currentDate, selectedStudent, students, lessons } = useAppContext()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingLesson, setEditingLesson] = useState<any | null>(null)

  // Get the start of the week (Monday) - memoize this calculation
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate])

  // Generate days of the week (Monday to Friday) - memoize this calculation
  const daysOfWeek = useMemo(() => Array.from({ length: 5 }).map((_, index) => addDays(weekStart, index)), [weekStart])

  // Get student name for display - memoize this calculation
  const studentName = useMemo(() => {
    return selectedStudent === "all"
      ? "All Students"
      : students.find((s) => s.id === selectedStudent)?.name || "Selected Student"
  }, [selectedStudent, students])

  // Filter lessons based on selected student and current week - memoize this calculation
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      // Parse the lesson date
      const lessonDate = parseISO(lesson.startDate)

      // Check if the lesson is in the current week
      const isInCurrentWeek = daysOfWeek.some((day) => isSameDay(day, lessonDate))

      // Check if the lesson is for the selected student or if all students are selected
      const isForSelectedStudent = selectedStudent === "all" || lesson.studentIds.includes(selectedStudent)

      return isInCurrentWeek && isForSelectedStudent
    })
  }, [lessons, daysOfWeek, selectedStudent])

  // Group lessons by day - memoize this calculation
  const lessonsByDay = useMemo(() => {
    return daysOfWeek.reduce(
      (acc, day) => {
        // Get the day key in yyyy-MM-dd format
        const dayKey = format(day, "yyyy-MM-dd")

        // Filter lessons for this day and sort by start time
        acc[dayKey] = filteredLessons
          .filter((lesson) => isSameDay(parseISO(lesson.startDate), day))
          .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())

        return acc
      },
      {} as Record<string, any[]>,
    )
  }, [daysOfWeek, filteredLessons])

  // Handle adding a new lesson - use useCallback to prevent recreation on each render
  const handleAddLesson = useCallback((day: Date) => {
    setSelectedDate(day)
    setEditingLesson(null)
    setIsModalOpen(true)
  }, [])

  // Handle editing a lesson - use useCallback to prevent recreation on each render
  const handleEditLesson = useCallback((lesson: any) => {
    setEditingLesson(lesson)
    setSelectedDate(parseISO(lesson.startDate))
    setIsModalOpen(true)
  }, [])

  // Handle modal close - use useCallback to prevent recreation on each render
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  // Get subject color based on subject name - memoize this function
  const getSubjectColor = useCallback((subjectName: string) => {
    const subjectColors: Record<string, { bg: string; border: string; text: string }> = {
      Math: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
      },
      Science: {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-800",
      },
      Reading: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-800",
      },
      Writing: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-800",
      },
      History: {
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-800",
      },
      Art: {
        bg: "bg-pink-50",
        border: "border-pink-200",
        text: "text-pink-800",
      },
      Music: {
        bg: "bg-indigo-50",
        border: "border-indigo-200",
        text: "text-indigo-800",
      },
      "Physical Education": {
        bg: "bg-cyan-50",
        border: "border-cyan-200",
        text: "text-cyan-800",
      },
    }

    return (
      subjectColors[subjectName] || {
        bg: "bg-[#f0f4f2]",
        border: "border-[#5e8b7e]/20",
        text: "text-[#5e8b7e]",
      }
    )
  }, [])

  // Get student name by ID - memoize this function
  const getStudentName = useCallback(
    (studentId: string) => {
      const student = students.find((s) => s.id === studentId)
      return student ? student.name : "Unassigned"
    },
    [students],
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Weekly Calendar</h1>
          <p className="text-[#333]">Viewing schedule for {studentName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {/* Day headers */}
        {daysOfWeek.map((day, index) => {
          const dayName = format(day, "EEEE").toLowerCase()
          const colorSet = logoColors[dayName as keyof typeof logoColors] || logoColors.monday

          return (
            <div key={index} className={cn("text-center p-2 rounded-lg border", colorSet.bg, colorSet.border)}>
              <div className={cn("font-semibold", colorSet.text)}>{format(day, "EEEE")}</div>
              <div className={cn("text-lg font-medium", colorSet.text)}>{format(day, "d")}</div>
              <div className={cn("text-sm", colorSet.text)}>{format(day, "MMMM")}</div>
            </div>
          )
        })}

        {/* Calendar cells */}
        {daysOfWeek.map((day, index) => {
          const dayKey = format(day, "yyyy-MM-dd")
          const dayLessons = lessonsByDay[dayKey] || []
          const dayName = format(day, "EEEE").toLowerCase()
          const colorSet = logoColors[dayName as keyof typeof logoColors] || logoColors.monday
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={`cell-${index}`}
              className={cn(
                "min-h-[400px] border rounded-lg p-2 relative",
                colorSet.border,
                colorSet.bg,
                "bg-opacity-20",
                isToday && "bg-opacity-40",
              )}
            >
              {dayLessons.length > 0 ? (
                <div className="space-y-2">
                  {dayLessons.map((lesson) => {
                    const startTime = parseISO(lesson.startDate)
                    const endTime = parseISO(lesson.endDate)

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => handleEditLesson(lesson)}
                        className="bg-[#f0f4f2] rounded-md text-sm px-2 py-1 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 mb-2.5"
                      >
                        <div className="font-medium text-[#5e8b7e]">{lesson.subjectName}</div>
                        <div className="text-xs text-[#5e8b7e] mt-1">
                          {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                        </div>

                        {/* Student tags */}
                        {lesson.studentIds.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {lesson.studentIds.map((id: string) => (
                              <Badge
                                key={id}
                                className="bg-[#e2f0e6] text-[#5e8b7e] rounded-full text-xs px-2 py-0.5 font-normal"
                              >
                                {getStudentName(id)}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {lesson.description && (
                          <div className="text-xs mt-1 line-clamp-2 text-[#333]/80">{lesson.description}</div>
                        )}

                        {lesson.completed && <div className="mt-1 text-xs text-green-600 font-medium">✓ Completed</div>}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-[#5e8b7e]/50 text-sm">No lessons</div>
              )}

              <Button
                size="sm"
                className={cn(
                  "absolute bottom-2 right-2 h-8 w-8 rounded-full p-0",
                  colorSet.text.replace("text", "bg"),
                  "hover:opacity-90 text-white",
                )}
                onClick={() => handleAddLesson(day)}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add lesson</span>
              </Button>
            </div>
          )
        })}
      </div>

      {/* Lesson Modal */}
      <LessonModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        selectedDate={selectedDate}
        editingLesson={editingLesson}
      />
    </div>
  )
}

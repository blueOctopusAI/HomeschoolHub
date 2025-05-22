"use client"

import { useState, useCallback, useMemo, useTransition } from "react"
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns"
import { Plus, Edit, Trash2, Check, X, Loader2, Calendar } from "lucide-react"
import { Button } from "./ui/button"
import { useStore, type Lesson, type Student } from "@/lib/store"
import { LessonModal } from "./lesson-modal"
import { cn } from "@/lib/utils"
import { Badge } from "./ui/badge"
import { useRouter } from "next/navigation"
import { deleteLesson, toggleLessonComplete } from "@/app/calendar/actions"

// Colors from the flower logo
const logoColors = {
  monday: { bg: "bg-[#e9f1e7]", border: "border-[#d8e8d2]", text: "text-[#5e8b7e]" },
  tuesday: { bg: "bg-[#f5e6d8]", border: "border-[#f0d7c2]", text: "text-[#b38867]" },
  wednesday: { bg: "bg-[#e6f0f9]", border: "border-[#d0e4f5]", text: "text-[#5a87ad]" },
  thursday: { bg: "bg-[#f9e6eb]", border: "border-[#f5d0da]", text: "text-[#c25e7c]" },
  friday: { bg: "bg-[#f0e6f5]", border: "border-[#e5d0f0]", text: "text-[#8a5aad]" },
}

export interface CalendarViewProps {
  initialLessons: Lesson[]
  userStudents: Student[]
}

export function CalendarView({ initialLessons = [], userStudents = [] }: CalendarViewProps) {
  // Get data from Zustand store
  const currentDate = useStore((state) => state.currentDate)
  const selectedStudent = useStore((state) => state.selectedStudent)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingLessonId, setPendingLessonId] = useState<string | null>(null)
  
  // Use props data instead of Zustand store
  const students = userStudents
  const lessons = initialLessons

  // Local state for modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  // Get the start of the week (Monday) - memoize this calculation
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate])

  // Generate days of the week (Monday to Friday) - memoize this calculation
  const daysOfWeek = useMemo(() => 
    Array.from({ length: 5 }).map((_, index) => addDays(weekStart, index)), 
  [weekStart])

  // Remove the timeSlots state since we're not using it anymore
  // const timeSlots = useMemo(() => {
  //   // Generate half-hour time slots from 8:00 AM to 8:00 PM
  //   const slots = [];
  //   for (let hour = 8; hour <= 20; hour++) {
  //     for (let minute of [0, 30]) {
  //       const time = new Date();
  //       time.setHours(hour, minute, 0, 0);
  //       slots.push(time);
  //     }
  //   }
  //   return slots;
  // }, [])

  // Get student name for display - memoize this calculation
  const studentName = useMemo(() => {
    return selectedStudent === "all"
      ? "All Students"
      : students.find((s) => s.id === selectedStudent)?.name || "Selected Student"
  }, [selectedStudent, students])

  // Filter lessons based on selected student and current week - memoize this calculation
  const filteredLessons = useMemo(() => {
    // Get mappings of student IDs from sidebar and topbar components
    const getDbStudentId = () => {
      // Return 'all' as is
      if (selectedStudent === 'all') return 'all';
      
      // Hardcoded mappings for testing - in real app would be fetched from DB
      const studentMappings: Record<string, string> = {
        'student1': 'bb0c2d70-4553-4c25-95f1-d4dbf38ec202', // Emma Johnson
        'student2': '9948fed0-2182-43a2-b186-1331b083eecd', // Noah Williams
        'student3': '57b063a8-fb4e-4421-bc15-7399601c7dc1'  // Olivia Davis
      };
      
      return studentMappings[selectedStudent] || selectedStudent;
    };
    
    const dbStudentId = getDbStudentId();
    console.log('Calendar view - Mapped DB student ID:', dbStudentId);
    
    return lessons.filter((lesson) => {
      // Parse the lesson date
      const lessonDate = parseISO(lesson.startDate)

      // Check if the lesson is in the current week
      const isInCurrentWeek = daysOfWeek.some((day) => isSameDay(day, lessonDate))

      // Check if the lesson is for the selected student using the mapped DB ID
      const isForSelectedStudent = dbStudentId === "all" || lesson.studentIds.includes(dbStudentId)

      return isInCurrentWeek && isForSelectedStudent
    })
  }, [lessons, daysOfWeek, selectedStudent])

  // Group and sort lessons by day - memoize this calculation
  const lessonsByDay = useMemo(() => {
    return daysOfWeek.reduce(
      (acc, day) => {
        // Get the day key in yyyy-MM-dd format
        const dayKey = format(day, "yyyy-MM-dd")

        // Filter lessons for this day and sort by start time
        // Note: filteredLessons already contains the student filtering logic
        acc[dayKey] = filteredLessons
          .filter((lesson) => isSameDay(parseISO(lesson.startDate), day))
          .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())

        return acc
      },
      {} as Record<string, Lesson[]>,
    )
  }, [daysOfWeek, filteredLessons])

  // Handle adding a new lesson - use useCallback to prevent recreation on each render
  const handleAddLesson = useCallback((day: Date) => {
    setSelectedDate(day)
    setEditingLesson(null)
    setIsModalOpen(true)
  }, [])

  // Handle editing a lesson - use useCallback to prevent recreation on each render
  const handleEditLesson = useCallback((lesson: Lesson, event?: React.MouseEvent) => {
    // If this was triggered by a button click in the actions area, stop propagation
    if (event) {
      event.stopPropagation();
    }
    
    setEditingLesson(lesson)
    setSelectedDate(parseISO(lesson.startDate))
    setIsModalOpen(true)
  }, [])

  // Handle modal close - use useCallback to prevent recreation on each render
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  // Handle deleting a lesson
  const handleDeleteLesson = useCallback((lessonId: string, event: React.MouseEvent) => {
    // Stop propagation to prevent opening the edit modal
    event.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this lesson?")) {
      return;
    }
    
    setPendingLessonId(lessonId);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('lessonId', lessonId);
        
        const result = await deleteLesson(undefined, formData);
        
        if (result.success) {
          router.refresh();
        } else {
          console.error("Failed to delete lesson:", result.message);
          alert("Failed to delete lesson. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting lesson:", error);
        alert("An unexpected error occurred. Please try again.");
      } finally {
        setPendingLessonId(null);
      }
    });
  }, [router]);

  // Handle toggling lesson completion
  const handleToggleComplete = useCallback((lessonId: string, currentStatus: boolean, event: React.MouseEvent) => {
    // Stop propagation to prevent opening the edit modal
    event.stopPropagation();
    
    setPendingLessonId(lessonId);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('lessonId', lessonId);
        formData.append('completed', (!currentStatus).toString());
        
        const result = await toggleLessonComplete(undefined, formData);
        
        if (result.success) {
          router.refresh();
        } else {
          console.error("Failed to toggle lesson status:", result.message);
        }
      } catch (error) {
        console.error("Error toggling lesson status:", error);
      } finally {
        setPendingLessonId(null);
      }
    });
  }, [router]);

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
                      const isCurrentlyProcessing = pendingLessonId === lesson.id;

                      return (
                        <div
                          key={lesson.id}
                          onClick={() => handleEditLesson(lesson)}
                          className={cn(
                            "rounded-md text-sm px-2 py-1 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 mb-2.5",
                            lesson.completed 
                              ? "bg-[#e6f4ea] border-l-4 border-l-green-500" 
                              : "bg-[#f0f4f2]"
                          )}
                        >
                          {lesson.completed && (
                            <div className="bg-green-100 rounded-t-md mx-[-8px] mt-[-4px] mb-1 px-2 py-0.5 text-xs text-green-800 font-medium border-b border-green-200 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                              COMPLETED
                            </div>
                          )}
                          <div className="flex justify-between items-start">
                            <div className="font-medium text-[#5e8b7e] flex-1">
                              {lesson.subjectName}
                            </div>
                            <div className="flex gap-1 mt-0.5">
                              {/* Toggle complete button */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className={`h-6 w-6 p-0 ${lesson.completed ? 'text-green-600 bg-green-50 border border-green-200 rounded-full' : 'text-gray-400 hover:text-green-600 hover:bg-green-50 hover:border hover:border-green-200 hover:rounded-full'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleComplete(lesson.id, lesson.completed, e);
                                }}
                                disabled={isPending && isCurrentlyProcessing}
                              >
                                {isPending && isCurrentlyProcessing ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </Button>
                              
                              {/* Delete button */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLesson(lesson.id, e);
                                }}
                                disabled={isPending && isCurrentlyProcessing}
                              >
                                {isPending && isCurrentlyProcessing ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                            
                          <div className="text-xs text-[#5e8b7e] mt-1 font-medium">
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
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-6">
                  <Calendar className="h-12 w-12 text-[#5e8b7e]/30 mb-3" />
                  <p className="text-[#5e8b7e] font-medium mb-2">Your calendar is clear for this day!</p>
                  <p className="text-[#5e8b7e]/60 text-sm mb-4">No lessons scheduled for {format(day, "EEEE")}.</p>
                  <Button
                    size="sm"
                    className={cn(
                      "px-4",
                      colorSet.text.replace("text", "bg"),
                      "hover:opacity-90 text-white",
                    )}
                    onClick={() => handleAddLesson(day)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lesson
                  </Button>
                </div>
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
          students={students}
        />
      </div>
  )
}
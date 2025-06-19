"use client"

import { useState, useMemo, useEffect } from "react"
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns"
import { useStore, type Lesson, type Student, type Assignment } from "@/lib/store"
import { Check, Calendar, BookOpen, CheckSquare, CheckCircle, FileText, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { markMultipleLessonsComplete } from "@/app/checklist/actions"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

// Combined type for checklist items
type ChecklistItem = {
  id: string
  type: "lesson" | "assignment"
  title: string
  startDate?: string
  endDate?: string
  dueDate?: string
  completed: boolean
  studentIds: string[]
  description?: string
  data: Lesson | Assignment
}

export function ChecklistView() {
  const router = useRouter();
  // Get data from Zustand store
  const lessons = useStore((state) => state.lessons)
  const assignments = useStore((state) => state.assignments)
  const students = useStore((state) => state.students)
  const selectedStudent = useStore((state) => state.selectedStudent)
  const currentDate = useStore((state) => state.currentDate)
  const toggleLessonComplete = useStore((state) => state.toggleLessonComplete)
  const updateAssignment = useStore((state) => state.updateAssignment)
  const markAllLessonsComplete = useStore((state) => state.markAllLessonsComplete)

  // Local state
  const [view, setView] = useState<"day" | "week">("day")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastSubmitResult, setLastSubmitResult] = useState<{ success: boolean, message: string } | null>(null)

  // Effect to show toast when submit result changes
  useEffect(() => {
    if (lastSubmitResult) {
      if (lastSubmitResult.success) {
        toast({
          title: "Success",
          description: lastSubmitResult.message,
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: lastSubmitResult.message,
          variant: "destructive",
        })
      }
    }
  }, [lastSubmitResult])

  // Get the student name for display
  const studentName = useMemo(() => {
    return selectedStudent === "all"
      ? "All Students"
      : students.find((s) => s.id === selectedStudent)?.name || "Selected Student"
  }, [selectedStudent, students])

  // Get the start and end of the week
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate])
  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart])

  // Combine lessons and assignments into checklist items
  const allChecklistItems = useMemo(() => {
    const items: ChecklistItem[] = []

    // Add lessons
    lessons.forEach(lesson => {
      items.push({
        id: lesson.id,
        type: "lesson",
        title: lesson.subjectName,
        startDate: lesson.startDate,
        endDate: lesson.endDate,
        completed: lesson.completed,
        studentIds: lesson.studentIds,
        description: lesson.description,
        data: lesson
      })
    })

    // Add assignments
    assignments.forEach(assignment => {
      // Consider assignment "completed" if it's been submitted or graded
      const isCompleted = assignment.status === "Submitted" || assignment.status === "Graded"
      
      items.push({
        id: assignment.id,
        type: "assignment",
        title: assignment.title,
        dueDate: assignment.dueDate,
        completed: isCompleted,
        studentIds: assignment.studentIds,
        description: assignment.description,
        data: assignment
      })
    })

    return items
  }, [lessons, assignments])

  // Filter items for the selected student and current week
  const filteredItems = useMemo(() => {
    return allChecklistItems.filter((item) => {
      const itemDate = item.type === "lesson" 
        ? new Date(item.startDate!)
        : new Date(item.dueDate!)
      const isInWeek = itemDate >= weekStart && itemDate <= weekEnd
      const isForSelectedStudent = selectedStudent === "all" || item.studentIds.includes(selectedStudent)
      return isInWeek && isForSelectedStudent
    })
  }, [allChecklistItems, weekStart, weekEnd, selectedStudent])

  // Filter items for today
  const todaysItems = useMemo(() => {
    return allChecklistItems.filter((item) => {
      const itemDate = item.type === "lesson" 
        ? new Date(item.startDate!)
        : new Date(item.dueDate!)
      const isToday = isSameDay(itemDate, currentDate)
      const isForSelectedStudent = selectedStudent === "all" || item.studentIds.includes(selectedStudent)
      return isToday && isForSelectedStudent
    })
  }, [allChecklistItems, currentDate, selectedStudent])

  // Group items by day
  const itemsByDay = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        const itemDate = item.type === "lesson" 
          ? new Date(item.startDate!)
          : new Date(item.dueDate!)
        const dateKey = format(itemDate, "yyyy-MM-dd")
        if (!acc[dateKey]) {
          acc[dateKey] = []
        }
        acc[dateKey].push(item)
        return acc
      },
      {} as Record<string, ChecklistItem[]>,
    )
  }, [filteredItems])

  // Generate days of the week (Monday to Friday)
  const daysOfWeek = useMemo(() => {
    return Array.from({ length: 5 }).map((_, index) => {
      const day = addDays(weekStart, index)
      const dateKey = format(day, "yyyy-MM-dd")
      return {
        date: day,
        dateKey,
        dayName: format(day, "EEEE"),
        dayNumber: format(day, "d"),
        month: format(day, "MMMM"),
        items: itemsByDay[dateKey] || [],
      }
    })
  }, [weekStart, itemsByDay])

  // Calculate completion stats
  const completionStats = useMemo(() => {
    const totalItems = filteredItems.length
    const completedItems = filteredItems.filter((item) => item.completed).length
    const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

    return {
      totalItems,
      completedItems,
      completionPercentage,
    }
  }, [filteredItems])

  // Handle item completion toggle
  const handleToggleComplete = (item: ChecklistItem) => {
    if (item.type === "lesson") {
      toggleLessonComplete(item.id)
    } else {
      // For assignments, toggle between "Not Started" and "Submitted"
      const assignment = item.data as Assignment
      const newStatus = assignment.status === "Not Started" ? "Submitted" : "Not Started"
      updateAssignment(item.id, { status: newStatus })
    }
  }

  // Handler for marking all items complete
  const handleMarkAllComplete = async (e: React.FormEvent, periodType: "today" | "week") => {
    e.preventDefault()
    
    if (!confirm(`Mark all ${periodType === "today" ? "today's" : "this week's"} items complete?`)) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Update items based on type
      const itemsToUpdate = periodType === "today" ? todaysItems : filteredItems
      
      itemsToUpdate.forEach(item => {
        if (item.type === "lesson" && !item.completed) {
          toggleLessonComplete(item.id)
        } else if (item.type === "assignment" && !item.completed) {
          updateAssignment(item.id, { status: "Submitted" })
        }
      })
      
      // Submit server action for lessons only (if you have one for assignments, add it here)
      const lessonsToUpdate = itemsToUpdate.filter(item => item.type === "lesson")
      if (lessonsToUpdate.length > 0) {
        const formData = new FormData()
        formData.append("studentId", selectedStudent)
        formData.append("currentDateISO", currentDate.toISOString())
        formData.append("datePeriodType", periodType)
        
        const result = await markMultipleLessonsComplete(formData)
        setLastSubmitResult(result)
      }
      
      // Force a refresh to ensure we have the latest data
      router.refresh()
    } catch (error) {
      console.error('Error marking items complete:', error)
      setLastSubmitResult({
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render checklist item
  const renderChecklistItem = (item: ChecklistItem) => {
    const isLesson = item.type === "lesson"
    const lesson = isLesson ? item.data as Lesson : null
    const assignment = !isLesson ? item.data as Assignment : null

    return (
      <div
        key={item.id}
        className={cn(
          "flex items-start gap-3 p-4 rounded-md bg-white border border-[#5e8b7e]/10 shadow-sm",
          item.completed && "opacity-60",
        )}
      >
        <button
          onClick={() => handleToggleComplete(item)}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-[#5e8b7e] mt-0.5",
            item.completed && "bg-[#5e8b7e] text-white",
          )}
        >
          {item.completed && <Check className="h-3 w-3" />}
        </button>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isLesson ? (
                <BookOpen className="h-4 w-4 text-[#5e8b7e]" />
              ) : (
                <FileText className="h-4 w-4 text-[#5e8b7e]" />
              )}
              <div className="font-medium text-[#5e8b7e]">{item.title}</div>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  isLesson ? "border-blue-500 text-blue-700" : "border-purple-500 text-purple-700"
                )}
              >
                {isLesson ? "Lesson" : "Assignment"}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#5e8b7e]/70">
              <Clock className="h-3 w-3" />
              {isLesson ? (
                `${format(new Date(item.startDate!), "h:mm a")} - ${format(new Date(item.endDate!), "h:mm a")}`
              ) : (
                `Due: ${format(new Date(item.dueDate!), "h:mm a")}`
              )}
            </div>
          </div>

          {item.description && (
            <div className={cn("text-sm text-[#333]", item.completed && "line-through text-[#333]/60")}>
              {item.description}
            </div>
          )}

          {/* Lesson-specific details */}
          {lesson && (
            <>
              {lesson.objectives && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-[#5e8b7e]">Objectives:</div>
                  <div className={cn("text-sm text-[#333]", item.completed && "line-through text-[#333]/60")}>
                    {lesson.objectives}
                  </div>
                </div>
              )}

              {lesson.materialsNeeded && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-[#5e8b7e]">Materials:</div>
                  <div className={cn("text-sm text-[#333]", item.completed && "line-through text-[#333]/60")}>
                    {lesson.materialsNeeded}
                  </div>
                </div>
              )}

              {lesson.location && (
                <div className="mt-2 flex items-center">
                  <span className="text-xs font-medium text-[#5e8b7e] mr-1">Location:</span>
                  <span className="text-xs text-[#333]">{lesson.location}</span>
                </div>
              )}
            </>
          )}

          {/* Assignment-specific details */}
          {assignment && (
            <>
              <div className="mt-2 flex items-center gap-4 text-xs">
                <div>
                  <span className="font-medium text-[#5e8b7e]">Points:</span> {assignment.pointsPossible}
                </div>
                <div>
                  <span className="font-medium text-[#5e8b7e]">Status:</span>{" "}
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      assignment.status === "Not Started" && "border-gray-400 text-gray-600",
                      assignment.status === "Submitted" && "border-blue-500 text-blue-700",
                      assignment.status === "Graded" && "border-green-500 text-green-700"
                    )}
                  >
                    {assignment.status}
                  </Badge>
                </div>
                {assignment.status === "Graded" && assignment.pointsEarned !== undefined && (
                  <div>
                    <span className="font-medium text-[#5e8b7e]">Score:</span> {assignment.pointsEarned}/{assignment.pointsPossible}
                  </div>
                )}
              </div>
            </>
          )}

          {selectedStudent === "all" && item.studentIds && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.studentIds.map((studentId: string) => {
                const student = students.find((s) => s.id === studentId)
                if (!student) return null
                return (
                  <Badge key={studentId} className="bg-[#e2f0e6] text-[#5e8b7e] hover:bg-[#d8e8d2] border-none">
                    {student.name.split(" ")[0]}
                  </Badge>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#5e8b7e]">Daily Checklist</h1>
          <p className="text-[#5e8b7e]/70">
            {selectedStudent === "all" ? "Showing lessons and assignments for all students" : `Showing lessons and assignments for ${studentName}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "day" | "week")} className="w-[240px]">
            <TabsList className="grid w-full grid-cols-2 bg-[#e9f1e7]">
              <TabsTrigger value="day" className="data-[state=active]:bg-[#5e8b7e] data-[state=active]:text-white">
                Today
              </TabsTrigger>
              <TabsTrigger value="week" className="data-[state=active]:bg-[#5e8b7e] data-[state=active]:text-white">
                This Week
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Completion Progress */}
      <Card className="border-[#5e8b7e]/20 bg-[#faf9f5]">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-medium text-[#5e8b7e]">Weekly Progress</h2>
              <p className="text-[#5e8b7e]/70 text-sm">
                {completionStats.completedItems} of {completionStats.totalItems} items completed
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-[#e9f1e7] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5e8b7e] rounded-full"
                  style={{ width: `${completionStats.completionPercentage}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-[#5e8b7e]">{completionStats.completionPercentage}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Content */}
      <Tabs value={view} onValueChange={(v) => setView(v as "day" | "week")}>
        <TabsContent value="day">
          <Card className="border-[#5e8b7e]/20 bg-[#faf9f5]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium text-[#5e8b7e]">Today's Tasks</CardTitle>
              {todaysItems.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-[#5e8b7e]/30 text-[#5e8b7e] hover:bg-[#e2f0e6]"
                  onClick={(e) => handleMarkAllComplete(e, "today")}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Updating..." : "Mark All Complete"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todaysItems.length > 0 ? (
                  todaysItems.map((item) => renderChecklistItem(item))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BookOpen className="h-16 w-16 text-[#5e8b7e]/30 mb-4" />
                    <h3 className="text-xl font-medium text-[#5e8b7e] mb-2">Nothing on the checklist for today!</h3>
                    <p className="text-[#5e8b7e]/70 mb-6 max-w-md">
                      Plan new lessons or create assignments for {selectedStudent === "all" ? "your students" : students.find(s => s.id === selectedStudent)?.name}.
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e2f0e6]"
                        onClick={() => {
                          useStore.getState().setCurrentView("calendar")
                        }}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Plan Lessons
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e2f0e6]"
                        onClick={() => {
                          useStore.getState().setCurrentView("assignments")
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Create Assignment
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week">
          <Card className="border-[#5e8b7e]/20 bg-[#faf9f5]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium text-[#5e8b7e]">This Week's Tasks</CardTitle>
              {filteredItems.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-[#5e8b7e]/30 text-[#5e8b7e] hover:bg-[#e2f0e6]"
                  onClick={(e) => handleMarkAllComplete(e, "week")}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Updating..." : "Mark All Complete"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {daysOfWeek.some((day) => day.items.length > 0) ? (
                <div className="space-y-6">
                  {daysOfWeek.map((day) => (
                    <div key={day.dateKey} className={day.items.length === 0 ? "hidden" : ""}>
                      <h3 className="font-medium text-[#5e8b7e] border-b border-[#5e8b7e]/20 pb-1 mb-3">
                        {day.dayName}, {day.month} {day.dayNumber}
                      </h3>

                      <div className="space-y-2 pl-1">{day.items.map((item) => renderChecklistItem(item))}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckSquare className="h-16 w-16 text-[#5e8b7e]/30 mb-4" />
                  <h3 className="text-xl font-medium text-[#5e8b7e] mb-2">All clear! Time to plan?</h3>
                  <p className="text-[#5e8b7e]/70 mb-6 max-w-md">No lessons or assignments scheduled for this week.</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e2f0e6]"
                      onClick={() => {
                        useStore.getState().setCurrentView("calendar")
                      }}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Plan Lessons
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e2f0e6]"
                      onClick={() => {
                        useStore.getState().setCurrentView("assignments")
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Create Assignment
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

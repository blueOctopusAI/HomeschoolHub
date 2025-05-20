"use client"

import { useState, useMemo } from "react"
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns"
import { useAppContext } from "@/lib/context"
import { Check, Calendar, BookOpen, CheckSquare, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function ChecklistView() {
  // Get data from context
  const { lessons, students, selectedStudent, currentDate } = useAppContext()

  // Get actions separately to avoid dependency issues
  const { toggleLessonComplete } = useAppContext()

  // Local state
  const [view, setView] = useState<"day" | "week">("day")

  // Get the student name for display
  const studentName = useMemo(() => {
    return selectedStudent === "all"
      ? "All Students"
      : students.find((s) => s.id === selectedStudent)?.name || "Selected Student"
  }, [selectedStudent, students])

  // Get the start and end of the week
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]) // Start on Monday
  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]) // End on Sunday (but we'll only show Mon-Fri)

  // Filter lessons for the selected student and current week
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const lessonDate = new Date(lesson.startDate)
      const isInWeek = lessonDate >= weekStart && lessonDate <= weekEnd
      const isForSelectedStudent = selectedStudent === "all" || lesson.studentIds.includes(selectedStudent)
      return isInWeek && isForSelectedStudent
    })
  }, [lessons, weekStart, weekEnd, selectedStudent])

  // Filter lessons for today
  const todaysLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const lessonDate = new Date(lesson.startDate)
      const isToday = isSameDay(lessonDate, currentDate)
      const isForSelectedStudent = selectedStudent === "all" || lesson.studentIds.includes(selectedStudent)
      return isToday && isForSelectedStudent
    })
  }, [lessons, currentDate, selectedStudent])

  // Group lessons by day
  const lessonsByDay = useMemo(() => {
    return filteredLessons.reduce(
      (acc, lesson) => {
        const dateKey = format(new Date(lesson.startDate), "yyyy-MM-dd")
        if (!acc[dateKey]) {
          acc[dateKey] = []
        }
        acc[dateKey].push(lesson)
        return acc
      },
      {} as Record<string, typeof filteredLessons>,
    )
  }, [filteredLessons])

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
        lessons: lessonsByDay[dateKey] || [],
      }
    })
  }, [weekStart, lessonsByDay])

  // Calculate completion stats
  const completionStats = useMemo(() => {
    const totalLessons = filteredLessons.length
    const completedLessons = filteredLessons.filter((lesson) => lesson.completed).length
    const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    return {
      totalLessons,
      completedLessons,
      completionPercentage,
    }
  }, [filteredLessons])

  // Handle lesson completion toggle
  const handleToggleComplete = (lessonId: string) => {
    toggleLessonComplete(lessonId)
  }

  // Handle mark all complete
  const handleMarkAllComplete = () => {
    // We'll implement this later or remove it if not needed
    alert("This feature is not implemented yet")
  }

  // Navigate to today
  const goToToday = () => {
    // We'll implement this later or remove it if not needed
    alert("This feature is not implemented yet")
  }

  // Render lesson item
  const renderLessonItem = (lesson: any) => (
    <div
      key={lesson.id}
      className={cn(
        "flex items-start gap-3 p-4 rounded-md bg-white border border-[#5e8b7e]/10 shadow-sm",
        lesson.completed && "opacity-60",
      )}
    >
      <button
        onClick={() => handleToggleComplete(lesson.id)}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-[#5e8b7e] mt-0.5",
          lesson.completed && "bg-[#5e8b7e] text-white",
        )}
      >
        {lesson.completed && <Check className="h-3 w-3" />}
      </button>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="font-medium text-[#5e8b7e]">{lesson.subjectName}</div>
          <div className="text-xs text-[#5e8b7e]/70">
            {format(new Date(lesson.startDate), "h:mm a")} - {format(new Date(lesson.endDate), "h:mm a")}
          </div>
        </div>

        {lesson.description && (
          <div className={cn("text-sm text-[#333]", lesson.completed && "line-through text-[#333]/60")}>
            {lesson.description}
          </div>
        )}

        {lesson.objectives && (
          <div className="mt-2">
            <div className="text-xs font-medium text-[#5e8b7e]">Objectives:</div>
            <div className={cn("text-sm text-[#333]", lesson.completed && "line-through text-[#333]/60")}>
              {lesson.objectives}
            </div>
          </div>
        )}

        {lesson.materialsNeeded && (
          <div className="mt-2">
            <div className="text-xs font-medium text-[#5e8b7e]">Materials:</div>
            <div className={cn("text-sm text-[#333]", lesson.completed && "line-through text-[#333]/60")}>
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

        {selectedStudent === "all" && lesson.studentIds && (
          <div className="flex flex-wrap gap-1 mt-2">
            {lesson.studentIds.map((studentId: string) => {
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#5e8b7e]">Daily Checklist</h1>
          <p className="text-[#5e8b7e]/70">
            {selectedStudent === "all" ? "Showing lessons for all students" : `Showing lessons for ${studentName}`}
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

          <Button variant="outline" size="sm" onClick={goToToday} className="border-[#5e8b7e]/30 text-[#5e8b7e]">
            <Calendar className="mr-2 h-4 w-4" />
            Today
          </Button>
        </div>
      </div>

      {/* Completion Progress */}
      <Card className="border-[#5e8b7e]/20 bg-[#faf9f5]">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-medium text-[#5e8b7e]">Weekly Progress</h2>
              <p className="text-[#5e8b7e]/70 text-sm">
                {completionStats.completedLessons} of {completionStats.totalLessons} lessons completed
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
              <CardTitle className="text-lg font-medium text-[#5e8b7e]">Today's Lessons</CardTitle>
              {todaysLessons.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllComplete}
                  className="border-[#5e8b7e]/30 text-[#5e8b7e] hover:bg-[#e2f0e6]"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark All Complete
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todaysLessons.length > 0 ? (
                  todaysLessons.map((lesson) => renderLessonItem(lesson))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BookOpen className="h-12 w-12 text-[#5e8b7e]/30 mb-4" />
                    <h3 className="text-lg font-medium text-[#5e8b7e]">No lessons scheduled for today</h3>
                    <p className="text-[#5e8b7e]/70 mt-1">Enjoy your free time!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week">
          <Card className="border-[#5e8b7e]/20 bg-[#faf9f5]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium text-[#5e8b7e]">This Week's Lessons</CardTitle>
              {filteredLessons.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllComplete}
                  className="border-[#5e8b7e]/30 text-[#5e8b7e] hover:bg-[#e2f0e6]"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark All Complete
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {daysOfWeek.some((day) => day.lessons.length > 0) ? (
                <div className="space-y-6">
                  {daysOfWeek.map((day) => (
                    <div key={day.dateKey} className={day.lessons.length === 0 ? "hidden" : ""}>
                      <h3 className="font-medium text-[#5e8b7e] border-b border-[#5e8b7e]/20 pb-1 mb-3">
                        {day.dayName}, {day.month} {day.dayNumber}
                      </h3>

                      <div className="space-y-2 pl-1">{day.lessons.map((lesson) => renderLessonItem(lesson))}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckSquare className="h-12 w-12 text-[#5e8b7e]/30 mb-4" />
                  <h3 className="text-lg font-medium text-[#5e8b7e]">No lessons scheduled for this week</h3>
                  <p className="text-[#5e8b7e]/70 mt-1">Time to plan your week!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useCallback, useMemo } from "react"
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useStore, type Lesson, type Student } from "@/lib/store"
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

export function WeeklyCalendar() {
  // Get data and actions from store using individual selectors for consistency
  const students = useStore((state) => state.students)
  const lessons = useStore((state) => state.lessons)
  const selectedStudent = useStore((state) => state.selectedStudent)
  const currentDate = useStore((state) => state.currentDate)
  const addLesson = useStore((state) => state.addLesson)
  const updateLesson = useStore((state) => state.updateLesson)
  const deleteLesson = useStore((state) => state.deleteLesson)
  const toggleLessonComplete = useStore((state) => state.toggleLessonComplete)

  // Local state for modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    subjectId: "",
    subjectName: "",
    subjectColor: "",
    description: "",
    studentIds: [] as string[],
    startTime: "09:00",
    endTime: "10:00",
    materialsNeeded: "",
    location: "",
    objectives: "",
  })

  // Get the start of the week (Monday) - memoize this calculation
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate])

  // Create an array of 5 days (Monday to Friday) - memoize this calculation
  const daysOfWeek = useMemo(() => 
    Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i))
  , [weekStart])

  // Handle adding a new lesson
  const handleAddLesson = useCallback(
    (day: Date) => {
      setSelectedDay(day)
      setEditingLesson(null)
      setFormData({
        subjectId: "",
        subjectName: "",
        subjectColor: "",
        description: "",
        studentIds: selectedStudent !== "all" ? [selectedStudent] : [],
        startTime: "09:00",
        endTime: "10:00",
        materialsNeeded: "",
        location: "",
        objectives: "",
      })
      setIsModalOpen(true)
    },
    [selectedStudent],
  )

  // Handle editing a lesson
  const handleEditLesson = useCallback((lesson: Lesson) => {
    setSelectedDay(new Date(lesson.startDate))
    setEditingLesson(lesson)

    // Format times for the form
    const startTime = format(new Date(lesson.startDate), "HH:mm")
    const endTime = format(new Date(lesson.endDate), "HH:mm")

    setFormData({
      subjectId: lesson.subjectId || "",
      subjectName: lesson.subjectName,
      subjectColor: lesson.subjectColor || "",
      description: lesson.description || "",
      studentIds: lesson.studentIds,
      startTime,
      endTime,
      materialsNeeded: lesson.materialsNeeded || "",
      location: lesson.location || "",
      objectives: lesson.objectives || "",
    })

    setIsModalOpen(true)
  }, [])

  // Handle form input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  // Handle student selection
  const handleStudentSelection = useCallback((studentId: string, checked: boolean) => {
    setFormData((prev) => {
      if (checked) {
        return { ...prev, studentIds: [...prev.studentIds, studentId] }
      } else {
        return { ...prev, studentIds: prev.studentIds.filter((id) => id !== studentId) }
      }
    })
  }, [])

  // Handle lesson completion toggle
  const handleToggleComplete = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, lessonId: string) => {
      e.stopPropagation() // Prevent opening edit modal
      toggleLessonComplete(lessonId)
    },
    [toggleLessonComplete]
  )

  // Handle lesson delete
  const handleDeleteLesson = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, lessonId: string) => {
      e.stopPropagation() // Prevent opening edit modal
      if (confirm("Are you sure you want to delete this lesson?")) {
        deleteLesson(lessonId)
      }
    },
    [deleteLesson]
  )

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (!selectedDay || !formData.subjectName) return

    const startDate = new Date(selectedDay)
    const [startHours, startMinutes] = formData.startTime.split(":").map(Number)
    startDate.setHours(startHours, startMinutes, 0, 0)

    const endDate = new Date(selectedDay)
    const [endHours, endMinutes] = formData.endTime.split(":").map(Number)
    endDate.setHours(endHours, endMinutes, 0, 0)

    const lessonData = {
      subjectId: formData.subjectId || `subject-${formData.subjectName.toLowerCase().replace(/\s+/g, '-')}`,
      subjectName: formData.subjectName,
      subjectColor: formData.subjectColor || getSubjectColor(formData.subjectName).text.replace("text", "#"),
      description: formData.description,
      studentIds: formData.studentIds.length > 0 ? formData.studentIds : [students[0].id],
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      duration: Math.round((endDate.getTime() - startDate.getTime()) / 60000),
      completed: editingLesson ? editingLesson.completed : false,
      materialsNeeded: formData.materialsNeeded,
      location: formData.location,
      objectives: formData.objectives,
      day: format(selectedDay, "EEEE"),
    }

    if (editingLesson) {
      updateLesson(editingLesson.id, lessonData)
    } else {
      // Remove any undefined fields when creating a new lesson
      Object.keys(lessonData).forEach((key) => {
        if (lessonData[key as keyof typeof lessonData] === undefined) {
          delete lessonData[key as keyof typeof lessonData]
        }
      })
      
      addLesson(lessonData)
    }

    setIsModalOpen(false)
  }, [selectedDay, formData, editingLesson, students, addLesson, updateLesson])

  // Get lessons for a specific day - memoize this function
  const getLessonsForDay = useCallback(
    (day: Date) => {
      return lessons.filter((lesson) => {
        const lessonDate = new Date(lesson.startDate)
        return isSameDay(lessonDate, day) && (selectedStudent === "all" || lesson.studentIds.includes(selectedStudent))
      })
    },
    [lessons, selectedStudent],
  )

  // Get student name by ID - memoize this function
  const getStudentName = useCallback(
    (studentId: string) => {
      const student = students.find((s) => s.id === studentId)
      return student ? student.name : "Unknown"
    },
    [students],
  )

  // Subject colors - memoize this object
  const subjectColors = useMemo(() => ({
    Math: { bg: "bg-blue-50", text: "text-blue-800" },
    Science: { bg: "bg-green-50", text: "text-green-800" },
    Reading: { bg: "bg-amber-50", text: "text-amber-800" },
    Writing: { bg: "bg-purple-50", text: "text-purple-800" },
    History: { bg: "bg-orange-50", text: "text-orange-800" },
    Art: { bg: "bg-pink-50", text: "text-pink-800" },
    Music: { bg: "bg-indigo-50", text: "text-indigo-800" },
    "Physical Education": { bg: "bg-cyan-50", text: "text-cyan-800" },
  }), [])

  // Get subject color - memoize this function
  const getSubjectColor = useCallback(
    (subjectName: string) => {
      return (
        subjectColors[subjectName] || {
          bg: "bg-gray-50",
          text: "text-gray-800",
        }
      )
    },
    [subjectColors],
  )

  // Organize lessons by day - memoize this calculation
  const lessonsByDay = useMemo(() => 
    daysOfWeek.reduce((acc, day) => {
      const dayKey = format(day, "yyyy-MM-dd")
      acc[dayKey] = lessons.filter((lesson) => {
        const lessonDate = new Date(lesson.startDate)
        return isSameDay(lessonDate, day) && (selectedStudent === "all" || lesson.studentIds.includes(selectedStudent))
      }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      return acc
    }, {} as Record<string, Lesson[]>)
  , [daysOfWeek, lessons, selectedStudent])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
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
                  const startTime = new Date(lesson.startDate)
                  const endTime = new Date(lesson.endDate)
                  const subjectStyle = getSubjectColor(lesson.subjectName)

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => handleEditLesson(lesson)}
                      className="bg-[#f0f4f2] rounded-md text-sm px-2 py-1 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 mb-2.5"
                    >
                      <div className="font-medium text-[#5e8b7e]">{lesson.subjectName}</div>
                      <div className="text-xs text-[#5e8b7e] mt-1">
                        {format(parseISO(lesson.startDate), "h:mm a")} - {format(parseISO(lesson.endDate), "h:mm a")}
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

                      <div className="mt-1 flex justify-between items-center">
                        <div 
                          className="cursor-pointer"
                          onClick={(e) => handleToggleComplete(e, lesson.id)}
                        >
                          {lesson.completed ? (
                            <span className="text-xs text-green-600 font-medium">✓ Completed</span>
                          ) : (
                            <span className="text-xs text-gray-500">Mark as complete</span>
                          )}
                        </div>
                      </div>
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

      {/* Lesson Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#faf9f5] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#5e8b7e]">{editingLesson ? "Edit Lesson" : "Add New Lesson"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subjectName" className="text-[#5e8b7e]">
                Subject
              </Label>
              <Select
                value={formData.subjectName}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, subjectName: value }))}
              >
                <SelectTrigger id="subjectName" className="border-[#5e8b7e]/20 bg-white">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(subjectColors).map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-[#5e8b7e]">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of the lesson"
                className="border-[#5e8b7e]/20 bg-white"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="objectives" className="text-[#5e8b7e]">
                Objectives
              </Label>
              <Textarea
                id="objectives"
                name="objectives"
                value={formData.objectives}
                onChange={handleInputChange}
                placeholder="Learning objectives for this lesson"
                className="border-[#5e8b7e]/20 bg-white"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-[#5e8b7e]">Students</Label>
              <div className="grid grid-cols-2 gap-2">
                {students
                  .filter((student) => student.id !== "all")
                  .map((student) => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={formData.studentIds.includes(student.id)}
                        onCheckedChange={(checked) => handleStudentSelection(student.id, checked as boolean)}
                      />
                      <Label htmlFor={`student-${student.id}`} className="text-[#5e8b7e]">
                        {student.name}
                      </Label>
                    </div>
                  ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime" className="text-[#5e8b7e]">
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="border-[#5e8b7e]/20 bg-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime" className="text-[#5e8b7e]">
                  End Time
                </Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="border-[#5e8b7e]/20 bg-white"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="materialsNeeded" className="text-[#5e8b7e]">
                Materials Needed
              </Label>
              <Textarea
                id="materialsNeeded"
                name="materialsNeeded"
                value={formData.materialsNeeded}
                onChange={handleInputChange}
                placeholder="List of materials needed for the lesson"
                className="border-[#5e8b7e]/20 bg-white"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location" className="text-[#5e8b7e]">
                Location
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Living room, Kitchen"
                className="border-[#5e8b7e]/20 bg-white"
              />
            </div>
          </div>

          <DialogFooter>
            {editingLesson && (
              <Button
                variant="outline"
                onClick={(e) => handleDeleteLesson(e, editingLesson.id)}
                className="mr-auto border-red-300 text-red-500 hover:bg-red-50"
              >
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7] hover:text-[#4a6e63]"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-[#5e8b7e] hover:bg-[#4a6e63]">
              {editingLesson ? "Update" : "Add"} Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import type React from "react"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Checkbox } from "./ui/checkbox"
import { useStore, type Lesson, type Student } from "@/lib/store"
import { format } from "date-fns"

interface LessonModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
  editingLesson: Lesson | null
}

export function LessonModal({ isOpen, onClose, selectedDate, editingLesson }: LessonModalProps) {
  // Get data and actions from Zustand store
  const students = useStore((state) => state.students)
  const addLesson = useStore((state) => state.addLesson)
  const updateLesson = useStore((state) => state.updateLesson)

  // Default lesson state - memoize this to prevent recreation on each render
  const defaultLesson = useMemo(
    () => ({
      subjectId: "",
      subjectName: "",
      subjectColor: "",
      description: "",
      studentIds: [] as string[],
      startDate: selectedDate ? new Date(selectedDate).toISOString() : new Date().toISOString(),
      endDate: selectedDate
        ? new Date(new Date(selectedDate).setHours(new Date(selectedDate).getHours() + 1)).toISOString()
        : new Date(new Date().setHours(new Date().getHours() + 1)).toISOString(),
      duration: 60,
      materialsNeeded: "",
      location: "",
      objectives: "",
      recurring: false,
      recurrencePattern: "none" as "none" | "daily" | "weekly" | "biweekly",
      completed: false,
      day: selectedDate ? format(selectedDate, "EEEE") : "",
    }),
    [selectedDate],
  )

  const [lesson, setLesson] = useState(defaultLesson)

  // Update form when editing lesson or selected date changes
  useEffect(() => {
    if (!isOpen) return // Skip effect if modal is closed

    if (editingLesson) {
      setLesson(editingLesson)
    } else if (selectedDate) {
      const startDate = new Date(selectedDate)
      startDate.setHours(9, 0, 0, 0)

      const endDate = new Date(selectedDate)
      endDate.setHours(10, 0, 0, 0)

      setLesson({
        ...defaultLesson,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        day: format(selectedDate, "EEEE"),
      })
    } else {
      setLesson(defaultLesson)
    }
  }, [editingLesson, selectedDate, isOpen, defaultLesson])

  // Handle input changes - use useCallback to prevent recreation on each render
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setLesson((prev) => ({ ...prev, [name]: value }))
  }, [])

  // Handle select changes - use useCallback to prevent recreation on each render
  const handleSelectChange = useCallback((name: string, value: any) => {
    setLesson((prev) => ({ ...prev, [name]: value }))
  }, [])

  // Handle student selection - use useCallback to prevent recreation on each render
  const handleStudentSelection = useCallback((studentId: string, checked: boolean) => {
    setLesson((prev) => {
      if (checked) {
        return { ...prev, studentIds: [...prev.studentIds, studentId] }
      } else {
        return { ...prev, studentIds: prev.studentIds.filter((id) => id !== studentId) }
      }
    })
  }, [])

  // Handle time changes - use useCallback to prevent recreation on each render
  const handleTimeChange = useCallback((timeString: string, field: "startTime" | "endTime") => {
    const [hours, minutes] = timeString.split(":").map(Number)

    setLesson((prev) => {
      if (field === "startTime") {
        const newStart = new Date(prev.startDate)
        newStart.setHours(hours, minutes, 0, 0)

        // Also update end time to maintain duration
        const currentStart = new Date(prev.startDate)
        const currentEnd = new Date(prev.endDate)
        const duration = currentEnd.getTime() - currentStart.getTime()
        const newEnd = new Date(newStart.getTime() + duration)

        return {
          ...prev,
          startDate: newStart.toISOString(),
          endDate: newEnd.toISOString(),
        }
      } else {
        const newEnd = new Date(prev.endDate)
        newEnd.setHours(hours, minutes, 0, 0)

        return {
          ...prev,
          endDate: newEnd.toISOString(),
        }
      }
    })
  }, [])

  // Format time for input - use useCallback to prevent recreation on each render
  const formatTimeForInput = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
  }, [])

  // Handle form submission - use useCallback to prevent recreation on each render
  const handleSubmit = useCallback(() => {
    // Validate form
    if (!lesson.subjectName) {
      alert("Please enter a subject name")
      return
    }

    if (lesson.studentIds.length === 0) {
      alert("Please select at least one student")
      return
    }

    // Calculate duration
    const start = new Date(lesson.startDate)
    const end = new Date(lesson.endDate)
    const durationInMinutes = Math.round((end.getTime() - start.getTime()) / (60 * 1000))

    // Get the day of the week from the selected date
    const dayOfWeek = selectedDate ? format(selectedDate, "EEEE") : ""

    const updatedLesson = {
      ...lesson,
      duration: durationInMinutes,
      day: dayOfWeek,
    }

    // Save the lesson using Zustand store actions
    if (editingLesson) {
      updateLesson(editingLesson.id, updatedLesson)
    } else {
      // When adding a new lesson, we use the addLesson action which expects Omit<Lesson, "id">
      const { id, ...lessonWithoutId } = updatedLesson as any // Need to remove id if it exists
      addLesson(lessonWithoutId)
    }

    onClose()
  }, [lesson, editingLesson, addLesson, updateLesson, onClose, selectedDate])

  // Subject options - memoize this array
  const subjectOptions = useMemo(
    () => [
      "Math",
      "Science",
      "Reading",
      "Writing",
      "History",
      "Geography",
      "Art",
      "Music",
      "Physical Education",
      "Foreign Language",
      "Computer Science",
      "Other",
    ],
    [],
  )

  // Filter out the "all" student - memoize this calculation
  const availableStudents = useMemo(() => students.filter((student) => student.id !== "all"), [students])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#faf9f5] rounded-lg shadow-md max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#5e8b7e] text-xl">
            {editingLesson ? "Edit Lesson" : "Add New Lesson"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Subject */}
          <div className="grid gap-2">
            <Label htmlFor="subjectName" className="text-[#5e8b7e]">
              Subject
            </Label>
            <Select value={lesson.subjectName} onValueChange={(value) => handleSelectChange("subjectName", value)}>
              <SelectTrigger id="subjectName" className="border-[#5e8b7e]/20 bg-white">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-[#5e8b7e]">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={lesson.description || ""}
              onChange={handleInputChange}
              placeholder="Brief description of the lesson"
              className="border-[#5e8b7e]/20 bg-white"
            />
          </div>

          {/* Students */}
          <div className="grid gap-2">
            <Label className="text-[#5e8b7e]">Students</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {availableStudents.map((student) => (
                <div key={student.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`student-${student.id}`}
                    checked={lesson.studentIds.includes(student.id)}
                    onCheckedChange={(checked) => handleStudentSelection(student.id, checked as boolean)}
                  />
                  <Label htmlFor={`student-${student.id}`} className="text-[#5e8b7e]">
                    {student.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startTime" className="text-[#5e8b7e]">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formatTimeForInput(lesson.startDate)}
                onChange={(e) => handleTimeChange(e.target.value, "startTime")}
                className="border-[#5e8b7e]/20 bg-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endTime" className="text-[#5e8b7e]">
                End Time
              </Label>
              <Input
                id="endTime"
                type="time"
                value={formatTimeForInput(lesson.endDate)}
                onChange={(e) => handleTimeChange(e.target.value, "endTime")}
                className="border-[#5e8b7e]/20 bg-white"
              />
            </div>
          </div>

          {/* Materials */}
          <div className="grid gap-2">
            <Label htmlFor="materialsNeeded" className="text-[#5e8b7e]">
              Materials Needed
            </Label>
            <Textarea
              id="materialsNeeded"
              name="materialsNeeded"
              value={lesson.materialsNeeded || ""}
              onChange={handleInputChange}
              placeholder="List of materials needed for the lesson"
              className="border-[#5e8b7e]/20 bg-white"
            />
          </div>

          {/* Location */}
          <div className="grid gap-2">
            <Label htmlFor="location" className="text-[#5e8b7e]">
              Location
            </Label>
            <Input
              id="location"
              name="location"
              value={lesson.location || ""}
              onChange={handleInputChange}
              placeholder="e.g., Living room, Kitchen"
              className="border-[#5e8b7e]/20 bg-white"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7] hover:text-[#5e8b7e]"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-[#5e8b7e] hover:bg-[#4a6e63]">
            {editingLesson ? "Update" : "Add"} Lesson
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

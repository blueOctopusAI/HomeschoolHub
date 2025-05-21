"use client"

import type React from "react"

import { useEffect, useState, useCallback, useMemo, useTransition, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Checkbox } from "./ui/checkbox"
import { Loader2 } from "lucide-react"
import { type Lesson, type Student } from "@/lib/store"
import { format } from "date-fns"
import { createLesson, updateLesson } from "@/app/calendar/lessons-actions"
import { useRouter } from "next/navigation"

interface LessonModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
  editingLesson: Lesson | null
  students: Student[]
}

export function LessonModal({ isOpen, onClose, selectedDate, editingLesson, students }: LessonModalProps) {
  // Setup state
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string[] | undefined>>({})
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  // Default lesson state - memoize this to prevent recreation on each render
  const defaultLesson = useMemo(
    () => ({
      subjectId: "",
      subjectName: "",
      subjectColor: "#5e8b7e", // Default color
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
      day_of_week: selectedDate ? format(selectedDate, "EEEE") : "",
    }),
    [selectedDate],
  )

  const [lesson, setLesson] = useState(defaultLesson)

  // Update form when editing lesson or selected date changes
  useEffect(() => {
    if (!isOpen) return // Skip effect if modal is closed

    // Reset any error states when modal opens
    setErrorMessage(null)
    setValidationErrors({})

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
        day_of_week: format(selectedDate, "EEEE"),
      })
    } else {
      setLesson(defaultLesson)
    }
  }, [editingLesson, selectedDate, isOpen, defaultLesson])

  // Handle input changes - use useCallback to prevent recreation on each render
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setLesson((prev) => ({ ...prev, [name]: value }))
    
    // Clear validation error for this field if it exists
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev }
        delete updated[name]
        return updated
      })
    }
  }, [validationErrors])

  // Handle select changes - use useCallback to prevent recreation on each render
  const handleSelectChange = useCallback((name: string, value: any) => {
    setLesson((prev) => ({ ...prev, [name]: value }))
    
    // Clear validation error for this field if it exists
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev }
        delete updated[name]
        return updated
      })
    }
  }, [validationErrors])

  // Handle student selection - use useCallback to prevent recreation on each render
  const handleStudentSelection = useCallback((studentId: string, checked: boolean) => {
    setLesson((prev) => {
      const newStudentIds = checked 
        ? [...prev.studentIds, studentId]
        : prev.studentIds.filter(id => id !== studentId);
        
      // Clear studentIds validation error if we now have students selected
      if (newStudentIds.length > 0 && validationErrors.studentIds) {
        setValidationErrors(prev => {
          const updated = { ...prev }
          delete updated.studentIds
          return updated
        })
      }
      
      return { 
        ...prev, 
        studentIds: newStudentIds 
      }
    })
  }, [validationErrors])

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
        
        // Clear validation errors for these fields
        if (validationErrors.startDate || validationErrors.endDate) {
          setValidationErrors(prev => {
            const updated = { ...prev }
            delete updated.startDate
            delete updated.endDate
            return updated
          })
        }

        return {
          ...prev,
          startDate: newStart.toISOString(),
          endDate: newEnd.toISOString(),
        }
      } else {
        const newEnd = new Date(prev.endDate)
        newEnd.setHours(hours, minutes, 0, 0)
        
        // Clear validation error for endDate if it exists
        if (validationErrors.endDate) {
          setValidationErrors(prev => {
            const updated = { ...prev }
            delete updated.endDate
            return updated
          })
        }

        return {
          ...prev,
          endDate: newEnd.toISOString(),
        }
      }
    })
  }, [validationErrors])

  // Format time for input - use useCallback to prevent recreation on each render
  const formatTimeForInput = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
  }, [])

  // Validate form before submission
  const validateForm = useCallback(() => {
    const errors: Record<string, string[]> = {}
    
    // Check required fields
    if (!lesson.subjectName) {
      errors.subjectName = ["Subject is required"]
    }
    
    if (lesson.studentIds.length === 0) {
      errors.studentIds = ["At least one student must be selected"]
    }
    
    // Check time validity
    const startDate = new Date(lesson.startDate)
    const endDate = new Date(lesson.endDate)
    
    if (isNaN(startDate.getTime())) {
      errors.startDate = ["Invalid start time"]
    }
    
    if (isNaN(endDate.getTime())) {
      errors.endDate = ["Invalid end time"]
    } else if (endDate <= startDate) {
      errors.endDate = ["End time must be after start time"]
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [lesson])

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate the form first
    if (!validateForm()) {
      setErrorMessage("Please correct the errors below.")
      return
    }
    
    setErrorMessage(null)
    startTransition(async () => {
      try {
        const formData = new FormData(formRef.current || undefined)
        
        // Debug: Log all form data
        console.log("Form data being submitted:", {
          lessonId: editingLesson?.id,
          subjectName: lesson.subjectName,
          subjectColor: lesson.subjectColor,
          startDate: lesson.startDate,
          endDate: lesson.endDate,
          studentIds: lesson.studentIds.join(','),
          day: lesson.day_of_week,
          description: lesson.description,
          objectives: lesson.objectives,
          materialsNeeded: lesson.materialsNeeded,
          location: lesson.location
        })
        
        // Manually add the required fields to the form data to ensure they're included correctly
        if (editingLesson?.id) {
          formData.set('lessonId', editingLesson.id)
        }
        // Properly format the day of week
        const startDateObj = new Date(lesson.startDate)
        const dayOfWeek = startDateObj.toLocaleDateString('en-US', { weekday: 'long' })
        
        formData.set('studentIds', lesson.studentIds.join(','))
        formData.set('startDate', lesson.startDate)
        formData.set('endDate', lesson.endDate)
        formData.set('dayOfWeek', dayOfWeek)
        formData.set('subjectName', lesson.subjectName || '')
        formData.set('description', lesson.description || '')
        formData.set('objectives', lesson.objectives || '')
        formData.set('materialsNeeded', lesson.materialsNeeded || '')
        formData.set('location', lesson.location || '')
        formData.set('subjectColor', lesson.subjectColor || '#5e8b7e')
        
        // Call the appropriate server action
        const result = editingLesson 
          ? await updateLesson(undefined, formData)
          : await createLesson(undefined, formData)
        
        if (result.success) {
          onClose()
          router.refresh()
        } else {
          setErrorMessage(result.message || "Failed to save lesson.")
          
          // Set validation errors if they exist in the result
          if (result.errors) {
            setValidationErrors(result.errors)
          }
        }
      } catch (error) {
        console.error("Error saving lesson:", error)
        setErrorMessage("An unexpected error occurred. Please try again.")
      }
    })
  }, [lesson, editingLesson, onClose, router, validateForm])

  // Subject options - memoize this array
  const subjectOptions = useMemo(
    () => [
      "Math",
      "Science",
      "Language Arts",
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

        {errorMessage && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">{errorMessage}</div>
        )}

        <form 
          ref={formRef}
          onSubmit={handleSubmit}
          className="grid gap-4 py-4"
        >
          {/* Hidden fields */}
          {editingLesson && (
            <input type="hidden" name="lessonId" value={editingLesson.id} />
          )}

          {/* Subject */}
          <div className="grid gap-2">
            <Label htmlFor="subjectName" className="text-[#5e8b7e] flex items-center">
              Subject <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select 
              name="subjectName"
              value={lesson.subjectName} 
              onValueChange={(value) => handleSelectChange("subjectName", value)}
            >
              <SelectTrigger 
                id="subjectName" 
                className={`border-[#5e8b7e]/20 bg-white ${validationErrors.subjectName ? "border-red-500" : ""}`}
              >
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
            {validationErrors.subjectName && (
              <p className="text-red-500 text-xs">{validationErrors.subjectName[0]}</p>
            )}
          </div>

          {/* Subject Color (hidden for now, using default) */}
          <input type="hidden" name="subjectColor" value={lesson.subjectColor || "#5e8b7e"} />

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
            <Label className="text-[#5e8b7e] flex items-center">
              Students <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className={`grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded-md ${
              validationErrors.studentIds ? "border border-red-500" : "border border-[#5e8b7e]/20"
            }`}>
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
            {validationErrors.studentIds && (
              <p className="text-red-500 text-xs">{validationErrors.studentIds[0]}</p>
            )}
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startTime" className="text-[#5e8b7e] flex items-center">
                Start Time <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formatTimeForInput(lesson.startDate)}
                onChange={(e) => handleTimeChange(e.target.value, "startTime")}
                className={`border-[#5e8b7e]/20 bg-white ${validationErrors.startDate ? "border-red-500" : ""}`}
              />
              {validationErrors.startDate && (
                <p className="text-red-500 text-xs">{validationErrors.startDate[0]}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endTime" className="text-[#5e8b7e] flex items-center">
                End Time <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="endTime"
                type="time"
                value={formatTimeForInput(lesson.endDate)}
                onChange={(e) => handleTimeChange(e.target.value, "endTime")}
                className={`border-[#5e8b7e]/20 bg-white ${validationErrors.endDate ? "border-red-500" : ""}`}
              />
              {validationErrors.endDate && (
                <p className="text-red-500 text-xs">{validationErrors.endDate[0]}</p>
              )}
            </div>
          </div>

          {/* Objectives */}
          <div className="grid gap-2">
            <Label htmlFor="objectives" className="text-[#5e8b7e]">
              Objectives
            </Label>
            <Textarea
              id="objectives"
              name="objectives"
              value={lesson.objectives || ""}
              onChange={handleInputChange}
              placeholder="Learning objectives for this lesson"
              className="border-[#5e8b7e]/20 bg-white"
            />
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7] hover:text-[#5e8b7e]"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#5e8b7e] hover:bg-[#4a6e63]"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingLesson ? "Updating..." : "Adding..."}
                </>
              ) : (
                `${editingLesson ? "Update" : "Add"} Lesson`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
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
import { useActionState } from "react"
import { useToast } from "@/components/ui/use-toast"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const { toast } = useToast()
  
  // Use useActionState for server actions
  const [createState, createAction] = useActionState(createLesson, undefined)
  const [updateState, updateAction] = useActionState(updateLesson, undefined)
  
  // Determine the current state and action based on whether we're editing or creating
  const state = editingLesson ? updateState : createState
  const formAction = editingLesson ? updateAction : createAction

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
  
  // Effect to close modal on successful action and show toast
  useEffect(() => {
    if (state?.success) {
      onClose()
      router.refresh()
      
      // Show success toast
      toast({
        title: "Success",
        description: state.message || `Lesson ${editingLesson ? 'updated' : 'scheduled'} successfully`,
        variant: "default",
      })
    } else if (state?.message && !state?.success && !Object.keys(state?.errors || {}).length) {
      // Show error toast for general errors (not field-specific)
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      })
    }
  }, [state, onClose, router, toast, editingLesson])

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
      const newStudentIds = checked 
        ? [...prev.studentIds, studentId]
        : prev.studentIds.filter(id => id !== studentId);
        
      return { 
        ...prev, 
        studentIds: newStudentIds 
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

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Prepare the form data
      const formData = new FormData(formRef.current || undefined)
      
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
      
      // Call the appropriate action
      const action = editingLesson ? updateAction : createAction
      action(formData).finally(() => {
        setIsSubmitting(false)
      })
    } catch (error) {
      console.error("Error preparing form data:", error)
      setIsSubmitting(false)
    }
  }, [lesson, editingLesson, createAction, updateAction])

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

        {state?.message && (
          <div className={`p-3 rounded-md text-sm mb-4 ${state?.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {state.message}
          </div>
        )}

        <form 
          ref={formRef}
          action={formAction}
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
                className={`border-[#5e8b7e]/20 bg-white ${state?.errors?.subjectName ? "border-red-500" : ""}`}
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
            {state?.errors?.subjectName && (
              <p className="text-red-500 text-xs">{state.errors.subjectName[0]}</p>
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
            <div className={`grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded-md ${state?.errors?.studentIds ? "border border-red-500" : "border border-[#5e8b7e]/20"}`}>
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
            {state?.errors?.studentIds && (
              <p className="text-red-500 text-xs">{state.errors.studentIds[0]}</p>
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
                className={`border-[#5e8b7e]/20 bg-white ${state?.errors?.startDate ? "border-red-500" : ""}`}
              />
              {state?.errors?.startDate && (
                <p className="text-red-500 text-xs">{state.errors.startDate[0]}</p>
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
                className={`border-[#5e8b7e]/20 bg-white ${state?.errors?.endDate ? "border-red-500" : ""}`}
              />
              {state?.errors?.endDate && (
                <p className="text-red-500 text-xs">{state.errors.endDate[0]}</p>
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#5e8b7e] hover:bg-[#4a6e63]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
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
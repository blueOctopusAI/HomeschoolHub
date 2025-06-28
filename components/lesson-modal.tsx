"use client"

import type React from "react"

import { useEffect, useState, useCallback, useMemo, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Checkbox } from "./ui/checkbox"
import { Loader2, CalendarIcon } from "lucide-react"
import { type Lesson, type Student } from "@/lib/store"
import { format, parseISO } from "date-fns"
import { Calendar } from "./ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { useRouter } from "next/navigation"
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scheduleType, setScheduleType] = useState<"single" | "range" | "recurring">("single")
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
  const router = useRouter()
  const { toast, dismiss } = useToast()
  const [error, setError] = useState<string | null>(null)

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
      recurrencePattern: "daily" as "none" | "daily" | "weekly" | "custom" | "biweekly",
      recurrenceEndDate: selectedDate ? new Date(new Date(selectedDate).setDate(new Date(selectedDate).getDate() + 30)).toISOString() : new Date().toISOString(),
      completed: false,
      day_of_week: selectedDate ? format(selectedDate, "EEEE") : "",
    }),
    [selectedDate],
  )

  const [lesson, setLesson] = useState<typeof defaultLesson & { recurrenceEndDate: string }>(defaultLesson)

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

  // Clean up any lingering toasts when modal closes
  useEffect(() => {
    return () => {
      if (!isOpen) {
        // Dismiss all toasts when modal is closing
        dismiss()
        setError(null)
      }
    }
  }, [isOpen, dismiss])

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
  const handleSubmit = useCallback(async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    // Clear any previous errors
    setError(null)
    
    // Ensure subjectName is set and not empty
    if (!lesson.subjectName || lesson.subjectName.trim() === '') {
      toast({
        title: "Error",
        description: "Please select a subject",
        variant: "destructive",
        duration: 5000,
      })
      return
    }
    
    // Ensure at least one student is selected
    if (lesson.studentIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student",
        variant: "destructive",
        duration: 5000,
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Prepare the data for the API
      const lessonData = {
        subjectName: lesson.subjectName.trim(),
        subjectColor: lesson.subjectColor || '#5e8b7e',
        startDate: lesson.startDate,
        endDate: lesson.endDate,
        studentIds: lesson.studentIds,
        description: lesson.description || null,
        objectives: lesson.objectives || null,
        materialsNeeded: lesson.materialsNeeded || null,
        location: lesson.location || null,
        scheduleType: scheduleType,
        recurrencePattern: scheduleType === 'recurring' ? lesson.recurrencePattern : null,
        recurrenceEndDate: (scheduleType === 'range' || scheduleType === 'recurring') ? lesson.recurrenceEndDate : null,
        selectedDays: (scheduleType === 'range' || scheduleType === 'recurring') ? selectedDays : [],
      }
      
      // Debug: Log form data to verify all fields
      console.log('Lesson data being sent:', lessonData)
      
      // Call the API route
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lessonData),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || `Lesson ${editingLesson ? 'updated' : 'scheduled'} successfully`,
          variant: "default",
          duration: 5000,
        })
        onClose()
        router.refresh()
      } else {
        setError(result.message || "An error occurred")
        toast({
          title: "Error",
          description: result.message || "Failed to save lesson",
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setError("Failed to save lesson. Please try again.")
      toast({
        title: "Error",
        description: "Failed to save lesson. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [lesson, editingLesson, scheduleType, selectedDays, toast, onClose, router])

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
      <DialogContent className="bg-[#faf9f5] rounded-lg shadow-md max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" aria-describedby="lesson-modal-description">
        <DialogHeader>
          <DialogTitle className="text-[#5e8b7e] text-xl">
            {editingLesson ? "Edit Lesson" : "Add New Lesson"}
          </DialogTitle>
          <p id="lesson-modal-description" className="sr-only">
            {editingLesson ? "Edit an existing lesson" : "Create a new lesson for your schedule"}
          </p>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-md text-sm mb-4 bg-red-50 text-red-600">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-4 py-4 px-1">
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
              value={lesson.subjectName} 
              onValueChange={(value) => handleSelectChange("subjectName", value)}
            >
              <SelectTrigger 
                id="subjectName" 
                className="border-[#5e8b7e]/20 bg-white"
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
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded-md border border-[#5e8b7e]/20">
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

          {/* --- START OF NEW CODE --- */}
          <div className="grid gap-4 p-4 border rounded-md bg-white/50 border-sage-200/50">
            <div className="grid gap-2">
              <Label htmlFor="scheduleType" className="text-[#5e8b7e]">Schedule Type</Label>
              <Select value={scheduleType} onValueChange={(value) => setScheduleType(value as any)}>
                <SelectTrigger id="scheduleType" className="border-[#5e8b7e]/20 bg-white">
                  <SelectValue placeholder="Select schedule type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Day</SelectItem>
                  <SelectItem value="range">Date Range</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fields for Single Day & Date Range */}
            {(scheduleType === 'single' || scheduleType === 'range') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#5e8b7e]">
                      {scheduleType === 'single' ? 'Date' : 'Start Date'} <span className="text-red-500">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal mt-1 border-[#5e8b7e]/20 bg-white">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {lesson.startDate ? format(parseISO(lesson.startDate), "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={parseISO(lesson.startDate)}
                          onSelect={(date) => date && setLesson(prev => ({ ...prev, startDate: date.toISOString() }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {scheduleType === 'range' && (
                    <div>
                      <Label className="text-[#5e8b7e]">End Date <span className="text-red-500">*</span></Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal mt-1 border-[#5e8b7e]/20 bg-white">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {lesson.recurrenceEndDate ? format(parseISO(lesson.recurrenceEndDate), "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={parseISO(lesson.recurrenceEndDate)}
                            onSelect={(date) => date && setLesson(prev => ({ ...prev, recurrenceEndDate: date.toISOString() }))}
                            disabled={{ before: parseISO(lesson.startDate) }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
                
                {/* Days of Week Selection for Date Range */}
                {scheduleType === 'range' && (
                  <div className="grid gap-2">
                    <Label className="text-[#5e8b7e]">Days of the Week</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={`range-day-${day}`}
                            checked={selectedDays.includes(day)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDays([...selectedDays, day])
                              } else {
                                setSelectedDays(selectedDays.filter(d => d !== day))
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`range-day-${day}`} 
                            className="text-sm text-[#5e8b7e] cursor-pointer"
                          >
                            {day.slice(0, 3)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Fields for Recurring */}
            {scheduleType === 'recurring' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-[#5e8b7e]">Recurs Until <span className="text-red-500">*</span></Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal mt-1 border-[#5e8b7e]/20 bg-white">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {lesson.recurrenceEndDate ? format(parseISO(lesson.recurrenceEndDate), "PPP") : "Select end date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={parseISO(lesson.recurrenceEndDate)}
                                    onSelect={(date) => date && setLesson(prev => ({ ...prev, recurrenceEndDate: date.toISOString() }))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div>
                      <Label className="text-[#5e8b7e]">Frequency</Label>
                      <Select 
                          name="recurrencePattern" 
                          value={lesson.recurrencePattern} 
                          onValueChange={(value) => handleSelectChange("recurrencePattern", value)}
                      >
                          <SelectTrigger className="mt-1 border-[#5e8b7e]/20 bg-white">
                              <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="daily">Daily (Selected Days)</SelectItem>
                              <SelectItem value="weekly">Weekly (Same Day)</SelectItem>
                              <SelectItem value="custom">Custom (Multiple Days/Week)</SelectItem>
                          </SelectContent>
                      </Select>
                    </div>
                </div>
                
                {/* Days of Week Selection for Daily and Custom Recurrence */}
                {(lesson.recurrencePattern === 'daily' || lesson.recurrencePattern === 'custom') && (
                  <div className="grid gap-2">
                    <Label className="text-[#5e8b7e]">Days of the Week</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${day}`}
                            checked={selectedDays.includes(day)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDays([...selectedDays, day])
                              } else {
                                setSelectedDays(selectedDays.filter(d => d !== day))
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`day-${day}`} 
                            className="text-sm text-[#5e8b7e] cursor-pointer"
                          >
                            {day.slice(0, 3)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Time inputs for Single and Recurring */}
            {(scheduleType === 'single' || scheduleType === 'recurring') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime" className="text-[#5e8b7e]">Start Time <span className="text-red-500">*</span></Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formatTimeForInput(lesson.startDate)}
                    onChange={(e) => handleTimeChange(e.target.value, "startTime")}
                    className="border-[#5e8b7e]/20 bg-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime" className="text-[#5e8b7e]">End Time <span className="text-red-500">*</span></Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formatTimeForInput(lesson.endDate)}
                    onChange={(e) => handleTimeChange(e.target.value, "endTime")}
                    className="border-[#5e8b7e]/20 bg-white"
                  />
                </div>
              </div>
            )}
          </div>
          {/* --- END OF NEW CODE --- */}

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

          </div>
        </div>
        
        <DialogFooter className="border-t pt-4 mt-4">
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
            onClick={handleSubmit}
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
      </DialogContent>
    </Dialog>
  )
}
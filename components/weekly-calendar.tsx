"use client"

import type React from "react"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns"
import { Plus, Loader2, Calendar } from "lucide-react"
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
import { createLesson, updateLesson, deleteLesson } from "@/app/calendar/actions" 
import { useActionState } from "react"
import { useRouter } from "next/navigation"

// Colors from the flower logo
const logoColors = {
  monday: { bg: "bg-[#e9f1e7]", border: "border-[#d8e8d2]", text: "text-[#5e8b7e]" },
  tuesday: { bg: "bg-[#f5e6d8]", border: "border-[#f0d7c2]", text: "text-[#b38867]" },
  wednesday: { bg: "bg-[#e6f0f9]", border: "border-[#d0e4f5]", text: "text-[#5a87ad]" },
  thursday: { bg: "bg-[#f9e6eb]", border: "border-[#f5d0da]", text: "text-[#c25e7c]" },
  friday: { bg: "bg-[#f0e6f5]", border: "border-[#e5d0f0]", text: "text-[#8a5aad]" },
}

export interface WeeklyCalendarProps {
  initialLessons: Lesson[]
  userStudents: Student[]
}

export function WeeklyCalendar({ initialLessons = [], userStudents = [] }: WeeklyCalendarProps) {
  // Get actions and selected data from store using individual selectors
  const selectedStudent = useStore((state) => state.selectedStudent)
  const currentDate = useStore((state) => state.currentDate)
  const addLesson = useStore((state) => state.addLesson)
  const updateLesson = useStore((state) => state.updateLesson)
  const deleteLesson = useStore((state) => state.deleteLesson)
  const toggleLessonComplete = useStore((state) => state.toggleLessonComplete)
  
  // Use props data instead of Zustand store
  const students = userStudents
  const lessons = initialLessons

  // Local state for modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  
  // Use action state for lesson actions
  const [createState, createAction] = useActionState(createLesson, undefined)
  const [updateState, updateAction] = useActionState(updateLesson, undefined)
  const [deleteState, deleteAction] = useActionState(deleteLesson, undefined)
  
  // Get the active state and action based on whether we're editing or creating
  const state = editingLesson ? updateState : createState
  
  // Effect to close modal on successful action
  useEffect(() => {
    if (state?.success || deleteState?.success) {
      setIsModalOpen(false)
      router.refresh()
    }
  }, [state?.success, deleteState?.success, router])

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
        studentIds: selectedStudent !== "all" ? [selectedStudent.toString()] : [],
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
        setIsSubmitting(true)
        const formDataObj = new FormData()
        formDataObj.set('lessonId', lessonId)
        
        deleteAction(formDataObj).finally(() => {
          setIsSubmitting(false)
        })
      }
    },
    [deleteAction]
  )

  // Handle form submission
  const handleSubmit = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    setIsSubmitting(true)

    if (!selectedDay || !formData.subjectName) {
      setIsSubmitting(false)
      return
    }

    try {
      // Prepare form data
      const formDataObj = new FormData()
      
      // Prepare dates
      const startDate = new Date(selectedDay)
      const [startHours, startMinutes] = formData.startTime.split(":").map(Number)
      startDate.setHours(startHours, startMinutes, 0, 0)

      const endDate = new Date(selectedDay)
      const [endHours, endMinutes] = formData.endTime.split(":").map(Number)
      endDate.setHours(endHours, endMinutes, 0, 0)
      
      // Set form data fields
      if (editingLesson?.id) {
        formDataObj.set('lessonId', editingLesson.id)
      }
      
      formDataObj.set('subjectName', formData.subjectName)
      formDataObj.set('subjectColor', formData.subjectColor || getSubjectColor(formData.subjectName).text.replace("text", "#"))
      formDataObj.set('startDate', startDate.toISOString())
      formDataObj.set('endDate', endDate.toISOString())
      formDataObj.set('studentIds', formData.studentIds.join(','))
      formDataObj.set('dayOfWeek', format(selectedDay, "EEEE"))
      formDataObj.set('description', formData.description || '')
      formDataObj.set('objectives', formData.objectives || '')
      formDataObj.set('materialsNeeded', formData.materialsNeeded || '')
      formDataObj.set('location', formData.location || '')
      
      // Call the appropriate action
      const action = editingLesson ? updateAction : createAction
      action(formDataObj).finally(() => {
        setIsSubmitting(false)
        // Modal will be closed via useEffect watching state.success
      })
    } catch (error) {
      console.error("Error submitting form:", error)
      setIsSubmitting(false)
    }
  }, [selectedDay, formData, editingLesson, createAction, updateAction, getSubjectColor])

  // Get lessons for a specific day - memoize this function
  const getLessonsForDay = useCallback(
    (day: Date) => {
      return lessons.filter((lesson) => {
        const lessonDate = new Date(lesson.startDate)
        // Use the actual database UUID directly for comparison
        const isForSelectedStudent = selectedStudent === "all" || lesson.studentIds.includes(selectedStudent)
        
        return isSameDay(lessonDate, day) && isForSelectedStudent
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
    "Language Arts": { bg: "bg-purple-50", text: "text-purple-800" },
    Reading: { bg: "bg-amber-50", text: "text-amber-800" },
    Writing: { bg: "bg-purple-50", text: "text-purple-800" },
    History: { bg: "bg-orange-50", text: "text-orange-800" },
    Geography: { bg: "bg-yellow-50", text: "text-yellow-800" },
    Art: { bg: "bg-pink-50", text: "text-pink-800" },
    Music: { bg: "bg-indigo-50", text: "text-indigo-800" },
    "Physical Education": { bg: "bg-cyan-50", text: "text-cyan-800" },
    "Foreign Language": { bg: "bg-lime-50", text: "text-lime-800" },
    "Computer Science": { bg: "bg-sky-50", text: "text-sky-800" },
    Other: { bg: "bg-gray-50", text: "text-gray-800" },
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
  const lessonsByDay = useMemo(() => {
    return daysOfWeek.reduce((acc, day) => {
      const dayKey = format(day, "yyyy-MM-dd")
      acc[dayKey] = lessons.filter((lesson) => {
        const lessonDate = new Date(lesson.startDate)
        // Check if the lesson is for the selected student using actual database UUID
        const isForSelectedStudent = selectedStudent === "all" || 
          lesson.studentIds.includes(selectedStudent);
        
        return isSameDay(lessonDate, day) && isForSelectedStudent
      }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      return acc
    }, {} as Record<string, Lesson[]>)
  }, [daysOfWeek, lessons, selectedStudent])

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
                      className={`${lesson.completed ? 'bg-[#e6f4ea] border-l-4 border-l-green-500' : 'bg-[#f0f4f2]'} rounded-md text-sm px-2 py-1 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 mb-2.5`}
                    >
                      <div>
                        {lesson.completed && (
                          <div className="bg-green-100 rounded-t-md mx-[-8px] mt-[-4px] mb-1 px-2 py-0.5 text-xs text-green-800 font-medium border-b border-green-200 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            COMPLETED
                          </div>
                        )}
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
                              <div className="flex items-center">
                                <div className="bg-green-500 text-white rounded-full p-0.5 mr-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-green-700">Completed</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500 hover:text-gray-700">Mark as complete</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-6">
                <Calendar className="h-12 w-12 text-[#5e8b7e]/30 mb-3" />
                <p className="text-[#5e8b7e] font-medium mb-2">No lessons scheduled!</p>
                <p className="text-[#5e8b7e]/60 text-sm mb-4">Time to plan activities for {format(day, "EEEE")}?</p>
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

      {/* Lesson Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#faf9f5] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#5e8b7e]">{editingLesson ? "Edit Lesson" : "Add New Lesson"}</DialogTitle>
          </DialogHeader>

          {state?.message && (
            <div className={`p-3 rounded-md text-sm mb-4 ${state?.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {state.message}
            </div>
          )}

          <form
            ref={formRef}
            action={editingLesson ? updateAction : createAction}
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="grid gap-4 py-4"
          >
            {/* Hidden fields for IDs */}
            {editingLesson?.id && (
              <input type="hidden" name="lessonId" value={editingLesson.id} />
            )}
            <input 
              type="hidden" 
              name="studentIds" 
              value={formData.studentIds.join(',')} 
            />

            <div className="grid gap-2">
              <Label htmlFor="subjectName" className="text-[#5e8b7e]">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.subjectName}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, subjectName: value }))}
                name="subjectName"
              >
                <SelectTrigger 
                  id="subjectName" 
                  className={`border-[#5e8b7e]/20 bg-white ${state?.errors?.subjectName ? 'border-red-500' : ''}`}
                >
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
              {state?.errors?.subjectName && (
                <p className="text-red-500 text-xs mt-1">{state.errors.subjectName[0]}</p>
              )}
              
              {/* Hidden subjectColor field */}
              <input 
                type="hidden" 
                name="subjectColor" 
                value={formData.subjectColor || getSubjectColor(formData.subjectName)?.text?.replace("text", "#") || '#5e8b7e'} 
              />
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
                className={`border-[#5e8b7e]/20 bg-white ${state?.errors?.description ? 'border-red-500' : ''}`}
              />
              {state?.errors?.description && (
                <p className="text-red-500 text-xs mt-1">{state.errors.description[0]}</p>
              )}
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
                className={`border-[#5e8b7e]/20 bg-white ${state?.errors?.objectives ? 'border-red-500' : ''}`}
              />
              {state?.errors?.objectives && (
                <p className="text-red-500 text-xs mt-1">{state.errors.objectives[0]}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label className="text-[#5e8b7e]">
                Students <span className="text-red-500">*</span>
              </Label>
              <div className={`grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded-md ${state?.errors?.studentIds ? 'border border-red-500' : 'border border-[#5e8b7e]/20'}`}>
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
              {state?.errors?.studentIds && (
                <p className="text-red-500 text-xs mt-1">{state.errors.studentIds[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime" className="text-[#5e8b7e]">
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className={`border-[#5e8b7e]/20 bg-white ${state?.errors?.startDate ? 'border-red-500' : ''}`}
                />
                {state?.errors?.startDate && (
                  <p className="text-red-500 text-xs mt-1">{state.errors.startDate[0]}</p>
                )}
                
                {/* Hidden field for the actual startDate that will be sent to the server */}
                {selectedDay && (
                  <input 
                    type="hidden" 
                    name="startDate" 
                    value={(() => {
                      const date = new Date(selectedDay);
                      const [hours, minutes] = formData.startTime.split(':').map(Number);
                      date.setHours(hours, minutes, 0, 0);
                      return date.toISOString();
                    })()} 
                  />
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime" className="text-[#5e8b7e]">
                  End Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className={`border-[#5e8b7e]/20 bg-white ${state?.errors?.endDate ? 'border-red-500' : ''}`}
                />
                {state?.errors?.endDate && (
                  <p className="text-red-500 text-xs mt-1">{state.errors.endDate[0]}</p>
                )}
                
                {/* Hidden field for the actual endDate that will be sent to the server */}
                {selectedDay && (
                  <input 
                    type="hidden" 
                    name="endDate" 
                    value={(() => {
                      const date = new Date(selectedDay);
                      const [hours, minutes] = formData.endTime.split(':').map(Number);
                      date.setHours(hours, minutes, 0, 0);
                      return date.toISOString();
                    })()} 
                  />
                )}
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
                className={`border-[#5e8b7e]/20 bg-white ${state?.errors?.materialsNeeded ? 'border-red-500' : ''}`}
              />
              {state?.errors?.materialsNeeded && (
                <p className="text-red-500 text-xs mt-1">{state.errors.materialsNeeded[0]}</p>
              )}
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
                className={`border-[#5e8b7e]/20 bg-white ${state?.errors?.location ? 'border-red-500' : ''}`}
              />
              {state?.errors?.location && (
                <p className="text-red-500 text-xs mt-1">{state.errors.location[0]}</p>
              )}
            </div>
            
            {/* Hidden dayOfWeek field */}
            {selectedDay && (
              <input 
                type="hidden" 
                name="dayOfWeek" 
                value={format(selectedDay, "EEEE")} 
              />
            )}
          </form>

          <DialogFooter>
            {editingLesson && (
              <Button
                variant="outline"
                onClick={(e) => handleDeleteLesson(e, editingLesson.id)}
                className="mr-auto border-red-300 text-red-500 hover:bg-red-50"
                disabled={isSubmitting}
              >
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7] hover:text-[#4a6e63]"
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
    </div>
  )
}

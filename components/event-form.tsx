"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface EventFormProps {
  selectedDate: Date
  onSubmit: (event: any) => void
  onCancel: () => void
  editingEvent: any | null
  students: any[]
}

export function EventForm({ selectedDate, onSubmit, onCancel, editingEvent, students }: EventFormProps) {
  // Initialize form state
  const [event, setEvent] = useState({
    subjectName: "",
    description: "",
    studentIds: [] as string[],
    startDate: selectedDate.toISOString(),
    endDate: new Date(selectedDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
    duration: 60,
    recurring: false,
    recurrencePattern: "none" as "none" | "daily" | "weekly" | "biweekly" | "monthly",
    recurrenceDays: [] as ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[],
    recurrenceEndDate: new Date(selectedDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days later
    completed: false,
    materialsNeeded: "",
    location: "",
    objectives: "",
    assessmentMethod: "None" as "Observation" | "Quiz" | "Project" | "Presentation" | "None",
  })

  // Update form when editing an existing event
  useEffect(() => {
    if (editingEvent) {
      setEvent({
        ...editingEvent,
        // Ensure dates are strings
        startDate: editingEvent.startDate,
        endDate: editingEvent.endDate,
        recurrenceEndDate: editingEvent.recurrenceEndDate || event.recurrenceEndDate,
      })
    }
  }, [editingEvent])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEvent((prev) => ({ ...prev, [name]: value }))
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: any) => {
    setEvent((prev) => ({ ...prev, [name]: value }))
  }

  // Handle checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setEvent((prev) => ({ ...prev, [name]: checked }))
  }

  // Handle student selection
  const handleStudentSelection = (studentId: string, checked: boolean) => {
    setEvent((prev) => {
      if (checked) {
        return { ...prev, studentIds: [...prev.studentIds, studentId] }
      } else {
        return { ...prev, studentIds: prev.studentIds.filter((id) => id !== studentId) }
      }
    })
  }

  // Handle recurrence day selection
  const handleRecurrenceDaySelection = (
    day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
    checked: boolean,
  ) => {
    setEvent((prev) => {
      if (checked) {
        return { ...prev, recurrenceDays: [...prev.recurrenceDays, day] }
      } else {
        return { ...prev, recurrenceDays: prev.recurrenceDays.filter((d) => d !== day) }
      }
    })
  }

  // Handle date changes
  const handleDateChange = (date: Date | undefined, field: "startDate" | "endDate" | "recurrenceEndDate") => {
    if (!date) return

    if (field === "startDate") {
      // Keep the same time, just change the date
      const currentStart = new Date(event.startDate)
      const newStart = new Date(date)
      newStart.setHours(currentStart.getHours(), currentStart.getMinutes(), 0, 0)

      // Also update end date to maintain duration
      const currentEnd = new Date(event.endDate)
      const duration = currentEnd.getTime() - currentStart.getTime()
      const newEnd = new Date(newStart.getTime() + duration)

      setEvent((prev) => ({
        ...prev,
        startDate: newStart.toISOString(),
        endDate: newEnd.toISOString(),
      }))
    } else if (field === "endDate") {
      // Keep the same time, just change the date
      const currentEnd = new Date(event.endDate)
      const newEnd = new Date(date)
      newEnd.setHours(currentEnd.getHours(), currentEnd.getMinutes(), 0, 0)

      setEvent((prev) => ({
        ...prev,
        endDate: newEnd.toISOString(),
      }))
    } else {
      // For recurrence end date, set to end of day
      const newDate = new Date(date)
      newDate.setHours(23, 59, 59, 999)

      setEvent((prev) => ({
        ...prev,
        recurrenceEndDate: newDate.toISOString(),
      }))
    }
  }

  // Handle time changes
  const handleTimeChange = (timeString: string, field: "startTime" | "endTime") => {
    const [hours, minutes] = timeString.split(":").map(Number)

    if (field === "startTime") {
      const newStart = new Date(event.startDate)
      newStart.setHours(hours, minutes, 0, 0)

      // Also update end time to maintain duration
      const currentStart = new Date(event.startDate)
      const currentEnd = new Date(event.endDate)
      const duration = currentEnd.getTime() - currentStart.getTime()
      const newEnd = new Date(newStart.getTime() + duration)

      setEvent((prev) => ({
        ...prev,
        startDate: newStart.toISOString(),
        endDate: newEnd.toISOString(),
      }))
    } else {
      const newEnd = new Date(event.endDate)
      newEnd.setHours(hours, minutes, 0, 0)

      setEvent((prev) => ({
        ...prev,
        endDate: newEnd.toISOString(),
      }))
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!event.subjectName) {
      alert("Please enter a subject name")
      return
    }

    if (event.studentIds.length === 0) {
      alert("Please select at least one student")
      return
    }

    // Calculate duration
    const start = new Date(event.startDate)
    const end = new Date(event.endDate)
    const durationInMinutes = Math.round((end.getTime() - start.getTime()) / (60 * 1000))

    // Submit the event
    onSubmit({
      ...event,
      duration: durationInMinutes,
    })
  }

  // Format time for input
  const formatTimeForInput = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
  }

  // Subject options
  const subjectOptions = [
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
  ]

  // Assessment method options
  const assessmentOptions = ["Observation", "Quiz", "Project", "Presentation", "None"]

  // Days of the week
  const daysOfWeek = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ]

  return (
    <Card className="border-[#5e8b7e]/20 bg-[#faf9f5]">
      <CardHeader>
        <CardTitle className="text-[#5e8b7e]">{editingEvent ? "Edit Lesson" : "Add New Lesson"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subjectName" className="text-[#5e8b7e]">
                  Subject
                </Label>
                <Select value={event.subjectName} onValueChange={(value) => handleSelectChange("subjectName", value)}>
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

              <div className="space-y-2">
                <Label htmlFor="location" className="text-[#5e8b7e]">
                  Location
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={event.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Living room, Kitchen"
                  className="border-[#5e8b7e]/20 bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#5e8b7e]">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={event.description}
                onChange={handleInputChange}
                placeholder="Brief description of the lesson"
                className="border-[#5e8b7e]/20 bg-white"
              />
            </div>
          </div>

          {/* Students */}
          <div className="space-y-2">
            <Label className="text-[#5e8b7e]">Students</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {students.map((student) => (
                <div key={student.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`student-${student.id}`}
                    checked={event.studentIds.includes(student.id)}
                    onCheckedChange={(checked) => handleStudentSelection(student.id, checked as boolean)}
                  />
                  <Label htmlFor={`student-${student.id}`} className="text-[#5e8b7e]">
                    {student.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#5e8b7e]">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        "border-[#5e8b7e]/20 bg-white text-[#5e8b7e]",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {event.startDate ? format(new Date(event.startDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(event.startDate)}
                      onSelect={(date) => handleDateChange(date, "startDate")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-[#5e8b7e]">
                  Start Time
                </Label>
                <div className="flex items-center border rounded-md border-[#5e8b7e]/20 bg-white">
                  <Clock className="ml-2 h-4 w-4 text-[#5e8b7e]" />
                  <Input
                    id="startTime"
                    type="time"
                    value={formatTimeForInput(event.startDate)}
                    onChange={(e) => handleTimeChange(e.target.value, "startTime")}
                    className="border-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-[#5e8b7e]">
                  End Time
                </Label>
                <div className="flex items-center border rounded-md border-[#5e8b7e]/20 bg-white">
                  <Clock className="ml-2 h-4 w-4 text-[#5e8b7e]" />
                  <Input
                    id="endTime"
                    type="time"
                    value={formatTimeForInput(event.endDate)}
                    onChange={(e) => handleTimeChange(e.target.value, "endTime")}
                    className="border-0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recurring Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={event.recurring}
                onCheckedChange={(checked) => handleCheckboxChange("recurring", checked as boolean)}
              />
              <Label htmlFor="recurring" className="text-[#5e8b7e]">
                Recurring Lesson
              </Label>
            </div>

            {event.recurring && (
              <div className="space-y-4 pl-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recurrencePattern" className="text-[#5e8b7e]">
                      Recurrence Pattern
                    </Label>
                    <Select
                      value={event.recurrencePattern}
                      onValueChange={(value) => handleSelectChange("recurrencePattern", value)}
                    >
                      <SelectTrigger id="recurrencePattern" className="border-[#5e8b7e]/20 bg-white">
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#5e8b7e]">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            "border-[#5e8b7e]/20 bg-white text-[#5e8b7e]",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {event.recurrenceEndDate ? (
                            format(new Date(event.recurrenceEndDate), "PPP")
                          ) : (
                            <span>Pick an end date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={new Date(event.recurrenceEndDate)}
                          onSelect={(date) => handleDateChange(date, "recurrenceEndDate")}
                          initialFocus
                          disabled={(date) => date < new Date(event.startDate)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {(event.recurrencePattern === "weekly" || event.recurrencePattern === "biweekly") && (
                  <div className="space-y-2">
                    <Label className="text-[#5e8b7e]">Repeat On</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {daysOfWeek.map((day) => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${day.value}`}
                            checked={event.recurrenceDays.includes(day.value as any)}
                            onCheckedChange={(checked) =>
                              handleRecurrenceDaySelection(day.value as any, checked as boolean)
                            }
                          />
                          <Label htmlFor={`day-${day.value}`} className="text-[#5e8b7e]">
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="materialsNeeded" className="text-[#5e8b7e]">
                Materials Needed
              </Label>
              <Textarea
                id="materialsNeeded"
                name="materialsNeeded"
                value={event.materialsNeeded}
                onChange={handleInputChange}
                placeholder="List of materials needed for the lesson"
                className="border-[#5e8b7e]/20 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objectives" className="text-[#5e8b7e]">
                Learning Objectives
              </Label>
              <Textarea
                id="objectives"
                name="objectives"
                value={event.objectives}
                onChange={handleInputChange}
                placeholder="What students should learn from this lesson"
                className="border-[#5e8b7e]/20 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assessmentMethod" className="text-[#5e8b7e]">
                Assessment Method
              </Label>
              <Select
                value={event.assessmentMethod}
                onValueChange={(value) => handleSelectChange("assessmentMethod", value)}
              >
                <SelectTrigger id="assessmentMethod" className="border-[#5e8b7e]/20 bg-white">
                  <SelectValue placeholder="Select assessment method" />
                </SelectTrigger>
                <SelectContent>
                  {assessmentOptions.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex space-x-2">
            {editingEvent && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this lesson?")) {
                    // In a real app, we would call a delete function here
                    onCancel()
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7] hover:text-[#4a6e63]"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-[#5e8b7e] hover:bg-[#4a6e63]">
              {editingEvent ? "Update" : "Add"} Lesson
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

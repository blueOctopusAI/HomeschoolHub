"use client"

import { useEffect, useState, useCallback } from "react"
import { format, parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useStore, type Assignment } from "@/lib/store"

interface UpdateAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: Assignment | null
}

export function UpdateAssignmentModal({ open, onOpenChange, assignment }: UpdateAssignmentModalProps) {
  // Get data and actions from Zustand store
  const students = useStore((state) => state.students)
  const courses = useStore((state) => state.courses)
  const updateAssignment = useStore((state) => state.updateAssignment)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [pointsPossible, setPointsPossible] = useState<number>(100)
  const [pointsEarned, setPointsEarned] = useState<number | undefined>(undefined)
  const [courseId, setCourseId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>("Not Started")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Update form when assignment changes
  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title || "")
      setDescription(assignment.description || "")
      setSelectedStudentIds(assignment.studentIds || [])
      setDueDate(assignment.dueDate ? parseISO(assignment.dueDate) : undefined)
      setPointsPossible(assignment.pointsPossible || 100)
      setPointsEarned(assignment.pointsEarned)
      setCourseId(assignment.courseId || null)
      setStatus(assignment.status || "Not Started")
      setValidationError(null)
    }
  }, [assignment])

  // Handle student selection
  const handleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (!assignment) return

    // Validate required fields
    if (!title) {
      setValidationError("Please enter a title")
      return
    }

    if (selectedStudentIds.length === 0) {
      setValidationError("Please select at least one student")
      return
    }

    if (!dueDate) {
      setValidationError("Please select a due date")
      return
    }

    if (pointsPossible <= 0) {
      setValidationError("Points possible must be greater than 0")
      return
    }

    if (status === "Graded" && (pointsEarned === undefined || pointsEarned === null)) {
      setValidationError("Please enter points earned for graded assignments")
      return
    }

    if (pointsEarned !== undefined && pointsEarned > pointsPossible) {
      setValidationError("Points earned cannot exceed points possible")
      return
    }

    // Clear validation error
    setValidationError(null)

    // Update assignment using the Zustand store action
    updateAssignment(assignment.id, {
      title,
      description,
      studentIds: selectedStudentIds,
      dueDate: dueDate.toISOString(),
      status: status as Assignment['status'],
      pointsPossible,
      pointsEarned: status === "Graded" ? pointsEarned : undefined,
      courseId,
    })

    onOpenChange(false)
  }, [
    assignment,
    title,
    selectedStudentIds,
    dueDate,
    pointsPossible,
    pointsEarned,
    status,
    courseId,
    updateAssignment,
    onOpenChange,
  ])

  if (!assignment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[#5e8b7e]">Update Assignment</DialogTitle>
          <DialogDescription>Update the assignment details.</DialogDescription>
        </DialogHeader>

        {validationError && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">{validationError}</div>}

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-[#5e8b7e]">
              Assignment Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter assignment title"
              className="border-[#5e8b7e]/20"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="text-[#5e8b7e]">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter assignment description"
              className="border-[#5e8b7e]/20 min-h-[100px]"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-[#5e8b7e]">
              Assign To <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2 border rounded-md p-2 border-[#5e8b7e]/20">
              {students
                .filter((s) => s.id !== "all")
                .map((student) => (
                  <div key={student.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`student-${student.id}`}
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={() => handleStudentSelection(student.id)}
                      className="mr-2 rounded border-[#5e8b7e]/20"
                    />
                    <Label htmlFor={`student-${student.id}`} className="text-sm cursor-pointer">
                      {student.name}
                    </Label>
                  </div>
                ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dueDate" className="text-[#5e8b7e]">
                Due Date <span className="text-red-500">*</span>
              </Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-[#5e8b7e]/20",
                      !dueDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date)
                      setIsCalendarOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="points" className="text-[#5e8b7e]">
                Points Possible <span className="text-red-500">*</span>
              </Label>
              <Input
                id="points"
                type="number"
                min="0"
                value={pointsPossible}
                onChange={(e) => setPointsPossible(Number(e.target.value))}
                className="border-[#5e8b7e]/20"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status" className="text-[#5e8b7e]">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status" className="border-[#5e8b7e]/20">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Graded">Graded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "Graded" && (
            <div className="grid gap-2">
              <Label htmlFor="pointsEarned" className="text-[#5e8b7e]">
                Points Earned <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pointsEarned"
                  type="number"
                  min="0"
                  max={pointsPossible}
                  value={pointsEarned !== undefined ? pointsEarned : ""}
                  onChange={(e) => setPointsEarned(Number(e.target.value))}
                  className="border-[#5e8b7e]/20"
                />
                <span className="text-[#5e8b7e]/70">/ {pointsPossible}</span>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="course" className="text-[#5e8b7e]">
              Related Course
            </Label>
            <Select value={courseId || "none"} onValueChange={(value) => setCourseId(value === "none" ? null : value)}>
              <SelectTrigger id="course" className="border-[#5e8b7e]/20">
                <SelectValue placeholder="Select a course (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#5e8b7e] text-[#5e8b7e]">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-[#5e8b7e] hover:bg-[#4a6e63]">
            Update Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

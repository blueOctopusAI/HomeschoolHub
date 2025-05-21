"use client"

import { useEffect, useState } from "react"
import { format, parseISO } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
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
import { updateAssignment } from "@/app/assignments/actions"
import { useActionState } from "react"

interface UpdateAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: Assignment | null
  studentsForSelection?: Student[]
  coursesForSelection?: Course[]
}

const initialState = {
  success: false,
  message: null,
  errors: {}
}

export function UpdateAssignmentModal({ open, onOpenChange, assignment, studentsForSelection = [], coursesForSelection = [] }: UpdateAssignmentModalProps) {
  // Form state with React useActionState hook
  const [state, formAction] = useActionState(updateAssignment, initialState)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [pointsPossible, setPointsPossible] = useState<number>(100)
  const [pointsEarned, setPointsEarned] = useState<number | undefined>(undefined)
  const [courseId, setCourseId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>("Not Started")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    }
  }, [assignment])

  // Close modal on successful update
  useEffect(() => {
    if (state.success) {
      onOpenChange(false)
    }
  }, [state.success, onOpenChange])

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

  if (!assignment) return null

  // Extract field errors
  const fieldErrors = state.errors || {}

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[#5e8b7e]">Update Assignment</DialogTitle>
          <DialogDescription>Update the assignment details.</DialogDescription>
        </DialogHeader>

        {state.message && !state.success && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">{state.message}</div>
        )}

        <form 
          action={async (formData) => {
            setIsSubmitting(true);
            try {
              await formAction(formData);
            } finally {
              // State.success effect will handle closing if successful
              setIsSubmitting(false);
            }
          }} 
          className="space-y-4">
          {/* Hidden assignment ID field */}
          <input type="hidden" name="assignmentId" value={assignment.id} />
          <input type="hidden" name="studentIds" value={selectedStudentIds.join(',')} />

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-[#5e8b7e]">
                Assignment Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter assignment title"
                className={cn("border-[#5e8b7e]/20", fieldErrors.title ? "border-red-500" : "")}
              />
              {fieldErrors.title && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.title[0]}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-[#5e8b7e]">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
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
              <div className={cn(
                "flex flex-wrap gap-2 border rounded-md p-2 border-[#5e8b7e]/20",
                fieldErrors.studentIds ? "border-red-500" : ""
              )}>
                {studentsForSelection
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
              {fieldErrors.studentIds && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.studentIds[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dueDate" className="text-[#5e8b7e]">
                  Due Date <span className="text-red-500">*</span>
                </Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button" /* Prevent form submission when clicking */
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-[#5e8b7e]/20",
                        !dueDate && "text-muted-foreground",
                        fieldErrors.dueDate ? "border-red-500" : ""
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
                {fieldErrors.dueDate && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.dueDate[0]}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pointsPossible" className="text-[#5e8b7e]">
                  Points Possible <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pointsPossible"
                  name="pointsPossible"
                  type="number"
                  min="0"
                  value={pointsPossible}
                  onChange={(e) => setPointsPossible(Number(e.target.value))}
                  className={cn("border-[#5e8b7e]/20", fieldErrors.pointsPossible ? "border-red-500" : "")}
                />
                {fieldErrors.pointsPossible && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.pointsPossible[0]}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status" className="text-[#5e8b7e]">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={status} 
                onValueChange={setStatus} 
                name="status"
              >
                <SelectTrigger 
                  id="status" 
                  className={cn("border-[#5e8b7e]/20", fieldErrors.status ? "border-red-500" : "")}
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Graded">Graded</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.status && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.status[0]}</p>
              )}
            </div>

            {status === "Graded" && (
              <div className="grid gap-2">
                <Label htmlFor="pointsEarned" className="text-[#5e8b7e]">
                  Points Earned <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pointsEarned"
                    name="pointsEarned"
                    type="number"
                    min="0"
                    max={pointsPossible}
                    value={pointsEarned !== undefined ? pointsEarned : ""}
                    onChange={(e) => setPointsEarned(Number(e.target.value))}
                    className={cn("border-[#5e8b7e]/20", fieldErrors.pointsEarned ? "border-red-500" : "")}
                  />
                  <span className="text-[#5e8b7e]/70">/ {pointsPossible}</span>
                </div>
                {fieldErrors.pointsEarned && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.pointsEarned[0]}</p>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="courseId" className="text-[#5e8b7e]">
                Related Course
              </Label>
              <Select 
                value={courseId || "none"} 
                onValueChange={(value) => setCourseId(value === "none" ? null : value)} 
                name="courseId"
              >
                <SelectTrigger id="courseId" className="border-[#5e8b7e]/20">
                  <SelectValue placeholder="Select a course (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {coursesForSelection.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Hidden date input to pass the formatted date to the server action */}
            {dueDate && (
              <input 
                type="hidden" 
                name="dueDate" 
                value={dueDate.toISOString()} 
              />
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="border-[#5e8b7e] text-[#5e8b7e]"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="bg-[#5e8b7e] hover:bg-[#4a6e63]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Assignment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

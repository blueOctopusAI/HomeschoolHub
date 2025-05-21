'use client'

import { useState, useTransition } from "react"
import { format } from "date-fns"
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
import { createAssignmentAction } from "@/app/assignments/form-actions"
import { useActionState } from "react"
import { useRouter } from "next/navigation"

// Import our handler but don't use it with useActionState
import { handleCreateAssignment } from "@/app/assignments/simple-handler"

interface CreateAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentsForSelection?: Student[]
  coursesForSelection?: Course[]
}

export function CreateAssignmentModal({ open, onOpenChange, studentsForSelection = [], coursesForSelection = [] }: CreateAssignmentModalProps) {
  // Get selected student from Zustand store
  const selectedStudent = useStore((state) => state.selectedStudent)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Use our server action
  const [state, formAction] = useActionState(createAssignmentAction, { success: false, message: "" })

  // Local state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [pointsPossible, setPointsPossible] = useState<number>(100)
  const [status, setStatus] = useState<string>("Not Started")
  const [courseId, setCourseId] = useState<string | null>(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Reset form
  const resetForm = () => {
    setTitle("")
    setDescription("")
    setSelectedStudentIds(selectedStudent !== "all" ? [selectedStudent] : [])
    setDueDate(undefined)
    setPointsPossible(100)
    setStatus("Not Started")
    setCourseId(null)
    setIsCalendarOpen(false)
  }

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

  // Effect to close modal on successful submission
  if (state?.success) {
    // Force a refresh of the assignments page
    resetForm()
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (open && !newOpen) {
          resetForm()
        }
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[#5e8b7e]">Create New Assignment</DialogTitle>
          <DialogDescription>Add a new assignment for your students to complete.</DialogDescription>
        </DialogHeader>

        {state?.message && (
          <div className={`p-3 rounded-md text-sm mb-4 ${state.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {state.message}
          </div>
        )}

        <form 
          action={async (formData) => {
            // This is a client-side wrapper function that calls our server action
            startTransition(async () => {
              try {
                await handleCreateAssignment(formData);
                resetForm();
                onOpenChange(false);
                router.refresh();
              } catch (error) {
                console.error("Error creating assignment:", error);
              }
            });
          }}
          className="grid gap-4 py-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-[#5e8b7e]">
              Assignment Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              name="Assignment Title"
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
              name="Description"
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
              {studentsForSelection
                .filter((s) => s.id !== "all")
                .map((student) => (
                  <div key={student.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`student-${student.id}`}
                      name={student.name}
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
                    type="button"
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
              <input 
                type="hidden" 
                name="Due Date" 
                value={dueDate ? dueDate.toISOString() : ''} 
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pointsPossible" className="text-[#5e8b7e]">
                Points Possible <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pointsPossible"
                name="Points Possible"
                type="number"
                min="1"
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
            <Select 
              value={status} 
              onValueChange={setStatus} 
              name="Status"
            >
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

          <div className="grid gap-2">
            <Label htmlFor="courseId" className="text-[#5e8b7e]">
              Related Course
            </Label>
            <Select 
              value={courseId || "None"} 
              onValueChange={(value) => setCourseId(value === "None" ? null : value)} 
              name="Related Course"
            >
              <SelectTrigger id="courseId" className="border-[#5e8b7e]/20">
                <SelectValue placeholder="Select a course (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None</SelectItem>
                {coursesForSelection.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
              className="border-[#5e8b7e] text-[#5e8b7e]"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#5e8b7e] hover:bg-[#4a6e63]"
              disabled={isPending}
            >
              {isPending ? "Creating..." : "Create Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
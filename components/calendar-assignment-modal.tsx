'use client'

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { createAssignment } from "@/app/assignments/actions"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { type Student } from "@/lib/store"

interface CalendarAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date | null
  students: Student[]
}

export function CalendarAssignmentModal({ 
  open, 
  onOpenChange, 
  selectedDate,
  students 
}: CalendarAssignmentModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // Use the server action
  const [state, formAction] = useActionState(createAssignment, undefined)
  
  // Local state for form fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [pointsPossible, setPointsPossible] = useState<number>(100)
  
  // Reset form
  const resetForm = () => {
    setTitle("")
    setDescription("")
    setSelectedStudentIds([])
    setPointsPossible(100)
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
  
  // Effect to handle successful submission
  useEffect(() => {
    if (!state) return
    
    if (state.success) {
      resetForm()
      onOpenChange(false)
      router.refresh()
      
      toast({
        title: "Success",
        description: state.message || "Assignment created successfully",
        variant: "default",
      })
    } else if (state.message && !state.success && !Object.keys(state.errors || {}).length) {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      })
    }
  }, [state, onOpenChange, router, toast])
  
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
          <DialogTitle className="text-[#5e8b7e]">Create Assignment</DialogTitle>
          <DialogDescription>
            Create a new assignment due on {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "selected date"}.
          </DialogDescription>
        </DialogHeader>
        
        {state?.message && !state.success && (
          <div className="p-3 rounded-md text-sm mb-4 bg-red-50 text-red-600">
            {state.message}
          </div>
        )}
        
        <form action={formAction} className="grid gap-4 py-4">
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
              className={`border-[#5e8b7e]/20 ${state?.errors?.title ? 'border-red-500' : ''}`}
            />
            {state?.errors?.title && (
              <p className="text-red-500 text-xs mt-1">{state.errors.title[0]}</p>
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
              className={`border-[#5e8b7e]/20 min-h-[100px] ${state?.errors?.description ? 'border-red-500' : ''}`}
            />
            {state?.errors?.description && (
              <p className="text-red-500 text-xs mt-1">{state.errors.description[0]}</p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label className="text-[#5e8b7e]">
              Assign To <span className="text-red-500">*</span>
            </Label>
            <div className={`flex flex-wrap gap-2 border rounded-md p-2 border-[#5e8b7e]/20 ${state?.errors?.studentIds ? 'border-red-500' : ''}`}>
              {students
                .filter((s) => s.id !== "all")
                .map((student) => (
                  <div key={student.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`cal-student-${student.id}`}
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={() => handleStudentSelection(student.id)}
                      className="mr-2 rounded border-[#5e8b7e]/20"
                    />
                    <Label htmlFor={`cal-student-${student.id}`} className="text-sm cursor-pointer">
                      {student.name}
                    </Label>
                  </div>
                ))}
            </div>
            <input 
              type="hidden" 
              name="studentIds" 
              value={selectedStudentIds.join(",")} 
            />
            {state?.errors?.studentIds && (
              <p className="text-red-500 text-xs mt-1">{state.errors.studentIds[0]}</p>
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
              min="1"
              value={pointsPossible}
              onChange={(e) => setPointsPossible(Number(e.target.value))}
              className={`border-[#5e8b7e]/20 ${state?.errors?.pointsPossible ? 'border-red-500' : ''}`}
            />
            {state?.errors?.pointsPossible && (
              <p className="text-red-500 text-xs mt-1">{state.errors.pointsPossible[0]}</p>
            )}
          </div>
          
          {/* Hidden fields */}
          <input type="hidden" name="dueDate" value={selectedDate?.toISOString() || ''} />
          <input type="hidden" name="status" value="Not Started" />
          <input type="hidden" name="courseId" value="" />
          
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
            >
              Create Assignment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
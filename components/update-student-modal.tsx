'use client'

import { useState, useEffect } from "react"
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
import { type Student } from "@/lib/store"
import { updateStudent } from "@/app/students/actions"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface UpdateStudentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  onSuccess?: () => void
}

export function UpdateStudentModal({ open, onOpenChange, student, onSuccess }: UpdateStudentModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // Use the server action
  const [state, formAction] = useActionState(updateStudent, undefined)
  
  // Local state for form fields
  const [name, setName] = useState("")
  const [gradeLevel, setGradeLevel] = useState("")
  const [notes, setNotes] = useState("")
  
  // Update form when student changes
  useEffect(() => {
    if (student) {
      setName(student.name || "")
      setGradeLevel(student.gradeLevel || "")
      setNotes(student.notes || "")
    }
  }, [student])
  
  // Effect to handle successful submission
  useEffect(() => {
    if (!state) return
    
    if (state.success) {
      onOpenChange(false)
      
      toast({
        title: "Success",
        description: state.message || "Student updated successfully",
        variant: "default",
      })
      
      // Call the onSuccess callback
      onSuccess?.()
    } else if (state.message && !state.success && !Object.keys(state.errors || {}).length) {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      })
    }
  }, [state, onOpenChange, toast, onSuccess])
  
  if (!student) return null
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-[#5e8b7e]">Update Student</DialogTitle>
          <DialogDescription>
            Update the student's information.
          </DialogDescription>
        </DialogHeader>
        
        {state?.message && !state.success && (
          <div className="p-3 rounded-md text-sm mb-4 bg-red-50 text-red-600">
            {state.message}
          </div>
        )}
        
        <form action={formAction} className="grid gap-4 py-4">
          <input type="hidden" name="studentId" value={student.id} />
          
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-[#5e8b7e]">
              Student Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter student's full name"
              className={`border-[#5e8b7e]/20 ${state?.errors?.name ? 'border-red-500' : ''}`}
            />
            {state?.errors?.name && (
              <p className="text-red-500 text-xs mt-1">{state.errors.name[0]}</p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="gradeLevel" className="text-[#5e8b7e]">
              Grade Level
            </Label>
            <Input
              id="gradeLevel"
              name="gradeLevel"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="e.g., 3rd Grade, Kindergarten"
              className={`border-[#5e8b7e]/20 ${state?.errors?.gradeLevel ? 'border-red-500' : ''}`}
            />
            {state?.errors?.gradeLevel && (
              <p className="text-red-500 text-xs mt-1">{state.errors.gradeLevel[0]}</p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes" className="text-[#5e8b7e]">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about the student"
              className={`border-[#5e8b7e]/20 min-h-[80px] ${state?.errors?.notes ? 'border-red-500' : ''}`}
            />
            {state?.errors?.notes && (
              <p className="text-red-500 text-xs mt-1">{state.errors.notes[0]}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#5e8b7e] text-[#5e8b7e]"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#5e8b7e] hover:bg-[#4a6e63]"
            >
              Update Student
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
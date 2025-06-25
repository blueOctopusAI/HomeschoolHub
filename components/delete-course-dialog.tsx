"use client"

import { useState, useEffect, useRef } from "react"
import { useActionState } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { deleteCourse } from "@/app/courses/actions"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Trash2 } from "lucide-react"

interface DeleteCourseDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  course: {
    id: string
    name: string
  } | null
}

export function DeleteCourseDialog({ isOpen, onOpenChange, course }: DeleteCourseDialogProps) {
  // Use server action with useActionState
  const [state, formAction] = useActionState(deleteCourse, undefined)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const hasShownSuccessToast = useRef(false)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      hasShownSuccessToast.current = false
      setIsDeleting(false)
    } else {
      // Reset deletion state when dialog closes
      setIsDeleting(false)
      hasShownSuccessToast.current = false
    }
  }, [isOpen])

  // Close dialog on successful deletion and show toast
  useEffect(() => {
    if (!state || !isOpen) return
    
    let timeoutId: NodeJS.Timeout | null = null
    
    if (state.success && !hasShownSuccessToast.current) {
      hasShownSuccessToast.current = true
      
      // Show success toast
      toast({
        title: "Success",
        description: state.message || "Course deleted successfully",
        variant: "default",
      })
      
      // Close dialog after a short delay
      timeoutId = setTimeout(() => {
        setIsDeleting(false)
        onOpenChange(false)
      }, 150)
    } else if (!state.success) {
      // If there was an error, stop deleting
      setIsDeleting(false)
      
      // Show error toast
      toast({
        title: "Error",
        description: state.message || "Failed to delete course",
        variant: "destructive",
      })
    }
    
    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [state, isOpen, onOpenChange, toast])

  // Handle form submission
  const handleSubmit = async (formData: FormData) => {
    setIsDeleting(true)
    
    try {
      await formAction(formData)
    } catch (error) {
      console.error("Form submission error:", error)
      setIsDeleting(false)
    }
  }

  if (!course) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#faf9f5]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle className="text-[#5e8b7e]">Delete Course</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-[#5e8b7e]/70 mt-3">
            Are you sure you want to delete <span className="font-medium text-[#5e8b7e]">{course.name}</span>? 
            This action cannot be undone and will permanently remove this course from the transcript.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Error display */}
        {state?.message && !state.success && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <form action={handleSubmit}>
          {/* Hidden input for course ID */}
          <input type="hidden" name="courseId" value={course.id} />

          <AlertDialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
              className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7] hover:text-[#5e8b7e]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isDeleting}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Course"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

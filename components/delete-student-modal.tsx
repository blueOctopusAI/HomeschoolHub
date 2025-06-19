'use client'

import { useState } from "react"
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
import { AlertTriangle } from "lucide-react"
import { deleteStudent } from "@/app/students/actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface DeleteStudentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: { id: string; name: string } | null
  onDelete?: () => void
}

export function DeleteStudentModal({ open, onOpenChange, student, onDelete }: DeleteStudentModalProps) {
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  
  if (!student) return null
  
  const expectedText = `I want to delete ${student.name}`
  const canDelete = confirmText === expectedText
  
  const handleDelete = async () => {
    if (!canDelete) return
    
    setIsDeleting(true)
    const formData = new FormData()
    formData.append('studentId', student.id)
    
    try {
      const result = await deleteStudent(formData)
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Student deleted successfully",
          variant: "default",
        })
        
        onOpenChange(false)
        setConfirmText("")
        onDelete?.()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete student",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }
  
  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmText("")
    }
    onOpenChange(newOpen)
  }
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-red-600">Delete Student</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <DialogDescription className="text-base">
            You are about to permanently delete <strong className="text-gray-900">{student.name}</strong>.
          </DialogDescription>
          
          <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-2">
            <p className="text-sm font-medium text-red-900">This action will permanently delete:</p>
            <ul className="text-sm text-red-700 space-y-1 ml-4 list-disc">
              <li>All assignments for this student</li>
              <li>All lesson enrollments</li>
              <li>All logged hours and compliance records</li>
              <li>All transcript entries and courses</li>
              <li>Any other data associated with this student</li>
            </ul>
            <p className="text-sm font-semibold text-red-900 mt-3">This action cannot be undone.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmText" className="text-sm font-medium">
              To confirm deletion, please type: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-red-600">{expectedText}</span>
            </Label>
            <Input
              id="confirmText"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type the confirmation text here"
              className="font-mono"
              autoComplete="off"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isDeleting}
            className="border-gray-300"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
            className={`${
              canDelete 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isDeleting ? "Deleting..." : "Delete Student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
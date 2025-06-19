'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BookOpen, Calendar } from "lucide-react"

interface AddEventChoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChooseAssignment: () => void
  onChooseLesson: () => void
}

export function AddEventChoiceModal({ 
  open, 
  onOpenChange, 
  onChooseAssignment, 
  onChooseLesson 
}: AddEventChoiceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-[#5e8b7e]">Add to Calendar</DialogTitle>
          <DialogDescription>
            What would you like to add to your calendar?
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-6">
          <Button
            variant="outline"
            className="h-32 flex flex-col gap-3 hover:bg-[#5e8b7e]/10 hover:border-[#5e8b7e] transition-all"
            onClick={() => {
              onChooseLesson()
              onOpenChange(false)
            }}
          >
            <Calendar className="h-10 w-10 text-[#5e8b7e]" />
            <div className="text-center">
              <div className="font-semibold text-[#5e8b7e]">Lesson</div>
              <div className="text-xs text-[#5e8b7e]/70 mt-1">
                Schedule a teaching session
              </div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="h-32 flex flex-col gap-3 hover:bg-blue-50 hover:border-blue-500 transition-all"
            onClick={() => {
              onChooseAssignment()
              onOpenChange(false)
            }}
          >
            <BookOpen className="h-10 w-10 text-blue-600" />
            <div className="text-center">
              <div className="font-semibold text-blue-900">Assignment</div>
              <div className="text-xs text-blue-700 mt-1">
                Create homework or project
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createCourse } from "@/app/courses/actions"

interface AddCourseModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  studentIdForCourse: string
}

// Subject categories
const subjectCategories = [
  "Mathematics",
  "Science",
  "English",
  "Social Studies",
  "Foreign Language",
  "Fine Arts",
  "Health & PE",
  "Elective",
  "Technology",
  "Other",
]

// Term options
const termOptions = ["Fall Semester", "Spring Semester", "Full Year"] as const

// Grade options
const gradeOptions = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"]

// Academic year options
const academicYearOptions = ["2022-2023", "2023-2024", "2024-2025", "2025-2026", "2026-2027"]

export function AddCourseModal({ isOpen, onOpenChange, studentIdForCourse }: AddCourseModalProps) {
  // Use server action with useActionState
  const [state, formAction] = useActionState(createCourse, undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Local state for form fields
  const [name, setName] = useState("")
  const [category, setCategory] = useState("Mathematics")
  const [term, setTerm] = useState<(typeof termOptions)[number]>("Full Year")
  const [grade, setGrade] = useState("A")
  const [credits, setCredits] = useState(1.0)
  const [academicYear, setAcademicYear] = useState("2024-2025")

  // Reset form when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      // Reset form for new course
      setName("")
      setCategory("Mathematics")
      setTerm("Full Year")
      setGrade("A")
      setCredits(1.0)
      setAcademicYear("2024-2025")
    }
  }, [isOpen])

  // Close modal on successful submission
  useEffect(() => {
    if (state?.success) {
      onOpenChange(false)
      setIsSubmitting(false)
    }
  }, [state?.success, onOpenChange])

  // Handle form submission
  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      await formAction(formData)
    } finally {
      // If there was an error, we'll still need to enable the button again
      if (!state?.success) {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#faf9f5] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#5e8b7e]">Add New Course</DialogTitle>
          <DialogDescription className="text-[#5e8b7e]/70">
            Enter the details for the course you want to add to the transcript.
          </DialogDescription>
        </DialogHeader>

        {state?.message && (
          <div
            className={`p-3 rounded-md text-sm ${
              state.success ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            }`}
          >
            {state.message}
          </div>
        )}

        <form action={handleSubmit} className="grid gap-4 py-4">
          {/* Hidden input for student ID */}
          <input type="hidden" name="studentId" value={studentIdForCourse} />

          <div className="grid gap-2">
            <Label htmlFor="name" className="text-[#5e8b7e]">
              Course Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Algebra I, Biology, etc."
              className={`border-[#5e8b7e]/20 bg-white focus-visible:ring-[#5e8b7e]/30 ${
                state?.errors?.name ? "border-red-500" : ""
              }`}
            />
            {state?.errors?.name && <p className="text-red-500 text-xs mt-1">{state.errors.name[0]}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category" className="text-[#5e8b7e]">
              Subject Category <span className="text-red-500">*</span>
            </Label>
            <Select name="category" value={category} onValueChange={setCategory}>
              <SelectTrigger
                id="category"
                className={`border-[#5e8b7e]/20 bg-white focus-visible:ring-[#5e8b7e]/30 ${
                  state?.errors?.category ? "border-red-500" : ""
                }`}
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {subjectCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.errors?.category && <p className="text-red-500 text-xs mt-1">{state.errors.category[0]}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="academicYear" className="text-[#5e8b7e]">
              Academic Year
            </Label>
            <Select name="academicYear" value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger
                id="academicYear"
                className={`border-[#5e8b7e]/20 bg-white focus-visible:ring-[#5e8b7e]/30 ${
                  state?.errors?.academicYear ? "border-red-500" : ""
                }`}
              >
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYearOptions.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.errors?.academicYear && (
              <p className="text-red-500 text-xs mt-1">{state.errors.academicYear[0]}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="term" className="text-[#5e8b7e]">
              Term <span className="text-red-500">*</span>
            </Label>
            <Select name="term" value={term} onValueChange={(value) => setTerm(value as (typeof termOptions)[number])}>
              <SelectTrigger
                id="term"
                className={`border-[#5e8b7e]/20 bg-white focus-visible:ring-[#5e8b7e]/30 ${
                  state?.errors?.term ? "border-red-500" : ""
                }`}
              >
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {termOptions.map((termOption) => (
                  <SelectItem key={termOption} value={termOption}>
                    {termOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.errors?.term && <p className="text-red-500 text-xs mt-1">{state.errors.term[0]}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="grade" className="text-[#5e8b7e]">
                Grade <span className="text-red-500">*</span>
              </Label>
              <Select name="grade" value={grade} onValueChange={setGrade}>
                <SelectTrigger
                  id="grade"
                  className={`border-[#5e8b7e]/20 bg-white focus-visible:ring-[#5e8b7e]/30 ${
                    state?.errors?.grade ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map((gradeOption) => (
                    <SelectItem key={gradeOption} value={gradeOption}>
                      {gradeOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state?.errors?.grade && <p className="text-red-500 text-xs mt-1">{state.errors.grade[0]}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="credits" className="text-[#5e8b7e]">
                Credits <span className="text-red-500">*</span>
              </Label>
              <Input
                id="credits"
                name="credits"
                type="number"
                step="0.5"
                min="0"
                max="5"
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                className={`border-[#5e8b7e]/20 bg-white focus-visible:ring-[#5e8b7e]/30 ${
                  state?.errors?.credits ? "border-red-500" : ""
                }`}
              />
              {state?.errors?.credits && <p className="text-red-500 text-xs mt-1">{state.errors.credits[0]}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7] hover:text-[#5e8b7e]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#5e8b7e] hover:bg-[#4a6e63]"
            >
              {isSubmitting ? "Adding..." : "Add Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

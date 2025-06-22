"use client"

import { useState, useEffect, useRef } from "react"
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
import { updateCourse } from "@/app/courses/actions"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface EditCourseModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  course: {
    id: string
    name: string
    category: string
    term: string
    grade: string
    credits: number
    academicYear?: string
  } | null
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

// Term options - matches the database enum values
const termOptions = [
  "Fall Semester", 
  "Spring Semester", 
  "Full Year", 
  "Summer Session", 
  "Quarter 1", 
  "Quarter 2", 
  "Quarter 3", 
  "Quarter 4"
] as const

// Grade options - matches the database enum values
const gradeOptions = [
  "A+", "A", "A-", 
  "B+", "B", "B-", 
  "C+", "C", "C-", 
  "D+", "D", "D-", 
  "F", "Pass", "Fail", 
  "In Progress", "Not Graded", 
  "Exempt", "Audit"
]

// Academic year options
const academicYearOptions = ["2022-2023", "2023-2024", "2024-2025", "2025-2026", "2026-2027"]

export function EditCourseModal({ isOpen, onOpenChange, course }: EditCourseModalProps) {
  // Use server action with useActionState
  const [state, formAction] = useActionState(updateCourse, undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const hasShownSuccessToast = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Local state for form fields
  const [name, setName] = useState("")
  const [category, setCategory] = useState("Mathematics")
  const [term, setTerm] = useState<(typeof termOptions)[number]>("Full Year")
  const [grade, setGrade] = useState("A")
  const [credits, setCredits] = useState(1.0)
  const [academicYear, setAcademicYear] = useState("2024-2025")

  // Reset form when modal is opened with a course
  useEffect(() => {
    if (isOpen && course) {
      setName(course.name)
      setCategory(course.category)
      setTerm(course.term as (typeof termOptions)[number])
      setGrade(course.grade)
      setCredits(course.credits)
      setAcademicYear(course.academicYear || "2024-2025")
      setIsSubmitting(false)
      hasShownSuccessToast.current = false
    }
  }, [isOpen, course])

  // Close modal on successful submission and show toast
  useEffect(() => {
    if (!state || !isOpen) return
    
    let timeoutId: NodeJS.Timeout | null = null
    
    if (state.success && !hasShownSuccessToast.current) {
      hasShownSuccessToast.current = true
      
      // Show success toast
      toast({
        title: "Success",
        description: state.message || "Course updated successfully",
        variant: "default",
      })
      
      // Reset form if we have a ref
      if (formRef.current) {
        formRef.current.reset()
      }
      
      // Close modal after a short delay
      timeoutId = setTimeout(() => {
        setIsSubmitting(false)
        onOpenChange(false)
      }, 150)
    } else if (!state.success) {
      // If there was an error, stop submitting
      setIsSubmitting(false)
      
      // Show error toast for general errors (not field-specific)
      if (state.message && !Object.keys(state.errors || {}).length) {
        toast({
          title: "Error",
          description: state.message,
          variant: "destructive",
        })
      }
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
    setIsSubmitting(true)
    
    try {
      await formAction(formData)
    } catch (error) {
      console.error("Form submission error:", error)
      setIsSubmitting(false)
    }
  }

  if (!course) return null

  // Check if there are any field errors
  const hasFieldErrors = state?.errors && Object.keys(state.errors).length > 0

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#faf9f5] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#5e8b7e]">Edit Course</DialogTitle>
          <DialogDescription className="text-[#5e8b7e]/70">
            Update the details for {course.name}
          </DialogDescription>
        </DialogHeader>

        {/* Enhanced error display */}
        {state?.message && (
          <Alert variant={state.success ? "default" : "destructive"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {state.message}
              {hasFieldErrors && (
                <div className="mt-2 text-xs">
                  <strong>Field errors:</strong>
                  <ul className="list-disc pl-5 mt-1">
                    {Object.entries(state.errors || {}).map(([field, errors]) => (
                      <li key={field}>
                        <strong>{field}:</strong> {Array.isArray(errors) ? errors.join(', ') : String(errors)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <form action={handleSubmit} className="grid gap-4 py-4" ref={formRef}>
          {/* Hidden input for course ID */}
          <input type="hidden" name="courseId" value={course.id} />

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
            {state?.errors?.name && <p className="text-red-500 text-xs mt-1">{Array.isArray(state.errors.name) ? state.errors.name[0] : state.errors.name}</p>}
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
            {state?.errors?.category && <p className="text-red-500 text-xs mt-1">{Array.isArray(state.errors.category) ? state.errors.category[0] : state.errors.category}</p>}
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
              <p className="text-red-500 text-xs mt-1">{Array.isArray(state.errors.academicYear) ? state.errors.academicYear[0] : state.errors.academicYear}</p>
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
            {state?.errors?.term && <p className="text-red-500 text-xs mt-1">{Array.isArray(state.errors.term) ? state.errors.term[0] : state.errors.term}</p>}
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
              {state?.errors?.grade && <p className="text-red-500 text-xs mt-1">{Array.isArray(state.errors.grade) ? state.errors.grade[0] : state.errors.grade}</p>}
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
              {state?.errors?.credits && <p className="text-red-500 text-xs mt-1">{Array.isArray(state.errors.credits) ? state.errors.credits[0] : state.errors.credits}</p>}
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
              {isSubmitting ? "Updating..." : "Update Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

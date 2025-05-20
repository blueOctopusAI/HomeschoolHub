"use client"

import type React from "react"

import { useState, useEffect } from "react"
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

interface AddCourseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (course: any) => void
  editingCourse: any | null
  students: any[]
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

export function AddCourseModal({ open, onOpenChange, onSave, editingCourse, students }: AddCourseModalProps) {
  const [course, setCourse] = useState<any>({
    name: "",
    category: "Mathematics",
    term: "Full Year",
    grade: "A",
    credits: 1.0,
    studentId: "",
    academicYear: "2024-2025", // Default to current academic year
  })

  // Update form when editing an existing course
  useEffect(() => {
    if (editingCourse) {
      setCourse({
        name: editingCourse.name || "",
        category: editingCourse.category || "Mathematics",
        term: editingCourse.term || "Full Year",
        grade: editingCourse.grade || "A",
        credits: editingCourse.credits || 1.0,
        studentId: editingCourse.studentId || "",
        academicYear: editingCourse.academicYear || "2024-2025",
      })
    } else if (open) {
      // Reset form for new course
      setCourse({
        name: "",
        category: "Mathematics",
        term: "Full Year",
        grade: "A",
        credits: 1.0,
        studentId: students.find((s) => s.id !== "all")?.id || "",
        academicYear: "2024-2025",
      })
    }
  }, [editingCourse, open, students])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCourse((prev: any) => ({
      ...prev,
      [name]: name === "credits" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setCourse((prev: any) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = () => {
    // Validate form
    if (!course.name.trim()) {
      alert("Please enter a course name")
      return
    }

    if (!course.studentId) {
      alert("Please select a student")
      return
    }

    // Save the course
    onSave(course)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#faf9f5] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#5e8b7e]">{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
          <DialogDescription className="text-[#5e8b7e]/70">
            {editingCourse
              ? "Update the course information below."
              : "Enter the details for the course you want to add to the transcript."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-[#5e8b7e]">
              Course Name
            </Label>
            <Input
              id="name"
              name="name"
              value={course.name}
              onChange={handleInputChange}
              placeholder="e.g., Algebra I, Biology, etc."
              className="border-[#5e8b7e]/20 bg-white focus-visible:ring-[#5e8b7e]/30"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category" className="text-[#5e8b7e]">
              Subject Category
            </Label>
            <Select value={course.category} onValueChange={(value) => handleSelectChange("category", value)}>
              <SelectTrigger id="category" className="border-[#5e8b7e]/20 bg-white focus-visible:ring-[#5e8b7e]/30">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {subjectCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="academicYear" className="text-[#5e8b7e]">
              Academic Year
            </Label>
            <Select value={course.academicYear} onValueChange={(value) => handleSelectChange("academicYear", value)}>
              <SelectTrigger id="academicYear" className="border-[#5e8b7e]/20 bg-white focus-visible:ring-[#5e8b7e]/30">
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
          </div>

          <div className="grid gap-2">
            <Label htmlFor="term" className="text-[#5e8b7e]">
              Term
            </Label>
            <Select
              value={course.term}
              onValueChange={(value) => handleSelectChange("term", value as (typeof termOptions)[number])}
            >
              <SelectTrigger id="term" className="border-[#5e8b7e]/20 bg-white focus-visible:ring-[#5e8b7e]/30">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {termOptions.map((term) => (
                  <SelectItem key={term} value={term}>
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="grade" className="text-[#5e8b7e]">
                Grade
              </Label>
              <Select value={course.grade} onValueChange={(value) => handleSelectChange("grade", value)}>
                <SelectTrigger id="grade" className="border-[#5e8b7e]/20 bg-white focus-visible:ring-[#5e8b7e]/30">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="credits" className="text-[#5e8b7e]">
                Credits
              </Label>
              <Input
                id="credits"
                name="credits"
                type="number"
                step="0.5"
                min="0"
                max="5"
                value={course.credits}
                onChange={handleInputChange}
                className="border-[#5e8b7e]/20 bg-white focus-visible:ring-[#5e8b7e]/30"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="studentId" className="text-[#5e8b7e]">
              Student
            </Label>
            <Select value={course.studentId} onValueChange={(value) => handleSelectChange("studentId", value)}>
              <SelectTrigger id="studentId" className="border-[#5e8b7e]/20 bg-white focus-visible:ring-[#5e8b7e]/30">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students
                  .filter((student) => student.id !== "all")
                  .map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7] hover:text-[#5e8b7e]"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-[#5e8b7e] hover:bg-[#4a6e63]">
            {editingCourse ? "Update Course" : "Add Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

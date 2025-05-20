"use client"

import { useMemo } from "react"
import { useStore, type Student } from "@/lib/store"

export function PortfolioBuilderView() {
  // Get selectedStudent ID from Zustand store
  const selectedStudentId = useStore((state) => state.selectedStudent)
  
  // Get all students from the store
  const students = useStore((state) => state.students)
  
  // Find the selected student object using the ID
  const student = useMemo(() => 
    selectedStudentId !== "all" 
      ? students.find(s => s.id === selectedStudentId) 
      : null
  , [students, selectedStudentId])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-[#5e8b7e] mb-6">Portfolio Builder</h1>

      {student ? (
        <div className="bg-white rounded-md shadow-sm p-4">
          <p className="text-gray-600">Portfolio builder for {student.name}</p>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow-sm p-4">
          <p className="text-gray-600">Please select a student to build a portfolio</p>
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { useStore, type Student } from "@/lib/store"

interface ComplianceViewProps {
  userStudents: Student[]
}

export function ComplianceView({ userStudents }: ComplianceViewProps) {
  // Get selectedStudent ID and setter from Zustand store
  const selectedStudentId = useStore((state) => state.selectedStudent)
  const setStudents = useStore((state) => state.setStudents)
  
  // Update the store's students with the ones from the database
  useEffect(() => {
    if (userStudents && userStudents.length > 0) {
      // Add the "All Students" option if it doesn't exist in userStudents
      const allStudentsIncluded = userStudents.some(s => s.id === "all")
      const updatedStudents = allStudentsIncluded 
        ? userStudents 
        : [{ id: "all", name: "All Students" }, ...userStudents]
      
      // Update the store with the database students
      setStudents(updatedStudents)
    }
  }, [userStudents, setStudents])
  
  // Find the selected student from userStudents
  const selectedStudent = userStudents?.find(s => s.id === selectedStudentId)

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-[#5e8b7e] mb-6">Compliance Tracker</h1>

      {selectedStudentId !== "all" && selectedStudent ? (
        <div className="bg-white rounded-md shadow-sm p-4">
          <p className="text-gray-600">Compliance Tracker for {selectedStudent.name}</p>
          {/* Additional content will be added here in future updates */}
          
          <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-md">
            <p className="text-gray-500">This is a placeholder for the compliance tracking content. In the future, this will include:</p>
            <ul className="mt-2 list-disc list-inside text-gray-500">
              <li>State requirements tracking</li>
              <li>Attendance records</li>
              <li>Required subject completion</li>
              <li>Compliance report generation</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow-sm p-4">
          <p className="text-gray-600">Please select a student to track compliance</p>
        </div>
      )}
    </div>
  )
}
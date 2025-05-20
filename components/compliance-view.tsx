"use client"

import { useAppContext } from "@/lib/context"

export function ComplianceView() {
  const { selectedStudent } = useAppContext()
  const student = selectedStudent ? { name: "Student" } : null

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-[#5e8b7e] mb-6">Compliance Tracker</h1>

      {student ? (
        <div className="bg-white rounded-md shadow-sm p-4">
          <p className="text-gray-600">Compliance tracker for {student.name}</p>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow-sm p-4">
          <p className="text-gray-600">Please select a student to track compliance</p>
        </div>
      )}
    </div>
  )
}

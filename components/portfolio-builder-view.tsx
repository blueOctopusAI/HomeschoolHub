"use client"

import { useEffect } from "react"
import { useStore, type Student } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { User } from "lucide-react"

interface PortfolioBuilderViewProps {
  userStudents: Student[]
}

export function PortfolioBuilderView({ userStudents }: PortfolioBuilderViewProps) {
  // Get selectedStudent ID and setter from Zustand store
  const selectedStudentId = useStore((state) => state.selectedStudent)
  const setSelectedStudent = useStore((state) => state.setSelectedStudent)
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
  
  // Filter out the "all" student for the student selection cards
  const individualStudents = userStudents?.filter(student => student.id !== "all") || []

  // Handle student card click
  const handleStudentCardClick = (studentId: string) => {
    setSelectedStudent(studentId)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-[#5e8b7e] mb-6">Portfolio Builder</h1>

      {selectedStudentId !== "all" && selectedStudent ? (
        <div className="bg-white rounded-md shadow-sm p-4">
          <p className="text-gray-600 mb-4">Portfolio Builder for {selectedStudent.name}</p>
          
          <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-md">
            <p className="text-gray-500">This is a placeholder for the portfolio builder content. In the future, this will include:</p>
            <ul className="mt-2 list-disc list-inside text-gray-500">
              <li>Uploaded work samples</li>
              <li>Achievement tracking</li>
              <li>Progress visualization</li>
              <li>Portfolio export options</li>
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-white rounded-md shadow-sm p-4 mb-6">
            <p className="text-gray-600 mb-4">Select a student to build their portfolio</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {individualStudents.map(student => (
              <Card 
                key={student.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleStudentCardClick(student.id)}
              >
                <CardContent className="p-6 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-[#5e8b7e]/10 flex items-center justify-center mb-4">
                    {student.profileImage ? (
                      <img 
                        src={student.profileImage} 
                        alt={student.name} 
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#5e8b7e]/20 flex items-center justify-center text-[#5e8b7e] text-xl font-semibold">
                        {student.initials || student.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-[#5e8b7e] text-center">{student.name}</h3>
                  {student.gradeLevel && (
                    <p className="text-sm text-gray-500 mt-1">{student.gradeLevel}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
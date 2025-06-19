"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, UserPlus, GraduationCap, User, ExternalLink } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreateStudentModal } from "./create-student-modal"
import { UpdateStudentModal } from "./update-student-modal"
import { DeleteStudentModal } from "./delete-student-modal"
import { type Student } from "@/lib/store"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface StudentsViewProps {
  initialStudents: Student[]
}

export function StudentsView({ initialStudents }: StudentsViewProps) {
  const router = useRouter()
  const [students, setStudents] = useState(initialStudents)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Function to refresh students list
  const refreshStudents = () => {
    router.refresh()
    // Force a hard refresh to ensure data is updated
    window.location.reload()
  }

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.gradeLevel && student.gradeLevel.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Handle edit student
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student)
    setIsUpdateModalOpen(true)
  }
  
  // Handle delete student
  const handleDeleteStudent = (student: Student) => {
    setDeletingStudent(student)
    setIsDeleteModalOpen(true)
  }
  
  // Handle successful deletion
  const handleDeleteSuccess = () => {
    refreshStudents()
  }
  
  // Handle successful creation
  const handleCreateSuccess = () => {
    refreshStudents()
  }
  
  // Handle successful update
  const handleUpdateSuccess = () => {
    refreshStudents()
  }

  // Get initials or first letter
  const getInitials = (student: Student) => {
    return student.initials || student.name.charAt(0).toUpperCase()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#5e8b7e]">Students</h1>
          <p className="text-[#5e8b7e]/70">
            Manage your homeschool students
          </p>
        </div>

        <Button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="bg-[#5e8b7e] hover:bg-[#4a6e63]"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      <Card className="bg-white rounded-md shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-[#5e8b7e]">Student List</CardTitle>

            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5e8b7e]/50" />
              <Input
                placeholder="Search by name or grade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 border-[#5e8b7e]/20"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Grade Level</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Portal</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow 
                      key={student.id}
                      className="cursor-pointer hover:bg-[#5e8b7e]/5 transition-colors"
                      onClick={(e) => {
                        // Don't navigate if clicking on buttons or links
                        const target = e.target as HTMLElement
                        if (target.closest('button') || target.closest('a')) {
                          return
                        }
                        router.push(`/student/${student.id}`)
                      }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#5e8b7e]/10 text-[#5e8b7e] text-sm font-medium">
                            {getInitials(student)}
                          </div>
                          <span className="text-[#5e8b7e]">{student.name}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {student.gradeLevel ? (
                          <Badge className="bg-[#e2f0e6] text-[#5e8b7e] rounded-full">
                            <GraduationCap className="mr-1 h-3 w-3" />
                            {student.gradeLevel}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </TableCell>

                      <TableCell className="max-w-[300px]">
                        <span className="text-sm text-gray-600 truncate block">
                          {student.notes || "No notes"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Link 
                          href={`/student/${student.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-[#5e8b7e] hover:text-[#4a6e63] text-sm"
                        >
                          <ExternalLink className="mr-1 h-4 w-4" />
                          View Portal
                        </Link>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStudent(student)}
                            className="h-8 w-8 p-0 text-[#5e8b7e]"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStudent(student)}
                            className="h-8 w-8 p-0 text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-[#5e8b7e] mb-4">
                <User className="h-16 w-16 mx-auto opacity-60" />
                <h3 className="mt-3 text-xl font-medium">
                  {searchQuery ? "No students match your search" : "No students yet!"}
                </h3>
              </div>
              <p className="text-[#5e8b7e]/70 max-w-md mb-6">
                {searchQuery 
                  ? "Try adjusting your search to find students."
                  : "Get started by adding your first student to begin organizing your homeschool."}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {searchQuery && (
                  <Button
                    variant="outline"
                    className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e2f0e6]"
                    onClick={() => setSearchQuery("")}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Clear Search
                  </Button>
                )}
                {!searchQuery && (
                  <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-[#5e8b7e] hover:bg-[#4a6e63] text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Student
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateStudentModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      <UpdateStudentModal
        open={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
        student={editingStudent}
        onSuccess={handleUpdateSuccess}
      />
      
      <DeleteStudentModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        student={deletingStudent}
        onDelete={handleDeleteSuccess}
      />
    </div>
  )
}
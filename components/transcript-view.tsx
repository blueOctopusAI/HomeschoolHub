"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, FileDown, Filter, Plus, RefreshCcw, ScrollText, Edit2, Trash2 } from "lucide-react"
import { useStore, type Course, type Student } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AddCourseModal } from "@/components/add-course-modal"
import { EditCourseModal } from "@/components/edit-course-modal"
import { DeleteCourseDialog } from "@/components/delete-course-dialog"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

// GPA calculation helper
const gradeToPoints = (grade: string): number => {
  const gradeMap: Record<string, number> = {
    "A+": 4.0,
    A: 4.0,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    "D+": 1.3,
    D: 1.0,
    "D-": 0.7,
    F: 0.0,
  }

  return gradeMap[grade] || 0
}

export function TranscriptView() {
  // Use direct selectors from useStore instead of helper hooks for consistency
  const students = useStore((state) => state.students)
  const selectedStudentId = useStore((state) => state.selectedStudent)
  const [yearFilter, setYearFilter] = useState<string>("all")
  
  // State for controlling the AddCourseModal
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false)
  
  // State for controlling the EditCourseModal
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false)
  const [courseToEdit, setCourseToEdit] = useState<any>(null)
  
  // State for controlling the DeleteCourseDialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<any>(null)
  
  // State for courses fetched from Supabase
  const [databaseCourses, setDatabaseCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null)
  
  // State for real student data from database
  const [databaseStudents, setDatabaseStudents] = useState<any[]>([])
  const [databaseStudentId, setDatabaseStudentId] = useState<string>("")

  // Get the selected student from the store
  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || null
  }, [students, selectedStudentId])
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [refreshTimeout])

  // Fetch real students from database
  useEffect(() => {
    const fetchDatabaseStudents = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        const { data: students, error } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error("Error fetching database students:", error);
          return;
        }

        setDatabaseStudents(students || []);
        
        // If we have a selected student, find their database ID
        if (selectedStudent && students && students.length > 0) {
          // Try to match by name or use the first student if no match
          const matchedStudent = students.find(s => 
            s.name.toLowerCase() === selectedStudent.name.toLowerCase()
          ) || students[0];
          
          if (matchedStudent) {
            setDatabaseStudentId(matchedStudent.id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch database students:", error);
      }
    };

    fetchDatabaseStudents();
  }, [selectedStudent]);

  // Fetch courses from Supabase when the database student ID changes or after adding a new course
  useEffect(() => {
    if (selectedStudentId === "all" || !databaseStudentId) {
      setDatabaseCourses([]);
      return;
    }

    let isSubscribed = true;

    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: courses, error } = await supabase
          .from('courses')
          .select('*')
          .eq('student_id', databaseStudentId);

        if (error) {
          console.error("Error fetching courses:", error);
          return;
        }

        if (isSubscribed) {
          setDatabaseCourses(courses || []);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    fetchCourses();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isSubscribed = false;
    };
  }, [databaseStudentId, refreshKey, selectedStudentId]);

  // Convert database courses to the format expected by the UI
  const transformedCourses = useMemo(() => {
    return databaseCourses.map(dbCourse => ({
      id: dbCourse.id,
      name: dbCourse.name,
      category: dbCourse.category,
      term: dbCourse.term,
      grade: dbCourse.grade,
      credits: dbCourse.credits,
      studentId: dbCourse.student_id,
      academicYear: dbCourse.academic_year || "2024-2025"
    }));
  }, [databaseCourses]);
  
  // Use the transformed courses instead of the ones from the store
  const studentCourses = transformedCourses;

  // Helper function to trigger refresh with debouncing
  const triggerRefresh = () => {
    // Clear any existing timeout
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    
    // Set a new timeout for refresh
    const timeout = setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      setRefreshTimeout(null);
    }, 500);
    
    setRefreshTimeout(timeout);
  };
  
  // Force a refresh of courses after modal closes
  const handleModalOpenChange = (open: boolean) => {
    setIsAddCourseModalOpen(open);
    if (!open && !isLoading) {
      triggerRefresh();
    }
  };
  
  // Handle edit modal close
  const handleEditModalOpenChange = (open: boolean) => {
    setIsEditCourseModalOpen(open);
    if (!open) {
      setCourseToEdit(null);
      if (!isLoading) {
        triggerRefresh();
      }
    }
  };
  
  // Handle delete dialog close
  const handleDeleteDialogOpenChange = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setCourseToDelete(null);
      if (!isLoading) {
        triggerRefresh();
      }
    }
  };
  
  // Handle edit course
  const handleEditCourse = (course: any) => {
    setCourseToEdit(course);
    setIsEditCourseModalOpen(true);
  };
  
  // Handle delete course
  const handleDeleteCourse = (course: any) => {
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  };

  // Manual refresh button handler
  const handleRefresh = () => {
    if (!isLoading) {
      triggerRefresh();
    }
  };

  // Group courses by academic year
  const coursesByYear = useMemo(() => {
    const grouped: Record<string, typeof studentCourses> = {}

    studentCourses.forEach((course) => {
      const year = course.academicYear || "2024-2025" // Default to current year if not specified
      if (!grouped[year]) {
        grouped[year] = []
      }
      grouped[year].push(course)
    })

    return grouped
  }, [studentCourses])

  // Calculate GPA and credits by year
  const yearlyStats = useMemo(() => {
    const stats: Record<string, { gpa: number; credits: number }> = {}

    Object.entries(coursesByYear).forEach(([year, yearCourses]) => {
      let totalPoints = 0
      let totalCredits = 0

      yearCourses.forEach((course) => {
        const points = gradeToPoints(course.grade)
        totalPoints += points * course.credits
        totalCredits += course.credits
      })

      stats[year] = {
        gpa: totalCredits > 0 ? totalPoints / totalCredits : 0,
        credits: totalCredits,
      }
    })

    return stats
  }, [coursesByYear])

  // Calculate cumulative GPA and total credits
  const cumulativeStats = useMemo(() => {
    let totalPoints = 0
    let totalCredits = 0

    studentCourses.forEach((course) => {
      const points = gradeToPoints(course.grade)
      totalPoints += points * course.credits
      totalCredits += course.credits
    })

    return {
      gpa: totalCredits > 0 ? totalPoints / totalCredits : 0,
      credits: totalCredits,
    }
  }, [studentCourses])

  // Get years for filter
  const academicYears = useMemo(() => {
    return Object.keys(coursesByYear).sort().reverse()
  }, [coursesByYear])

  // Filter courses by selected year
  const filteredCoursesByYear = useMemo(() => {
    if (yearFilter === "all") return coursesByYear
    return { [yearFilter]: coursesByYear[yearFilter] || [] }
  }, [coursesByYear, yearFilter])

  // Handle print functionality
  const handlePrint = () => {
    window.print()
  }

  // Handle PDF export
  const handleExportPDF = () => {
    alert("PDF export functionality would be implemented here")
  }

  if (selectedStudentId === "all") {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[#5e8b7e] mb-6">Academic Transcript</h1>
        
        <div className="bg-white rounded-md shadow-sm p-4 mb-6">
          <p className="text-gray-600 mb-4">Select a student to view their transcript</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {students
            .filter(student => student.id !== "all")
            .map(student => (
              <Card 
                key={student.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => useStore.getState().setSelectedStudent(student.id)}
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
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#5e8b7e]">Academic Transcript</h1>
          <p className="text-[#5e8b7e]/70">
            {selectedStudent?.name} • {selectedStudent?.gradeLevel}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddCourseModalOpen(true)}
            className="bg-[#5e8b7e] text-white hover:bg-[#4a6e63] border-[#5e8b7e]"
            disabled={!databaseStudentId}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Course
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7]"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-[#5e8b7e]">Academic Year:</span>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[180px] border-[#5e8b7e]/20 bg-white">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {academicYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7]"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7]"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Show message if no database student is found */}
      {!databaseStudentId && selectedStudent && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">
            No database record found for {selectedStudent.name}. Please create a student record in the database first.
          </p>
        </div>
      )}

      {/* Render the AddCourseModal with the correct database ID */}
      <AddCourseModal 
        isOpen={isAddCourseModalOpen} 
        onOpenChange={handleModalOpenChange} 
        studentIdForCourse={databaseStudentId} 
      />
      
      {/* Render the EditCourseModal */}
      <EditCourseModal
        isOpen={isEditCourseModalOpen}
        onOpenChange={handleEditModalOpenChange}
        course={courseToEdit}
      />
      
      {/* Render the DeleteCourseDialog */}
      <DeleteCourseDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
        course={courseToDelete}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <Card className="bg-white rounded-md shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-[#5e8b7e]/70">Loading courses...</p>
              </CardContent>
            </Card>
          ) : Object.keys(filteredCoursesByYear).length > 0 ? (
            Object.entries(filteredCoursesByYear)
              .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
              .map(([year, yearCourses]) => (
                <Card key={year} className="bg-white rounded-md shadow-sm overflow-hidden">
                  <CardHeader className="bg-[#e9f1e7] py-3 px-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-[#5e8b7e] text-lg">{year} Academic Year</CardTitle>
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="text-[#5e8b7e]/70">GPA: </span>
                          <span className="font-medium text-[#5e8b7e]">
                            {yearlyStats[year]?.gpa.toFixed(2) || "0.00"}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-[#5e8b7e]/70">Credits: </span>
                          <span className="font-medium text-[#5e8b7e]">
                            {yearlyStats[year]?.credits.toFixed(1) || "0.0"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#5e8b7e]/10">
                            <th className="text-left py-3 px-4 font-medium text-[#5e8b7e]">Course Name</th>
                            <th className="text-left py-3 px-4 font-medium text-[#5e8b7e]">Subject</th>
                            <th className="text-left py-3 px-4 font-medium text-[#5e8b7e]">Grade</th>
                            <th className="text-left py-3 px-4 font-medium text-[#5e8b7e]">Credits</th>
                            <th className="text-left py-3 px-4 font-medium text-[#5e8b7e]">Term</th>
                            <th className="text-left py-3 px-4 font-medium text-[#5e8b7e]">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {yearCourses.length > 0 ? (
                            yearCourses.map((course) => (
                              <tr key={course.id} className="border-b border-[#5e8b7e]/10 hover:bg-[#e9f1e7]/10">
                                <td className="py-3 px-4">{course.name}</td>
                                <td className="py-3 px-4">{course.category}</td>
                                <td className="py-3 px-4">
                                  <Badge
                                    className={`font-medium ${
                                      course.grade.startsWith("A")
                                        ? "bg-green-100 text-green-800"
                                        : course.grade.startsWith("B")
                                          ? "bg-blue-100 text-blue-800"
                                          : course.grade.startsWith("C")
                                            ? "bg-yellow-100 text-yellow-800"
                                            : course.grade.startsWith("D")
                                              ? "bg-orange-100 text-orange-800"
                                              : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {course.grade}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">{typeof course.credits === 'number' ? course.credits.toFixed(1) : course.credits}</td>
                                <td className="py-3 px-4">{course.term}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditCourse(course)}
                                      className="h-8 w-8 p-0 hover:bg-[#e9f1e7] text-[#5e8b7e]"
                                      title="Edit course"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteCourse(course)}
                                      className="h-8 w-8 p-0 hover:bg-red-50 text-red-600"
                                      title="Delete course"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-[#5e8b7e]/60 italic">
                                No courses found for this academic year.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : (
            <Card className="bg-white rounded-md shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center">
                  <ScrollText className="h-16 w-16 text-[#5e8b7e]/30 mb-4" />
                  <h3 className="text-xl font-medium text-[#5e8b7e] mb-2">No courses recorded yet</h3>
                  <p className="text-[#5e8b7e]/70 mb-6 max-w-md">
                    {databaseStudentId 
                      ? "Add courses to build a complete academic transcript."
                      : "Please ensure a student record exists in the database first."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="bg-white rounded-md shadow-sm sticky top-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#5e8b7e] text-lg">Transcript Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-[#5e8b7e] mb-2">Student Information</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-[#5e8b7e]/70">Name:</span> {selectedStudent?.name}
                    </p>
                    <p>
                      <span className="text-[#5e8b7e]/70">Grade Level:</span> {selectedStudent?.gradeLevel}
                    </p>
                    {databaseStudentId && (
                      <p className="text-xs break-all">
                        <span className="text-[#5e8b7e]/70">Database ID:</span> {databaseStudentId}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[#5e8b7e] mb-2">Academic Summary</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-[#5e8b7e]/70">Total Courses:</span> {studentCourses.length}
                    </p>
                    <p>
                      <span className="text-[#5e8b7e]/70">Total Credits:</span> {cumulativeStats.credits.toFixed(1)}
                    </p>
                    <p>
                      <span className="text-[#5e8b7e]/70">Cumulative GPA:</span> {cumulativeStats.gpa.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[#5e8b7e] mb-2">GPA by Year</h3>
                  <div className="space-y-2">
                    {Object.entries(yearlyStats)
                      .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
                      .map(([year, stats]) => (
                        <div key={year} className="flex justify-between items-center text-sm">
                          <span className="text-[#5e8b7e]/70">{year}:</span>
                          <span className="font-medium text-[#5e8b7e]">{stats.gpa.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#5e8b7e]/10">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#5e8b7e]">Cumulative GPA:</span>
                    <span className="font-bold text-lg text-[#5e8b7e]">{cumulativeStats.gpa.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

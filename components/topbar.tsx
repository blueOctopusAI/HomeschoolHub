"use client"

import { format, startOfWeek, addDays } from "date-fns"
import { ChevronLeft, ChevronRight, Upload, LogOut, User, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from "@/lib/store"
import { signOut } from "@/app/auth/actions"
import Link from "next/link"

export function Topbar() {
  // Get state and actions from Zustand store
  const students = useStore((state) => state.students)
  const selectedStudent = useStore((state) => state.selectedStudent)
  const currentDate = useStore((state) => state.currentDate)
  const setSelectedStudent = useStore((state) => state.setSelectedStudent)
  const setCurrentDate = useStore((state) => state.setCurrentDate)
  const importLessons = useStore((state) => state.importLessons)
  
  // Simplified handlers

  const handleStudentChange = (value: string) => {
    if (value !== selectedStudent) {
      setSelectedStudent(value)
    }
  }

  const handleImport = () => {
    // Use the importLessons action from the Zustand store
    importLessons()
    // Show an alert for UI feedback (this would be replaced with proper UI in a real implementation)
    alert("Import functionality would be implemented here")
  }

  // Format date range for display
  const dateRange = (() => {
    // Use date-fns startOfWeek to correctly calculate Monday
    const mondayOfWeek = startOfWeek(currentDate, { weekStartsOn: 1 })
    const fridayOfWeek = addDays(mondayOfWeek, 4)

    return `${format(mondayOfWeek, "MMM d")} - ${format(fridayOfWeek, "MMM d, yyyy")}`
  })()

  // Mobile date range - shorter format
  const mobileDateRange = (() => {
    const mondayOfWeek = startOfWeek(currentDate, { weekStartsOn: 1 })
    return format(mondayOfWeek, "MMM d")
  })()

  // Handle previous week navigation
  const handlePreviousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  // Handle next week navigation
  const handleNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  return (
    <div className="h-16 border-b border-[#5e8b7e]/20 bg-[#faf9f5] no-print">
      <div className="h-full flex items-center justify-between px-4 md:px-6">
        {/* Date Navigation - Adjusted for mobile */}
        <div className="flex items-center space-x-1 md:space-x-2 ml-14 md:ml-0">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7]"
            onClick={handlePreviousWeek}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous week</span>
          </Button>

          <Button variant="outline" className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7] text-xs md:text-sm px-2 md:px-4 cursor-default" disabled>
            <span className="md:hidden">{mobileDateRange}</span>
            <span className="hidden md:inline">{dateRange}</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7]"
            onClick={handleNextWeek}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next week</span>
          </Button>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Hide some buttons on mobile */}
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7]"
            onClick={handleImport}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Lessons
          </Button>

          <Select value={selectedStudent} onValueChange={handleStudentChange}>
            <SelectTrigger className="w-[120px] md:w-[160px] border-[#5e8b7e] text-slate-800 bg-white font-medium text-sm">
              <SelectValue placeholder="Select student" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              {students
                .filter((s) => s.id !== "all")
                .map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedStudent !== "all" && (
            <Link href={`/student/${selectedStudent}`} passHref target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="hidden md:flex border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7]">
                <ExternalLink className="h-4 w-4 mr-2" />
                Student Portal
              </Button>
            </Link>
          )}
          
          {/* Profile Button - Hidden on mobile */}
          <Link href="/profile" className="hidden md:block">  
            <Button
              variant="ghost"
              size="sm"
              className="text-[#5e8b7e] hover:bg-[#e9f1e7] hover:text-[#5e8b7e]"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </Link>
          
          {/* Logout Button - Icon only on mobile */}
          <form action={signOut}>
            <Button 
              type="submit" 
              variant="ghost" 
              size="sm" 
              className="text-[#5e8b7e] hover:bg-[#e9f1e7] hover:text-[#5e8b7e]"
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

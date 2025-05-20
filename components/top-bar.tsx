"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore, useStudents, useSelectedStudent, useCurrentDate } from "@/lib/store"

export function TopBar() {
  // Use store selectors for better performance
  const students = useStudents()
  const selectedStudent = useSelectedStudent()
  const currentDate = useCurrentDate()

  // Get actions from the store
  const { setCurrentDate, setSelectedStudent, importLessons } = useStore((state) => ({
    setCurrentDate: state.setCurrentDate,
    setSelectedStudent: state.setSelectedStudent,
    importLessons: state.importLessons,
  }))

  const [date, setDate] = useState<Date>(currentDate)

  // Handle date change
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate)
      setCurrentDate(selectedDate)
    }
  }

  // Handle student change
  const handleStudentChange = (value: string) => {
    setSelectedStudent(value)
  }

  // Handle import
  const handleImport = () => {
    // In a real app, this would open a file dialog
    alert("Import functionality would be implemented here")
  }

  // Format date range for display
  const formatDateRange = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1) // Start from Monday

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 4) // End on Friday (5 days later)

    return `${format(startOfWeek, "MMM d")} - ${format(endOfWeek, "MMM d, yyyy")}`
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#5e8b7e]/10 bg-[#faf9f5]">
      {/* Date Navigation */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-[#5e8b7e]/30 text-slate-800 hover:bg-[#e6f0ec] hover:text-[#5e8b7e]"
          onClick={() => {
            const newDate = new Date(date)
            newDate.setDate(date.getDate() - 7)
            handleDateSelect(newDate)
          }}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous week</span>
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="border-[#5e8b7e]/30 text-slate-800 font-medium hover:bg-[#e6f0ec] hover:text-[#5e8b7e]"
            >
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-[#5e8b7e]/20 rounded-md shadow-sm" align="start">
            <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-[#5e8b7e]/30 text-slate-800 hover:bg-[#e6f0ec] hover:text-[#5e8b7e]"
          onClick={() => {
            const newDate = new Date(date)
            newDate.setDate(date.getDate() + 7)
            handleDateSelect(newDate)
          }}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next week</span>
        </Button>
      </div>

      {/* Right side controls */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleImport}
          className="border-[#5e8b7e]/30 text-slate-800 text-sm hover:bg-[#e6f0ec] hover:text-[#5e8b7e] font-medium"
        >
          <Upload className="h-4 w-4 mr-1" />
          Import Lessons
        </Button>

        {/* Student Selector */}
        <Select value={selectedStudent} onValueChange={handleStudentChange}>
          <SelectTrigger className="w-[160px] border-[#5e8b7e]/30 text-slate-800 bg-white font-medium">
            <SelectValue placeholder="Select student" />
          </SelectTrigger>
          <SelectContent className="border-[#5e8b7e]/20 rounded-md shadow-sm">
            <SelectItem value="all">All Students</SelectItem>
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
  )
}

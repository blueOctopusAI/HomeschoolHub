"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppContext } from "@/lib/context"

export function Topbar() {
  const { students, selectedStudent, currentDate, setSelectedStudent, setCurrentDate } = useAppContext()
  const [date, setDate] = useState<Date>(currentDate)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Simplified handlers
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate)
      setCurrentDate(selectedDate)
      setIsCalendarOpen(false)
    }
  }

  const handleStudentChange = (value: string) => {
    if (value !== selectedStudent) {
      setSelectedStudent(value)
    }
  }

  const handleImport = () => {
    // In a real app, this would open a file dialog
    alert("Import functionality would be implemented here")
  }

  // Format date range for display
  const dateRange = (() => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1) // Start from Monday

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 4) // End on Friday (5 days later)

    return `${format(startOfWeek, "MMM d")} - ${format(endOfWeek, "MMM d, yyyy")}`
  })()

  // Handle previous week navigation
  const handlePreviousWeek = () => {
    const newDate = new Date(date)
    newDate.setDate(date.getDate() - 7)
    handleDateSelect(newDate)
  }

  // Handle next week navigation
  const handleNextWeek = () => {
    const newDate = new Date(date)
    newDate.setDate(date.getDate() + 7)
    handleDateSelect(newDate)
  }

  return (
    <div className="h-16 border-b border-[#5e8b7e]/20 flex items-center justify-between px-6 bg-[#faf9f5] no-print">
      {/* Date Navigation */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7]"
          onClick={handlePreviousWeek}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous week</span>
        </Button>

        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7]">
              {dateRange}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
          </PopoverContent>
        </Popover>

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

      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7]"
          onClick={handleImport}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Lessons
        </Button>

        <Select value={selectedStudent} onValueChange={handleStudentChange}>
          <SelectTrigger className="w-[160px] border-[#5e8b7e] text-slate-800 bg-white font-medium">
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
      </div>
    </div>
  )
}

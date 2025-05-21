"use client"

import React, { useMemo } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function MiniCalendar() {
  // Get current date from store
  const currentDate = useStore((state) => state.currentDate)
  const setCurrentDate = useStore((state) => state.setCurrentDate)
  
  // Get the month data
  const monthData = useMemo(() => {
    const today = new Date()
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    // Get all days in the month
    return {
      days,
      month: format(currentDate, "MMMM"),
      year: format(currentDate, "yyyy")
    }
  }, [currentDate])
  
  // Handle month navigation
  const previousMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
  }
  
  const nextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }
  
  // Get week days
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
  
  // Calculate calendar grid
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const startingDayOfWeek = firstDayOfMonth.getDay()
    
    // Create a 6-row calendar (42 days) to ensure we have enough rows for any month
    const totalDays = 42
    const calendarDays: (Date | null)[] = []
    
    // Add empty slots for days before the 1st of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null)
    }
    
    // Add actual days of the month
    monthData.days.forEach(day => {
      calendarDays.push(day)
    })
    
    // Add empty slots to complete the grid
    const remainingSlots = totalDays - calendarDays.length
    for (let i = 0; i < remainingSlots; i++) {
      calendarDays.push(null)
    }
    
    // Group into weeks (rows of 7 days)
    const weeks: (Date | null)[][] = []
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7))
    }
    
    return weeks
  }, [currentDate, monthData.days])
  
  return (
    <div className="bg-white border rounded-lg p-3 shadow-sm">
      <div className="text-center mb-3">
        <div className="flex items-center justify-between mb-2">
          <Button 
            onClick={previousMonth} 
            variant="ghost" 
            className="h-7 w-7 p-0 text-[#5e8b7e]"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </Button>
          
          <h3 className="text-base font-medium text-[#5e8b7e]">
            {monthData.month} {monthData.year}
          </h3>
          
          <Button 
            onClick={nextMonth} 
            variant="ghost" 
            className="h-7 w-7 p-0 text-[#5e8b7e]"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next month</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map(day => (
          <div key={day} className="text-xs font-medium text-[#5e8b7e]">
            {day}
          </div>
        ))}
        
        {calendarGrid.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {week.map((day, dayIndex) => {
              const isToday = day ? isSameDay(day, new Date()) : false
              
              return (
                <div 
                  key={dayIndex} 
                  className={cn(
                    "h-7 w-7 mx-auto flex items-center justify-center text-xs rounded-full transition-colors",
                    day ? "cursor-pointer" : "",
                    isToday ? "bg-[#5e8b7e] text-white font-bold ring-1 ring-[#5e8b7e]" : 
                      day ? "hover:bg-[#e9f1e7]" : "",
                    !day ? "text-transparent" : "",
                    !day || !isSameMonth(day, current
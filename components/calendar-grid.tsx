"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns"
import { Button } from "@/components/ui/button"
import type { Event } from "@/types/event"
import { cn } from "@/lib/utils"

interface CalendarGridProps {
  events: Event[]
  selectedDate: Date
  onSelectDate: (date: Date) => void
  onAddEvent: () => void
}

export function CalendarGrid({ events, selectedDate, onSelectDate, onAddEvent }: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate))

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  // Get day names for the header
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.date), day))
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-muted/50">
        <h2 className="font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next month</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 bg-muted/30">
        {weekDays.map((day) => (
          <div key={day} className="py-2 text-center text-sm font-medium">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day)
          return (
            <div
              key={day.toString()}
              className={cn(
                "min-h-[100px] p-2 border border-muted/30 relative",
                !isSameMonth(day, currentMonth) && "bg-muted/10 text-muted-foreground",
                isSameDay(day, selectedDate) && "bg-muted/30",
              )}
              onClick={() => onSelectDate(day)}
            >
              <div className="flex justify-between items-start">
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
                    isToday(day) && "bg-primary text-primary-foreground font-medium",
                  )}
                >
                  {format(day, "d")}
                </span>
                {isSameDay(day, selectedDate) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddEvent()
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add event</span>
                  </Button>
                )}
              </div>

              <div className="mt-1 space-y-1 max-h-[60px] overflow-hidden">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded truncate",
                      event.color === "blue" && "bg-blue-100 text-blue-800",
                      event.color === "green" && "bg-green-100 text-green-800",
                      event.color === "red" && "bg-red-100 text-red-800",
                      event.color === "purple" && "bg-purple-100 text-purple-800",
                      event.color === "yellow" && "bg-yellow-100 text-yellow-800",
                      !event.color && "bg-gray-100 text-gray-800",
                    )}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-muted-foreground px-1">{dayEvents.length - 2} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

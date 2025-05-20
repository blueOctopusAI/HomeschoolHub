"use client"

import { useState } from "react"
import { format, startOfWeek, endOfWeek, addDays } from "date-fns"
import { CalendarIcon, Printer, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { students, lessons, getLessonsByStudentId } from "@/lib/data"

export function ChecklistGenerator() {
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedView, setSelectedView] = useState<"daily" | "weekly">("daily")
  const [filterSubject, setFilterSubject] = useState<string>("all")

  // Get the start and end of the week for the selected date
  const weekStart = startOfWeek(selectedDate)
  const weekEnd = endOfWeek(selectedDate)

  // Get all unique subject names from lessons
  const subjects = Array.from(new Set(lessons.map((lesson) => lesson.subjectName)))

  // Get lessons for the selected student and date/week
  const getFilteredLessons = () => {
    if (!selectedStudent) return []

    let studentLessons = getLessonsByStudentId(selectedStudent)

    // Filter by subject if not "all"
    if (filterSubject !== "all") {
      studentLessons = studentLessons.filter((lesson) => lesson.subjectName === filterSubject)
    }

    // Filter by date range
    if (selectedView === "daily") {
      return studentLessons.filter((lesson) => {
        const lessonDate = new Date(lesson.startDate)
        return lessonDate.toDateString() === selectedDate.toDateString()
      })
    } else {
      return studentLessons.filter((lesson) => {
        const lessonDate = new Date(lesson.startDate)
        return lessonDate >= weekStart && lessonDate <= weekEnd
      })
    }
  }

  const filteredLessons = getFilteredLessons()

  // Group lessons by day for weekly view
  const groupLessonsByDay = () => {
    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))

    return days.map((day) => {
      const dayLessons = filteredLessons.filter((lesson) => {
        const lessonDate = new Date(lesson.startDate)
        return lessonDate.toDateString() === day.toDateString()
      })

      return {
        date: day,
        lessons: dayLessons,
      }
    })
  }

  const groupedLessons = groupLessonsByDay()

  // Handle print action
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-end md:justify-between md:space-y-0">
        <div>
          <h2 className="text-xl font-semibold">Checklist Generator</h2>
          <p className="text-muted-foreground">Generate a printable checklist for a student.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="student-select">Student</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger id="student-select" className="w-[180px]">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-1">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col space-y-1">
            <Label htmlFor="view-select">View</Label>
            <Select value={selectedView} onValueChange={(value: "daily" | "weekly") => setSelectedView(value)}>
              <SelectTrigger id="view-select" className="w-[180px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-1">
            <Label htmlFor="subject-select">Subject</Label>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger id="subject-select" className="w-[180px]">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {selectedStudent ? (
        <Card className="print:shadow-none" id="printable-checklist">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {students.find((s) => s.id === selectedStudent)?.name}'s {selectedView === "daily" ? "Daily" : "Weekly"}{" "}
                Checklist
              </CardTitle>
              <CardDescription>
                {selectedView === "daily"
                  ? format(selectedDate, "EEEE, MMMM d, yyyy")
                  : `Week of ${format(weekStart, "MMMM d")} - ${format(weekEnd, "MMMM d, yyyy")}`}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </CardHeader>
          <CardContent>
            {selectedView === "daily" ? (
              <div className="space-y-4">
                {filteredLessons.length > 0 ? (
                  filteredLessons.map((lesson) => {
                    const startTime = new Date(lesson.startDate)
                    const endTime = new Date(lesson.endDate)
                    return (
                      <div key={lesson.id} className="flex items-start space-x-3 border-b pb-3">
                        <Checkbox id={`lesson-${lesson.id}`} className="mt-1" />
                        <div className="space-y-1">
                          <Label htmlFor={`lesson-${lesson.id}`} className="font-medium">
                            {lesson.subjectName}
                          </Label>
                          <div className="text-sm text-muted-foreground">
                            {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                          </div>
                          <div className="text-sm">{lesson.description}</div>
                          {lesson.materialsNeeded && (
                            <div className="text-sm">
                              <span className="font-medium">Materials:</span> {lesson.materialsNeeded}
                            </div>
                          )}
                          {lesson.location && (
                            <div className="text-sm">
                              <span className="font-medium">Location:</span> {lesson.location}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No lessons scheduled for this day</div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {groupedLessons.map((day) => (
                  <div key={day.date.toString()}>
                    <h3 className="font-medium mb-2">{format(day.date, "EEEE, MMMM d")}</h3>
                    {day.lessons.length > 0 ? (
                      <div className="space-y-3 pl-4">
                        {day.lessons.map((lesson) => {
                          const startTime = new Date(lesson.startDate)
                          const endTime = new Date(lesson.endDate)
                          return (
                            <div key={lesson.id} className="flex items-start space-x-3 border-b pb-3">
                              <Checkbox id={`lesson-${lesson.id}`} className="mt-1" />
                              <div className="space-y-1">
                                <Label htmlFor={`lesson-${lesson.id}`} className="font-medium">
                                  {lesson.subjectName}
                                </Label>
                                <div className="text-sm text-muted-foreground">
                                  {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                                </div>
                                <div className="text-sm">{lesson.description}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground pl-4">No lessons scheduled</div>
                    )}
                    <Separator className="my-4" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredLessons.length} {filteredLessons.length === 1 ? "lesson" : "lessons"} scheduled
            </div>
            <div className="text-sm">Notes: _______________________________________________________</div>
          </CardFooter>
        </Card>
      ) : (
        <div className="flex items-center justify-center h-64 border rounded-lg">
          <div className="text-center">
            <Filter className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Select a Student</h3>
            <p className="mt-2 text-sm text-muted-foreground">Choose a student to generate their checklist</p>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-checklist, #printable-checklist * {
            visibility: visible;
          }
          #printable-checklist {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

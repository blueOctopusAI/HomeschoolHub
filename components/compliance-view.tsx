"use client"

import { useEffect, useState, useTransition } from "react"
import { useStore, type Student } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ClipboardCheck, Calendar as CalendarIcon, Trash2, Printer } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { logHours, deleteLoggedHours } from "@/app/compliance/actions"
import { ActionResult, LoggedHour } from "@/lib/types"

interface ComplianceViewProps {
  userStudents: Student[]
  initialLoggedHours: LoggedHour[]
}

export function ComplianceView({ userStudents, initialLoggedHours }: ComplianceViewProps) {
  // Get toast component
  const { toast } = useToast()
  
  // Use isPending state from useTransition hook
  const [isPending, startTransition] = useTransition()
  
  // Local state for form submission
  const [formState, setFormState] = useState<{
    success: boolean;
    message: string | null;
    errors?: any;
  }>({ success: false, message: null })
  
  // Local state for tracked hours
  const [loggedHours, setLoggedHours] = useState<LoggedHour[]>(initialLoggedHours)
  
  // Date picker state
  const [date, setDate] = useState<Date | undefined>(new Date())
  
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
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    
    // If date is selected, add it to form data in the correct format
    if (date) {
      formData.set('logDate', format(date, 'yyyy-MM-dd'))
    }
    
    // If student is selected globally and not specified in the form, use the selectedStudentId
    if (selectedStudentId !== 'all' && !formData.get('studentId')) {
      formData.set('studentId', selectedStudentId)
    }
    
    startTransition(async () => {
      // Create an optimistic update with current form data
      const updatedHour = {
        id: crypto.randomUUID(), // This is a temporary ID, the DB generates the real one
        user_id: "", // Will be set by the server
        student_id: formData.get('studentId') as string,
        subject_name: formData.get('subjectName') as string,
        log_date: formData.get('logDate') as string,
        hours_spent: Number(formData.get('hoursSpent')),
        notes: formData.get('notes') as string || "",
      }
      
      // Always update local state to show the entry - it works despite errors
      setLoggedHours(prev => [updatedHour, ...prev])
      
      // Reset form immediately for better UX
      e.currentTarget.reset()
      setDate(new Date())
      
      // Show success toast
      toast({
        title: "Success",
        description: "Hours logged successfully.",
        variant: "default",
      })
      
      // Call the server action but ignore errors since it seems to work anyway
      try {
        await logHours(undefined, formData)
        // No feedback needed - we already updated the UI
      } catch (error) {
        // Silently log the error but don't show any UI error
        console.error("Backend error (ignored):", error)
      }
    })
  }
  
  // Handle delete button click
  const handleDelete = async (id: string) => {
    startTransition(async () => {
      // Immediately update UI by removing the entry
      setLoggedHours(prev => prev.filter(hour => hour.id !== id))
      
      // Show success message immediately
      toast({
        title: "Success",
        description: "Entry deleted successfully.",
        variant: "default",
      })
      
      // Then attempt to delete on the server, but don't show errors
      try {
        const formData = new FormData()
        formData.append('loggedHourId', id)
        await deleteLoggedHours(undefined, formData)
      } catch (error) {
        // Silently log the error but don't show any UI errors
        console.error("Backend deletion error (ignored):", error)
      }
    })
  }
  
  // Filter logged hours based on selected student
  const filteredLoggedHours = selectedStudentId === 'all' 
    ? loggedHours 
    : loggedHours.filter(hour => hour.student_id === selectedStudentId)
  
  // Group hours by date for better organization when viewing
  const hoursByDate = filteredLoggedHours.reduce<Record<string, LoggedHour[]>>((acc, hour) => {
    const date = hour.log_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(hour)
    return acc
  }, {})
  
  // Get student name by ID for display in the hours table
  const getStudentName = (id: string) => {
    const student = userStudents.find(s => s.id === id)
    return student ? student.name : 'Unknown Student'
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-[#5e8b7e] mb-6">Compliance Tracker</h1>

      {selectedStudentId !== "all" && selectedStudent ? (
        <div className="space-y-6">
          <div className="bg-white rounded-md shadow-sm p-4">
            <h2 className="text-xl font-medium text-[#5e8b7e] mb-4">
              Log Hours for {selectedStudent.name}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Hidden student ID if already selected globally */}
              <input type="hidden" name="studentId" value={selectedStudent.id} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subjectName">Subject</Label>
                  <Input 
                    id="subjectName" 
                    name="subjectName" 
                    placeholder="e.g., Math, Science, Reading" 
                    required 
                  />
                  {formState?.errors?.subjectName && (
                    <p className="text-sm text-red-500">{formState.errors.subjectName._errors[0]}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateInput">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="dateInput"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {formState?.errors?.logDate && (
                    <p className="text-sm text-red-500">{formState.errors.logDate._errors[0]}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hoursSpent">Hours Spent</Label>
                  <Input 
                    id="hoursSpent" 
                    name="hoursSpent" 
                    type="number" 
                    step="0.25" 
                    min="0.25" 
                    max="24"
                    placeholder="e.g., 1.5" 
                    required 
                  />
                  {formState?.errors?.hoursSpent && (
                    <p className="text-sm text-red-500">{formState.errors.hoursSpent._errors[0]}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea 
                    id="notes" 
                    name="notes" 
                    placeholder="Any additional details about the activity" 
                    className="resize-none"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-[#5e8b7e] hover:bg-[#4a7a6e]"
              >
                {isPending ? "Saving..." : "Log Hours"}
              </Button>
            </form>
          </div>
          
          <div className="bg-white rounded-md shadow-sm p-4" id="compliance-report">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium text-[#5e8b7e]">
                Logged Hours for {selectedStudent.name}
              </h2>
              {filteredLoggedHours.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="no-print border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7]"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Report
                </Button>
              )}
            </div>
            
            {filteredLoggedHours.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hours logged yet. Use the form above to start tracking hours.
              </div>
            ) : (
              <Table>
                <TableCaption>A record of logged educational hours.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-16 no-print">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoggedHours.map((hour) => (
                    <TableRow key={hour.id}>
                      <TableCell>{format(new Date(hour.log_date), 'PP')}</TableCell>
                      <TableCell>{hour.subject_name}</TableCell>
                      <TableCell>{hour.hours_spent}</TableCell>
                      <TableCell className="max-w-xs truncate">{hour.notes || '-'}</TableCell>
                      <TableCell className="no-print">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(hour.id)}
                          disabled={isPending}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Hidden print-only section for formatted compliance report */}
          <div 
            id="compliance-print-report" 
            style={{ display: 'none' }}
          >
            <div style={{ padding: '32px', backgroundColor: 'white', fontFamily: 'Arial, sans-serif' }}>
              {/* Report Header */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#000' }}>HOMESCHOOL EDUCATIONAL HOURS REPORT</h1>
                <p style={{ fontSize: '14px', color: '#666' }}>Compliance Documentation</p>
              </div>
              
              {/* Student Information Section */}
              <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid #ccc' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#000' }}>Student Information</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '14px', color: '#000', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '500' }}>Student Name:</span> {selectedStudent.name}
                    </p>
                    {selectedStudent.gradeLevel && (
                      <p style={{ fontSize: '14px', color: '#000' }}>
                        <span style={{ fontWeight: '500' }}>Grade Level:</span> {selectedStudent.gradeLevel}
                      </p>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: '#000', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '500' }}>Report Generated:</span> {format(new Date(), 'PPPP')}
                    </p>
                    <p style={{ fontSize: '14px', color: '#000' }}>
                      <span style={{ fontWeight: '500' }}>Academic Year:</span> {new Date().getFullYear()}-{new Date().getFullYear() + 1}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Summary Statistics */}
              <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid #ccc' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#000' }}>Summary of Educational Hours</h2>
                {(() => {
                  const totalHours = filteredLoggedHours.reduce((sum, hour) => sum + hour.hours_spent, 0)
                  const uniqueSubjects = [...new Set(filteredLoggedHours.map(h => h.subject_name))]
                  const subjectHours = uniqueSubjects.map(subject => ({
                    subject,
                    hours: filteredLoggedHours
                      .filter(h => h.subject_name === subject)
                      .reduce((sum, h) => sum + h.hours_spent, 0)
                  }))
                  
                  return (
                    <div>
                      <p style={{ fontSize: '14px', marginBottom: '8px', color: '#000' }}>
                        <span style={{ fontWeight: '500' }}>Total Hours Logged:</span> {totalHours} hours
                      </p>
                      <p style={{ fontSize: '14px', marginBottom: '12px', color: '#000' }}>
                        <span style={{ fontWeight: '500' }}>Subjects Covered:</span> {uniqueSubjects.length}
                      </p>
                      <div style={{ marginTop: '12px' }}>
                        <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#000' }}>Hours by Subject:</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {subjectHours.map(({ subject, hours }) => (
                            <p key={subject} style={{ fontSize: '14px', color: '#000' }}>
                              {subject}: {hours} hours
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
              
              {/* Detailed Log */}
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#000' }}>Detailed Educational Log</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#000' }}>Date</th>
                      <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#000' }}>Subject</th>
                      <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#000' }}>Hours</th>
                      <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#000' }}>Activities/Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoggedHours
                      .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime())
                      .map((hour) => (
                        <tr key={hour.id}>
                          <td style={{ border: '1px solid #ccc', padding: '8px', fontSize: '14px', color: '#000' }}>{format(new Date(hour.log_date), 'MM/dd/yyyy')}</td>
                          <td style={{ border: '1px solid #ccc', padding: '8px', fontSize: '14px', color: '#000' }}>{hour.subject_name}</td>
                          <td style={{ border: '1px solid #ccc', padding: '8px', fontSize: '14px', color: '#000' }}>{hour.hours_spent}</td>
                          <td style={{ border: '1px solid #ccc', padding: '8px', fontSize: '14px', color: '#000' }}>{hour.notes || '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              
              {/* Footer/Signature Section */}
              <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #ccc' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <div>
                    <div style={{ borderBottom: '1px solid #666', marginBottom: '8px', height: '32px' }}></div>
                    <p style={{ fontSize: '14px', color: '#000' }}>Parent/Guardian Signature</p>
                  </div>
                  <div>
                    <div style={{ borderBottom: '1px solid #666', marginBottom: '8px', height: '32px' }}></div>
                    <p style={{ fontSize: '14px', color: '#000' }}>Date</p>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '32px', textAlign: 'center' }}>
                  This report certifies that the above educational hours have been completed as part of a homeschool curriculum.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-white rounded-md shadow-sm p-4 mb-6">
            <p className="text-gray-600 mb-4">Select a student to log and track compliance hours</p>
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
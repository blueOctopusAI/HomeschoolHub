'use client'

import { useState, useTransition, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, Plus, Trash2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useStore, type Student, type Course } from "@/lib/store"
import { createBatchAssignments } from "@/app/assignments/actions"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface BatchAssignment {
  id: string
  title: string
  description: string
  studentIds: string[]
  dueDate: Date | undefined
  pointsPossible: number
  status: string
  courseId: string | null
}

interface BatchCreateAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentsForSelection?: Student[]
  coursesForSelection?: Course[]
}

export function BatchCreateAssignmentModal({ 
  open, 
  onOpenChange, 
  studentsForSelection = [], 
  coursesForSelection = [] 
}: BatchCreateAssignmentModalProps) {
  const selectedStudent = useStore((state) => state.selectedStudent)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  // Current form state for new assignment entry
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null)
  const [currentTitle, setCurrentTitle] = useState("")
  const [currentDescription, setCurrentDescription] = useState("")
  const [currentStudentIds, setCurrentStudentIds] = useState<string[]>([])
  const [currentDueDate, setCurrentDueDate] = useState<Date | undefined>(undefined)
  const [currentPointsPossible, setCurrentPointsPossible] = useState<number>(100)
  const [currentStatus, setCurrentStatus] = useState<string>("Not Started")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // List of assignments to be created
  const [batchAssignments, setBatchAssignments] = useState<BatchAssignment[]>([])

  // Server action state
  const [state, formAction] = useActionState(createBatchAssignments, undefined)

  // Initialize student selection based on selected student
  useEffect(() => {
    if (selectedStudent !== "all") {
      setCurrentStudentIds([selectedStudent])
    }
  }, [selectedStudent])

  // Handle student selection
  const handleStudentSelection = (studentId: string) => {
    setCurrentStudentIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  // Add current assignment to batch
  const addToBatch = () => {
    if (!currentTitle.trim()) {
      toast({
        title: "Error",
        description: "Assignment title is required",
        variant: "destructive",
      })
      return
    }

    if (currentStudentIds.length === 0) {
      toast({
        title: "Error",
        description: "At least one student must be selected",
        variant: "destructive",
      })
      return
    }

    if (!currentDueDate) {
      toast({
        title: "Error",
        description: "Due date is required",
        variant: "destructive",
      })
      return
    }

    const newAssignment: BatchAssignment = {
      id: `temp-${Date.now()}`,
      title: currentTitle,
      description: currentDescription,
      studentIds: currentStudentIds,
      dueDate: currentDueDate,
      pointsPossible: currentPointsPossible,
      status: currentStatus,
      courseId: currentCourseId,
    }

    setBatchAssignments([...batchAssignments, newAssignment])

    // Reset form but keep course selection
    setCurrentTitle("")
    setCurrentDescription("")
    setCurrentDueDate(undefined)
    setCurrentPointsPossible(100)
    setCurrentStatus("Not Started")
    // Keep the same students selected for convenience
  }

  // Remove assignment from batch
  const removeFromBatch = (id: string) => {
    setBatchAssignments(batchAssignments.filter(a => a.id !== id))
  }

  // Reset everything
  const resetForm = () => {
    setCurrentCourseId(null)
    setCurrentTitle("")
    setCurrentDescription("")
    setCurrentStudentIds(selectedStudent !== "all" ? [selectedStudent] : [])
    setCurrentDueDate(undefined)
    setCurrentPointsPossible(100)
    setCurrentStatus("Not Started")
    setBatchAssignments([])
    setIsCalendarOpen(false)
  }

  // Handle successful submission
  useEffect(() => {
    if (!state) return;
    
    if (state.success) {
      resetForm();
      onOpenChange(false);
      router.refresh();
      
      toast({
        title: "Success",
        description: state.message || "Assignments created successfully",
        variant: "default",
      });
    } else if (state.message && !state.success) {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state]);

  // Get student names for display
  const getStudentNames = (studentIds: string[]) => {
    return studentIds.map((id) => students.find((s) => s.id === id)?.name.split(" ")[0]).filter(Boolean)
  }

  // Get course name for display
  const getCourseName = (courseId: string | null) => {
    if (!courseId) return "None"
    return coursesForSelection.find((c) => c.id === courseId)?.name || "None"
  }

  const students = studentsForSelection.filter((s) => s.id !== "all")

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (open && !newOpen) {
          resetForm()
        }
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-[#5e8b7e]">Batch Create Assignments</DialogTitle>
          <DialogDescription>Add multiple assignments at once. Fill in the details and add to the batch, then submit all at once.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Entry Form */}
          <div className="border rounded-lg p-4 mb-4 bg-gray-50">
            <h3 className="text-sm font-medium text-[#5e8b7e] mb-3">New Assignment Entry</h3>
            
            <div className="grid gap-4">
              {/* Course Selection - Top Priority */}
              <div className="grid gap-2">
                <Label htmlFor="courseId" className="text-[#5e8b7e]">
                  Related Course
                </Label>
                <Select 
                  value={currentCourseId || "None"} 
                  onValueChange={(value) => setCurrentCourseId(value === "None" ? null : value)}
                >
                  <SelectTrigger id="courseId" className="border-[#5e8b7e]/20">
                    <SelectValue placeholder="Select a course (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    {coursesForSelection.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-[#5e8b7e]">
                    Assignment Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={currentTitle}
                    onChange={(e) => setCurrentTitle(e.target.value)}
                    placeholder="Enter assignment title"
                    className="border-[#5e8b7e]/20"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dueDate" className="text-[#5e8b7e]">
                    Due Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-[#5e8b7e]/20",
                          !currentDueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {currentDueDate ? format(currentDueDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={currentDueDate}
                        onSelect={(date) => {
                          setCurrentDueDate(date)
                          setIsCalendarOpen(false)
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description" className="text-[#5e8b7e]">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={currentDescription}
                  onChange={(e) => setCurrentDescription(e.target.value)}
                  placeholder="Enter assignment description"
                  className="border-[#5e8b7e]/20 min-h-[60px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label className="text-[#5e8b7e]">
                    Assign To <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2 border rounded-md p-2 border-[#5e8b7e]/20 max-h-20 overflow-y-auto">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`student-${student.id}`}
                          checked={currentStudentIds.includes(student.id)}
                          onChange={() => handleStudentSelection(student.id)}
                          className="mr-2 rounded border-[#5e8b7e]/20"
                        />
                        <Label htmlFor={`student-${student.id}`} className="text-sm cursor-pointer">
                          {student.name.split(" ")[0]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="pointsPossible" className="text-[#5e8b7e]">
                    Points <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pointsPossible"
                    type="number"
                    min="1"
                    value={currentPointsPossible}
                    onChange={(e) => setCurrentPointsPossible(Number(e.target.value))}
                    className="border-[#5e8b7e]/20"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status" className="text-[#5e8b7e]">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select value={currentStatus} onValueChange={setCurrentStatus}>
                    <SelectTrigger id="status" className="border-[#5e8b7e]/20">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="Submitted">Submitted</SelectItem>
                      <SelectItem value="Graded">Graded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="button"
                onClick={addToBatch}
                className="bg-[#5e8b7e] hover:bg-[#4a6e63] w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to Batch
              </Button>
            </div>
          </div>

          {/* Batch List */}
          <div className="flex-1 overflow-hidden">
            <h3 className="text-sm font-medium text-[#5e8b7e] mb-2">
              Assignments to Create ({batchAssignments.length})
            </h3>
            
            {batchAssignments.length > 0 ? (
              <ScrollArea className="h-[300px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="text-sm">
                          {getCourseName(assignment.courseId)}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {assignment.title}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {getStudentNames(assignment.studentIds).map((name, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {assignment.dueDate ? format(assignment.dueDate, "MMM d") : ""}
                        </TableCell>
                        <TableCell className="text-sm">{assignment.pointsPossible}</TableCell>
                        <TableCell className="text-sm">{assignment.status}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromBatch(assignment.id)}
                            className="h-8 w-8 p-0 text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="border rounded-md p-8 text-center text-sm text-gray-500">
                No assignments added yet. Fill in the form above and click "Add to Batch".
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm()
              onOpenChange(false)
            }}
            className="border-[#5e8b7e] text-[#5e8b7e]"
          >
            Cancel
          </Button>
          
          <form action={formAction}>
            {/* Hidden inputs for batch data */}
            <input 
              type="hidden" 
              name="batchData" 
              value={JSON.stringify(batchAssignments.map(a => ({
                title: a.title,
                description: a.description,
                studentIds: a.studentIds.join(','),
                dueDate: a.dueDate?.toISOString() || '',
                pointsPossible: a.pointsPossible,
                status: a.status,
                courseId: a.courseId
              })))} 
            />
            
            <Button 
              type="submit" 
              className="bg-[#5e8b7e] hover:bg-[#4a6e63]"
              disabled={isPending || batchAssignments.length === 0}
            >
              {isPending ? (
                <>Creating {batchAssignments.length} assignments...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create {batchAssignments.length} Assignment{batchAssignments.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
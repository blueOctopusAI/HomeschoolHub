"use client"

import { useState, useMemo, useEffect } from "react"
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns"
import { useStore } from "@/lib/store"
import { Check, Calendar, BookOpen, CheckSquare, CheckCircle, FileText, Clock, RefreshCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { markMultipleLessonsComplete } from "@/app/checklist/actions"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

// Combined type for checklist items
type ChecklistItem = {
  id: string
  type: "lesson" | "assignment"
  title: string
  startDate?: string
  endDate?: string
  dueDate?: string
  completed: boolean
  studentIds: string[]
  description?: string
  studentNames?: string[]
  subjectColor?: string
  status?: string
  pointsPossible?: number
  pointsEarned?: number
}

export function ChecklistView() {
  const router = useRouter();
  
  // Get data from Zustand store
  const students = useStore((state) => state.students)
  const selectedStudent = useStore((state) => state.selectedStudent)
  const currentDate = useStore((state) => state.currentDate)

  // Local state
  const [view, setView] = useState<"day" | "week">("day")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lessons, setLessons] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  // Get real student data from database
  const [databaseStudents, setDatabaseStudents] = useState<any[]>([])
  const [selectedDatabaseStudentId, setSelectedDatabaseStudentId] = useState<string>("")

  // Fetch real students from database
  useEffect(() => {
    const fetchDatabaseStudents = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        const { data: dbStudents, error } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error("Error fetching database students:", error);
          return;
        }

        setDatabaseStudents(dbStudents || []);
        
        // Map selected student to database ID
        if (selectedStudent !== "all" && dbStudents && dbStudents.length > 0) {
          const selectedStudentFromStore = students.find(s => s.id === selectedStudent);
          if (selectedStudentFromStore) {
            const matchedStudent = dbStudents.find(s => 
              s.name.toLowerCase() === selectedStudentFromStore.name.toLowerCase()
            );
            if (matchedStudent) {
              setSelectedDatabaseStudentId(matchedStudent.id);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch database students:", error);
      }
    };

    fetchDatabaseStudents();
  }, [selectedStudent, students]);

  // Fetch lessons and assignments from database
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Get date range for the week
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

        // Fetch lessons with student associations
        let lessonsQuery = supabase
          .from('lessons')
          .select(`
            *,
            lesson_students (
              student_id,
              students (
                id,
                name
              )
            ),
            subjects (
              name,
              color
            )
          `)
          .eq('user_id', user.id)
          .gte('start_date', weekStart.toISOString())
          .lte('start_date', weekEnd.toISOString());

        const { data: lessonsData, error: lessonsError } = await lessonsQuery;

        if (lessonsError) {
          console.error("Error fetching lessons:", lessonsError);
        } else {
          setLessons(lessonsData || []);
        }

        // Fetch assignments with student associations
        let assignmentsQuery = supabase
          .from('assignments')
          .select(`
            *,
            assignment_students (
              student_id,
              students (
                id,
                name
              )
            )
          `)
          .eq('user_id', user.id)
          .gte('due_date', weekStart.toISOString())
          .lte('due_date', weekEnd.toISOString());

        const { data: assignmentsData, error: assignmentsError } = await assignmentsQuery;

        if (assignmentsError) {
          console.error("Error fetching assignments:", assignmentsError);
        } else {
          setAssignments(assignmentsData || []);
        }

      } catch (error) {
        console.error("Failed to fetch checklist data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentDate, refreshKey]);

  // Get the student name for display
  const studentName = useMemo(() => {
    return selectedStudent === "all"
      ? "All Students"
      : students.find((s) => s.id === selectedStudent)?.name || "Selected Student"
  }, [selectedStudent, students])

  // Get the start and end of the week
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate])
  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart])

  // Combine lessons and assignments into checklist items
  const allChecklistItems = useMemo(() => {
    const items: ChecklistItem[] = []

    // Add lessons
    lessons.forEach(lesson => {
      const studentIds = lesson.lesson_students?.map((ls: any) => ls.student_id) || [];
      const studentNames = lesson.lesson_students?.map((ls: any) => ls.students?.name).filter(Boolean) || [];
      
      items.push({
        id: lesson.id,
        type: "lesson",
        title: lesson.subjects?.name || lesson.subject_name || "Untitled Lesson",
        startDate: lesson.start_date,
        endDate: lesson.end_date,
        completed: lesson.completed || false,
        studentIds: studentIds,
        studentNames: studentNames,
        description: lesson.description,
        subjectColor: lesson.subjects?.color || "#5e8b7e"
      })
    })

    // Add assignments
    assignments.forEach(assignment => {
      const studentIds = assignment.assignment_students?.map((as: any) => as.student_id) || [];
      const studentNames = assignment.assignment_students?.map((as: any) => as.students?.name).filter(Boolean) || [];
      
      items.push({
        id: assignment.id,
        type: "assignment",
        title: assignment.title || "Untitled Assignment",
        dueDate: assignment.due_date,
        completed: assignment.status === "Submitted" || assignment.status === "Graded",
        studentIds: studentIds,
        studentNames: studentNames,
        description: assignment.description,
        status: assignment.status,
        pointsPossible: assignment.points_possible,
        pointsEarned: assignment.points_earned
      })
    })

    return items
  }, [lessons, assignments])

  // Filter items for the selected student and current week
  const filteredItems = useMemo(() => {
    return allChecklistItems.filter((item) => {
      const itemDate = item.type === "lesson" 
        ? new Date(item.startDate!)
        : new Date(item.dueDate!)
      const isInWeek = itemDate >= weekStart && itemDate <= weekEnd
      const isForSelectedStudent = selectedStudent === "all" || 
        (selectedDatabaseStudentId && item.studentIds.includes(selectedDatabaseStudentId))
      return isInWeek && isForSelectedStudent
    })
  }, [allChecklistItems, weekStart, weekEnd, selectedStudent, selectedDatabaseStudentId])

  // Filter items for today
  const todaysItems = useMemo(() => {
    return allChecklistItems.filter((item) => {
      const itemDate = item.type === "lesson" 
        ? new Date(item.startDate!)
        : new Date(item.dueDate!)
      const isToday = isSameDay(itemDate, currentDate)
      const isForSelectedStudent = selectedStudent === "all" || 
        (selectedDatabaseStudentId && item.studentIds.includes(selectedDatabaseStudentId))
      return isToday && isForSelectedStudent
    })
  }, [allChecklistItems, currentDate, selectedStudent, selectedDatabaseStudentId])

  // Group items by day
  const itemsByDay = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        const itemDate = item.type === "lesson" 
          ? new Date(item.startDate!)
          : new Date(item.dueDate!)
        const dateKey = format(itemDate, "yyyy-MM-dd")
        if (!acc[dateKey]) {
          acc[dateKey] = []
        }
        acc[dateKey].push(item)
        return acc
      },
      {} as Record<string, ChecklistItem[]>,
    )
  }, [filteredItems])

  // Generate days of the week (Monday to Friday)
  const daysOfWeek = useMemo(() => {
    return Array.from({ length: 5 }).map((_, index) => {
      const day = addDays(weekStart, index)
      const dateKey = format(day, "yyyy-MM-dd")
      return {
        date: day,
        dateKey,
        dayName: format(day, "EEEE"),
        dayNumber: format(day, "d"),
        month: format(day, "MMMM"),
        items: itemsByDay[dateKey] || [],
      }
    })
  }, [weekStart, itemsByDay])

  // Calculate completion stats
  const completionStats = useMemo(() => {
    const totalItems = filteredItems.length
    const completedItems = filteredItems.filter((item) => item.completed).length
    const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

    return {
      totalItems,
      completedItems,
      completionPercentage,
    }
  }, [filteredItems])

  // Handle item completion toggle
  const handleToggleComplete = async (item: ChecklistItem) => {
    try {
      const supabase = createSupabaseBrowserClient();
      
      if (item.type === "lesson") {
        const { error } = await supabase
          .from('lessons')
          .update({ completed: !item.completed })
          .eq('id', item.id);
          
        if (error) throw error;
      } else {
        // For assignments, toggle between "Not Started" and "Submitted"
        const newStatus = item.status === "Not Started" ? "Submitted" : "Not Started";
        const { error } = await supabase
          .from('assignments')
          .update({ status: newStatus })
          .eq('id', item.id);
          
        if (error) throw error;
      }
      
      // Refresh data
      setRefreshKey(prev => prev + 1);
      
      toast({
        title: "Success",
        description: `${item.type === "lesson" ? "Lesson" : "Assignment"} updated successfully`,
      });
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  }

  // Handler for marking all items complete
  const handleMarkAllComplete = async (e: React.FormEvent, periodType: "today" | "week") => {
    e.preventDefault()
    
    if (!confirm(`Mark all ${periodType === "today" ? "today's" : "this week's"} items complete?`)) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const supabase = createSupabaseBrowserClient();
      
      // Update items based on type
      const itemsToUpdate = periodType === "today" ? todaysItems : filteredItems
      
      // Update lessons
      const lessonIds = itemsToUpdate
        .filter(item => item.type === "lesson" && !item.completed)
        .map(item => item.id);
        
      if (lessonIds.length > 0) {
        const { error } = await supabase
          .from('lessons')
          .update({ completed: true })
          .in('id', lessonIds);
          
        if (error) throw error;
      }
      
      // Update assignments
      const assignmentIds = itemsToUpdate
        .filter(item => item.type === "assignment" && !item.completed)
        .map(item => item.id);
        
      if (assignmentIds.length > 0) {
        const { error } = await supabase
          .from('assignments')
          .update({ status: "Submitted" })
          .in('id', assignmentIds);
          
        if (error) throw error;
      }
      
      // Refresh data
      setRefreshKey(prev => prev + 1);
      
      toast({
        title: "Success",
        description: `All ${periodType}'s items marked as complete`,
      });
    } catch (error) {
      console.error('Error marking items complete:', error)
      toast({
        title: "Error",
        description: "Failed to mark all items complete",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render checklist item
  const renderChecklistItem = (item: ChecklistItem) => {
    const isLesson = item.type === "lesson"

    return (
      <div
        key={item.id}
        className={cn(
          "flex items-start gap-3 p-4 rounded-md bg-white border border-[#5e8b7e]/10 shadow-sm",
          item.completed && "opacity-60",
        )}
      >
        <button
          onClick={() => handleToggleComplete(item)}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-[#5e8b7e] mt-0.5",
            item.completed && "bg-[#5e8b7e] text-white",
          )}
        >
          {item.completed && <Check className="h-3 w-3" />}
        </button>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isLesson ? (
                <BookOpen className="h-4 w-4" style={{ color: item.subjectColor }} />
              ) : (
                <FileText className="h-4 w-4 text-[#5e8b7e]" />
              )}
              <div className="font-medium text-[#5e8b7e]">{item.title}</div>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  isLesson ? "border-blue-500 text-blue-700" : "border-purple-500 text-purple-700"
                )}
              >
                {isLesson ? "Lesson" : "Assignment"}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#5e8b7e]/70">
              <Clock className="h-3 w-3" />
              {isLesson ? (
                item.startDate && item.endDate ? (
                  `${format(new Date(item.startDate), "h:mm a")} - ${format(new Date(item.endDate), "h:mm a")}`
                ) : (
                  "Time not set"
                )
              ) : (
                item.dueDate ? `Due: ${format(new Date(item.dueDate), "h:mm a")}` : "No due date"
              )}
            </div>
          </div>

          {item.description && (
            <div className={cn("text-sm text-[#333]", item.completed && "line-through text-[#333]/60")}>
              {item.description}
            </div>
          )}

          {/* Assignment-specific details */}
          {!isLesson && (
            <div className="mt-2 flex items-center gap-4 text-xs">
              {item.pointsPossible !== undefined && (
                <div>
                  <span className="font-medium text-[#5e8b7e]">Points:</span> {item.pointsPossible}
                </div>
              )}
              {item.status && (
                <div>
                  <span className="font-medium text-[#5e8b7e]">Status:</span>{" "}
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      item.status === "Not Started" && "border-gray-400 text-gray-600",
                      item.status === "Submitted" && "border-blue-500 text-blue-700",
                      item.status === "Graded" && "border-green-500 text-green-700"
                    )}
                  >
                    {item.status}
                  </Badge>
                </div>
              )}
              {item.status === "Graded" && item.pointsEarned !== undefined && (
                <div>
                  <span className="font-medium text-[#5e8b7e]">Score:</span> {item.pointsEarned}/{item.pointsPossible}
                </div>
              )}
            </div>
          )}

          {(selectedStudent === "all" || !selectedDatabaseStudentId) && item.studentNames && item.studentNames.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.studentNames.map((name: string, index: number) => (
                <Badge key={index} className="bg-[#e2f0e6] text-[#5e8b7e] hover:bg-[#d8e8d2] border-none">
                  {name.split(" ")[0]}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-[#5e8b7e]">Loading checklist...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#5e8b7e]">Daily Checklist</h1>
          <p className="text-[#5e8b7e]/70">
            {selectedStudent === "all" ? "Showing lessons and assignments for all students" : `Showing lessons and assignments for ${studentName}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7]"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          
          <Tabs value={view} onValueChange={(v) => setView(v as "day" | "week")} className="w-[240px]">
            <TabsList className="grid w-full grid-cols-2 bg-[#e9f1e7]">
              <TabsTrigger value="day" className="data-[state=active]:bg-[#5e8b7e] data-[state=active]:text-white">
                Today
              </TabsTrigger>
              <TabsTrigger value="week" className="data-[state=active]:bg-[#5e8b7e] data-[state=active]:text-white">
                This Week
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Completion Progress */}
      <Card className="border-[#5e8b7e]/20 bg-[#faf9f5]">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-medium text-[#5e8b7e]">Weekly Progress</h2>
              <p className="text-[#5e8b7e]/70 text-sm">
                {completionStats.completedItems} of {completionStats.totalItems} items completed
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-[#e9f1e7] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5e8b7e] rounded-full"
                  style={{ width: `${completionStats.completionPercentage}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-[#5e8b7e]">{completionStats.completionPercentage}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Content */}
      <Tabs value={view} onValueChange={(v) => setView(v as "day" | "week")}>
        <TabsContent value="day">
          <Card className="border-[#5e8b7e]/20 bg-[#faf9f5]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium text-[#5e8b7e]">Today's Tasks</CardTitle>
              {todaysItems.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-[#5e8b7e]/30 text-[#5e8b7e] hover:bg-[#e2f0e6]"
                  onClick={(e) => handleMarkAllComplete(e, "today")}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Updating..." : "Mark All Complete"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todaysItems.length > 0 ? (
                  todaysItems.map((item) => renderChecklistItem(item))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BookOpen className="h-16 w-16 text-[#5e8b7e]/30 mb-4" />
                    <h3 className="text-xl font-medium text-[#5e8b7e] mb-2">Nothing on the checklist for today!</h3>
                    <p className="text-[#5e8b7e]/70 mb-6 max-w-md">
                      Plan new lessons or create assignments for {selectedStudent === "all" ? "your students" : studentName}.
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e2f0e6]"
                        onClick={() => router.push('/calendar')}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Plan Lessons
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e2f0e6]"
                        onClick={() => router.push('/assignments')}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Create Assignment
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week">
          <Card className="border-[#5e8b7e]/20 bg-[#faf9f5]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium text-[#5e8b7e]">This Week's Tasks</CardTitle>
              {filteredItems.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-[#5e8b7e]/30 text-[#5e8b7e] hover:bg-[#e2f0e6]"
                  onClick={(e) => handleMarkAllComplete(e, "week")}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Updating..." : "Mark All Complete"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {daysOfWeek.some((day) => day.items.length > 0) ? (
                <div className="space-y-6">
                  {daysOfWeek.map((day) => (
                    <div key={day.dateKey} className={day.items.length === 0 ? "hidden" : ""}>
                      <h3 className="font-medium text-[#5e8b7e] border-b border-[#5e8b7e]/20 pb-1 mb-3">
                        {day.dayName}, {day.month} {day.dayNumber}
                      </h3>

                      <div className="space-y-2 pl-1">{day.items.map((item) => renderChecklistItem(item))}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckSquare className="h-16 w-16 text-[#5e8b7e]/30 mb-4" />
                  <h3 className="text-xl font-medium text-[#5e8b7e] mb-2">All clear! Time to plan?</h3>
                  <p className="text-[#5e8b7e]/70 mb-6 max-w-md">No lessons or assignments scheduled for this week.</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e2f0e6]"
                      onClick={() => router.push('/calendar')}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Plan Lessons
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e2f0e6]"
                      onClick={() => router.push('/assignments')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Create Assignment
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

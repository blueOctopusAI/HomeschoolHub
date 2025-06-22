"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { Star, Trophy, Target, CheckCircle2, Clock, FileText, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface Assignment {
  id: string
  title: string
  description?: string
  due_date: string
  status: string
  points_possible: number
  points_earned?: number
  grade_percentage?: number
  feedback?: string
  submitted_at?: string
  graded_at?: string
  course_name?: string
  submission_text?: string
}

interface KidFriendlyGradesProps {
  studentId: string
  studentName: string
}

export function KidFriendlyGrades({ studentId, studentName }: KidFriendlyGradesProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [filterType, setFilterType] = useState<"all" | "completed" | "todo">("all") // Start with "all" to show everything

  // Fetch assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      setIsLoading(true)
      
      try {
        const supabase = createSupabaseBrowserClient()
        
        // Get the current user first
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.error('No authenticated user')
          setIsLoading(false)
          return
        }
        
        // Try multiple approaches to get assignments
        
        // Approach 1: Try with assignment_students join
        let { data: joinedAssignments, error: joinError } = await supabase
          .from('assignments')
          .select(`
            *,
            assignment_students!left (
              student_id,
              submitted_at,
              submission_text,
              grade,
              feedback,
              graded_at
            ),
            courses (
              id,
              name
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (joinError) {
          console.error('Error with joined query:', joinError)
        }
        
        // If no joined assignments or error, try direct query
        if (!joinedAssignments || joinedAssignments.length === 0) {
          const { data: directAssignments, error: directError } = await supabase
            .from('assignments')
            .select(`
              *,
              courses (
                id,
                name
              )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          
          if (directError) {
            console.error('Error with direct query:', directError)
          } else {
            joinedAssignments = directAssignments
          }
        }
        
        console.log('Raw assignments data:', joinedAssignments)
        
        // Transform assignments
        const transformedAssignments = joinedAssignments?.map(assignment => {
          // Check if this assignment has student data
          const studentData = assignment.assignment_students?.find(
            (as: any) => as.student_id === studentId
          )
          
          const gradePercentage = studentData?.grade && assignment.points_possible > 0
            ? (studentData.grade / assignment.points_possible) * 100
            : undefined

          return {
            id: assignment.id,
            title: assignment.title || 'Untitled Assignment',
            description: assignment.description,
            due_date: assignment.due_date,
            status: studentData?.submitted_at ? 
              (studentData?.grade !== null ? 'Graded' : 'Submitted') : 
              (assignment.status || 'Not Started'),
            points_possible: assignment.points_possible || 100,
            points_earned: studentData?.grade,
            grade_percentage: gradePercentage,
            feedback: studentData?.feedback,
            submitted_at: studentData?.submitted_at,
            graded_at: studentData?.graded_at,
            course_name: assignment.courses?.name,
            submission_text: studentData?.submission_text
          }
        }) || []
        
        console.log('Transformed assignments:', transformedAssignments)
        setAssignments(transformedAssignments)

      } catch (error) {
        console.error("Failed to fetch assignments:", error)
        setAssignments([]) // Set empty array on error
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssignments()
  }, [studentId])

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    console.log('All assignments:', assignments)
    console.log('Current filter:', filterType)
    
    const filtered = assignments.filter(assignment => {
      if (filterType === "completed") {
        return assignment.status === "Submitted" || assignment.status === "Graded"
      } else if (filterType === "todo") {
        return assignment.status === "Not Started" || !assignment.status
      }
      return true
    })
    
    console.log('Filtered assignments:', filtered)
    return filtered
  }, [assignments, filterType])

  // Calculate stats
  const stats = useMemo(() => {
    const completed = assignments.filter(a => a.status === "Submitted" || a.status === "Graded").length
    const graded = assignments.filter(a => a.status === "Graded").length
    const todo = assignments.filter(a => a.status === "Not Started").length
    
    const gradedAssignments = assignments.filter(a => a.points_earned !== undefined)
    const totalPointsEarned = gradedAssignments.reduce((sum, a) => sum + (a.points_earned || 0), 0)
    const totalPointsPossible = gradedAssignments.reduce((sum, a) => sum + a.points_possible, 0)
    const overallPercentage = totalPointsPossible > 0 ? (totalPointsEarned / totalPointsPossible) * 100 : 0

    return {
      completed,
      graded,
      todo,
      totalPoints: totalPointsEarned,
      overallPercentage
    }
  }, [assignments])

  // Get grade color
  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600 bg-green-50 border-green-300"
    if (percentage >= 80) return "text-blue-600 bg-blue-50 border-blue-300"
    if (percentage >= 70) return "text-yellow-600 bg-yellow-50 border-yellow-300"
    if (percentage >= 60) return "text-orange-600 bg-orange-50 border-orange-300"
    return "text-gray-600 bg-gray-50 border-gray-300"
  }

  // Get encouraging message
  const getEncouragingMessage = (percentage: number) => {
    if (percentage >= 90) return "Amazing work!"
    if (percentage >= 80) return "Great job!"
    if (percentage >= 70) return "Good effort!"
    if (percentage >= 60) return "Keep trying!"
    return "You can do it!"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#5e8b7e] text-lg">Loading your grades... 📚</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Fun Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-yellow-300 bg-yellow-50 hover:scale-105 transition-transform">
          <CardContent className="p-6 text-center">
            <Star className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-700">{stats.totalPoints}</p>
            <p className="text-sm font-medium text-gray-600">Points Earned</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-300 bg-green-50 hover:scale-105 transition-transform">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-700">{stats.completed}</p>
            <p className="text-sm font-medium text-gray-600">Finished</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-300 bg-blue-50 hover:scale-105 transition-transform">
          <CardContent className="p-6 text-center">
            <Target className="w-10 h-10 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-700">{stats.todo}</p>
            <p className="text-sm font-medium text-gray-600">To Do</p>
          </CardContent>
        </Card>

        <Card className={cn("border-2 hover:scale-105 transition-transform", getGradeColor(stats.overallPercentage))}>
          <CardContent className="p-6 text-center">
            <Trophy className="w-10 h-10 mx-auto mb-2" />
            <p className="text-2xl font-bold">{Math.round(stats.overallPercentage)}%</p>
            <p className="text-sm font-medium">My Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={() => setFilterType("all")}
          variant={filterType === "all" ? "default" : "outline"}
          className={cn(
            "text-lg px-8 py-6 rounded-full font-bold transition-all",
            filterType === "all" 
              ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg scale-105" 
              : "border-2 border-purple-400 text-purple-600 hover:bg-purple-50"
          )}
        >
          <FileText className="mr-2 h-5 w-5" />
          All Work
        </Button>
        <Button
          onClick={() => setFilterType("completed")}
          variant={filterType === "completed" ? "default" : "outline"}
          className={cn(
            "text-lg px-8 py-6 rounded-full font-bold transition-all",
            filterType === "completed" 
              ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg scale-105" 
              : "border-2 border-green-400 text-green-600 hover:bg-green-50"
          )}
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Finished
        </Button>
        <Button
          onClick={() => setFilterType("todo")}
          variant={filterType === "todo" ? "default" : "outline"}
          className={cn(
            "text-lg px-8 py-6 rounded-full font-bold transition-all",
            filterType === "todo" 
              ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg scale-105" 
              : "border-2 border-blue-400 text-blue-600 hover:bg-blue-50"
          )}
        >
          <Target className="mr-2 h-5 w-5" />
          To Do
        </Button>
      </div>

      {/* Assignments List */}
      <Card className="border-2 border-[#5e8b7e]/20">
        <CardHeader>
          <CardTitle className="text-xl text-[#5e8b7e]">My Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-xl font-bold text-gray-700">No Assignments Yet!</p>
              <p className="text-lg text-gray-600 mt-2">Check back later for new assignments</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
              <p className="text-xl font-bold text-gray-700">All Clear!</p>
              <p className="text-lg text-gray-600 mt-2">No assignments in this category</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssignments.map(assignment => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-[#5e8b7e] transition-colors cursor-pointer"
                  onClick={() => setSelectedAssignment(assignment)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">
                        {assignment.title}
                      </h3>
                      
                      {assignment.course_name && (
                        <p className="text-sm text-gray-600 mt-1">{assignment.course_name}</p>
                      )}

                      <div className="flex flex-wrap gap-3 mt-3">
                        {assignment.status === "Not Started" && (
                          <Badge className="bg-gray-100 text-gray-700 text-sm px-3 py-1">
                            <Clock className="mr-1 h-4 w-4" />
                            Not Started
                          </Badge>
                        )}
                        {assignment.status === "Submitted" && (
                          <Badge className="bg-blue-100 text-blue-700 text-sm px-3 py-1">
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Submitted
                          </Badge>
                        )}
                        {assignment.status === "Graded" && (
                          <Badge className="bg-green-100 text-green-700 text-sm px-3 py-1">
                            <Trophy className="mr-1 h-4 w-4" />
                            Graded
                          </Badge>
                        )}

                        <span className="text-sm text-gray-500">
                          Due: {format(new Date(assignment.due_date), "MMM d")}
                        </span>
                      </div>
                    </div>

                    {assignment.points_earned !== undefined && (
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#5e8b7e]">
                          {assignment.points_earned}
                        </div>
                        <div className="text-sm text-gray-600">
                          out of {assignment.points_possible}
                        </div>
                        {assignment.grade_percentage !== undefined && (
                          <div className={cn("text-sm font-bold mt-1 px-2 py-1 rounded-full inline-block", 
                            assignment.grade_percentage >= 90 ? "bg-green-100 text-green-700" :
                            assignment.grade_percentage >= 80 ? "bg-blue-100 text-blue-700" :
                            assignment.grade_percentage >= 70 ? "bg-yellow-100 text-yellow-700" :
                            assignment.grade_percentage >= 60 ? "bg-orange-100 text-orange-700" :
                            "bg-gray-100 text-gray-700"
                          )}>
                            {Math.round(assignment.grade_percentage)}%
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {assignment.feedback && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Teacher's Note:</p>
                      <p className="text-sm text-gray-700">{assignment.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Detail Dialog */}
      <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#5e8b7e]">
              {selectedAssignment?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedAssignment && (
            <div className="space-y-4">
              {selectedAssignment.description && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">What to do:</p>
                  <p className="text-gray-600">{selectedAssignment.description}</p>
                </div>
              )}

              {selectedAssignment.points_earned !== undefined && (
                <div className="text-center py-6 bg-gradient-to-b from-blue-50 to-white rounded-lg">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-gray-800">
                    {selectedAssignment.points_earned} / {selectedAssignment.points_possible}
                  </p>
                  <p className="text-lg text-gray-600">points</p>
                  {selectedAssignment.grade_percentage !== undefined && (
                    <div className={cn("text-xl font-bold mt-3 px-4 py-2 rounded-full inline-block",
                      getGradeColor(selectedAssignment.grade_percentage)
                    )}>
                      {Math.round(selectedAssignment.grade_percentage)}%
                    </div>
                  )}
                  <p className="text-lg font-medium text-gray-700 mt-3">
                    {getEncouragingMessage(selectedAssignment.grade_percentage || 0)}
                  </p>
                </div>
              )}

              {selectedAssignment.submission_text && (
                <div>
                  <p className="font-medium text-gray-700 mb-2">Your Answer:</p>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{selectedAssignment.submission_text}</p>
                  </div>
                </div>
              )}

              {selectedAssignment.feedback && (
                <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                  <p className="font-medium text-yellow-800 mb-1 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Teacher's Special Note:
                  </p>
                  <p className="text-gray-700">{selectedAssignment.feedback}</p>
                </div>
              )}

              <Button
                onClick={() => setSelectedAssignment(null)}
                className="w-full bg-[#5e8b7e] hover:bg-[#4a6e63] text-white"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

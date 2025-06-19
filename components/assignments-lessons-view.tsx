"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssignmentsView } from "./assignments-view"
import { LessonsView } from "./lessons-view"
import { type Assignment, type Student, type Course, type Lesson } from "@/lib/store"

interface AssignmentsLessonsViewProps {
  initialAssignments: Array<Assignment & { studentIds: string[] }>
  initialLessons: Lesson[]
  userStudents: Student[]
  userCourses: Course[]
}

export function AssignmentsLessonsView({ 
  initialAssignments, 
  initialLessons, 
  userStudents, 
  userCourses 
}: AssignmentsLessonsViewProps) {
  const [activeTab, setActiveTab] = useState("assignments")

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-[#e9f1e7] h-10 p-1">
          <TabsTrigger 
            value="assignments" 
            className="data-[state=active]:bg-[#5e8b7e] data-[state=active]:text-white"
          >
            Assignments
          </TabsTrigger>
          <TabsTrigger 
            value="lessons" 
            className="data-[state=active]:bg-[#5e8b7e] data-[state=active]:text-white"
          >
            Lessons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="mt-6">
          <AssignmentsView 
            initialAssignments={initialAssignments}
            userStudents={userStudents}
            userCourses={userCourses}
          />
        </TabsContent>

        <TabsContent value="lessons" className="mt-6">
          <LessonsView
            initialLessons={initialLessons}
            userStudents={userStudents}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
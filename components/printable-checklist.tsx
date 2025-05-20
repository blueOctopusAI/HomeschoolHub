import { format } from "date-fns"

interface PrintableChecklistProps {
  studentName: string
  weekStart: Date
  weekEnd: Date
  lessonsByDay: Record<string, any[]>
  completedLessons: number
  totalLessons: number
  lessonNotes: Record<string, string>
}

export function PrintableChecklist({
  studentName,
  weekStart,
  weekEnd,
  lessonsByDay,
  completedLessons,
  totalLessons,
  lessonNotes,
}: PrintableChecklistProps) {
  const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <div className="p-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#5e8b7e]">Weekly Homeschool Checklist</h1>
          <p className="text-[#5e8b7e]/70">
            {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}
          </p>
          <p className="font-medium mt-2">{studentName}</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-[#5e8b7e]">
              {completedLessons} of {totalLessons} lessons completed
            </span>
            <span className="text-sm font-medium text-[#5e8b7e]/70">{completionPercentage}% complete</span>
          </div>
          <div className="h-2.5 w-full bg-[#e9f1e7] rounded-full overflow-hidden">
            <div className="h-full bg-[#5e8b7e] rounded-full" style={{ width: `${completionPercentage}%` }}></div>
          </div>
        </div>

        <div className="space-y-8">
          {Object.entries(lessonsByDay).map(([day, dayLessons]) => {
            if (dayLessons.length === 0) return null

            return (
              <div key={day}>
                <h2 className="text-xl font-semibold text-[#5e8b7e] border-b-2 border-[#5e8b7e]/30 pb-2 mb-4">{day}</h2>
                <div className="space-y-4">
                  {dayLessons.map((lesson) => {
                    const startTime = new Date(lesson.startDate)
                    const endTime = new Date(lesson.endDate)

                    return (
                      <div key={lesson.id} className="border rounded-lg p-4 border-[#5e8b7e]/20">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-5 h-5 border border-[#5e8b7e] rounded-sm"></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h3 className="font-semibold text-[#5e8b7e]">{lesson.subjectName}</h3>
                              <span className="text-sm text-[#5e8b7e]/70">
                                {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{lesson.description}</p>

                            {lesson.materialsNeeded && (
                              <div className="mt-2">
                                <p className="text-sm font-medium">Materials Needed:</p>
                                <p className="text-sm">{lesson.materialsNeeded}</p>
                              </div>
                            )}

                            {lesson.tasks && lesson.tasks.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium mb-1">Tasks:</p>
                                <ul className="space-y-1">
                                  {lesson.tasks.map((task: any) => (
                                    <li key={task.id} className="flex items-start gap-2">
                                      <div className="w-4 h-4 border border-[#5e8b7e]/70 rounded-sm flex-shrink-0 mt-0.5"></div>
                                      <span className="text-sm">{task.description}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="mt-3">
                              <p className="text-sm font-medium">Notes:</p>
                              <div className="mt-1 border-t border-dashed border-[#5e8b7e]/30 pt-2 min-h-[40px]">
                                {lessonNotes[lesson.id] || ""}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 pt-4 border-t border-[#5e8b7e]/30">
          <h3 className="font-medium text-[#5e8b7e] mb-2">Weekly Notes:</h3>
          <div className="border border-[#5e8b7e]/30 rounded-lg p-4 min-h-[100px]"></div>
        </div>

        <div className="mt-8 text-center text-sm text-[#5e8b7e]/70">
          <p>Generated by Homeschool Hub on {format(new Date(), "MMMM d, yyyy")}</p>
        </div>
      </div>
    </div>
  )
}

"use client";

import { format } from "date-fns";
import { CheckCircle, Circle } from "lucide-react";
import { toggleLessonComplete } from "@/app/calendar/lessons-actions";

// Define Lesson type based on the database schema
type Lesson = {
  id: string;
  subject_name: string;
  subject_color?: string;
  description?: string;
  start_date: string;
  end_date: string;
  completed: boolean;
  objectives?: string;
  materials_needed?: string;
  location?: string;
};

export default function StudentChecklistView({ 
  lessons 
}: { 
  lessons: Lesson[] 
}) {
  // Format time range from start_date and end_date
  const formatTimeRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
  };

  return (
    <div className="student-checklist">
      {lessons.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No lessons scheduled for today.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {lessons.map((lesson) => (
            <li 
              key={lesson.id}
              className={`border rounded-lg p-4 transition-all ${
                lesson.completed ? "bg-sage-50 border-sage-200" : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: lesson.subject_color || "#5e8b7e" }}
                    />
                    <h4 className="font-medium text-gray-800">{lesson.subject_name}</h4>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatTimeRange(lesson.start_date, lesson.end_date)}
                  </p>
                  {lesson.description && (
                    <p className="text-sm text-gray-600 mt-2">{lesson.description}</p>
                  )}
                </div>
                <form action={toggleLessonComplete}>
                  <input type="hidden" name="lessonId" value={lesson.id} />
                  <input type="hidden" name="completed" value={(!lesson.completed).toString()} />
                  <button 
                    type="submit"
                    className="flex items-center text-sage-600 hover:text-sage-800 transition-colors"
                    aria-label={lesson.completed ? "Mark as incomplete" : "Mark as complete"}
                  >
                    {lesson.completed ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Circle className="h-6 w-6" />
                    )}
                  </button>
                </form>
              </div>
              
              {/* Optional details in an expandable section could go here in future iterations */}
              {(lesson.objectives || lesson.materials_needed || lesson.location) && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                  {lesson.objectives && (
                    <div className="mb-1">
                      <span className="font-medium">Objectives:</span> {lesson.objectives}
                    </div>
                  )}
                  {lesson.materials_needed && (
                    <div className="mb-1">
                      <span className="font-medium">Materials:</span> {lesson.materials_needed}
                    </div>
                  )}
                  {lesson.location && (
                    <div>
                      <span className="font-medium">Location:</span> {lesson.location}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

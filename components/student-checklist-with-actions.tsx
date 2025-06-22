"use client";

import { format } from "date-fns";
import { CheckCircle2, Circle, Loader2, BookOpen, Clock, MapPin, Target, Backpack, Sparkles } from "lucide-react";
import { useTransition, useState } from "react";
import { toggleLessonComplete } from "@/app/calendar/actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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

export default function StudentChecklistWithActions({ 
  lessons,
  studentId
}: { 
  lessons: Lesson[],
  studentId: string
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingLessonId, setPendingLessonId] = useState<string | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  // Format time range from start_date and end_date
  const formatTimeRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
  };

  // Handle lesson completion toggle with client-side refresh
  const handleToggleCompletion = async (lessonId: string, currentStatus: boolean) => {
    setPendingLessonId(lessonId);
    
    const formData = new FormData();
    formData.append('lessonId', lessonId);
    formData.append('completed', (!currentStatus).toString());
    
    startTransition(async () => {
      try {
        await toggleLessonComplete(undefined, formData);
        // Force refresh the current page
        router.refresh();
      } catch (error) {
        console.error("Error toggling lesson completion:", error);
      } finally {
        setPendingLessonId(null);
      }
    });
  };

  return (
    <div className="student-checklist">
      {lessons.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-700">Free Time!</p>
          <p className="text-gray-600 mt-2">No lessons scheduled for today</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Today's Progress</span>
              <span className="text-sm font-bold text-[#5e8b7e]">
                {lessons.filter(l => l.completed).length} / {lessons.length} Done
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${(lessons.filter(l => l.completed).length / lessons.length) * 100}%` 
                }}
              />
            </div>
          </div>

          {/* Lessons list */}
          <ul className="space-y-3">
            {lessons.map((lesson) => (
              <li 
                key={lesson.id}
                className={cn(
                  "border-2 rounded-xl p-5 transition-all transform hover:scale-[1.02] cursor-pointer",
                  lesson.completed 
                    ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-sm" 
                    : "bg-white border-gray-200 hover:border-[#5e8b7e] shadow-md"
                )}
                onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-inner"
                        style={{ backgroundColor: lesson.subject_color || "#5e8b7e" }}
                      >
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className={cn(
                          "font-bold text-lg",
                          lesson.completed ? "text-green-700" : "text-gray-800"
                        )}>
                          {lesson.subject_name}
                        </h4>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeRange(lesson.start_date, lesson.end_date)}
                        </p>
                      </div>
                    </div>
                    
                    {lesson.description && (
                      <p className={cn(
                        "text-sm mt-3 font-medium",
                        lesson.completed ? "text-green-700/80 line-through" : "text-gray-700"
                      )}>
                        {lesson.description}
                      </p>
                    )}
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCompletion(lesson.id, lesson.completed);
                    }}
                    disabled={isPending && pendingLessonId === lesson.id}
                    className={cn(
                      "flex items-center transition-all ml-4",
                      lesson.completed 
                        ? "text-green-600 hover:text-green-700" 
                        : "text-gray-400 hover:text-[#5e8b7e]"
                    )}
                    aria-label={lesson.completed ? "Mark as incomplete" : "Mark as complete"}
                  >
                    {isPending && pendingLessonId === lesson.id ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : lesson.completed ? (
                      <CheckCircle2 className="h-8 w-8" />
                    ) : (
                      <Circle className="h-8 w-8" />
                    )}
                  </button>
                </div>
                
                {/* Expandable details */}
                {expandedLesson === lesson.id && (lesson.objectives || lesson.materials_needed || lesson.location) && (
                  <div className="mt-4 pt-4 border-t-2 border-gray-100 space-y-3 animate-in slide-in-from-top-2">
                    {lesson.objectives && (
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-purple-500 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm text-purple-700">Today's Goal:</p>
                          <p className="text-sm text-gray-700">{lesson.objectives}</p>
                        </div>
                      </div>
                    )}
                    {lesson.materials_needed && (
                      <div className="flex items-start gap-3">
                        <Backpack className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm text-blue-700">What You Need:</p>
                          <p className="text-sm text-gray-700">{lesson.materials_needed}</p>
                        </div>
                      </div>
                    )}
                    {lesson.location && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-orange-500 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm text-orange-700">Where:</p>
                          <p className="text-sm text-gray-700">{lesson.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Completion celebration */}
          {lessons.length > 0 && lessons.every(l => l.completed) && (
            <div className="mt-6 p-6 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl text-center border-2 border-yellow-300">
              <Sparkles className="w-12 h-12 text-yellow-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-yellow-800">Amazing Job!</p>
              <p className="text-yellow-700">You finished all your lessons today!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

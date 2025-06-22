"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { updateAssignmentStatus } from "@/app/assignments/actions";
import { Calendar, FileText, Loader2, Send, Undo2, Trophy, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Assignment = {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  status: string;
  points_possible: number;
  points_earned?: number | null;
};

export default function StudentAssignmentActions({ 
  assignments,
  studentId
}: { 
  assignments: Assignment[], 
  studentId: string 
}) {
  console.log("StudentAssignmentActions received assignments:", assignments);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingAssignmentId, setPendingAssignmentId] = useState<string | null>(null);

  // Handle status change
  const handleStatusChange = async (assignmentId: string, newStatus: string) => {
    setPendingAssignmentId(assignmentId);
    
    const formData = new FormData();
    formData.append('assignmentId', assignmentId);
    formData.append('status', newStatus);
    
    startTransition(async () => {
      try {
        // Call the server action
        await updateAssignmentStatus(undefined, formData);
        // Force refresh the page
        router.refresh();
      } catch (error) {
        console.error("Error updating assignment status:", error);
      } finally {
        setPendingAssignmentId(null);
      }
    });
  };

  // Get days until due
  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get due date color
  const getDueDateColor = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return "text-red-600 bg-red-50";
    if (daysUntilDue === 0) return "text-orange-600 bg-orange-50";
    if (daysUntilDue <= 2) return "text-yellow-600 bg-yellow-50";
    return "text-blue-600 bg-blue-50";
  };

  // Get due date text
  const getDueDateText = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)} days late!`;
    if (daysUntilDue === 0) return "Due today!";
    if (daysUntilDue === 1) return "Due tomorrow";
    return `Due in ${daysUntilDue} days`;
  };

  return (
    <div className="student-assignments">
      {assignments.length === 0 ? (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No assignments right now!</p>
          <p className="text-sm text-gray-400 mt-1">Enjoy your free time!</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {assignments.map((assignment) => {
            const daysUntilDue = getDaysUntilDue(assignment.due_date);
            const isLoading = isPending && pendingAssignmentId === assignment.id;
            
            console.log(`Rendering assignment ${assignment.title}:`, {
              status: assignment.status,
              points_earned: assignment.points_earned,
              isGraded: assignment.status === 'Graded',
              hasPoints: assignment.points_earned !== null && assignment.points_earned !== undefined
            });
            
            return (
              <li 
                key={assignment.id} 
                className={cn(
                  "border-2 rounded-xl p-5 transition-all",
                  assignment.status === 'Graded' 
                    ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300" 
                    : assignment.status === 'Submitted'
                    ? "bg-gradient-to-r from-blue-50 to-sky-50 border-blue-300"
                    : "bg-white border-gray-200 hover:border-[#5e8b7e] shadow-sm"
                )}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        assignment.status === 'Graded' ? "bg-green-200" :
                        assignment.status === 'Submitted' ? "bg-blue-200" :
                        "bg-gray-200"
                      )}>
                        <FileText className={cn(
                          "h-5 w-5",
                          assignment.status === 'Graded' ? "text-green-700" :
                          assignment.status === 'Submitted' ? "text-blue-700" :
                          "text-gray-700"
                        )} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-800">{assignment.title}</h4>
                        
                        <div className="flex items-center gap-3 mt-2">
                          <Badge className={cn(
                            "text-xs font-medium px-3 py-1",
                            getDueDateColor(daysUntilDue)
                          )}>
                            <Clock className="w-3 h-3 mr-1" />
                            {getDueDateText(daysUntilDue)}
                          </Badge>
                          
                          <span className="text-sm text-gray-600 font-medium">
                            {assignment.points_possible} points
                          </span>
                        </div>
                        
                        {assignment.description && (
                          <p className="text-sm text-gray-600 mt-3">{assignment.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <Badge 
                      variant="secondary"
                      className={cn(
                        "text-sm font-bold px-4 py-2",
                        assignment.status === 'Graded' ? 'bg-green-100 text-green-800 border-green-300' : 
                        assignment.status === 'Submitted' ? 'bg-blue-100 text-blue-800 border-blue-300' : 
                        'bg-gray-100 text-gray-800 border-gray-300'
                      )}
                    >
                      {assignment.status}
                    </Badge>
                    
                    {/* Status change buttons - only show if status isn't Graded */}
                    {assignment.status !== 'Graded' && (
                      <div className="flex gap-2">
                        {assignment.status === 'Not Started' && (
                          <Button
                            onClick={() => handleStatusChange(assignment.id, 'Submitted')}
                            disabled={isLoading}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-1" />
                                Submit
                              </>
                            )}
                          </Button>
                        )}
                        
                        {assignment.status === 'Submitted' && (
                          <Button
                            onClick={() => handleStatusChange(assignment.id, 'Not Started')}
                            disabled={isLoading}
                            size="sm"
                            variant="outline"
                            className="border-gray-300 hover:bg-gray-50"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Undo2 className="h-4 w-4 mr-1" />
                                Undo
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {/* Show grade if graded */}
                    {assignment.status === 'Graded' && (
                      <div className="text-center">
                        {assignment.points_earned !== null && assignment.points_earned !== undefined ? (
                          <>
                            <p className="text-2xl font-bold text-green-700">
                              {assignment.points_earned}/{assignment.points_possible}
                            </p>
                            <p className="text-sm text-green-600 font-medium">Points Earned</p>
                            {assignment.points_possible > 0 && (
                              <p className="text-xs text-green-600">
                                {Math.round((assignment.points_earned / assignment.points_possible) * 100)}%
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-600">Grade pending</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

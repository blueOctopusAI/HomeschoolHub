"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { updateAssignmentStatus } from "@/app/assignments/actions";

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

  return (
    <div className="student-assignments">
      {assignments.length === 0 ? (
        <p className="text-gray-500 italic">No upcoming assignments.</p>
      ) : (
        <ul className="space-y-3">
          {assignments.map((assignment) => (
            <li key={assignment.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-800">{assignment.title}</h4>
                  <p className="text-sm text-gray-500">
                    Due: {new Date(assignment.due_date).toLocaleDateString()} 
                  </p>
                  {assignment.description && (
                    <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div 
                    className={`px-2 py-1 rounded text-xs font-medium 
                      ${assignment.status === 'Not Started' ? 'bg-gray-100 text-gray-800' : 
                        assignment.status === 'Submitted' ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'}`}
                  >
                    {assignment.status}
                  </div>
                  
                  {/* Status change buttons - only show if status isn't Graded */}
                  {assignment.status !== 'Graded' && (
                    <div className="flex gap-1 mt-1">
                      {assignment.status === 'Not Started' && (
                        <button
                          onClick={() => handleStatusChange(assignment.id, 'Submitted')}
                          disabled={isPending && pendingAssignmentId === assignment.id}
                          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                        >
                          {isPending && pendingAssignmentId === assignment.id ? 'Updating...' : 'Mark Submitted'}
                        </button>
                      )}
                      
                      {assignment.status === 'Submitted' && (
                        <button
                          onClick={() => handleStatusChange(assignment.id, 'Not Started')}
                          disabled={isPending && pendingAssignmentId === assignment.id}
                          className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors"
                        >
                          {isPending && pendingAssignmentId === assignment.id ? 'Updating...' : 'Mark Not Started'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
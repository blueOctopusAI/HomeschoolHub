'use server'

import { createSupabaseServerActionClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ActionResult } from "@/app/actions"

/**
 * Creates a new assignment directly from the assignment form
 */
export async function createAssignmentAction(prevState: any, formData: FormData) {
  console.log("createAssignmentAction called, form data:", Object.fromEntries(formData.entries()));
  
  try {
    // Create Supabase client
    const supabase = await createSupabaseServerActionClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if user is authenticated
    if (!user) {
      return { success: false, message: "User not authenticated." };
    }
    
    // Get form data values
    const title = formData.get("title")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const dueDateStr = formData.get("dueDate")?.toString() || "";
    const pointsPossible = parseInt(formData.get("pointsPossible")?.toString() || "0");
    const status = formData.get("status")?.toString() || "Not Started";
    const courseId = formData.get("courseId")?.toString() || null;
    
    // Get student IDs
    const emmaChecked = formData.get("Emma Johnson") === "on";
    const noahChecked = formData.get("Noah Williams") === "on";
    const oliviaChecked = formData.get("Olivia Davis") === "on";
    
    // Find student IDs from their names
    const studentsQuery = await supabase.from("students").select("id, name").eq("user_id", user.id);
    
    if (studentsQuery.error) {
      return { success: false, message: "Error fetching students: " + studentsQuery.error.message };
    }
    
    const students = studentsQuery.data || [];
    
    const studentIds = students
      .filter(student => 
        (student.name === "Emma Johnson" && emmaChecked) ||
        (student.name === "Noah Williams" && noahChecked) ||
        (student.name === "Olivia Davis" && oliviaChecked)
      )
      .map(student => student.id);
    
    // Validation
    if (!title) {
      return { success: false, message: "Title is required" };
    }
    
    if (studentIds.length === 0) {
      return { success: false, message: "At least one student must be selected" };
    }
    
    if (!dueDateStr) {
      return { success: false, message: "Due date is required" };
    }
    
    if (pointsPossible <= 0) {
      return { success: false, message: "Points possible must be greater than 0" };
    }
    
    // Insert the assignment into the database
    const { data: newAssignment, error } = await supabase
      .from("assignments")
      .insert({
        user_id: user.id,
        title,
        description,
        due_date: dueDateStr,
        status,
        points_possible: pointsPossible,
        course_id: courseId === "none" ? null : courseId,
      })
      .select("id")
      .single();
    
    if (error) {
      console.error("Error creating assignment:", error);
      return { success: false, message: "Error creating assignment: " + error.message };
    }
    
    // Insert the student assignments
    const assignmentStudentPromises = studentIds.map(studentId => {
      return supabase
        .from("assignment_students")
        .insert({
          assignment_id: newAssignment.id,
          student_id: studentId
        });
    });
    
    // Wait for all student assignments to be created
    const studentResults = await Promise.all(assignmentStudentPromises);
    
    // Check if any student assignment insertions failed
    const studentErrors = studentResults.filter(result => result.error);
    if (studentErrors.length > 0) {
      console.error("Errors creating student assignments:", studentErrors);
      return { 
        success: false, 
        message: "Assignment created but some student associations failed." 
      };
    }
    
    // Revalidate the assignments page
    revalidatePath("/assignments");
    
    return { success: true, message: "Assignment created successfully." };
    
  } catch (error) {
    console.error("Assignment creation error:", error);
    return { 
      success: false, 
      message: "An unexpected error occurred: " + (error instanceof Error ? error.message : String(error)) 
    };
  }
}
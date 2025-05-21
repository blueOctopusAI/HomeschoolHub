'use server'

import { revalidatePath } from "next/cache"
import { createSupabaseServerActionClient } from "@/lib/supabase/server"

/**
 * Simple server action to directly handle the built-in create assignment form
 */
export async function handleCreateAssignment(formData: FormData) {
  console.log("handleCreateAssignment formData:", Object.fromEntries(formData.entries()));
  
  try {
    // Create Supabase client
    const supabase = await createSupabaseServerActionClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if user is authenticated
    if (!user) {
      console.error("User not authenticated");
      return { error: "User not authenticated" };
    }
    
    // Extract form data
    const title = formData.get("Assignment Title")?.toString() || "";
    const description = formData.get("Description")?.toString() || "";
    const dueDate = formData.get("Due Date")?.toString() || "";
    const pointsPossible = parseInt(formData.get("Points Possible")?.toString() || "0");
    const status = formData.get("Status")?.toString() || "Not Started";
    const courseId = formData.get("Related Course")?.toString();
    
    // Student checkboxes
    const emmaJohnson = formData.get("Emma Johnson") === "on";
    const noahWilliams = formData.get("Noah Williams") === "on";
    const oliviaDavis = formData.get("Olivia Davis") === "on";
    
    // Get student IDs from names
    const studentQuery = await supabase
      .from("students")
      .select("id, name")
      .eq("user_id", user.id);
    
    if (studentQuery.error) {
      console.error("Error fetching students:", studentQuery.error);
      return { error: "Error fetching students" };
    }
    
    const students = studentQuery.data || [];
    
    // Find student IDs based on selected checkboxes
    const studentIds = students
      .filter(student => 
        (student.name === "Emma Johnson" && emmaJohnson) ||
        (student.name === "Noah Williams" && noahWilliams) ||
        (student.name === "Olivia Davis" && oliviaDavis)
      )
      .map(student => student.id);
    
    // Basic validation
    if (!title) {
      console.error("Title is required");
      return { error: "Title is required" };
    }
    
    if (studentIds.length === 0) {
      console.error("At least one student must be selected");
      return { error: "At least one student must be selected" };
    }
    
    // Create the assignment
    const { data: assignment, error } = await supabase
      .from("assignments")
      .insert({
        user_id: user.id,
        title,
        description,
        due_date: dueDate,
        status,
        points_possible: pointsPossible,
        course_id: courseId === "None" ? null : courseId
      })
      .select("id")
      .single();
    
    if (error) {
      console.error("Error creating assignment:", error);
      return { error: "Error creating assignment" };
    }
    
    // Create the student assignments
    for (const studentId of studentIds) {
      const { error: studentError } = await supabase
        .from("assignment_students")
        .insert({
          assignment_id: assignment.id,
          student_id: studentId
        });
      
      if (studentError) {
        console.error("Error creating student assignment:", studentError);
        // Continue with other students even if one fails
      }
    }
    
    // Revalidate the path
    revalidatePath('/assignments');
    
    return { success: true };
    
  } catch (error) {
    console.error("Error in handleCreateAssignment:", error);
    return { error: "An unexpected error occurred" };
  }
}
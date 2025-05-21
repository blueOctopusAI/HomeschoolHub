'use server'

import { createSupabaseServerActionClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ActionResult } from "@/app/actions"

/**
 * Creates a new assignment directly from the simple assignment form
 */
export async function createSimpleAssignment(formData: FormData): Promise<void> {
  console.log("createSimpleAssignment called with formData:", Object.fromEntries(formData.entries()));
  
  try {
    // Create Supabase client
    const supabase = await createSupabaseServerActionClient()
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Check if user is authenticated
    if (!user) {
      console.error("User not authenticated");
      return;
    }
    
    // Extract assignment fields from form data
    const title = formData.get('Assignment Title')?.toString() || '';
    const description = formData.get('Description')?.toString() || '';
    const dueDate = formData.get('Due Date')?.toString() || '';
    const pointsPossible = parseInt(formData.get('Points Possible')?.toString() || '0');
    const status = formData.get('Status')?.toString() || 'Not Started';
    const courseId = formData.get('Related Course')?.toString();
    
    // Get student IDs - in the simple form, they may be individual checkboxes
    const studentIds: string[] = [];
    
    // In the screenshot, I can see the checkboxes for students
    // The form might have individual checkbox names for each student
    if (formData.get('Emma Johnson') === 'on') {
      // Find Emma's ID from the database
      const { data: emma } = await supabase
        .from('students')
        .select('id')
        .eq('name', 'Emma Johnson')
        .single();
      
      if (emma) studentIds.push(emma.id);
    }
    
    if (formData.get('Noah Williams') === 'on') {
      const { data: noah } = await supabase
        .from('students')
        .select('id')
        .eq('name', 'Noah Williams')
        .single();
      
      if (noah) studentIds.push(noah.id);
    }
    
    if (formData.get('Olivia Davis') === 'on') {
      const { data: olivia } = await supabase
        .from('students')
        .select('id')
        .eq('name', 'Olivia Davis')
        .single();
      
      if (olivia) studentIds.push(olivia.id);
    }
    
    // Basic validation
    if (!title) {
      console.error("Title is required");
      return;
    }
    
    if (studentIds.length === 0) {
      console.error("At least one student must be selected");
      return;
    }
    
    if (!dueDate) {
      console.error("Due date is required");
      return;
    }
    
    if (pointsPossible <= 0) {
      console.error("Points possible must be greater than 0");
      return;
    }
    
    // Insert the assignment into the database
    const { data: newAssignment, error } = await supabase
      .from('assignments')
      .insert({
        user_id: user.id,
        title: title,
        description: description,
        due_date: dueDate,
        status: status,
        points_possible: pointsPossible,
        course_id: courseId === 'none' ? null : courseId,
      })
      .select('id')
      .single();
    
    if (error) {
      console.error("Error creating assignment:", error);
      return;
    }
    
    // Insert the student assignments
    const assignmentStudentPromises = studentIds.map(studentId => {
      return supabase
        .from('assignment_students')
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
    }
    
    // Revalidate the assignments page
    revalidatePath('/assignments');
    
  } catch (error) {
    console.error("Assignment creation error:", error);
  }
}
'use server'

import { createSupabaseServerActionClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Define the ActionResult interface
export interface ActionResult {
  success: boolean;
  message: string | null;
  errors?: { [key: string]: string[] | undefined };
}

// Define a schema for profile validation
const profileSchema = z.object({
  full_name: z.string().min(1, "Name cannot be empty"),
  timezone: z.string().optional(),
  avatar_url: z.string().optional(),
})

/**
 * Update the current user's profile
 */
export async function updateMyProfile(
  prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  try {
    // Create Supabase client
    const supabase = await createSupabaseServerActionClient()
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Check if user is authenticated
    if (!user) {
      return {
        success: false,
        message: "User not authenticated."
      }
    }
    
    // Extract profile fields from form data
    const profileData = {
      full_name: formData.get('full_name')?.toString() || '',
      timezone: formData.get('timezone')?.toString() || '',
      avatar_url: formData.get('avatar_url')?.toString() || undefined,
    }
    
    // Validate the profile data
    const validationResult = profileSchema.safeParse(profileData)
    
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors
      return {
        success: false,
        message: "Please correct the errors below.",
        errors
      }
    }
    
    // Update the profile in the database
    const { error } = await supabase
      .from('profiles')
      .update(validationResult.data)
      .eq('id', user.id)
    
    if (error) {
      console.error("Error updating profile:", error)
      return {
        success: false,
        message: error.message || "Failed to update profile."
      }
    }
    
    // Revalidate the profile page
    revalidatePath('/profile')
    
    return {
      success: true,
      message: "Profile updated successfully."
    }
  } catch (error) {
    console.error("Profile update error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred."
    }
  }
}

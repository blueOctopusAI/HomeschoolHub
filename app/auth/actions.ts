"use server"

// Import the Supabase server client
import { createSupabaseServerActionClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// Define the ActionResult interface
export interface ActionResult {
  success: boolean;
  message: string | null;
  errors?: { [key: string]: string[] | undefined };
}

// Login server action
export async function login(
  prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  try {
    // Get form data
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Validate input
    if (!email || !email.includes("@")) {
      return {
        success: false,
        message: "Please provide a valid email address",
        errors: {
          email: ["Please provide a valid email address"]
        }
      }
    }

    if (!password || password.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters",
        errors: {
          password: ["Password must be at least 6 characters"]
        }
      }
    }

    // Create Supabase client
    const supabase = await createSupabaseServerActionClient()
    
    // Sign in with email and password
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        message: error.message,
      }
    }

    // Success - redirect to dashboard
    // This will throw a NEXT_REDIRECT error, which is expected
    redirect('/dashboard')
    
    // This return is theoretically unreachable due to the redirect
    return {
      success: true,
      message: "Successfully logged in",
    }
  } catch (error) {
    // Filter out NEXT_REDIRECT errors as they're expected
    if (error instanceof Error && 'digest' in error && error.digest?.includes('NEXT_REDIRECT')) {
      // This is an expected redirect, not a real error
      throw error; // Re-throw to let Next.js handle the redirect
    }
    
    // Log only actual errors
    console.error("Login error:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

// Signup server action
export async function signup(
  prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  try {
    // Get form data
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string || null

    // Validate input
    if (!email || !email.includes("@")) {
      return {
        success: false,
        message: "Please provide a valid email address",
        errors: {
          email: ["Please provide a valid email address"]
        }
      }
    }

    if (!password || password.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters",
        errors: {
          password: ["Password must be at least 6 characters"]
        }
      }
    }

    // Create Supabase client
    const supabase = await createSupabaseServerActionClient()

    // Sign up with email and password
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      return {
        success: false,
        message: error.message,
      }
    }

    // Success
    return {
      success: true,
      message: "Successfully signed up. Check your email for confirmation.",
    }
  } catch (error) {
    console.error("Signup error:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

// Logout server action
export async function signOut() {
  try {
    const supabase = await createSupabaseServerActionClient()
    await supabase.auth.signOut()
    
    // Always redirect to login page regardless of errors
    redirect('/login')
  } catch (error) {
    // Filter out NEXT_REDIRECT errors as they're expected
    if (error instanceof Error && 'digest' in error && error.digest?.includes('NEXT_REDIRECT')) {
      // This is an expected redirect, not a real error
      throw error; // Re-throw to let Next.js handle the redirect
    }
    
    // Log only actual errors
    console.error("Logout error:", error)
    
    // If we get here, try to force a redirect anyway
    redirect('/login')
  }
}

// Alias for logout
export const logout = signOut;

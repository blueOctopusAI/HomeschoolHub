"use server"

// Import the Supabase server client
import { createSupabaseServerActionClient } from "@/lib/supabase/server"

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
    const supabase = createSupabaseServerActionClient()

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

    // Success
    return {
      success: true,
      message: "Successfully logged in",
    }
  } catch (error) {
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
    const supabase = createSupabaseServerActionClient()

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
export async function logout(): Promise<ActionResult> {
  try {
    const supabase = createSupabaseServerActionClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        message: error.message,
      }
    }

    return {
      success: true,
      message: "Successfully logged out",
    }
  } catch (error) {
    console.error("Logout error:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
    }
  }
}

import { createSupabaseServerActionClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Attempt to create a client instance to check if env vars are okay
    const supabase = createSupabaseServerActionClient()
    
    // Perform a simple query to check database connectivity
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error("Health check Supabase query error:", error)
      return NextResponse.json(
        { 
          status: "error", 
          message: "Supabase client initialized but query failed",
          error: error.message
        }, 
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      status: "ok", 
      message: "Supabase client and database connection healthy" 
    })
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      { 
        status: "error", 
        message: "Failed to initialize Supabase client",
        error: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
}
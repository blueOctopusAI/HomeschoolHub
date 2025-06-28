"use client"

import { useEffect } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useStore } from "@/lib/store"
import { Student } from "@/lib/store"

export function StudentsLoader() {
  const setStudents = useStore((state) => state.setStudents)
  const authUser = useStore((state) => state.authUser)
  
  useEffect(() => {
    if (!authUser) return
    
    const loadStudents = async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        
        // Fetch students for the authenticated user
        const { data: userStudents, error } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error("Error fetching students:", error)
          return
        }
        
        // Transform students to match the Student type
        const transformedStudents = userStudents?.map(student => ({
          id: student.id,
          name: student.name,
          gradeLevel: student.grade_level || undefined,
          notes: student.notes || undefined,
          profileImage: student.profile_image_url || undefined,
          initials: student.initials || undefined
        } as Student)) || []
        
        // Always include "All Students" option
        const studentsWithAll = [
          { id: "all", name: "All Students" },
          ...transformedStudents
        ]
        
        // Update the store
        setStudents(studentsWithAll)
      } catch (error) {
        console.error("Error loading students:", error)
      }
    }
    
    loadStudents()
    
    // Set up real-time subscription to students table
    const supabase = createSupabaseBrowserClient()
    const subscription = supabase
      .channel('students-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'students',
          filter: `user_id=eq.${authUser.id}`
        }, 
        () => {
          // Reload students when any change occurs
          loadStudents()
        }
      )
      .subscribe()
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [authUser, setStudents])
  
  // This component doesn't render anything
  return null
}

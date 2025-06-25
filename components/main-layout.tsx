"use client"

import { useEffect } from "react"
import { useStore } from "@/lib/store"
import { usePathname } from "next/navigation"
import type { View } from "@/lib/store"
import { useSyncStoreWithSupabase } from "@/lib/hooks/use-sync-store"

// List of valid views
const VALID_VIEWS = [
  "dashboard", "students", "calendar", "assignments", "checklist", 
  "portfolio", "compliance", "transcript", "settings"
] as const

export function MainLayout({ children }: { children: React.ReactNode }) {
  // Get minimal state from store
  const setCurrentView = useStore((state) => state.setCurrentView)
  const pathname = usePathname()
  
  // Sync Supabase data with Zustand store
  const { loading, errors, hasErrors } = useSyncStoreWithSupabase()

  // Sync pathname with current view in store
  useEffect(() => {
    try {
      const path = pathname.split('/')[1] || 'dashboard'
      
      // Only set if it's a valid view
      if (VALID_VIEWS.includes(path as View)) {
        setCurrentView(path as View)
      }
    } catch (error) {
      console.error('Error syncing path to view:', error)
    }
  }, [pathname, setCurrentView])
  
  // Log any data loading errors
  useEffect(() => {
    if (hasErrors) {
      console.error('Errors loading data:', errors)
    }
  }, [hasErrors, errors])

  // Return the children wrapped in our data context
  return <>{children}</>
}

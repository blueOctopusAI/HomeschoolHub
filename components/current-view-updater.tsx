"use client"

import { useEffect } from "react"
import { useStore } from "@/lib/store"
import { usePathname } from "next/navigation"
import type { View } from "@/lib/store"

// List of valid views
const VALID_VIEWS = [
  "dashboard", "students", "calendar", "assignments", "checklist", 
  "reports", "portfolio", "compliance", "transcript", "settings"
] as const

/**
 * Component that syncs the current URL pathname with the currentView in the Zustand store.
 * This component doesn't render any UI elements.
 */
export function CurrentViewUpdater() {
  // Get minimal state from store
  const setCurrentView = useStore((state) => state.setCurrentView)
  const pathname = usePathname()

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

  return null // This component doesn't render anything
}

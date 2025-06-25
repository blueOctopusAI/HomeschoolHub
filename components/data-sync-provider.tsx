"use client"

import { useEffect } from "react"
import { useSyncStoreWithSupabase } from "@/lib/hooks/use-sync-store"

export function DataSyncProvider({ children }: { children: React.ReactNode }) {
  // This hook will sync all data from Supabase to the Zustand store
  const { loading, errors, hasErrors } = useSyncStoreWithSupabase()

  // Log any errors
  useEffect(() => {
    if (hasErrors) {
      console.error('Errors loading data:', errors)
    }
  }, [hasErrors, errors])

  return <>{children}</>
}

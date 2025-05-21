"use client"

import { useEffect } from "react"
import { useDataSync } from "@/lib/services/data-sync"
import { useAuth } from "@/lib/store"

export function DataSyncInitializer({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const { initialize } = useDataSync()
  
  useEffect(() => {
    // Initialize data synchronization once the user is authenticated
    if (user && !isLoading) {
      initialize().catch(error => {
        console.error("Failed to initialize data synchronization:", error)
      })
    }
  }, [user, isLoading, initialize])
  
  return <>{children}</>
}

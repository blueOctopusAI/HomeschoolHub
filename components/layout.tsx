"use client"

import type { ReactNode } from "react"
import { MobileSidebar } from "./mobile-sidebar"
import { Topbar } from "./topbar"
import { useAuthUser, useAuthLoading } from "@/lib/store"
import { usePathname } from "next/navigation"
import { useMemo, useState, useEffect } from "react"
import { Toaster } from "@/components/ui/toaster"


export function Layout({ children }: { children: ReactNode }) {
  // Use separate selectors for auth state
  const user = useAuthUser()
  const isLoading = useAuthLoading()
  const pathname = usePathname()
  
  // Add a timeout state to bypass loading state if it takes too long
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  
  // Set a timeout to bypass the loading state after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true)
    }, 3000)
    
    return () => {
      clearTimeout(timer)
    }
  }, [])
  
  // Memoize the auth page check to avoid unnecessary rerenders
  const isAuthPage = useMemo(() => {
    return pathname === "/login" || pathname === "/signup"
  }, [pathname])
  
  // Check if this is a student portal page
  const isStudentPortalPage = useMemo(() => {
    return pathname.startsWith('/student/')
  }, [pathname])
  
  // If loading and the timeout hasn't occurred yet, show a loading indicator
  if (isLoading && !loadingTimeout) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#faf9f5]">
        <div className="text-[#5e8b7e]">Loading...</div>
      </div>
    )
  }

  // For auth pages, don't show the app layout (sidebar/topbar)
  if (isAuthPage || isStudentPortalPage) {
    return (
      <div className="flex h-screen bg-[#faf9f5]">
        <main className="flex-1 overflow-auto p-4">{children}</main>
        <Toaster />
      </div>
    )
  }

  // For regular app pages, show the full layout
  return (
    <div className="flex h-screen bg-[#faf9f5]">
      <MobileSidebar />
      <div className="flex-1 flex flex-col md:ml-[220px]">
        <Topbar />
        <main className="flex-1 overflow-auto p-2 md:p-4">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}

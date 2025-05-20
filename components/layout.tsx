"use client"

import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { useAuthUser, useAuthLoading } from "@/lib/store"
import { usePathname } from "next/navigation"
import { useMemo } from "react"

export function Layout({ children }: { children: ReactNode }) {
  // Use separate selectors for auth state
  const user = useAuthUser()
  const isLoading = useAuthLoading()
  const pathname = usePathname()
  
  // Memoize the auth page check to avoid unnecessary rerenders
  const isAuthPage = useMemo(() => {
    return pathname === "/login" || pathname === "/signup"
  }, [pathname])
  
  // If loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#faf9f5]">
        <div className="text-[#5e8b7e]">Loading...</div>
      </div>
    )
  }

  // For auth pages, don't show the app layout (sidebar/topbar)
  if (isAuthPage) {
    return (
      <div className="flex h-screen bg-[#faf9f5]">
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    )
  }

  // For regular app pages, show the full layout
  return (
    <div className="flex h-screen bg-[#faf9f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[220px]">
        <Topbar />
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  )
}

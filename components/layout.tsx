"use client"

import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"

export function Layout({ children }: { children: ReactNode }) {
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

"use client"

import { useStore } from "@/lib/store"
import { Logo } from "./logo"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  Calendar,
  CheckSquare,
  FileText,
  Home,
  ScrollText,
  Settings,
  Briefcase,
  ClipboardCheck,
} from "lucide-react"
import { type View } from "@/lib/store"
import { usePathname, useRouter } from "next/navigation"
import { useCallback } from "react"

export function Sidebar() {
  // Get state and actions from Zustand store
  const currentView = useStore((state) => state.currentView)
  const setCurrentView = useStore((state) => state.setCurrentView)
  const students = useStore((state) => state.students)
  const selectedStudent = useStore((state) => state.selectedStudent)
  const setSelectedStudent = useStore((state) => state.setSelectedStudent)
  
  const router = useRouter()
  const pathname = usePathname()
  
  // We're removing this effect since MainLayout already handles this
  // This removes duplicate effects that might cause rendering loops

  const navItems = [
    {
      name: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      value: "dashboard",
    },
    {
      name: "Calendar",
      icon: <Calendar className="h-5 w-5" />,
      value: "calendar",
    },
    {
      name: "Assignments",
      icon: <BookOpen className="h-5 w-5" />,
      value: "assignments",
    },
    {
      name: "Checklist",
      icon: <CheckSquare className="h-5 w-5" />,
      value: "checklist",
    },
    {
      name: "Reports",
      icon: <FileText className="h-5 w-5" />,
      value: "reports",
    },
    {
      name: "Portfolio",
      icon: <Briefcase className="h-5 w-5" />,
      value: "portfolio",
    },
    {
      name: "Compliance",
      icon: <ClipboardCheck className="h-5 w-5" />,
      value: "compliance",
    },
    {
      name: "Transcript",
      icon: <ScrollText className="h-5 w-5" />,
      value: "transcript",
    },
    {
      name: "Settings",
      icon: <Settings className="h-5 w-5" />,
      value: "settings",
    },
  ]

  const handleNavigation = useCallback((view: string) => {
    try {
      // Let router handle the navigation directly
      router.push(`/${view}`)
      // View will be updated by MainLayout based on pathname
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }, [router])

  return (
    <div className="fixed top-0 left-0 h-full w-[220px] bg-white border-r border-[#5e8b7e]/10 flex flex-col no-print">
      <div className="p-4">
        <Logo />
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.value}>
              <button
                onClick={() => handleNavigation(item.value)}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  currentView === item.value
                    ? "bg-[#5e8b7e] text-white"
                    : "text-gray-700 hover:bg-[#5e8b7e]/10 hover:text-[#5e8b7e]",
                )}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Students Section */}
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Students</h3>
          <ul className="mt-2 space-y-1">
            {students.map((student) => (
              <li key={student.id}>
                <button
                  onClick={() => setSelectedStudent(student.id)}
                  className={cn(
                    "flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    selectedStudent === student.id
                      ? "bg-[#5e8b7e]/10 text-[#5e8b7e]"
                      : "text-gray-700 hover:bg-[#5e8b7e]/10 hover:text-[#5e8b7e]",
                  )}
                >
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-[#5e8b7e]/10 text-[#5e8b7e] text-xs font-medium">
                    {student.initials || student.name.charAt(0)}
                  </div>
                  <span className="ml-3 truncate">{student.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="p-4">
        <div className="rounded-md bg-[#f0f7f4] p-3">
          <h3 className="font-medium text-[#5e8b7e]">Need Help?</h3>
          <p className="mt-1 text-xs text-[#5e8b7e]/70">Check our documentation or contact support for assistance.</p>
          <button className="mt-2 w-full py-1 px-2 text-xs font-medium rounded-md border border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#5e8b7e] hover:text-white transition-colors">
            View Documentation
          </button>
        </div>
      </div>
    </div>
  )
}

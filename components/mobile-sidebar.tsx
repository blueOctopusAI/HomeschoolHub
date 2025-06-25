"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { Logo } from "./logo"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Home,
  ScrollText,
  Settings,
  Briefcase,
  ClipboardCheck,
  Users,
  Menu,
  X,
} from "lucide-react"
import { type View } from "@/lib/store"
import { usePathname, useRouter } from "next/navigation"
import { useCallback } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const currentView = useStore((state) => state.currentView)
  const students = useStore((state) => state.students)
  const selectedStudent = useStore((state) => state.selectedStudent)
  const setSelectedStudent = useStore((state) => state.setSelectedStudent)
  
  const router = useRouter()
  const pathname = usePathname()
  const [dbStudentIdMap, setDbStudentIdMap] = useState<{[key: string]: string}>({})
  
  // Load actual student IDs from database
  useEffect(() => {
    const loadStudentIds = async () => {
      if (students.length > 0) {
        const supabase = createSupabaseBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: dbStudents } = await supabase
            .from('students')
            .select('id, name')
            .eq('user_id', user.id)
          
          if (dbStudents?.length) {
            const mapping: {[key: string]: string} = {}
            
            dbStudents.forEach(dbStudent => {
              const matchingStoreStudent = students.find(s => 
                s.name.toLowerCase() === dbStudent.name.toLowerCase()
              )
              if (matchingStoreStudent) {
                mapping[matchingStoreStudent.id] = dbStudent.id
              }
            })
            
            setDbStudentIdMap(mapping)
          }
        }
      }
    }
    
    loadStudentIds()
  }, [students])

  const navItems = [
    {
      name: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      value: "dashboard",
    },
    {
      name: "Students",
      icon: <Users className="h-5 w-5" />,
      value: "students",
    },
    {
      name: "Calendar",
      icon: <Calendar className="h-5 w-5" />,
      value: "calendar",
    },
    {
      name: "Assignments/Lessons",
      icon: <BookOpen className="h-5 w-5" />,
      value: "assignments",
    },
    {
      name: "Checklist",
      icon: <CheckSquare className="h-5 w-5" />,
      value: "checklist",
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
      router.push(`/${view}`)
      setIsOpen(false) // Close sidebar on navigation
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }, [router])

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:flex fixed top-0 left-0 h-full w-[220px] bg-white border-r border-[#5e8b7e]/10 flex-col no-print">
        <div className="p-0">
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

      {/* Mobile Hamburger Menu */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 bg-white border-[#5e8b7e]/20"
            >
              <Menu className="h-5 w-5 text-[#5e8b7e]" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-[#5e8b7e]/10">
                <Logo />
              </div>

              <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-1">
                  {navItems.map((item) => (
                    <li key={item.value}>
                      <button
                        onClick={() => handleNavigation(item.value)}
                        className={cn(
                          "flex items-center w-full px-3 py-3 text-sm font-medium rounded-md transition-colors",
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
              </nav>

              <div className="p-4 border-t border-[#5e8b7e]/10">
                <div className="rounded-md bg-[#f0f7f4] p-3">
                  <h3 className="font-medium text-[#5e8b7e] text-sm">Need Help?</h3>
                  <p className="mt-1 text-xs text-[#5e8b7e]/70">Check our documentation or contact support.</p>
                  <button className="mt-2 w-full py-1.5 px-2 text-xs font-medium rounded-md border border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#5e8b7e] hover:text-white transition-colors">
                    View Documentation
                  </button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}

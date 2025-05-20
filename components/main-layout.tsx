"use client"

   import { useStore } from "@/lib/store"
   import { Sidebar } from "./sidebar"
   import { Topbar } from "./topbar"
   import { CalendarView } from "./calendar-view"
   import { DashboardView } from "./dashboard-view"
   import { ChecklistView } from "./checklist-view"
   import { TranscriptView } from "./transcript-view"
   import { SettingsView } from "./settings-view"
   import { AssignmentsView } from "./assignments-view"
   import { ProgressReportView } from "./progress-report-view"
   import { PortfolioBuilderView } from "./portfolio-builder-view"
   import { ComplianceView } from "./compliance-view"
   import { Loading } from "./loading"
   import { memo } from "react"

   // Memoize the content components to prevent unnecessary re-renders
   const MemoizedDashboardView = memo(DashboardView)
   const MemoizedCalendarView = memo(CalendarView)
   const MemoizedChecklistView = memo(ChecklistView)
   const MemoizedTranscriptView = memo(TranscriptView)
   const MemoizedSettingsView = memo(SettingsView)
   const MemoizedAssignmentsView = memo(AssignmentsView)

   export function MainLayout() {
   // Get state from Zustand store instead of useAppContext
   const currentView = useStore((state) => state.currentView)
   const isLoading = useStore((state) => state.isLoading)

     if (isLoading) {
       return <Loading />
     }

     // Render content based on current view
     const renderContent = () => {
       switch (currentView) {
         case "dashboard":
           return <MemoizedDashboardView />
         case "calendar":
           return <MemoizedCalendarView />
         case "checklist":
           return <MemoizedChecklistView />
         case "transcript":
           return <MemoizedTranscriptView />
         case "settings":
           return <MemoizedSettingsView />
         case "assignments":
           return <MemoizedAssignmentsView />
         case "reports":
           return <ProgressReportView />
         case "portfolio":
           return <PortfolioBuilderView />
         case "compliance":
           return <ComplianceView />
         default:
           return <MemoizedDashboardView />
       }
     }

     return (
       <div className="flex h-screen bg-[#faf9f5]">
         <Sidebar />
         <div className="flex-1 flex flex-col ml-0 md:ml-[220px]">
           <Topbar />
           <main className="flex-1 overflow-auto">{renderContent()}</main>
         </div>
       </div>
     )
   }
   
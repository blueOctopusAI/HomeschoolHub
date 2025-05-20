import { CalendarDays } from "lucide-react"

export function CalendarHeader() {
  return (
    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="flex items-center space-x-2">
        <CalendarDays className="h-6 w-6" />
        <h1 className="text-2xl font-bold tracking-tight">Homeschool Calendar</h1>
      </div>
      <p className="text-muted-foreground">
        Organize your homeschool schedule, track lessons, and generate checklists.
      </p>
    </div>
  )
}

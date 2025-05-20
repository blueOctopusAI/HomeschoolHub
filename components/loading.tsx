import { Loader2 } from "lucide-react"

export function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#faf9f5]">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 text-[#5e8b7e] animate-spin" />
        <p className="mt-4 text-[#5e8b7e] font-medium">Loading your homeschool data...</p>
      </div>
    </div>
  )
}

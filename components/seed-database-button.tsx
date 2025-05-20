"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { seedDatabaseAction } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"

export function SeedDatabaseButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSeedDatabase = async () => {
    setIsLoading(true)
    try {
      const result = await seedDatabaseAction()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSeedDatabase} disabled={isLoading} className="bg-[#5e8b7e] hover:bg-[#4a6e63]">
      {isLoading ? "Seeding Database..." : "Seed Database with Sample Data"}
    </Button>
  )
}

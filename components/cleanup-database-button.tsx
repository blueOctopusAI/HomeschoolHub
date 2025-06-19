'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { checkOrphanedData, cleanupOrphanedData } from "@/app/students/cleanup-actions"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function CleanupDatabaseButton() {
  const [isChecking, setIsChecking] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [orphanedData, setOrphanedData] = useState<{
    lessonStudents: number
    assignmentStudents: number
    courses: number
    loggedHours: number
  } | null>(null)
  const { toast } = useToast()
  
  const handleCheck = async () => {
    setIsChecking(true)
    
    try {
      const result = await checkOrphanedData()
      
      if (result.success && result.orphanedData) {
        setOrphanedData(result.orphanedData)
        const total = Object.values(result.orphanedData).reduce((sum, count) => sum + count, 0)
        
        if (total > 0) {
          setShowConfirmDialog(true)
        } else {
          toast({
            title: "Database is clean",
            description: "No orphaned data found in your database.",
            variant: "default",
          })
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to check for orphaned data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking orphaned data:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }
  
  const handleCleanup = async () => {
    setIsCleaning(true)
    setShowConfirmDialog(false)
    
    try {
      const result = await cleanupOrphanedData()
      
      if (result.success) {
        toast({
          title: "Cleanup successful",
          description: result.message,
          variant: "default",
        })
        
        // Refresh the page to show updated data
        window.location.reload()
      } else {
        toast({
          title: "Cleanup failed",
          description: result.message || "Failed to clean up orphaned data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error cleaning up data:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred during cleanup",
        variant: "destructive",
      })
    } finally {
      setIsCleaning(false)
      setOrphanedData(null)
    }
  }
  
  const totalOrphaned = orphanedData 
    ? Object.values(orphanedData).reduce((sum, count) => sum + count, 0)
    : 0
  
  return (
    <>
      <Button
        onClick={handleCheck}
        disabled={isChecking || isCleaning}
        variant="outline"
        className="border-yellow-600 text-yellow-700 hover:bg-yellow-50"
      >
        {isChecking ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking for orphaned data...
          </>
        ) : isCleaning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cleaning up database...
          </>
        ) : (
          <>
            <Trash2 className="mr-2 h-4 w-4" />
            Check & Clean Database
          </>
        )}
      </Button>
      
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <DialogTitle>Orphaned Data Found</DialogTitle>
            </div>
          </DialogHeader>
          
          <DialogDescription className="space-y-4">
            <p>
              We found {totalOrphaned} orphaned records in your database that belong to students 
              that no longer exist.
            </p>
            
            {orphanedData && (
              <div className="bg-gray-50 rounded-md p-4 space-y-2">
                <p className="font-medium text-sm">Records to be cleaned:</p>
                <ul className="text-sm space-y-1">
                  {orphanedData.lessonStudents > 0 && (
                    <li>• {orphanedData.lessonStudents} lesson assignments</li>
                  )}
                  {orphanedData.assignmentStudents > 0 && (
                    <li>• {orphanedData.assignmentStudents} assignment records</li>
                  )}
                  {orphanedData.courses > 0 && (
                    <li>• {orphanedData.courses} course entries</li>
                  )}
                  {orphanedData.loggedHours > 0 && (
                    <li>• {orphanedData.loggedHours} logged hour records</li>
                  )}
                </ul>
              </div>
            )}
            
            <p className="text-sm text-gray-600">
              This cleanup is safe and will only remove data associated with students that have 
              been deleted. Your active student data will not be affected.
            </p>
          </DialogDescription>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCleanup}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clean Up Database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
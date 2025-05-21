"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { updateMyProfile } from "@/app/actions"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"

// Loading button component with pending state
function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto bg-[#5e8b7e] hover:bg-[#4a6d62]"
    >
      {pending ? "Saving..." : "Save Changes"}
    </Button>
  )
}

const initialState = {
  success: false,
  message: null,
  errors: {}
}

interface ProfileData {
  full_name?: string;
  timezone?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  id?: string;
}

interface ProfileFormProps {
  profile: ProfileData | null;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction] = useActionState(updateMyProfile, initialState)
  const { toast } = useToast()
  
  // Form fields state to handle pre-filling
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [timezone, setTimezone] = useState(profile?.timezone || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  
  // Update form fields when profile prop changes
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setTimezone(profile.timezone || '')
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile])
  
  // Show toast notifications when state changes
  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast({
          title: "Success",
          description: state.message,
          variant: "default",
        })
      } else if (Object.keys(state.errors || {}).length === 0) {
        // Only show error toast for general errors, not field-specific ones
        toast({
          title: "Error",
          description: state.message,
          variant: "destructive",
        })
      }
    }
  }, [state, toast])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-[#5e8b7e]">Edit Profile</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input 
              id="full_name"
              name="full_name" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required 
              className="w-full"
            />
            {state.errors?.full_name && (
              <p className="text-red-500 text-sm mt-1">{state.errors.full_name[0]}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input 
              id="timezone"
              name="timezone" 
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. America/New_York" 
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input 
              id="avatar_url"
              name="avatar_url" 
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg" 
              className="w-full"
            />
          </div>
          
          {state.message && (
            <div className={`p-3 rounded-md ${state.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {state.message}
            </div>
          )}
          
          <div className="pt-2">
            <SubmitButton />
          </div>
        </form>
      </CardContent>
      
      {profile && profile.created_at && (
        <CardFooter className="text-xs text-muted-foreground flex flex-col items-start sm:flex-row sm:justify-between">
          <span>Account created: {new Date(profile.created_at).toLocaleDateString()}</span>
          {profile.updated_at && profile.updated_at !== profile.created_at && (
            <span>Last updated: {new Date(profile.updated_at).toLocaleDateString()}</span>
          )}
        </CardFooter>
      )}
    </Card>
  )
}


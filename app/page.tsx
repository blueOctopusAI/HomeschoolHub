import { MainLayout } from "@/components/main-layout"
import { ProfileForm } from "@/components/profile-form"
import { getProfiles } from "@/lib/profiles"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function Home() {
  // Get the current session server-side
  const supabase = createSupabaseServerComponentClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Extra safety check - if no user, redirect to login
  // This is a belt-and-suspenders approach since middleware should already handle this
  if (!user) {
    redirect('/login')
  }
  
  // Get profiles data - in a real app, you'd likely filter this by the current user
  const profiles = await getProfiles()
  
  return (
    <>
      <MainLayout />
      
      <div className="max-w-4xl mx-auto p-6 mt-8 bg-white rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Your Profile</h2>
        
        {profiles.length > 0 ? (
          <ul className="mb-6 space-y-2">
            {profiles.map(p => (
              <li key={p.id} className="p-3 border border-slate-200 rounded-md hover:bg-slate-50">
                {p.full_name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 italic mb-6">No profile found. Complete your profile below!</p>
        )}
        
        <ProfileForm />
      </div>
    </>
  )
}

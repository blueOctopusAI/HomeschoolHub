import { ProfileForm } from "@/components/profile-form"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  // Get the current session server-side
  const supabase = await createSupabaseServerComponentClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Extra safety check - if no user, redirect to login
  // This is a belt-and-suspenders approach since middleware should already handle this
  if (!user) {
    redirect('/login')
  }
  
  // Fetch the user's profile from the database
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, timezone, avatar_url, created_at, updated_at')
    .eq('id', user.id)
    .single()
  
  if (profileError && profileError.code !== 'PGRST116') {
    // PGRST116 is the error code for no rows returned, which is fine for new users
    console.error('Error fetching profile:', profileError)
  }
  
  // Get user's email from auth
  const userEmail = user.email
  
  return (
    <div className="max-w-4xl mx-auto p-6 mt-8 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#5e8b7e] mb-2">
          {profileData?.full_name ? `Welcome, ${profileData.full_name}` : `Welcome!`}
        </h1>
        
        <p className="text-slate-600">
          {userEmail && <span className="font-medium">Email: </span>}{userEmail}
        </p>
        
        {profileData?.timezone && (
          <p className="text-slate-600">
            <span className="font-medium">Timezone: </span>
            {profileData.timezone}
          </p>
        )}
      </div>
      
      {profileData?.avatar_url && (
        <div className="flex justify-center mb-6">
          <img 
            src={profileData.avatar_url} 
            alt="Profile avatar" 
            className="w-32 h-32 rounded-full object-cover border-4 border-[#5e8b7e]/20"
          />
        </div>
      )}
      
      <div className="mt-6">
        <ProfileForm profile={profileData} />
      </div>
    </div>
  )
}
import { MainLayout } from "@/components/main-layout"
import { ProfileForm } from "@/components/profile-form"
import { getProfiles } from "@/lib/profiles"

export default async function Home() {
  const profiles = await getProfiles()
  
  return (
    <>
      <MainLayout />
      
      <div className="max-w-4xl mx-auto p-6 mt-8 bg-white rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Profiles</h2>
        
        {profiles.length > 0 ? (
          <ul className="mb-6 space-y-2">
            {profiles.map(p => (
              <li key={p.id} className="p-3 border border-slate-200 rounded-md hover:bg-slate-50">
                {p.full_name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 italic mb-6">No profiles found. Add one below!</p>
        )}
        
        <ProfileForm />
      </div>
    </>
  )
}

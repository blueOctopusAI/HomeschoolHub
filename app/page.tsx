import { MainLayout } from "@/components/main-layout"
import { getProfiles } from "@/lib/profiles"
import { addProfile } from "./actions"

export default async function Home() {
  const profiles = await getProfiles()
  
  return (
    <>
      <MainLayout />
      
      <div className="max-w-4xl mx-auto p-6 mt-8 bg-white rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Profiles</h2>
        
        <ul className="mb-6 space-y-2">
          {profiles.map(p => (
            <li key={p.id} className="p-3 border border-slate-200 rounded-md hover:bg-slate-50">
              {p.full_name}
            </li>
          ))}
        </ul>
        
        <form action={addProfile} className="flex gap-2 mt-4">
          <input 
            name="full_name" 
            placeholder="Full name" 
            required 
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5e8b7e] focus:border-transparent"
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-[#5e8b7e] text-white rounded-md hover:bg-[#4a6d62] transition-colors"
          >
            Add Profile
          </button>
        </form>
      </div>
    </>
  )
}

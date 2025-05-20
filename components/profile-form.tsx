"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { addProfile } from "../app/actions"

// Loading button component with pending state
function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button 
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-[#5e8b7e] text-white rounded-md hover:bg-[#4a6d62] transition-colors disabled:opacity-70 w-full sm:w-auto"
    >
      {pending ? "Adding..." : "Add Profile"}
    </button>
  )
}

const initialState = {
  success: false,
  message: ""
}

export function ProfileForm() {
  const [state, formAction] = useActionState(addProfile, initialState)
  
  return (
    <div>
      <form action={formAction} className="flex flex-col gap-2 mt-4">
        <input 
          name="full_name" 
          placeholder="Full name" 
          required 
          className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5e8b7e] focus:border-transparent"
        />
        <SubmitButton />
      </form>
      
      {state.message && (
        <p className={`mt-2 text-sm ${state.success ? 'text-green-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
    </div>
  )
}

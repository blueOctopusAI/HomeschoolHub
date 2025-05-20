// lib/profiles.ts
import { supabase } from './supabaseClient'

export type Profile = {
  id: string
  full_name: string
  avatar_url: string | null
  created_at: string
}

/** fetch all profiles */
export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from<Profile>('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/** insert a new profile */
export async function createProfile(full_name: string, avatar_url?: string) {
  const { data, error } = await supabase
    .from<Profile>('profiles')
    .insert({ full_name, avatar_url })
    .select()
    .single()
  if (error) throw error
  return data
}
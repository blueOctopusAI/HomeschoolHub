// lib/profiles.ts
"use server"

import { createSupabaseServerComponentClient } from './supabase/server'

export type Profile = {
  id: string
  full_name: string
  avatar_url: string | null
  created_at: string
}

/** fetch all profiles */
export async function getProfiles(): Promise<Profile[]> {
  const supabase = createSupabaseServerComponentClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    
  if (error) throw error
  return data || []
}

/** insert a new profile */
export async function createProfile(full_name: string, avatar_url?: string) {
  const supabase = createSupabaseServerComponentClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .insert({ full_name, avatar_url })
    .select()
    .single()
    
  if (error) throw error
  return data
}

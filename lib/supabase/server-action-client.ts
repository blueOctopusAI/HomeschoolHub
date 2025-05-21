// lib/supabase/server-action-client.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client specifically for server actions.
 * Ensuring proper cookie handling and authentication.
 */
export async function createSupabaseServerActionClient() {
  'use server'
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          async set(name: string, value: string, options: CookieOptions) {
            await cookieStore.set(name, value, options)
          },
          async remove(name: string, options: CookieOptions) {
            await cookieStore.set(name, '', { ...options, maxAge: 0 })
          },
        },
      }
    )
    
    return supabase
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    throw error
  }
}

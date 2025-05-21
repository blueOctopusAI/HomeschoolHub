// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// For use in Server Components where cookies are read-only
export async function createSupabaseServerComponentClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // For Server Components, set and remove are no-ops as cookies() is read-only.
        set(name: string, value: string, options: CookieOptions) {},
        remove(name: string, options: CookieOptions) {},
      },
    }
  )
}

// Specialized function for server action cookie management
// This approach follows the official Supabase docs for Server Actions
export async function createSupabaseServerActionClient() {
  "use server"
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
}

// For use in middleware specifically
export function createSupabaseMiddlewareClient(request: Request) {
  // Create a response to modify cookies on
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.headers.get('cookie')?.split('; ').find(c => c.startsWith(`${name}=`))?.split('=')[1]
        },
        set(name: string, value: string, options: CookieOptions) {
          response.headers.append('Set-Cookie', `${name}=${value}; Max-Age=${options.maxAge || 3600}; Path=${options.path || '/'}${options.secure ? '; Secure' : ''}${options.httpOnly ? '; HttpOnly' : ''}${options.sameSite ? `; SameSite=${options.sameSite}` : ''}`)
        },
        remove(name: string, options: CookieOptions) {
          response.headers.append('Set-Cookie', `${name}=; Max-Age=0; Path=${options.path || '/'}`)
        },
      },
    }
  )

  return { supabase, response }
}

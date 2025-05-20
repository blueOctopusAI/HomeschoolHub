// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies' // May be needed for type safety in some Next.js versions

// Define a function to create a Supabase client for Server Components, Server Actions, and Route Handlers.
// This function will read and write Supabase session cookies.
export function createSupabaseServerClient(cookieStore?: ReadonlyRequestCookies) { // Make cookieStore optional for broader use
  // If cookieStore is not provided (e.g. in a Route Handler or simple Server Component without direct access to request cookies initially),
  // try to get it from next/headers. This is the common case for Server Components and Server Actions.
  const currentCookies = cookieStore || cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return currentCookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // If `currentCookies` is the direct `cookies()` from `next/headers`,
          // it's read-only in Server Components. `set` and `remove` are typically
          // handled in Server Actions or middleware where modification is allowed.
          // For Server Actions, you'd pass `cookies()` to this function, and `createServerClient`
          // handles setting them on the response.
          // This generic set function might not always be directly callable depending on context,
          // but it's required by createServerClient.
          try {
            (currentCookies as any).set(name, value, options) // Type assertion for Server Actions
          } catch (error) {
            // Log error if cookies are read-only and set is attempted (e.g. in a Server Component)
            // This is expected in some contexts. The important part is that `createServerClient`
            // can *read* cookies correctly. Session updates are handled by middleware/actions.
            // console.log(`Note: Failed to set cookie '${name}' in read-only context. This is often expected in Server Components.`);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            (currentCookies as any).set(name, '', options) // Type assertion for Server Actions
          } catch (error) {
            // console.log(`Note: Failed to remove cookie '${name}' in read-only context.`);
          }
        },
      },
    }
  )
}

// Specific function for use in Server Actions and Route Handlers where you can modify cookies
// (by passing cookies() from next/headers to it)
export function createSupabaseServerActionClient() {
    const cookieStore = cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set(name, value, options)
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.set(name, '', options)
                },
            },
        }
    )
}

// Specific function for use in Server Components where cookies are read-only
export function createSupabaseServerComponentClient() {
    const cookieStore = cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                // For Server Components, set and remove are no-ops as cookies() is read-only.
                // The actual cookie management is handled via middleware or server actions.
                set(name: string, value: string, options: CookieOptions) {},
                remove(name: string, options: CookieOptions) {},
            },
        }
    )
}

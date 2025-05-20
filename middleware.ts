// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh session if expired - important for Server Components
  // and Server Actions.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Define protected routes and auth routes
  // Include the root path in protected routes since it contains profile management functionality
  const protectedRoutes = ['/', '/dashboard', '/calendar', '/assignments', '/checklist', '/reports', '/transcript', '/settings', '/portfolio', '/compliance'];
  const authRoutes = ['/login', '/signup'];
  
  // If user is not logged in and trying to access a protected route (including root '/')
  if (!user && protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Optionally save the original URL to redirect back after login
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  // If user is logged in and trying to access an auth route (login/signup)
  if (user && authRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard'; // Redirect to their main dashboard
    return NextResponse.redirect(url);
  }
  
  // Special handling for root path (/)
  if (pathname === '/') {
    if (user) {
      // If user is logged in and hits the root path, redirect to dashboard
      // This makes the UX more consistent by always showing dashboard as the main view
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    // If user is not logged in, they will be redirected to /login by the first condition above
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

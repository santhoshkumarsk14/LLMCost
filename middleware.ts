import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url)

  // Allow public access to /, /auth/*, /api/webhooks/*
  if (pathname === '/' || pathname.startsWith('/auth/') || pathname.startsWith('/api/webhooks/')) {
    return NextResponse.next()
  }

  // Protect /dashboard/* routes with auth
  if (pathname.startsWith('/dashboard/')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Middleware cannot set cookies, but this is required for the client
            cookiesToSet.forEach(({ name, value, options }) => {
              // No-op in middleware
            })
          }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
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
}
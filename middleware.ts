import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

type CookieOption = {
  domain?: string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  path?: string
  sameSite?: 'strict' | 'lax' | 'none' | boolean
  secure?: boolean
}

export async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url)

  console.log(`Middleware: Processing path ${pathname}`)

  // Allow public access to /, /auth/*, /api/webhooks/*
  if (pathname === '/' || pathname.startsWith('/auth/') || pathname.startsWith('/api/webhooks/')) {
    return NextResponse.next()
  }

  // Protect /dashboard/* routes with auth
  if (pathname.startsWith('/dashboard/')) {
    console.log(`Middleware: Protecting dashboard route ${pathname}`)

    const cookies = request.cookies.getAll()
    console.log(`Middleware: Cookies received:`, cookies.map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' })))

    let cookiesToSet: { name: string; value: string; options: CookieOption }[] = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSetArray) {
            cookiesToSet = cookiesToSetArray
          }
        }
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    console.log(`Middleware: getUser result - user: ${!!user}, error:`, error)

    if (!user) {
      console.log(`Middleware: No user found, redirecting to login`)
      const response = NextResponse.redirect(new URL('/auth/login', request.url))
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options)
      })
      return response
    }

    console.log(`Middleware: User authenticated, proceeding`)
    const response = NextResponse.next()
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
    return response
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
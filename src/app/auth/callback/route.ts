import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  console.log('Callback: Exchanging code for session')
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Callback: Error exchanging code for session:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  console.log('Callback: Session exchanged successfully, user:', !!data.user)
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
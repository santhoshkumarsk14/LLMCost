import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

let resend: Resend | null = null

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY)
}
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, type, message } = body

    if (!user_id || !type || !message) {
      return NextResponse.json({ error: 'Missing user_id, type, or message' }, { status: 400 })
    }

    if (!resend) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 400 })
    }

    // Fetch user email
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', user_id)
      .single()

    if (userError || !userData?.email) {
      console.error('Failed to fetch user email:', userError)
      return NextResponse.json({ error: 'User not found or no email' }, { status: 404 })
    }

    // Send email
    const subject = `${type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Notification`
    try {
      await resend!.emails.send({
        from: 'notifications@yourapp.com', // Replace with your verified domain
        to: userData.email,
        subject,
        text: message,
      })
    } catch (emailError) {
      console.error('Failed to send email:', emailError)
      return NextResponse.json({ error: 'Failed to send notification email' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Notification sent successfully' }, { status: 200 })
  } catch (error) {
    console.error('Notifications send API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
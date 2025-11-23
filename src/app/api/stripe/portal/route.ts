import { NextRequest, NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 })
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find customer by email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    })

    if (customers.data.length === 0) {
      return NextResponse.json({ error: 'No customer found' }, { status: 404 })
    }

    const customer = customers.data[0]

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
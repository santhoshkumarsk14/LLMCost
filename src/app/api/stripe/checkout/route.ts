import { NextRequest, NextResponse } from 'next/server'
import stripe from '@/lib/stripe'

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 })
  }

  try {
    const { price_id } = await request.json()

    if (!price_id) {
      return NextResponse.json({ error: 'Missing price_id' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
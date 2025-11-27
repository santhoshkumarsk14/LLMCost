import { NextRequest, NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ subscription: null })
    }

    const customer = customers.data[0]

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ subscription: null })
    }

    const subscription = subscriptions.data[0]
    const price = subscription.items.data[0].price

    // Map price_id to tier
    const priceIdToTier: { [key: string]: { name: string; features: string[]; limits: { requests: number } } } = {
      'price_starter': {
        name: 'Starter',
        features: ['Basic API calls', 'Standard analytics'],
        limits: { requests: 1000 }
      },
      'price_pro': {
        name: 'Pro',
        features: ['Unlimited API calls', 'Advanced analytics', 'Priority support'],
        limits: { requests: 10000 }
      },
      'price_enterprise': {
        name: 'Enterprise',
        features: ['Unlimited API calls', 'Advanced analytics', 'Priority support', 'Custom integrations'],
        limits: { requests: 100000 }
      },
    }

    const tier = priceIdToTier[price.id] || {
      name: 'Free',
      features: ['Limited API calls'],
      limits: { requests: 100 }
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_start: (subscription as any).current_period_start,
        current_period_end: (subscription as any).current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        price: {
          id: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval,
        },
        tier,
      }
    })
  } catch (error) {
    console.error('Stripe subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
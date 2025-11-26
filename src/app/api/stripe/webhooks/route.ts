import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import stripe from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 })
  }

  try {
    const body = await request.text()
    const sig = (await headers()).get('stripe-signature')

    if (!sig) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    let event

    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err: unknown) {
      console.error('Webhook signature verification failed:', err instanceof Error ? err.message : err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object)
        break
      case 'customer.subscription.deleted':
        await handleCustomerSubscriptionDeleted(event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const customer = await stripe!.customers.retrieve(session.customer as string) as Stripe.Customer
  const email = customer.email

  if (!email) return

  // Find user by email
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (!user) return

  // Get subscription
  const subscription = await stripe!.subscriptions.retrieve(session.subscription as string)

  // Map price_id to tier - configure your actual Stripe price IDs here
  // Get price IDs from your Stripe dashboard: https://dashboard.stripe.com/prices
  const priceIdToTier: { [key: string]: string } = {
    // Example mappings - replace with your actual price IDs
    'price_starter': 'starter',
    'price_pro': 'pro',
    'price_enterprise': 'enterprise',
  }

  const priceId = subscription.items.data[0].price.id
  let tier = priceIdToTier[priceId]
  if (!tier) {
    console.warn(`Unknown price ID: ${priceId}. Defaulting to 'free' tier. Configure priceIdToTier mapping for proper tier assignment.`)
    tier = 'free'
  }

  // Update user subscription tier
  await supabase
    .from('users')
    .update({ subscription_tier: tier, subscription_status: 'active' })
    .eq('id', user.id)

  console.log(`Updated user ${user.id} to tier ${tier}`)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customer = await stripe!.customers.retrieve(invoice.customer as string) as Stripe.Customer
  const email = customer.email

  if (!email) return

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (!user) return

  // Send receipt notification
  console.log(`Sending receipt to user ${user.id} for invoice ${invoice.id}`)

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: user.id,
        type: 'payment_receipt',
        message: `Your payment of $${(invoice.amount_paid / 100).toFixed(2)} has been processed successfully. Invoice ID: ${invoice.id}`
      })
    })

    if (!response.ok) {
      console.error('Failed to send receipt notification')
    }
  } catch (error) {
    console.error('Error sending receipt notification:', error)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customer = await stripe!.customers.retrieve(invoice.customer as string) as Stripe.Customer
  const email = customer.email

  if (!email) return

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (!user) return

  // Send dunning notification
  console.log(`Sending dunning email to user ${user.id} for failed payment on invoice ${invoice.id}`)

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: user.id,
        type: 'payment_failed',
        message: `Your payment of $${(invoice.amount_due / 100).toFixed(2)} for invoice ${invoice.id} has failed. Please update your payment method to avoid service interruption.`
      })
    })

    if (!response.ok) {
      console.error('Failed to send dunning notification')
    }
  } catch (error) {
    console.error('Error sending dunning notification:', error)
  }
}

async function handleCustomerSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customer = await stripe!.customers.retrieve(subscription.customer as string) as Stripe.Customer
  const email = customer.email

  if (!email) return

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (!user) return

  // Downgrade to free
  await supabase
    .from('users')
    .update({ subscription_tier: 'free', subscription_status: 'canceled' })
    .eq('id', user.id)

  console.log(`Downgraded user ${user.id} to free tier`)
}
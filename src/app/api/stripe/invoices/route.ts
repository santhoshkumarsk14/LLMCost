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
      return NextResponse.json({ invoices: [] })
    }

    const customer = customers.data[0]

    // Get invoices
    const invoices = await stripe.invoices.list({
      customer: customer.id,
      limit: 50, // Get last 50 invoices
    })

    const invoiceData = invoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      date: invoice.created,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency,
      status: invoice.status,
      pdf_url: invoice.invoice_pdf,
      hosted_url: invoice.hosted_invoice_url,
    }))

    return NextResponse.json({ invoices: invoiceData })
  } catch (error) {
    console.error('Stripe invoices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
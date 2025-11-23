import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const body = await request.json()
    const { user_id, cost_usd } = body

    if (!user_id || typeof cost_usd !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid user_id or cost_usd' }, { status: 400 })
    }

    // Fetch active budgets for the user
    const { data: budgets, error: fetchError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active')

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!budgets || budgets.length === 0) {
      return NextResponse.json({ message: 'No active budgets found' }, { status: 200 })
    }

    const updates = []

    for (const budget of budgets) {
      const newSpend = budget.current_spend + cost_usd

      let status = budget.status
      if (newSpend > budget.limit) {
        status = 'exceeded'
      }

      // Check alert threshold
      if (newSpend > budget.alert_threshold) {
        // Send email notification
        ;(async () => {
          try {
            const response = await fetch('/api/notifications/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: budget.user_id,
                type: 'budget_alert',
                message: `Your budget "${budget.name || 'Unnamed Budget'}" has exceeded the alert threshold. Current spend: $${newSpend.toFixed(4)}, Threshold: $${budget.alert_threshold.toFixed(4)}`
              })
            })
            if (!response.ok) {
              console.error('Error sending budget alert email:', await response.text())
            }
          } catch (error) {
            console.error('Error sending budget alert:', error)
          }
        })()
      }

      updates.push({
        id: budget.id,
        current_spend: newSpend,
        status,
        updated_at: new Date().toISOString()
      })
    }

    // Update budgets in database
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('budgets')
        .update(update)
        .eq('id', update.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ message: 'Budgets updated successfully' }, { status: 200 })
  } catch (error) {
    console.error('Budgets check API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
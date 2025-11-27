import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: rules, error: rulesError } = await supabase
      .from('optimization_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (rulesError) {
      return NextResponse.json({ error: rulesError.message }, { status: 500 })
    }

    // Get performance metrics for each rule
    const rulesWithMetrics = await Promise.all(
      rules.map(async (rule) => {
        // Count successful applications
        const { count: applications, error: appError } = await supabase
          .from('api_requests')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('model', rule.target_model)
          .gt('savings', 0)

        // Calculate success rate (applications / total requests with this source model)
        const { count: totalRequests, error: totalError } = await supabase
          .from('api_requests')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('model', rule.source_model)

        const successRate = totalRequests && totalRequests > 0 ? (applications || 0) / totalRequests : 0

        return {
          ...rule,
          metrics: {
            total_applications: applications || 0,
            success_rate: successRate,
            total_savings: rule.savings_usd || 0
          }
        }
      })
    )

    return NextResponse.json(rulesWithMetrics)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ruleData = await request.json()

    const { data, error } = await supabase
      .from('optimization_rules')
      .insert({
        user_id: user.id,
        name: ruleData.name,
        source_model: ruleData.sourceModel,
        target_model: ruleData.targetModel,
        conditions: ruleData.conditions,
        enabled: ruleData.enabled ?? true,
        savings_usd: 0
      })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('optimization_rules')
      .update({
        name: updateData.name,
        source_model: updateData.sourceModel,
        target_model: updateData.targetModel,
        conditions: updateData.conditions,
        enabled: updateData.enabled
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('optimization_rules')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
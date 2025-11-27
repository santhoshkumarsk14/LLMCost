import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current month start and end
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Get requests for current month
    const { data: requests, error } = await supabase
      .from('api_requests')
      .select('cost')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const totalRequests = requests?.length || 0
    const totalCost = requests?.reduce((sum, req) => sum + parseFloat(req.cost || 0), 0) || 0

    return NextResponse.json({
      usage: {
        requests: totalRequests,
        cost: totalCost,
        period: {
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString()
        }
      }
    })
  } catch (error) {
    console.error('Usage API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing start_date or end_date' }, { status: 400 })
    }

    // Base query with date filter
    const baseQuery = supabase
      .from('api_requests')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Previous period query
    const start = new Date(startDate)
    const end = new Date(endDate)
    const periodMs = end.getTime() - start.getTime()
    const prevStart = new Date(start.getTime() - periodMs)
    const prevEnd = start
    const prevQuery = supabase
      .from('api_requests')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', prevStart.toISOString())
      .lte('created_at', prevEnd.toISOString())

    // Get all requests for calculations
    const { data: requests, error: requestsError } = await baseQuery

    if (requestsError) {
      return NextResponse.json({ error: requestsError.message }, { status: 500 })
    }

    // Get previous period requests
    const { data: prevRequests, error: prevRequestsError } = await prevQuery

    if (prevRequestsError) {
      console.error('Previous requests error:', prevRequestsError)
      // Continue with empty prev data
    }

    // Calculate metrics
    const totalCost = requests?.reduce((sum, req) => sum + parseFloat(req.cost || 0), 0) || 0
    const totalRequests = requests?.length || 0
    const avgCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0
    const totalTokens = requests?.reduce((sum, req) => sum + (req.tokens_used || 0), 0) || 0
    const cachedRequests = requests?.filter(req => req.status === 'cached').length || 0
    const cacheHitRate = totalRequests > 0 ? (cachedRequests / totalRequests) * 100 : 0

    // Calculate previous period metrics
    const prevTotalCost = prevRequests?.reduce((sum, req) => sum + parseFloat(req.cost || 0), 0) || 0
    const prevTotalRequests = prevRequests?.length || 0
    const prevAvgCostPerRequest = prevTotalRequests > 0 ? prevTotalCost / prevTotalRequests : 0
    const prevCachedRequests = prevRequests?.filter(req => req.status === 'cached').length || 0
    const prevCacheHitRate = prevTotalRequests > 0 ? (prevCachedRequests / prevTotalRequests) * 100 : 0

    // Cost over time (by day)
    const costOverTime = requests?.reduce((acc, req) => {
      const date = new Date(req.created_at).toISOString().split('T')[0]
      if (!acc[date]) acc[date] = { cost: 0, requests: 0 }
      acc[date].cost += parseFloat(req.cost || 0)
      acc[date].requests += 1
      return acc
    }, {} as Record<string, { cost: number, requests: number }>) || {}

    const costOverTimeData = Object.entries(costOverTime)
      .map(([date, data]) => ({ name: date, cost: (data as { cost: number, requests: number }).cost, requests: (data as { cost: number, requests: number }).requests }))
      .sort((a, b) => a.name.localeCompare(b.name))

    // Cost by model
    const costByModel = requests?.reduce((acc, req) => {
      const model = req.model
      if (!acc[model]) acc[model] = 0
      acc[model] += parseFloat(req.cost || 0)
      return acc
    }, {} as Record<string, number>) || {}

    const costByModelData = Object.entries(costByModel)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => (b.value as number) - (a.value as number))

    // Requests by hour (last 24 hours, but filtered by date range)
    const requestsByHour = requests?.reduce((acc, req) => {
      const hour = new Date(req.created_at).getHours()
      if (!acc[hour]) acc[hour] = 0
      acc[hour] += 1
      return acc
    }, {} as Record<number, number>) || {}

    const requestsByHourData = Array.from({ length: 24 }, (_, hour) => ({
      name: `${hour}:00`,
      requests: requestsByHour[hour] || 0
    }))

    // Token usage (total and by model)
    const tokenUsage = {
      total: totalTokens,
      byModel: requests?.reduce((acc, req) => {
        const model = req.model
        if (!acc[model]) acc[model] = 0
        acc[model] += req.tokens_used || 0
        return acc
      }, {} as Record<string, number>) || {}
    }

    // Function to calculate change
    function calcChange(current: number, previous: number): { change: string, changeType: 'positive' | 'negative' } {
      if (previous === 0) {
        return { change: "+0%", changeType: "positive" }
      }
      const percent = ((current - previous) / previous) * 100
      const sign = percent >= 0 ? '+' : ''
      return { change: `${sign}${percent.toFixed(1)}%`, changeType: percent >= 0 ? "positive" : "negative" }
    }

    // Metrics
    const metrics = [
      {
        title: "Total Cost",
        value: `$${totalCost.toFixed(2)}`,
        change: calcChange(totalCost, prevTotalCost).change,
        changeType: calcChange(totalCost, prevTotalCost).changeType,
        icon: "DollarSign"
      },
      {
        title: "Total Requests",
        value: totalRequests.toLocaleString(),
        change: calcChange(totalRequests, prevTotalRequests).change,
        changeType: calcChange(totalRequests, prevTotalRequests).changeType,
        icon: "Activity"
      },
      {
        title: "Avg Cost/Request",
        value: `$${avgCostPerRequest.toFixed(3)}`,
        change: calcChange(avgCostPerRequest, prevAvgCostPerRequest).change,
        changeType: calcChange(avgCostPerRequest, prevAvgCostPerRequest).changeType,
        icon: "TrendingUp"
      },
      {
        title: "Cache Hit Rate",
        value: `${cacheHitRate.toFixed(1)}%`,
        change: calcChange(cacheHitRate, prevCacheHitRate).change,
        changeType: calcChange(cacheHitRate, prevCacheHitRate).changeType,
        icon: "Target"
      }
    ]

    // Top requests (by cost)
    const topRequests = requests?.reduce((acc, req) => {
      const key = `${req.model}-${req.provider}`
      if (!acc[key]) {
        acc[key] = {
          model: req.model,
          provider: req.provider,
          requests: 0,
          cost: 0
        }
      }
      acc[key].requests += 1
      acc[key].cost += parseFloat(req.cost || 0)
      return acc
    }, {} as Record<string, { model: string, provider: string, requests: number, cost: number }>) || {}

    const topRequestsData = Object.values(topRequests)
      .map(item => ({
        ...(item as { model: string, provider: string, requests: number, cost: number }),
        avgCost: (item as { requests: number, cost: number }).requests > 0 ? (item as { cost: number }).cost / (item as { requests: number }).requests : 0
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)

    return NextResponse.json({
      metrics,
      costOverTime: costOverTimeData,
      costByModel: costByModelData,
      requestsByHour: requestsByHourData,
      tokenUsage,
      topRequests: topRequestsData
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
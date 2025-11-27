import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { proxyLogger } from '@/lib/logger'

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
    const level = searchParams.get('level') // error, warn, info, debug
    const source = searchParams.get('source') // proxy, auth, api, etc.
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)

    // Build query
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    if (level) {
      query = query.eq('level', level)
    }

    if (source) {
      query = query.eq('source', source)
    }

    const { data: auditLogs, error } = await query

    if (error) {
      proxyLogger.error('Failed to fetch audit logs', { error: error.message }, user.id)
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
    }

    // Get summary statistics
    const { data: stats, error: statsError } = await supabase
      .from('audit_logs')
      .select('level, source')
      .eq('user_id', user.id)

    if (statsError) {
      proxyLogger.warn('Failed to fetch audit statistics', { error: statsError.message }, user.id)
    }

    const summary = stats?.reduce((acc, log) => {
      acc.total += 1
      acc.byLevel[log.level] = (acc.byLevel[log.level] || 0) + 1
      acc.bySource[log.source] = (acc.bySource[log.source] || 0) + 1
      return acc
    }, {
      total: 0,
      byLevel: {} as Record<string, number>,
      bySource: {} as Record<string, number>
    }) || { total: 0, byLevel: {}, bySource: {} }

    return NextResponse.json({
      logs: auditLogs || [],
      summary,
      pagination: {
        limit,
        hasMore: (auditLogs?.length || 0) === limit
      }
    })
  } catch (error) {
    proxyLogger.error('Audit API error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST endpoint for security events (internal use)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    const { user_id, event, details, level = 'info', source = 'security' } = body

    if (!user_id || !event) {
      return NextResponse.json({ error: 'Missing user_id or event' }, { status: 400 })
    }

    // Log security event
    proxyLogger.securityEvent(user_id, event, details || {})

    // Store in audit logs
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        level,
        message: `Security event: ${event}`,
        user_id,
        metadata: details ? JSON.stringify(details) : null,
        source
      })

    if (error) {
      proxyLogger.error('Failed to store security event', { error: error.message })
      return NextResponse.json({ error: 'Failed to log security event' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Security event logged successfully' })
  } catch (error) {
    proxyLogger.error('Security event logging error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
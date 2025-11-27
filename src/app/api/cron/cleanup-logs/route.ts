import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { proxyLogger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.CRON_SECRET || 'default-cron-secret'

    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.substring(7) !== expectedSecret) {
      proxyLogger.warn('Unauthorized cron job access', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    // Clean up old API request logs (keep last 90 days for compliance)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { error: requestsError } = await supabase
      .from('api_requests')
      .delete()
      .lt('created_at', ninetyDaysAgo.toISOString())

    if (requestsError) {
      proxyLogger.error('Failed to cleanup old API requests', { error: requestsError.message })
      return NextResponse.json({ error: 'API requests cleanup failed' }, { status: 500 })
    }

    // Clean up old audit logs (keep last 30 days for security monitoring)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { error: auditError } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())

    if (auditError) {
      proxyLogger.error('Failed to cleanup old audit logs', { error: auditError.message })
      return NextResponse.json({ error: 'Audit logs cleanup failed' }, { status: 500 })
    }

    // Clean up old notification logs (keep last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Note: This assumes a notifications table exists - adjust as needed
    // const { data: deletedNotifications, error: notificationsError } = await supabase
    //   .from('notifications')
    //   .delete()
    //   .lt('created_at', sevenDaysAgo.toISOString())
    //   .select('count', { count: 'exact' })

    // Archive old data to cold storage (if needed)
    // This could be implemented to move data to cheaper storage

    const result = {
      message: 'Log cleanup completed successfully',
      deleted: {
        api_requests: 'completed',
        audit_logs: 'completed',
        // notifications: deletedNotifications?.length || 0
      },
      retention_policy: {
        api_requests: '90 days',
        audit_logs: '30 days',
        notifications: '7 days'
      },
      timestamp: new Date().toISOString()
    }

    proxyLogger.info('Log cleanup completed', result)

    return NextResponse.json(result)
  } catch (error) {
    proxyLogger.error('Log cleanup failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
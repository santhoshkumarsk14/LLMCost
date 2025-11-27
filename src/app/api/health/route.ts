import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { performanceMonitor } from '@/lib/performance'

export async function GET() {
  try {
    // Check database connectivity
    const supabase = await createServerSupabaseClient()
    const { error: dbError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })

    const databaseHealthy = !dbError

    // Get performance metrics
    const performanceMetrics = performanceMonitor.getHealthMetrics()

    // Check memory usage
    const memUsage = process.memoryUsage()
    const memoryHealthy = memUsage.heapUsed < 500 * 1024 * 1024 // 500MB limit

    // Overall health status
    const overallHealthy = databaseHealthy && memoryHealthy

    const healthStatus = {
      status: overallHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: databaseHealthy ? 'healthy' : 'unhealthy',
          details: databaseHealthy ? 'Connected' : dbError?.message || 'Connection failed'
        },
        memory: {
          status: memoryHealthy ? 'healthy' : 'warning',
          details: `Heap used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`
        },
        performance: {
          status: performanceMetrics.averageResponseTime < 2000 ? 'healthy' : 'warning',
          details: `Avg response time: ${performanceMetrics.averageResponseTime.toFixed(2)}ms`
        }
      },
      metrics: {
        uptime: process.uptime(),
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss
        },
        performance: performanceMetrics,
        cpu: process.cpuUsage()
      }
    }

    return NextResponse.json(healthStatus, {
      status: overallHealthy ? 200 : 503
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { status: 503 })
  }
}
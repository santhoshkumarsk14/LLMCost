import { proxyLogger } from './logger'

export interface PerformanceMetrics {
  requestId: string
  userId: string
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  requestSize: number
  responseSize: number
  databaseQueries: number
  databaseTime: number
  cacheHits: number
  cacheMisses: number
  memoryUsage: number
  cpuUsage: number
  timestamp: string
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map()
  private dbQueryCount: Map<string, number> = new Map()
  private dbQueryTime: Map<string, number> = new Map()
  private cacheHits: Map<string, number> = new Map()
  private cacheMisses: Map<string, number> = new Map()

  startRequest(requestId: string, userId: string, endpoint: string, method: string): void {
    const metrics: PerformanceMetrics = {
      requestId,
      userId,
      endpoint,
      method,
      statusCode: 0,
      responseTime: 0,
      requestSize: 0,
      responseSize: 0,
      databaseQueries: 0,
      databaseTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      timestamp: new Date().toISOString()
    }

    this.metrics.set(requestId, metrics)
    this.dbQueryCount.set(requestId, 0)
    this.dbQueryTime.set(requestId, 0)
    this.cacheHits.set(requestId, 0)
    this.cacheMisses.set(requestId, 0)
  }

  endRequest(requestId: string, statusCode: number, responseSize: number): void {
    const metrics = this.metrics.get(requestId)
    if (!metrics) return

    metrics.statusCode = statusCode
    metrics.responseSize = responseSize
    metrics.responseTime = Date.now() - new Date(metrics.timestamp).getTime()
    metrics.databaseQueries = this.dbQueryCount.get(requestId) || 0
    metrics.databaseTime = this.dbQueryTime.get(requestId) || 0
    metrics.cacheHits = this.cacheHits.get(requestId) || 0
    metrics.cacheMisses = this.cacheMisses.get(requestId) || 0

    // Get system metrics
    metrics.memoryUsage = process.memoryUsage().heapUsed
    metrics.cpuUsage = process.cpuUsage().user

    // Log performance metrics
    this.logPerformanceMetrics(metrics)

    // Clean up
    this.metrics.delete(requestId)
    this.dbQueryCount.delete(requestId)
    this.dbQueryTime.delete(requestId)
    this.cacheHits.delete(requestId)
    this.cacheMisses.delete(requestId)
  }

  recordDatabaseQuery(requestId: string, queryTime: number): void {
    const currentCount = this.dbQueryCount.get(requestId) || 0
    const currentTime = this.dbQueryTime.get(requestId) || 0

    this.dbQueryCount.set(requestId, currentCount + 1)
    this.dbQueryTime.set(requestId, currentTime + queryTime)
  }

  recordCacheHit(requestId: string): void {
    const currentHits = this.cacheHits.get(requestId) || 0
    this.cacheHits.set(requestId, currentHits + 1)
  }

  recordCacheMiss(requestId: string): void {
    const currentMisses = this.cacheMisses.get(requestId) || 0
    this.cacheMisses.set(requestId, currentMisses + 1)
  }

  private logPerformanceMetrics(metrics: PerformanceMetrics): void {
    // Log slow requests (>1 second)
    if (metrics.responseTime > 1000) {
      proxyLogger.warn('Slow request detected', {
        request_id: metrics.requestId,
        response_time: metrics.responseTime,
        endpoint: metrics.endpoint,
        status_code: metrics.statusCode,
        database_queries: metrics.databaseQueries,
        database_time: metrics.databaseTime
      }, metrics.userId)
    }

    // Log high memory usage (>100MB)
    if (metrics.memoryUsage > 100 * 1024 * 1024) {
      proxyLogger.warn('High memory usage detected', {
        request_id: metrics.requestId,
        memory_usage: metrics.memoryUsage,
        endpoint: metrics.endpoint
      }, metrics.userId)
    }

    // Log performance metrics for monitoring
    if (process.env.NODE_ENV === 'production') {
      proxyLogger.info('Performance metrics', {
        request_id: metrics.requestId,
        response_time: metrics.responseTime,
        database_time: metrics.databaseTime,
        cache_hit_rate: metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) || 0,
        memory_usage: metrics.memoryUsage,
        status_code: metrics.statusCode
      }, metrics.userId)
    }
  }

  getHealthMetrics(): {
    averageResponseTime: number
    totalRequests: number
    errorRate: number
    cacheHitRate: number
    memoryUsage: number
  } {
    const recentMetrics = Array.from(this.metrics.values()).slice(-100) // Last 100 requests

    if (recentMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
        cacheHitRate: 0,
        memoryUsage: 0
      }
    }

    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
    const totalRequests = recentMetrics.length
    const errors = recentMetrics.filter(m => m.statusCode >= 400).length
    const errorRate = errors / totalRequests

    const totalCacheHits = recentMetrics.reduce((sum, m) => sum + m.cacheHits, 0)
    const totalCacheMisses = recentMetrics.reduce((sum, m) => sum + m.cacheMisses, 0)
    const cacheHitRate = totalCacheHits / (totalCacheHits + totalCacheMisses) || 0

    const memoryUsage = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length

    return {
      averageResponseTime,
      totalRequests,
      errorRate,
      cacheHitRate,
      memoryUsage
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Middleware function to wrap API routes with performance monitoring
export function withPerformanceMonitoring(
  handler: (request: Request, context?: unknown) => Promise<Response>,
  endpoint: string
) {
  return async (request: Request, context?: unknown): Promise<Response> => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const userId = 'anonymous' // This would be extracted from auth in real implementation

    performanceMonitor.startRequest(requestId, userId, endpoint, request.method)

    try {
      const response = await handler(request, context)

      // Estimate response size (simplified)
      const responseSize = response.headers.get('content-length')
        ? parseInt(response.headers.get('content-length')!)
        : 0

      performanceMonitor.endRequest(requestId, response.status, responseSize)

      return response
    } catch (error) {
      performanceMonitor.endRequest(requestId, 500, 0)
      throw error
    }
  }
}
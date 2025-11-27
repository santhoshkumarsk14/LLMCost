import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogEntry {
  level: LogLevel
  message: string
  user_id?: string
  api_key_id?: string
  request_id?: string
  metadata?: Record<string, unknown>
  timestamp: string
  source: string
}

class Logger {
  private source: string

  constructor(source: string) {
    this.source = source
  }

  private async log(level: LogLevel, message: string, metadata?: Record<string, unknown>, userId?: string, apiKeyId?: string, requestId?: string) {
    const logEntry: LogEntry = {
      level,
      message,
      user_id: userId,
      api_key_id: apiKeyId,
      request_id: requestId,
      metadata,
      timestamp: new Date().toISOString(),
      source: this.source
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      const color = {
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.INFO]: '\x1b[36m',  // Cyan
        [LogLevel.DEBUG]: '\x1b[35m'  // Magenta
      }[level]

      console.log(`${color}[${level.toUpperCase()}] ${this.source}: ${message}\x1b[0m`, metadata || '')
    }

    // Database logging for production (async, don't block)
    if (process.env.NODE_ENV === 'production') {
      try {
        await supabaseAdmin
          .from('audit_logs')
          .insert({
            level,
            message,
            user_id: userId,
            api_key_id: apiKeyId,
            request_id: requestId,
            metadata: metadata ? JSON.stringify(metadata) : null,
            source: this.source,
            created_at: logEntry.timestamp
          })
      } catch (error) {
        // Fallback to console if database logging fails
        console.error('Failed to write to audit log:', error)
      }
    }
  }

  error(message: string, metadata?: Record<string, unknown>, userId?: string, apiKeyId?: string, requestId?: string) {
    this.log(LogLevel.ERROR, message, metadata, userId, apiKeyId, requestId)
  }

  warn(message: string, metadata?: Record<string, unknown>, userId?: string, apiKeyId?: string, requestId?: string) {
    this.log(LogLevel.WARN, message, metadata, userId, apiKeyId, requestId)
  }

  info(message: string, metadata?: Record<string, unknown>, userId?: string, apiKeyId?: string, requestId?: string) {
    this.log(LogLevel.INFO, message, metadata, userId, apiKeyId, requestId)
  }

  debug(message: string, metadata?: Record<string, unknown>, userId?: string, apiKeyId?: string, requestId?: string) {
    this.log(LogLevel.DEBUG, message, metadata, userId, apiKeyId, requestId)
  }

  // Specialized logging methods
  apiRequest(userId: string, apiKeyId: string, model: string, cost: number, latency: number, status: string, requestId?: string) {
    this.info('API request processed', {
      model,
      cost,
      latency,
      status,
      endpoint: 'proxy'
    }, userId, apiKeyId, requestId)
  }

  budgetAlert(userId: string, budgetId: string, currentSpend: number, threshold: number, budgetLimit: number) {
    this.warn('Budget threshold exceeded', {
      budget_id: budgetId,
      current_spend: currentSpend,
      threshold,
      budget_limit: budgetLimit
    }, userId)
  }

  rateLimitExceeded(userId: string, apiKeyId: string, limit: number, window: string) {
    this.warn('Rate limit exceeded', {
      limit,
      window
    }, userId, apiKeyId)
  }

  cacheHit(userId: string, requestHash: string) {
    this.debug('Cache hit', { request_hash: requestHash }, userId)
  }

  cacheMiss(userId: string, requestHash: string) {
    this.debug('Cache miss', { request_hash: requestHash }, userId)
  }

  modelRouted(userId: string, originalModel: string, targetModel: string, ruleId: string, savings: number) {
    this.info('Model routed for optimization', {
      original_model: originalModel,
      target_model: targetModel,
      rule_id: ruleId,
      savings
    }, userId)
  }

  securityEvent(userId: string, event: string, details: Record<string, unknown>, ip?: string) {
    this.warn(`Security event: ${event}`, {
      ...details,
      ip_address: ip
    }, userId)
  }
}

// Create logger instances for different parts of the application
export const proxyLogger = new Logger('proxy')
export const authLogger = new Logger('auth')
export const apiLogger = new Logger('api')
export const budgetLogger = new Logger('budget')
export const cacheLogger = new Logger('cache')
export const notificationLogger = new Logger('notification')

// Global error handler
export function handleGlobalError(error: Error, context?: Record<string, unknown>) {
  const globalLogger = new Logger('global')
  globalLogger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    ...context
  })
}

// Request ID generator
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
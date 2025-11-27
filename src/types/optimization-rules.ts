export interface OptimizationRuleConditions {
  // Basic conditions
  promptLength?: number
  responseLength?: number
  keywords?: string[]
  timeOfDay?: string

  // Advanced conditions
  maxCostPerRequest?: number
  maxCostPerToken?: number
  requestType?: string
  fallbackChain?: string[]

  // Priority (higher number = higher priority)
  priority?: number
}

export interface OptimizationRule {
  id: string
  user_id: string
  name: string
  sourceModel: string
  targetModel: string
  conditions: OptimizationRuleConditions
  enabled: boolean
  savings_usd: number
  created_at: string

  // Computed metrics
  metrics?: {
    total_applications: number
    success_rate: number
    total_savings: number
  }
}

export interface RuleTestRequest {
  model: string
  messages: Array<{
    role: string
    content: string | unknown
  }>
  requestType?: 'chat' | 'completion' | 'embedding'
}

export interface RuleTestResult {
  ruleMatched: boolean
  originalModel: string
  targetModel: string
  matchedConditions: string[]
  failedConditions: string[]
  estimatedSavings: number
  evaluation: {
    inputLength: number
    requestType: string
    currentHour: number
  }
}

export interface CreateRuleRequest {
  name: string
  sourceModel: string
  targetModel: string
  conditions: OptimizationRuleConditions
  enabled?: boolean
}

export interface UpdateRuleRequest extends Partial<CreateRuleRequest> {
  id: string
}
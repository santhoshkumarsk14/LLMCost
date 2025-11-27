import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ruleId, testRequest } = await request.json()

    if (!ruleId || !testRequest) {
      return NextResponse.json({ error: 'Missing ruleId or testRequest' }, { status: 400 })
    }

    // Get the rule
    const { data: rule, error: ruleError } = await supabase
      .from('optimization_rules')
      .select('*')
      .eq('id', ruleId)
      .eq('user_id', user.id)
      .single()

    if (ruleError || !rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    // Simulate rule evaluation
    const { model, messages, requestType = 'chat' } = testRequest
    const inputText = messages?.map((m: { content: string | unknown }) => typeof m.content === 'string' ? m.content : JSON.stringify(m.content)).join(' ') || ''
    const inputLength = inputText.length

    let match = true
    const matchedConditions: string[] = []
    const failedConditions: string[] = []
    const conditions = rule.conditions || {}

    // Check source model
    if (rule.source_model !== model) {
      match = false
      failedConditions.push(`Source model mismatch: expected ${rule.source_model}, got ${model}`)
    } else {
      matchedConditions.push(`Source model matches: ${model}`)
    }

    // Check request type
    if (conditions.requestType && conditions.requestType !== requestType) {
      match = false
      failedConditions.push(`Request type mismatch: expected ${conditions.requestType}, got ${requestType}`)
    } else if (conditions.requestType) {
      matchedConditions.push(`Request type matches: ${requestType}`)
    }

    // Check prompt length
    if (conditions.promptLength && inputLength >= conditions.promptLength) {
      match = false
      failedConditions.push(`Prompt too long: ${inputLength} >= ${conditions.promptLength}`)
    } else if (conditions.promptLength) {
      matchedConditions.push(`Prompt length OK: ${inputLength} < ${conditions.promptLength}`)
    }

    // Check keywords
    if (conditions.keywords && conditions.keywords.length > 0) {
      const hasKeyword = conditions.keywords.some((k: string) =>
        inputText.toLowerCase().includes(k.toLowerCase())
      )
      if (!hasKeyword) {
        match = false
        failedConditions.push(`Missing required keywords: ${conditions.keywords.join(', ')}`)
      } else {
        matchedConditions.push(`Contains keywords: ${conditions.keywords.join(', ')}`)
      }
    }

    // Check time of day
    if (conditions.timeOfDay) {
      const now = new Date()
      const hour = now.getUTCHours()
      let timeMatch = false

      if (conditions.timeOfDay === 'off-peak') {
        timeMatch = hour >= 22 || hour <= 5
      } else if (conditions.timeOfDay === 'business-hours') {
        timeMatch = hour >= 9 && hour <= 17
      } else if (conditions.timeOfDay === 'peak') {
        timeMatch = hour >= 17 && hour <= 22
      }

      if (!timeMatch) {
        match = false
        failedConditions.push(`Time condition not met: current hour ${hour}, required ${conditions.timeOfDay}`)
      } else {
        matchedConditions.push(`Time condition met: ${conditions.timeOfDay}`)
      }
    }

    // Check cost threshold (simulate cost calculation)
    if (conditions.maxCostPerRequest) {
      // Simple cost estimation
      const estimatedTokens = Math.ceil(inputLength / 4)
      const estimatedCost = (estimatedTokens / 1000) * 0.03 // Rough GPT-4 pricing

      if (estimatedCost > conditions.maxCostPerRequest) {
        match = false
        failedConditions.push(`Estimated cost too high: $${estimatedCost.toFixed(4)} > $${conditions.maxCostPerRequest}`)
      } else {
        matchedConditions.push(`Cost within threshold: $${estimatedCost.toFixed(4)} <= $${conditions.maxCostPerRequest}`)
      }
    }

    const result = {
      ruleMatched: match,
      originalModel: model,
      targetModel: match ? rule.target_model : model,
      matchedConditions,
      failedConditions,
      estimatedSavings: match ? 0.01 : 0, // Placeholder
      evaluation: {
        inputLength,
        requestType,
        currentHour: new Date().getUTCHours()
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
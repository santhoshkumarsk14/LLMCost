import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import AES from 'crypto-js/aes'
import CryptoJS from 'crypto-js'
import { encoding_for_model } from 'tiktoken'

const secretKey = process.env.ENCRYPTION_SECRET!

// For production scalability, consider using Redis for rate limiting instead of in-memory Map
const rateLimitMap = new Map<string, number[]>()

const pricing: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'gpt-3.5': { input: 0.0005, output: 0.0015 }
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  let modelKey = 'gpt-3.5'
  if (model.includes('gpt-4')) modelKey = 'gpt-4'
  else if (model.includes('claude-3')) modelKey = 'claude-3-opus'
  else if (model.includes('gpt-3.5')) modelKey = 'gpt-3.5'

  return ((inputTokens / 1000) * pricing[modelKey].input) + ((outputTokens / 1000) * pricing[modelKey].output)
}

function countTokens(text: string, model: string): number {
  try {
    let encoding
    if (model.includes('gpt-4')) {
      encoding = encoding_for_model('gpt-4')
    } else if (model.includes('gpt-3.5')) {
      encoding = encoding_for_model('gpt-3.5-turbo')
    } else if (model.includes('claude')) {
      // Claude uses similar tokenization to GPT, but for simplicity use GPT-4 encoding
      encoding = encoding_for_model('gpt-4')
    } else {
      encoding = encoding_for_model('gpt-3.5-turbo')
    }
    const tokens = encoding.encode(text)
    encoding.free()
    return tokens.length
  } catch (error) {
    console.warn('Error counting tokens with tiktoken, falling back to approximation:', error)
    return Math.ceil(text.length / 4)
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 })
    }
    const incomingApiKey = authHeader.substring(7) // Remove 'Bearer '

    // Create Supabase client
    const supabase = await createServerSupabaseClient()

    // Fetch all API keys to find matching one (since they're encrypted)
    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('*')

    if (keysError) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Find matching API key
    let matchedKey = null
    for (const key of apiKeys) {
      const decryptedKey = AES.decrypt(key.api_key, secretKey).toString(CryptoJS.enc.Utf8)
      if (decryptedKey === incomingApiKey && key.status === 'active') {
        matchedKey = key
        break
      }
    }

    if (!matchedKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Rate limiting: 100 requests per minute per user
    const userId = matchedKey.user_id
    const now = Date.now()
    const windowStart = now - 60 * 1000
    let timestamps = rateLimitMap.get(userId) || []
    timestamps = timestamps.filter(ts => ts > windowStart)
    if (timestamps.length >= 100) {
      const resetTime = Math.ceil((timestamps[0] + 60 * 1000 - now) / 1000)
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': resetTime.toString()
        }
      })
    }
    timestamps.push(now)
    rateLimitMap.set(userId, timestamps)

    // Parse request body
    const body = await request.json()
    const { endpoint, ...payload } = body

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint in request body' }, { status: 400 })
    }

    // Security: Validate endpoint URL to prevent SSRF
    try {
      const url = new URL(endpoint)
      const allowedHosts = [
        'api.openai.com',
        'api.anthropic.com',
        'generativelanguage.googleapis.com'
      ]
      if (!allowedHosts.includes(url.hostname)) {
        return NextResponse.json({ error: 'Invalid endpoint host' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid endpoint URL' }, { status: 400 })
    }

    // Extract model and messages for caching
    let model = payload.model
    const messages = payload.messages
    if (!model || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing or invalid model/messages in request body' }, { status: 400 })
    }

    // Validate model name
    const allowedModels = [
      'gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-32k', 'gpt-4-turbo',
      'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307',
      'gemini-pro', 'gemini-pro-vision'
    ]
    if (!allowedModels.some(allowed => model.includes(allowed.split('-')[0]))) {
      return NextResponse.json({ error: 'Unsupported model' }, { status: 400 })
    }

    // Calculate input tokens
    const inputText = messages.map(m => typeof m.content === 'string' ? m.content : JSON.stringify(m.content)).join(' ')
    const inputTokens = countTokens(inputText, model)

    // Query optimization rules
    const { data: rules, error: rulesError } = await supabase
      .from('optimization_rules')
      .select('*')
      .eq('user_id', matchedKey.user_id)
      .eq('enabled', true)

    if (rulesError) {
      console.error('Error fetching optimization rules:', rulesError)
    }

    // Apply model routing if conditions match
    const originalModel = model
    let appliedRule = null
    if (rules) {
      for (const rule of rules) {
        if (rule.source_model === model) {
          let match = true
          const conditions = rule.conditions || {}

          // Check prompt length
          if (conditions.promptLength && inputText.length >= conditions.promptLength) {
            match = false
          }

          // Check keywords
          if (conditions.keywords && conditions.keywords.length > 0) {
            const hasKeyword = conditions.keywords.some((k: string) => inputText.toLowerCase().includes(k.toLowerCase()))
            if (!hasKeyword) match = false
          }

          // Check time of day
          if (conditions.timeOfDay) {
            const now = new Date()
            const hour = now.getUTCHours()
            if (conditions.timeOfDay === 'off-peak') {
              if (!(hour >= 22 || hour <= 5)) match = false
            } else if (conditions.timeOfDay === 'business-hours') {
              if (!(hour >= 9 && hour <= 17)) match = false
            } else {
              match = false // unknown timeOfDay
            }
          }

          if (match) {
            model = rule.target_model
            appliedRule = rule
            console.log(`Model routed from ${originalModel} to ${model}`)
            break // apply first matching rule
          }
        }
      }
    }

    // Update payload with routed model
    payload.model = model

    // Generate hash for prompt + model
    const hashInput = JSON.stringify({ model, messages })
    const requestHash = CryptoJS.SHA256(hashInput).toString()

    // Check cache
    const { data: cacheEntry } = await supabase
      .from('cache_entries')
      .select('*')
      .eq('request_hash', requestHash)
      .eq('user_id', matchedKey.user_id)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (cacheEntry) {
      // Cache hit: log request asynchronously and return cached response
      ;(async () => {
        try {
          await supabase
            .from('api_requests')
            .insert({
              user_id: matchedKey.user_id,
              api_key_id: matchedKey.id,
              provider: matchedKey.provider,
              model,
              tokens_used: 0,
              cost: 0,
              savings: 0,
              latency: Date.now() - startTime,
              status: 'cached'
            })
        } catch (error) {
          console.error('Error logging cached request:', error)
        }
      })()

      return NextResponse.json(JSON.parse(cacheEntry.response), {
        headers: {
          'X-CostLLM-Cached': 'true',
          'X-CostLLM-Cost': '0',
          'X-CostLLM-Tokens': '0'
        }
      })
    }

    // Determine provider based on endpoint (basic validation)
    let expectedProvider = null
    if (endpoint.includes('api.openai.com')) {
      expectedProvider = 'openai'
    } else if (endpoint.includes('api.anthropic.com')) {
      expectedProvider = 'anthropic'
    } else if (endpoint.includes('generativelanguage.googleapis.com')) {
      expectedProvider = 'google'
    }

    if (expectedProvider && expectedProvider !== matchedKey.provider) {
      return NextResponse.json({ error: 'Endpoint does not match API key provider' }, { status: 400 })
    }

    // Forward request to real API using the decrypted API key with retry logic
    const realApiKey = AES.decrypt(matchedKey.api_key, secretKey).toString(CryptoJS.enc.Utf8)
    let response: Response | undefined
    let retryCount = 0
    const maxRetries = 3

    while (retryCount <= maxRetries) {
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${realApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        })

        if (response.status === 429 && retryCount < maxRetries) {
          // Exponential backoff: wait 2^retryCount seconds
          const waitTime = Math.pow(2, retryCount) * 1000
          console.log(`Rate limited, retrying in ${waitTime}ms (attempt ${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          retryCount++
          continue
        }
        break
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return NextResponse.json({ error: 'Request timeout' }, { status: 408 })
        }
        if (retryCount < maxRetries) {
          retryCount++
          continue
        }
        throw error
      }
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : 'No response'
      if (response?.status === 429) {
        return NextResponse.json({ error: 'Rate limit exceeded by provider after retries' }, { status: 429 })
      }
      return NextResponse.json({ error: `Provider API error: ${errorText}` }, { status: response?.status || 500 })
    }

    const data = await response.json()

    // Calculate output tokens and cost
    let outputText = ''
    if (matchedKey.provider === 'openai') {
      outputText = data.choices?.[0]?.message?.content || ''
    } else if (matchedKey.provider === 'anthropic') {
      outputText = data.content?.[0]?.text || ''
    } else if (matchedKey.provider === 'google') {
      outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    }
    const outputTokens = countTokens(outputText, model)

    let modelKey = 'gpt-3.5'
    if (model.includes('gpt-4')) modelKey = 'gpt-4'
    else if (model.includes('claude-3')) modelKey = 'claude-3-opus'
    else if (model.includes('gpt-3.5')) modelKey = 'gpt-3.5'

    const cost = ((inputTokens / 1000) * pricing[modelKey].input) + ((outputTokens / 1000) * pricing[modelKey].output)

    // Calculate savings if model was routed
    let savings = 0
    if (appliedRule) {
      const originalCost = calculateCost(originalModel, inputTokens, outputTokens)
      savings = originalCost - cost

      // Update rule savings asynchronously
      ;(async () => {
        try {
          const currentSavings = appliedRule.savings_usd || 0
          await supabase
            .from('optimization_rules')
            .update({ savings_usd: currentSavings + savings })
            .eq('id', appliedRule.id)
        } catch (error) {
          console.error('Error updating rule savings:', error)
        }
      })()
    }

    // Update budgets and check alerts asynchronously
    if (cost > 0) {
      ;(async () => {
        try {
          const response = await fetch('/api/budgets/check', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: matchedKey.user_id, cost_usd: cost })
          })
          if (!response.ok) {
            console.error('Error calling budgets check:', await response.text())
          }
        } catch (error) {
          console.error('Error updating budgets:', error)
        }
      })()
    }

    // Store response in cache asynchronously
    ;(async () => {
      try {
        await supabase
          .from('cache_entries')
          .insert({
            user_id: matchedKey.user_id,
            request_hash: requestHash,
            response: JSON.stringify(data),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
      } catch (error) {
        console.error('Error storing cache:', error)
      }
    })()

    // Log request asynchronously
    ;(async () => {
      try {
        await supabase
          .from('api_requests')
          .insert({
            user_id: matchedKey.user_id,
            api_key_id: matchedKey.id,
            provider: matchedKey.provider,
            model,
            tokens_used: inputTokens + outputTokens,
            cost: cost,
            savings: savings,
            latency: Date.now() - startTime,
            status: 'success'
          })
      } catch (error) {
        console.error('Error logging request:', error)
      }
    })()

    return NextResponse.json(data, {
      headers: {
        'X-CostLLM-Cached': 'false',
        'X-CostLLM-Cost': cost.toString(),
        'X-CostLLM-Tokens': (inputTokens + outputTokens).toString()
      }
    })

  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { POST } from '@/app/api/proxy/route'
import AES from 'crypto-js/aes'
import CryptoJS from 'crypto-js'
import { NextRequest } from 'next/server'

// Mock Supabase client
vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn()
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {}
}))

// Mock fetch for internal API calls (budget checks)
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock environment variables
process.env.ENCRYPTION_SECRET = 'test-encryption-secret'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock server for external API calls
const server = setupServer()

// Helper function to create NextRequest
function createNextRequest(body: any, headers: Record<string, string> = {}): NextRequest {
  const url = 'http://localhost:3000/api/proxy'
  const request = new NextRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })
  return request
}

describe('/api/proxy integration tests', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterEach(() => {
    server.resetHandlers()
    server.close()
    vi.clearAllMocks()
  })
  const testUserId = 'test-user-id'
  const testApiKeyId = 'test-api-key-id'
  const testApiKey = 'sk-test123456789'
  const encryptedApiKey = AES.encrypt(testApiKey, process.env.ENCRYPTION_SECRET!).toString()

  const mockSupabaseClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockResolvedValue({}),
  }

  beforeEach(async () => {
    const { createServerSupabaseClient } = vi.mocked(await import('@/lib/supabase-server'))
    createServerSupabaseClient.mockResolvedValue(mockSupabaseClient as any)

    // Mock API keys query
    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.select.mockResolvedValue({
      data: [{
        id: testApiKeyId,
        user_id: testUserId,
        api_key: encryptedApiKey,
        provider: 'openai',
        status: 'active'
      }],
      error: null
    })

    // Mock optimization rules query
    mockSupabaseClient.select.mockResolvedValueOnce({
      data: [],
      error: null
    })

    // Mock cache query (no cache hit by default)
    mockSupabaseClient.maybeSingle.mockResolvedValue(null)

    // Mock insert operations
    mockSupabaseClient.insert.mockResolvedValue({ error: null })
    mockSupabaseClient.update.mockResolvedValue({ error: null })

    // Mock fetch for budget checks
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })
  })

  describe('successful OpenAI proxy flow', () => {
    it('should proxy OpenAI chat completion request and log to database', async () => {
      // Mock OpenAI API response
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          return HttpResponse.json({
            id: 'chatcmpl-test',
            object: 'chat.completion',
            created: Date.now(),
            model: 'gpt-3.5-turbo',
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: 'Hello, this is a test response!'
              },
              finish_reason: 'stop'
            }],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 8,
              total_tokens: 18
            }
          })
        })
      )

      const requestBody = {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.7
      }

      const request = createNextRequest(requestBody, {
        'Authorization': `Bearer ${testApiKey}`
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.choices[0].message.content).toBe('Hello, this is a test response!')

      // Check headers
      expect(response.headers.get('X-CostLLM-Cached')).toBe('false')
      expect(response.headers.get('X-CostLLM-Cost')).toMatch(/^\d+\.\d+$/)
      expect(response.headers.get('X-CostLLM-Tokens')).toBe('18')

      // Verify database logging
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('api_requests')
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: testUserId,
          api_key_id: testApiKeyId,
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          tokens_used: 18,
          status: 'success'
        })
      )

      // Verify cache storage
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('cache_entries')
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: testUserId,
          response: JSON.stringify(data)
        })
      )
    })
  })

  describe('successful Anthropic proxy flow', () => {
    it('should proxy Anthropic messages request and log to database', async () => {
      // Update mock for Anthropic provider
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [{
          id: testApiKeyId,
          user_id: testUserId,
          api_key: encryptedApiKey,
          provider: 'anthropic',
          status: 'active'
        }],
        error: null
      })

      // Mock Anthropic API response
      server.use(
        http.post('https://api.anthropic.com/v1/messages', () => {
          return HttpResponse.json({
            id: 'msg_test123',
            type: 'message',
            role: 'assistant',
            content: [{
              type: 'text',
              text: 'Hello! This is Claude responding to your message.'
            }],
            model: 'claude-3-sonnet-20240229',
            stop_reason: 'end_turn',
            stop_sequence: null,
            usage: {
              input_tokens: 12,
              output_tokens: 15
            }
          })
        })
      )

      const requestBody = {
        endpoint: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-sonnet-20240229',
        messages: [{ role: 'user', content: 'Hello Claude' }],
        max_tokens: 100
      }

      const request = createNextRequest(requestBody, {
        'Authorization': `Bearer ${testApiKey}`
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.content[0].text).toBe('Hello! This is Claude responding to your message.')

      // Check headers
      expect(response.headers.get('X-CostLLM-Cached')).toBe('false')
      expect(response.headers.get('X-CostLLM-Cost')).toMatch(/^\d+\.\d+$/)
      expect(response.headers.get('X-CostLLM-Tokens')).toBe('27')

      // Verify database logging
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('api_requests')
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: testUserId,
          api_key_id: testApiKeyId,
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229',
          tokens_used: 27,
          status: 'success'
        })
      )
    })
  })

  describe('cache behavior', () => {
    it('should return cached response when cache hit occurs', async () => {
      const cachedResponse = {
        id: 'cached-response',
        choices: [{ message: { content: 'Cached response' } }]
      }

      // Mock cache hit
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        request_hash: 'test-hash',
        response: JSON.stringify(cachedResponse),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })

      const requestBody = {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }]
      }

      const request = createNextRequest(requestBody, {
        'Authorization': `Bearer ${testApiKey}`
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toEqual(cachedResponse)

      // Check cache headers
      expect(response.headers.get('X-CostLLM-Cached')).toBe('true')
      expect(response.headers.get('X-CostLLM-Cost')).toBe('0')
      expect(response.headers.get('X-CostLLM-Tokens')).toBe('0')

      // Verify cached request logging
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('api_requests')
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: testUserId,
          api_key_id: testApiKeyId,
          tokens_used: 0,
          cost: 0,
          status: 'cached'
        })
      )
    })

    it('should not call external API when cache hit occurs', async () => {
      const cachedResponse = { id: 'cached', choices: [] }

      mockSupabaseClient.maybeSingle.mockResolvedValue({
        request_hash: 'test-hash',
        response: JSON.stringify(cachedResponse),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })

      // Spy on fetch to ensure it's not called for external API
      const originalFetch = global.fetch
      const fetchSpy = vi.fn().mockImplementation(originalFetch)
      global.fetch = fetchSpy

      const requestBody = {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }]
      }

      const request = createNextRequest(requestBody, {
        'Authorization': `Bearer ${testApiKey}`
      })

      await POST(request)

      // Should not call external API
      expect(fetchSpy).not.toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.any(Object)
      )

      global.fetch = originalFetch
    })
  })

  describe('model routing', () => {
    it('should route model based on optimization rules', async () => {
      // Mock optimization rule
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [{
          id: 'rule-1',
          user_id: testUserId,
          source_model: 'gpt-4',
          target_model: 'gpt-3.5-turbo',
          enabled: true,
          conditions: { promptLength: 100 } // Route if prompt > 100 chars
        }],
        error: null
      })

      // Mock OpenAI API response for routed model
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          return HttpResponse.json({
            id: 'chatcmpl-routed',
            choices: [{
              message: {
                role: 'assistant',
                content: 'Response from GPT-3.5 (routed from GPT-4)'
              }
            }],
            usage: { prompt_tokens: 25, completion_tokens: 10, total_tokens: 35 }
          })
        })
      )

      const longMessage = 'a'.repeat(150) // Longer than 100 chars
      const requestBody = {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4',
        messages: [{ role: 'user', content: longMessage }]
      }

      const request = createNextRequest(requestBody, {
        'Authorization': `Bearer ${testApiKey}`
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      // Verify rule savings were updated
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('optimization_rules')
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          savings_usd: expect.any(Number)
        })
      )
    })
  })

  describe('budget integration', () => {
    it('should call budget check API when cost > 0', async () => {
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          return HttpResponse.json({
            choices: [{ message: { content: 'Test response' } }],
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
          })
        })
      )

      const requestBody = {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }]
      }

      const request = createNextRequest(requestBody, {
        'Authorization': `Bearer ${testApiKey}`
      })

      await POST(request)

      // Verify budget check was called
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/budgets/check',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            user_id: testUserId,
            cost_usd: expect.any(Number)
          })
        })
      )
    })
  })

  describe('error handling', () => {
    it('should return 401 for missing authorization header', async () => {
      const request = createNextRequest({
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }]
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Missing or invalid Authorization header')
    })

    it('should return 401 for invalid API key', async () => {
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [], // No matching keys
        error: null
      })

      const request = createNextRequest({
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }]
      }, {
        'Authorization': 'Bearer invalid-key'
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Invalid API key')
    })

    it('should return 400 for endpoint-provider mismatch', async () => {
      // API key is for OpenAI but endpoint is Anthropic
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [{
          id: testApiKeyId,
          user_id: testUserId,
          api_key: encryptedApiKey,
          provider: 'openai',
          status: 'active'
        }],
        error: null
      })

      const request = createNextRequest({
        endpoint: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-sonnet-20240229',
        messages: [{ role: 'user', content: 'Hello' }]
      }, {
        'Authorization': `Bearer ${testApiKey}`
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Endpoint does not match API key provider')
    })

    it('should handle provider API errors', async () => {
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          return HttpResponse.json(
            { error: { message: 'Rate limit exceeded' } },
            { status: 429 }
          )
        })
      )

      const request = createNextRequest({
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }]
      }, {
        'Authorization': `Bearer ${testApiKey}`
      })

      const response = await POST(request)
      expect(response.status).toBe(429)
      const data = await response.json()
      expect(data.error).toBe('Rate limit exceeded by provider after retries')
    })
  })
})
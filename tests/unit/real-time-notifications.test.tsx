import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { RealTimeNotifications } from '@/components/dashboard/real-time-notifications'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
        unsubscribe: vi.fn()
      })),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    })),
    removeChannel: vi.fn()
  }
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

describe('RealTimeNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders without crashing', () => {
    render(<RealTimeNotifications />)
    // Component renders null, so nothing to assert in DOM
    expect(document.body.children).toHaveLength(1)
  })

  it('sets up subscriptions when user is authenticated', async () => {
    const mockSupabase = vi.mocked(supabase)
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    })
    mockSupabase.channel.mockReturnValue(mockChannel as any)

    render(<RealTimeNotifications />)

    await waitFor(() => {
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    })

    expect(mockSupabase.channel).toHaveBeenCalledTimes(3) // budgets, api-keys, api_requests
    expect(mockChannel.on).toHaveBeenCalledTimes(3)
    expect(mockChannel.subscribe).toHaveBeenCalledTimes(3)
  })

  it('does not set up subscriptions when user is not authenticated', async () => {
    const mockSupabase = vi.mocked(supabase)

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    render(<RealTimeNotifications />)

    await waitFor(() => {
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    })

    expect(mockSupabase.channel).not.toHaveBeenCalled()
  })

  it('shows budget alert when threshold is exceeded', async () => {
    const mockSupabase = vi.mocked(supabase)
    const mockToast = vi.mocked(toast)

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    })

    let budgetCallback: (payload: any) => void
    const mockChannel = {
      on: vi.fn().mockImplementation((event, config, callback) => {
        if (config.table === 'budgets') {
          budgetCallback = callback
        }
        return mockChannel
      }),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    }

    mockSupabase.channel.mockReturnValue(mockChannel as any)

    render(<RealTimeNotifications />)

    await waitFor(() => {
      expect(budgetCallback).toBeDefined()
    })

    // Simulate budget update that exceeds alert threshold
    const payload = {
      new: {
        id: 'budget-1',
        user_id: 'test-user-id',
        type: 'Monthly Budget',
        limit: 100,
        current_spend: 85, // Exceeds 80% threshold (80)
        alert_threshold: 0.8,
        status: 'active'
      },
      old: {
        current_spend: 75 // Was below threshold
      }
    }

    budgetCallback!(payload)

    expect(mockToast.warning).toHaveBeenCalledWith(
      'Budget Alert: Monthly Budget has exceeded alert threshold',
      {
        description: 'Current spend: $85.0000, Threshold: $80.0000'
      }
    )
  })

  it('shows budget exceeded error when limit is exceeded', async () => {
    const mockSupabase = vi.mocked(supabase)
    const mockToast = vi.mocked(toast)

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    })

    let budgetCallback: (payload: any) => void
    const mockChannel = {
      on: vi.fn().mockImplementation((event, config, callback) => {
        if (config.table === 'budgets') {
          budgetCallback = callback
        }
        return mockChannel
      }),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    }

    mockSupabase.channel.mockReturnValue(mockChannel as any)

    render(<RealTimeNotifications />)

    await waitFor(() => {
      expect(budgetCallback).toBeDefined()
    })

    // Simulate budget update that exceeds limit
    const payload = {
      new: {
        id: 'budget-1',
        user_id: 'test-user-id',
        type: 'Monthly Budget',
        limit: 100,
        current_spend: 105, // Exceeds limit
        alert_threshold: 0.8,
        status: 'exceeded'
      },
      old: {
        current_spend: 95 // Was below limit
      }
    }

    budgetCallback!(payload)

    expect(mockToast.error).toHaveBeenCalledWith(
      'Budget Exceeded: Monthly Budget has exceeded its limit',
      {
        description: 'Current spend: $105.0000, Limit: $100.0000'
      }
    )
  })

  it('shows API key invalid error when status changes', async () => {
    const mockSupabase = vi.mocked(supabase)
    const mockToast = vi.mocked(toast)

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    })

    let apiKeyCallback: (payload: any) => void
    const mockChannel = {
      on: vi.fn().mockImplementation((event, config, callback) => {
        if (config.table === 'api_keys') {
          apiKeyCallback = callback
        }
        return mockChannel
      }),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    }

    mockSupabase.channel.mockReturnValue(mockChannel as any)

    render(<RealTimeNotifications />)

    await waitFor(() => {
      expect(apiKeyCallback).toBeDefined()
    })

    // Simulate API key status change to invalid
    const payload = {
      new: {
        id: 'key-1',
        user_id: 'test-user-id',
        provider: 'openai',
        status: 'invalid'
      },
      old: {
        status: 'active'
      }
    }

    apiKeyCallback!(payload)

    expect(mockToast.error).toHaveBeenCalledWith(
      'API Key Issue: openai API key is invalid',
      {
        description: 'Please update your openai API key in settings.'
      }
    )
  })

  it('shows high cost alert for expensive requests', async () => {
    const mockSupabase = vi.mocked(supabase)
    const mockToast = vi.mocked(toast)

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    })

    let requestCallback: (payload: any) => void
    const mockChannel = {
      on: vi.fn().mockImplementation((event, config, callback) => {
        if (config.table === 'api_requests') {
          requestCallback = callback
        }
        return mockChannel
      }),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    }

    mockSupabase.channel.mockReturnValue(mockChannel as any)

    render(<RealTimeNotifications />)

    await waitFor(() => {
      expect(requestCallback).toBeDefined()
    })

    // Simulate high-cost request
    const payload = {
      new: {
        id: 'req-1',
        user_id: 'test-user-id',
        model: 'gpt-4',
        cost: 0.15 // Above $0.10 threshold
      }
    }

    requestCallback!(payload)

    expect(mockToast.info).toHaveBeenCalledWith(
      'High Cost Request: $0.1500 for gpt-4',
      {
        description: 'Request ID: req-1'
      }
    )
  })

  it('cleans up subscriptions on unmount', async () => {
    const mockSupabase = vi.mocked(supabase)
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    })
    mockSupabase.channel.mockReturnValue(mockChannel as any)
    mockSupabase.removeChannel = vi.fn()

    const { unmount } = render(<RealTimeNotifications />)

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalled()
    })

    unmount()

    expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(3)
  })
})
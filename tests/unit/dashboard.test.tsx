import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardPage from '@/app/dashboard/page'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          }))
        })),
        eq: vi.fn(() => ({
          data: [],
          error: null
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [],
            error: null
          }))
        })),
        reduce: vi.fn(() => 0)
      })),
      count: vi.fn(() => ({
        count: 0,
        error: null
      }))
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        on: vi.fn(() => ({
          on: vi.fn(() => ({
            subscribe: vi.fn(),
            unsubscribe: vi.fn()
          }))
        }))
      })),
      removeChannel: vi.fn()
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } } }))
    }
  }
}))

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders dashboard with loading state initially', () => {
    render(<DashboardPage />)

    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders dashboard metrics after data loads', async () => {
    // Mock successful data fetch
    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'api_requests') {
        return {
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  { cost: 0.05, created_at: '2024-01-01T00:00:00Z' },
                  { cost: 0.03, created_at: '2024-01-02T00:00:00Z' }
                ],
                error: null
              })
            }),
            eq: vi.fn().mockResolvedValue({
              data: [{ cost: 0.02 }],
              error: null
            }),
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  { id: '1', model: 'gpt-4', cost: 0.05, created_at: '2024-01-01T00:00:00Z' }
                ],
                error: null
              })
            })
          }),
          count: vi.fn().mockResolvedValue({
            count: 10,
            error: null
          })
        } as any
      }
      return {} as any
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Total Spend')).toBeInTheDocument()
    })

    expect(screen.getByText('$0.08')).toBeInTheDocument() // 0.05 + 0.03
    expect(screen.getByText('10')).toBeInTheDocument() // requests count
    expect(screen.getByText('$0.02')).toBeInTheDocument() // money saved
    expect(screen.getByText('$0.0040')).toBeInTheDocument() // avg cost
  })

  it('handles button clicks for navigation', async () => {
    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ data: [], error: null }),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      }),
      count: vi.fn().mockResolvedValue({ count: 0, error: null })
    } as any))

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Add API Key')).toBeInTheDocument()
    })

    const addApiKeyButton = screen.getByText('Add API Key')
    await userEvent.click(addApiKeyButton)

    expect(mockPush).toHaveBeenCalledWith('/dashboard/api-keys')

    const configureBudgetButton = screen.getByText('Configure Budget')
    await userEvent.click(configureBudgetButton)

    expect(mockPush).toHaveBeenCalledWith('/dashboard/budgets')

    const viewAnalyticsButton = screen.getByText('View Analytics')
    await userEvent.click(viewAnalyticsButton)

    expect(mockPush).toHaveBeenCalledWith('/dashboard/analytics')
  })

  it('handles export data functionality', async () => {
    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ data: [], error: null }),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [
              { id: '1', model: 'gpt-4', cost: 0.05, created_at: '2024-01-01T00:00:00Z' }
            ],
            error: null
          })
        })
      }),
      count: vi.fn().mockResolvedValue({ count: 0, error: null })
    } as any))

    // Mock URL.createObjectURL and document methods
    const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
    const mockClick = vi.fn()
    global.URL.createObjectURL = mockCreateObjectURL
    global.URL.revokeObjectURL = vi.fn()

    const mockAppendChild = vi.fn()
    const mockRemoveChild = vi.fn()
    Object.defineProperty(document, 'createElement', {
      writable: true,
      value: vi.fn(() => ({
        click: mockClick,
        setAttribute: vi.fn(),
        style: {}
      }))
    })
    document.body.appendChild = mockAppendChild
    document.body.removeChild = mockRemoveChild

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument()
    })

    const exportButton = screen.getByText('Export')
    await userEvent.click(exportButton)

    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(mockClick).toHaveBeenCalled()
  })

  it('sets up real-time subscriptions on mount', async () => {
    const mockSupabase = vi.mocked(supabase)
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    }
    mockSupabase.channel.mockReturnValue(mockChannel as any)

    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ data: [], error: null }),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      }),
      count: vi.fn().mockResolvedValue({ count: 0, error: null })
    } as any))

    render(<DashboardPage />)

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalledWith('dashboard-updates')
    })

    expect(mockChannel.on).toHaveBeenCalledTimes(3) // api_requests, budgets, optimization_rules
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it('handles API errors gracefully', async () => {
    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockImplementation(() => {
      throw new Error('Database error')
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Total Spend')).toBeInTheDocument()
    })

    // Should show default values when error occurs
    expect(screen.getByText('$0.00')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
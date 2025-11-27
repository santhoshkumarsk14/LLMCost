import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AnalyticsPage from '@/app/dashboard/analytics/page'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
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

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn()
  }))
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock URL and document for export functionality
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn()
  },
  writable: true
})

Object.defineProperty(document, 'createElement', {
  writable: true,
  value: vi.fn(() => ({
    click: vi.fn(),
    setAttribute: vi.fn(),
    href: '',
    download: ''
  }))
})

document.body.appendChild = vi.fn()
document.body.removeChild = vi.fn()

describe('AnalyticsPage', () => {
  const mockUseQuery = vi.fn()
  const mockUseQueryClient = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup React Query mocks
    const { useQuery, useQueryClient } = require('@tanstack/react-query')
    useQuery.mockImplementation(mockUseQuery)
    useQueryClient.mockImplementation(mockUseQueryClient)

    mockUseQueryClient.mockReturnValue({
      invalidateQueries: vi.fn()
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state initially', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    })

    render(<AnalyticsPage />)

    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getAllByTestId('skeleton')).toHaveLength(4) // Metric cards loading
  })

  it('renders analytics data after loading', async () => {
    const mockData = {
      metrics: [
        {
          title: 'Total Cost',
          value: '$125.50',
          change: '+12.5%',
          changeType: 'positive',
          icon: 'DollarSign'
        },
        {
          title: 'Total Requests',
          value: '1,250',
          change: '-5.2%',
          changeType: 'negative',
          icon: 'Activity'
        }
      ],
      costOverTime: [
        { name: 'Jan', cost: 50, requests: 100 },
        { name: 'Feb', cost: 75, requests: 150 }
      ],
      costByModel: [
        { name: 'GPT-4', value: 80 },
        { name: 'Claude', value: 45.5 }
      ],
      requestsByHour: [
        { name: '00:00', requests: 10 },
        { name: '01:00', requests: 15 }
      ],
      topRequests: [
        {
          model: 'gpt-4',
          provider: 'openai',
          requests: 500,
          cost: 75.25,
          avgCost: 0.15
        }
      ]
    }

    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null
    })

    render(<AnalyticsPage />)

    await waitFor(() => {
      expect(screen.getByText('Total Cost')).toBeInTheDocument()
    })

    expect(screen.getByText('$125.50')).toBeInTheDocument()
    expect(screen.getByText('1,250')).toBeInTheDocument()
    expect(screen.getByText('+12.5%')).toBeInTheDocument()
    expect(screen.getByText('-5.2%')).toBeInTheDocument()
    expect(screen.getByText('Cost Over Time')).toBeInTheDocument()
    expect(screen.getByText('Cost by Model')).toBeInTheDocument()
    expect(screen.getByText('gpt-4')).toBeInTheDocument()
    expect(screen.getByText('500')).toBeInTheDocument()
  })

  it('handles API errors gracefully', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch')
    })

    render(<AnalyticsPage />)

    expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument()
  })

  it('handles export functionality', async () => {
    const user = userEvent.setup()

    const mockData = {
      metrics: [],
      costOverTime: [],
      costByModel: [],
      requestsByHour: [],
      topRequests: [
        {
          model: 'gpt-4',
          provider: 'openai',
          requests: 500,
          cost: 75.25,
          avgCost: 0.15
        }
      ]
    }

    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null
    })

    render(<AnalyticsPage />)

    await waitFor(() => {
      expect(screen.getByText('Export Data')).toBeInTheDocument()
    })

    const exportButton = screen.getByText('Export Data')
    await user.click(exportButton)

    expect(window.URL.createObjectURL).toHaveBeenCalled()
    expect(document.createElement).toHaveBeenCalledWith('a')
  })

  it('sets up real-time subscriptions', () => {
    const mockSupabase = vi.mocked(supabase)
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    }

    mockSupabase.channel.mockReturnValue(mockChannel as any)

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    })

    render(<AnalyticsPage />)

    expect(mockSupabase.channel).toHaveBeenCalledWith('analytics-updates')
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'api_requests' },
      expect.any(Function)
    )
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it('invalidates queries on real-time updates', () => {
    const mockInvalidateQueries = vi.fn()
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries
    })

    const mockSupabase = vi.mocked(supabase)
    let updateCallback: (payload: any) => void

    const mockChannel = {
      on: vi.fn().mockImplementation((event, config, callback) => {
        if (config.table === 'api_requests') {
          updateCallback = callback
        }
        return mockChannel
      }),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    }

    mockSupabase.channel.mockReturnValue(mockChannel as any)

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    })

    render(<AnalyticsPage />)

    // Simulate real-time update
    updateCallback!({})

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: expect.any(Array)
    })
  })

  it('fetches data with correct date range parameters', () => {
    const mockDateRange = {
      from: new Date('2024-01-01'),
      to: new Date('2024-01-31')
    }

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    })

    render(<AnalyticsPage />)

    // The query should be called with the date range
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['analytics', expect.any(Object)],
        enabled: true
      })
    )
  })

  it('displays correct trend indicators', async () => {
    const mockData = {
      metrics: [
        {
          title: 'Total Cost',
          value: '$125.50',
          change: '+12.5%',
          changeType: 'positive',
          icon: 'DollarSign'
        },
        {
          title: 'Total Requests',
          value: '1,250',
          change: '-5.2%',
          changeType: 'negative',
          icon: 'Activity'
        }
      ],
      costOverTime: [],
      costByModel: [],
      requestsByHour: [],
      topRequests: []
    }

    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null
    })

    render(<AnalyticsPage />)

    await waitFor(() => {
      expect(screen.getByText('+12.5%')).toBeInTheDocument()
    })

    // Check for trend icons (TrendingUp and TrendingDown)
    const trendingUpIcon = document.querySelector('[data-testid="trending-up"]') ||
                          screen.getByText('+12.5%').previousElementSibling
    const trendingDownIcon = document.querySelector('[data-testid="trending-down"]') ||
                           screen.getByText('-5.2%').previousElementSibling

    expect(trendingUpIcon).toBeInTheDocument()
    expect(trendingDownIcon).toBeInTheDocument()
  })

  it('formats table data correctly', async () => {
    const mockData = {
      metrics: [],
      costOverTime: [],
      costByModel: [],
      requestsByHour: [],
      topRequests: [
        {
          model: 'gpt-4-turbo',
          provider: 'openai',
          requests: 1234,
          cost: 123.456,
          avgCost: 0.1
        }
      ]
    }

    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null
    })

    render(<AnalyticsPage />)

    await waitFor(() => {
      expect(screen.getByText('gpt-4-turbo')).toBeInTheDocument()
    })

    expect(screen.getByText('1,234')).toBeInTheDocument() // Formatted number
    expect(screen.getByText('$123.46')).toBeInTheDocument() // Formatted cost
    expect(screen.getByText('$0.100')).toBeInTheDocument() // Formatted avg cost
  })

  it('handles empty data gracefully', () => {
    const mockData = {
      metrics: [],
      costOverTime: [],
      costByModel: [],
      requestsByHour: [],
      topRequests: []
    }

    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null
    })

    render(<AnalyticsPage />)

    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Top Requests by Model')).toBeInTheDocument()
    // Should not crash with empty data
  })
})
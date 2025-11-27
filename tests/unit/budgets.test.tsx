import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BudgetsPage from '@/app/dashboard/budgets/page'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

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

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('BudgetsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state initially', () => {
    render(<BudgetsPage />)
    expect(screen.getByText('Budgets')).toBeInTheDocument()
    expect(screen.getByText('Loading budgets...')).toBeInTheDocument()
  })

  it('renders budgets after loading', async () => {
    const mockBudgets = [
      {
        id: '1',
        type: 'Monthly API Budget',
        budgetLimit: 1000,
        alertThreshold: 80,
        currentSpend: 650,
        status: 'active',
        notificationChannels: ['email', 'slack']
      },
      {
        id: '2',
        type: 'Weekly Budget',
        budgetLimit: 200,
        alertThreshold: 90,
        currentSpend: 50,
        status: 'paused',
        notificationChannels: ['email']
      }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBudgets)
    })

    render(<BudgetsPage />)

    await waitFor(() => {
      expect(screen.getByText('Monthly API Budget')).toBeInTheDocument()
    })

    expect(screen.getByText('Weekly Budget')).toBeInTheDocument()
    expect(screen.getByText('$650.00')).toBeInTheDocument()
    expect(screen.getByText('$1000.00')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('65.0%')).toBeInTheDocument()
    expect(screen.getByText('Total Current Spend')).toBeInTheDocument()
    expect(screen.getByText('$700.00')).toBeInTheDocument() // 650 + 50
  })

  it('opens add budget dialog', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    render(<BudgetsPage />)

    await waitFor(() => {
      expect(screen.getByText('Add Budget')).toBeInTheDocument()
    })

    const addButton = screen.getByText('Add Budget')
    await user.click(addButton)

    expect(screen.getByText('Add New Budget')).toBeInTheDocument()
    expect(screen.getByText('Budget Type')).toBeInTheDocument()
    expect(screen.getByText('Limit Amount ($)')).toBeInTheDocument()
    expect(screen.getByText('Alert Threshold (%)')).toBeInTheDocument()
    expect(screen.getByText('Notification Channels')).toBeInTheDocument()
  })

  it('handles successful budget creation', async () => {
    const user = userEvent.setup()
    const mockToast = vi.mocked(toast)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    // Mock successful budget creation
    const newBudget = {
      id: '3',
      type: 'Test Budget',
      budgetLimit: 500,
      alertThreshold: 75,
      currentSpend: 0,
      status: 'active',
      notificationChannels: ['email', 'slack']
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(newBudget)
    })

    render(<BudgetsPage />)

    await waitFor(() => {
      expect(screen.getByText('Add Budget')).toBeInTheDocument()
    })

    const addButton = screen.getByText('Add Budget')
    await user.click(addButton)

    const typeInput = screen.getByPlaceholderText('e.g., Monthly API Budget')
    const limitInput = screen.getByPlaceholderText('1000')
    const thresholdInput = screen.getByPlaceholderText('80')
    const emailCheckbox = screen.getByLabelText('email')
    const slackCheckbox = screen.getByLabelText('slack')
    const createButton = screen.getByText('Create Budget')

    await user.type(typeInput, 'Test Budget')
    await user.clear(limitInput)
    await user.type(limitInput, '500')
    await user.clear(thresholdInput)
    await user.type(thresholdInput, '75')
    await user.click(emailCheckbox)
    await user.click(slackCheckbox)
    await user.click(createButton)

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Budget created successfully')
    })

    // Verify API call
    expect(mockFetch).toHaveBeenCalledWith('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'Test Budget',
        limit: 500,
        alertThreshold: 75,
        notificationChannels: ['email', 'slack']
      })
    })
  })

  it('handles budget creation error', async () => {
    const user = userEvent.setup()
    const mockToast = vi.mocked(toast)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    // Mock failed budget creation
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Budget limit too low' })
    })

    render(<BudgetsPage />)

    await waitFor(() => {
      expect(screen.getByText('Add Budget')).toBeInTheDocument()
    })

    const addButton = screen.getByText('Add Budget')
    await user.click(addButton)

    const typeInput = screen.getByPlaceholderText('e.g., Monthly API Budget')
    const limitInput = screen.getByPlaceholderText('1000')
    const emailCheckbox = screen.getByLabelText('email')
    const createButton = screen.getByText('Create Budget')

    await user.type(typeInput, 'Test Budget')
    await user.clear(limitInput)
    await user.type(limitInput, '0')
    await user.click(emailCheckbox)
    await user.click(createButton)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Budget limit too low')
    })
  })

  it('validates form fields', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    render(<BudgetsPage />)

    await waitFor(() => {
      expect(screen.getByText('Add Budget')).toBeInTheDocument()
    })

    const addButton = screen.getByText('Add Budget')
    await user.click(addButton)

    const createButton = screen.getByText('Create Budget')

    // Try to submit empty form
    await user.click(createButton)

    expect(screen.getByText('Budget type is required')).toBeInTheDocument()
    expect(screen.getByText('At least one notification channel is required')).toBeInTheDocument()
  })

  it('validates budget limit is positive', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    render(<BudgetsPage />)

    await waitFor(() => {
      expect(screen.getByText('Add Budget')).toBeInTheDocument()
    })

    const addButton = screen.getByText('Add Budget')
    await user.click(addButton)

    const limitInput = screen.getByPlaceholderText('1000')
    const createButton = screen.getByText('Create Budget')

    await user.clear(limitInput)
    await user.type(limitInput, '-100')
    await user.click(createButton)

    expect(screen.getByText('Limit must be positive')).toBeInTheDocument()
  })

  it('validates alert threshold range', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    render(<BudgetsPage />)

    await waitFor(() => {
      expect(screen.getByText('Add Budget')).toBeInTheDocument()
    })

    const addButton = screen.getByText('Add Budget')
    await user.click(addButton)

    const thresholdInput = screen.getByPlaceholderText('80')
    const createButton = screen.getByText('Create Budget')

    await user.clear(thresholdInput)
    await user.type(thresholdInput, '150')
    await user.click(createButton)

    expect(screen.getByText('Threshold must be between 0 and 100')).toBeInTheDocument()
  })

  it('handles API fetch errors', async () => {
    const mockToast = vi.mocked(toast)

    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<BudgetsPage />)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to load budgets')
    })
  })

  it('sets up real-time subscriptions', async () => {
    const mockSupabase = vi.mocked(supabase)
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    }

    mockSupabase.channel.mockReturnValue(mockChannel as any)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    render(<BudgetsPage />)

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalledWith('budgets-updates')
    })

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'budgets' },
      expect.any(Function)
    )
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it('calculates progress correctly', async () => {
    const mockBudgets = [
      {
        id: '1',
        type: 'Test Budget',
        budgetLimit: 1000,
        alertThreshold: 80,
        currentSpend: 750,
        status: 'active',
        notificationChannels: ['email']
      }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBudgets)
    })

    render(<BudgetsPage />)

    await waitFor(() => {
      expect(screen.getByText('75.0%')).toBeInTheDocument()
    })
  })

  it('handles notification channel selection', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    render(<BudgetsPage />)

    await waitFor(() => {
      expect(screen.getByText('Add Budget')).toBeInTheDocument()
    })

    const addButton = screen.getByText('Add Budget')
    await user.click(addButton)

    const emailCheckbox = screen.getByLabelText('email')
    const slackCheckbox = screen.getByLabelText('slack')
    const smsCheckbox = screen.getByLabelText('sms')

    await user.click(emailCheckbox)
    await user.click(slackCheckbox)
    await user.click(smsCheckbox)

    expect(emailCheckbox).toBeChecked()
    expect(slackCheckbox).toBeChecked()
    expect(smsCheckbox).toBeChecked()

    // Uncheck one
    await user.click(emailCheckbox)
    expect(emailCheckbox).not.toBeChecked()
  })
})
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ApiKeysPage from '@/app/dashboard/api-keys/page'
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

describe('ApiKeysPage', () => {
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
    render(<ApiKeysPage />)
    expect(screen.getByText('API Keys')).toBeInTheDocument()
  })

  it('renders API keys after loading', async () => {
    const mockApiKeys = [
      {
        id: '1',
        provider: 'openai',
        nickname: 'Production Key',
        api_key: 'sk-****1234',
        status: 'active',
        total_requests: 150,
        total_cost: 2.5
      },
      {
        id: '2',
        provider: 'anthropic',
        nickname: null,
        api_key: 'sk-ant-****5678',
        status: 'inactive',
        total_requests: 75,
        total_cost: 1.2
      }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiKeys)
    })

    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('Openai')).toBeInTheDocument()
    })

    expect(screen.getByText('Production Key')).toBeInTheDocument()
    expect(screen.getByText('Requests: 150')).toBeInTheDocument()
    expect(screen.getByText('Cost: $2.5000')).toBeInTheDocument()
    expect(screen.getByText('Anthropic')).toBeInTheDocument()
    expect(screen.getByText('No nickname')).toBeInTheDocument()
  })

  it('shows empty state when no API keys', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('No API keys yet')).toBeInTheDocument()
    })

    expect(screen.getByText('Add your first API key to get started.')).toBeInTheDocument()
  })

  it('opens add API key dialog', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('Add API Key')).toBeInTheDocument()
    })

    const addButton = screen.getByText('Add API Key')
    await user.click(addButton)

    expect(screen.getByText('Add New API Key')).toBeInTheDocument()
    expect(screen.getByText('Provider')).toBeInTheDocument()
    expect(screen.getByText('API Key')).toBeInTheDocument()
    expect(screen.getByText('Nickname (Optional)')).toBeInTheDocument()
  })

  it('handles successful API key addition', async () => {
    const user = userEvent.setup()
    const mockToast = vi.mocked(toast)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    // Mock successful connection test
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })

    // Mock successful API key creation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })

    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('Add API Key')).toBeInTheDocument()
    })

    const addButton = screen.getByText('Add API Key')
    await user.click(addButton)

    const providerSelect = screen.getByDisplayValue('openai')
    const apiKeyInput = screen.getByPlaceholderText('Enter your API key')
    const nicknameInput = screen.getByPlaceholderText('e.g., Production Key')
    const saveButton = screen.getByText('Save API Key')

    await user.selectOptions(providerSelect, 'anthropic')
    await user.type(apiKeyInput, 'sk-ant-test123')
    await user.type(nicknameInput, 'Test Key')
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('API key added successfully!')
    })

    // Verify API calls
    expect(mockFetch).toHaveBeenCalledWith('/api/api-keys/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'anthropic', api_key: 'sk-ant-test123' })
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'anthropic',
        api_key: 'sk-ant-test123',
        nickname: 'Test Key'
      })
    })
  })

  it('handles connection test failure', async () => {
    const user = userEvent.setup()
    const mockToast = vi.mocked(toast)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    // Mock failed connection test
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: false, error: 'Invalid API key' })
    })

    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('Add API Key')).toBeInTheDocument()
    })

    const addButton = screen.getByText('Add API Key')
    await user.click(addButton)

    const testButton = screen.getByText('Test Connection')
    await user.click(testButton)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Connection test failed: Invalid API key')
    })
  })

  it('handles API key status toggle', async () => {
    const user = userEvent.setup()
    const mockToast = vi.mocked(toast)

    const mockApiKeys = [
      {
        id: '1',
        provider: 'openai',
        nickname: 'Test Key',
        api_key: 'sk-****1234',
        status: 'active',
        total_requests: 150,
        total_cost: 2.5
      }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiKeys)
    })

    // Mock successful status update
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })

    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('Openai')).toBeInTheDocument()
    })

    // Find the switch and toggle it (this is tricky with RTL, let's mock the toggle function)
    // For now, we'll test the API call directly
    const toggleSwitch = screen.getByRole('switch')
    await user.click(toggleSwitch)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1', status: 'inactive' })
      })
    })

    expect(mockToast.success).toHaveBeenCalledWith('API key deactivated')
  })

  it('handles API key deletion', async () => {
    const user = userEvent.setup()
    const mockToast = vi.mocked(toast)

    const mockApiKeys = [
      {
        id: '1',
        provider: 'openai',
        nickname: 'Test Key',
        api_key: 'sk-****1234',
        status: 'active',
        total_requests: 150,
        total_cost: 2.5
      }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiKeys)
    })

    // Mock window.confirm
    const mockConfirm = vi.fn(() => true)
    global.confirm = mockConfirm

    // Mock successful deletion
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })

    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('Openai')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /trash/i })
    await user.click(deleteButton)

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this API key?')

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1' })
      })
    })

    expect(mockToast.success).toHaveBeenCalledWith('API key deleted successfully!')
  })

  it('handles API fetch errors', async () => {
    const mockToast = vi.mocked(toast)

    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Error fetching API keys')
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

    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalledWith('api-keys-updates')
    })

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'api_keys' },
      expect.any(Function)
    )
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })
})
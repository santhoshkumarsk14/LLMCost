import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/auth/login/page'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn()
    }
  }
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders login form correctly', () => {
    render(<LoginPage />)

    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByText('Enter your credentials to access your account')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByText('Remember me')).toBeInTheDocument()
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  it('handles successful login', async () => {
    const user = userEvent.setup()
    const mockSupabase = vi.mocked(supabase)
    const mockToast = vi.mocked(toast)

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'test-user' }, session: {} },
      error: null
    })

    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByText('Sign In')

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    expect(mockToast.success).toHaveBeenCalledWith('Logged in successfully!')
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('handles login error', async () => {
    const user = userEvent.setup()
    const mockSupabase = vi.mocked(supabase)
    const mockToast = vi.mocked(toast)

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' }
    })

    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByText('Sign In')

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Invalid credentials')
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('handles Google OAuth login', async () => {
    const user = userEvent.setup()
    const mockSupabase = vi.mocked(supabase)

    mockSupabase.auth.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/oauth', provider: 'google' },
      error: null
    })

    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true
    })

    render(<LoginPage />)

    const googleButton = screen.getByText('Continue with Google')
    await user.click(googleButton)

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback'
        }
      })
    })
  })

  it('handles Google OAuth error', async () => {
    const user = userEvent.setup()
    const mockSupabase = vi.mocked(supabase)
    const mockToast = vi.mocked(toast)

    mockSupabase.auth.signInWithOAuth.mockResolvedValue({
      data: null,
      error: { message: 'OAuth error' }
    })

    render(<LoginPage />)

    const googleButton = screen.getByText('Continue with Google')
    await user.click(googleButton)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('OAuth error')
    })
  })

  it('shows loading state during form submission', async () => {
    const user = userEvent.setup()
    const mockSupabase = vi.mocked(supabase)

    // Delay the response to show loading state
    mockSupabase.auth.signInWithPassword.mockImplementation(
      () => new Promise(resolve =>
        setTimeout(() => resolve({
          data: { user: { id: 'test-user' }, session: {} },
          error: null
        }), 100)
      )
    )

    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByText('Sign In')

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Check loading state
    expect(screen.getByText('Signing in...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument()
    })
  })

  it('shows loading state during Google login', async () => {
    const user = userEvent.setup()
    const mockSupabase = vi.mocked(supabase)

    mockSupabase.auth.signInWithOAuth.mockImplementation(
      () => new Promise(resolve =>
        setTimeout(() => resolve({
          data: { url: 'https://accounts.google.com/oauth', provider: 'google' },
          error: null
        }), 100)
      )
    )

    render(<LoginPage />)

    const googleButton = screen.getByText('Continue with Google')
    await user.click(googleButton)

    expect(screen.getByText('Signing in...')).toBeInTheDocument()
    expect(googleButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByText('Continue with Google')).toBeInTheDocument()
    })
  })

  it('validates form fields', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    const submitButton = screen.getByText('Sign In')

    // Try to submit empty form
    await user.click(submitButton)

    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    const submitButton = screen.getByText('Sign In')

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
  })

  it('handles unexpected errors during login', async () => {
    const user = userEvent.setup()
    const mockSupabase = vi.mocked(supabase)
    const mockToast = vi.mocked(toast)

    mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Network error'))

    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByText('Sign In')

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('An unexpected error occurred. Please try again.')
    })
  })

  it('handles unexpected errors during Google login', async () => {
    const user = userEvent.setup()
    const mockSupabase = vi.mocked(supabase)
    const mockToast = vi.mocked(toast)

    mockSupabase.auth.signInWithOAuth.mockRejectedValue(new Error('Network error'))

    render(<LoginPage />)

    const googleButton = screen.getByText('Continue with Google')
    await user.click(googleButton)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('An unexpected error occurred. Please try again.')
    })
  })
})
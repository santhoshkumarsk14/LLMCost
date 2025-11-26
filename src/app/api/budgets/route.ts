import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

const createBudgetSchema = z.object({
  type: z.string().min(1, 'Budget type is required'),
  limit: z.number().min(0, 'Limit must be positive'),
  alertThreshold: z.number().min(0).max(100, 'Threshold must be between 0 and 100'),
  notificationChannels: z.array(z.string()).min(1, 'At least one notification channel is required')
})

const updateBudgetSchema = createBudgetSchema.extend({
  id: z.string().uuid('Invalid budget ID')
})

const deleteBudgetSchema = z.object({
  id: z.string().uuid('Invalid budget ID')
})

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: budgets, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching budgets:', error)
      return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 })
    }

    // Transform to match frontend interface
    const transformedBudgets = budgets.map(budget => ({
      id: budget.id,
      type: budget.type,
      budgetLimit: parseFloat(budget.limit),
      currentSpend: parseFloat(budget.current_spend),
      alertThreshold: parseFloat(budget.alert_threshold),
      status: budget.status,
      notificationChannels: budget.notification_channels,
      createdAt: budget.created_at,
      updatedAt: budget.updated_at
    }))

    return NextResponse.json(transformedBudgets)
  } catch (error) {
    console.error('GET budgets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createBudgetSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.issues
      }, { status: 400 })
    }

    const { type, limit, alertThreshold, notificationChannels } = validationResult.data

    const { data: budget, error } = await supabase
      .from('budgets')
      .insert({
        user_id: user.id,
        type,
        limit,
        alert_threshold: alertThreshold,
        notification_channels: notificationChannels
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating budget:', error)
      return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 })
    }

    // Transform response
    const transformedBudget = {
      id: budget.id,
      type: budget.type,
      budgetLimit: parseFloat(budget.limit),
      currentSpend: parseFloat(budget.current_spend),
      alertThreshold: parseFloat(budget.alert_threshold),
      status: budget.status,
      notificationChannels: budget.notification_channels,
      createdAt: budget.created_at,
      updatedAt: budget.updated_at
    }

    return NextResponse.json(transformedBudget, { status: 201 })
  } catch (error) {
    console.error('POST budgets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = updateBudgetSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.issues
      }, { status: 400 })
    }

    const { id, type, limit, alertThreshold, notificationChannels } = validationResult.data

    const { data: budget, error } = await supabase
      .from('budgets')
      .update({
        type,
        limit,
        alert_threshold: alertThreshold,
        notification_channels: notificationChannels,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the budget
      .select()
      .single()

    if (error) {
      console.error('Error updating budget:', error)
      return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 })
    }

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Transform response
    const transformedBudget = {
      id: budget.id,
      type: budget.type,
      budgetLimit: parseFloat(budget.limit),
      currentSpend: parseFloat(budget.current_spend),
      alertThreshold: parseFloat(budget.alert_threshold),
      status: budget.status,
      notificationChannels: budget.notification_channels,
      createdAt: budget.created_at,
      updatedAt: budget.updated_at
    }

    return NextResponse.json(transformedBudget)
  } catch (error) {
    console.error('PUT budgets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = deleteBudgetSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.issues
      }, { status: 400 })
    }

    const { id } = validationResult.data

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the budget

    if (error) {
      console.error('Error deleting budget:', error)
      return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Budget deleted successfully' })
  } catch (error) {
    console.error('DELETE budgets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
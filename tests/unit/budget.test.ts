import { describe, it, expect } from 'vitest'

// Extracted budget checking logic for testing
type Budget = {
  id: string
  user_id: string
  name: string
  limit: number
  alert_threshold: number
  current_spend: number
  status: 'active' | 'exceeded' | 'paused'
  created_at: string
  updated_at: string
}

type BudgetUpdate = {
  id: string
  current_spend: number
  status: string
  updated_at: string
}

function processBudgetUpdates(budgets: Budget[], costUsd: number): BudgetUpdate[] {
  const updates: BudgetUpdate[] = []

  for (const budget of budgets) {
    const newSpend = budget.current_spend + costUsd

    let status = budget.status
    if (newSpend > budget.limit) {
      status = 'exceeded'
    }

    updates.push({
      id: budget.id,
      current_spend: newSpend,
      status,
      updated_at: new Date().toISOString()
    })
  }

  return updates
}

function checkBudgetAlerts(budgets: Budget[], costUsd: number): Array<{ budgetId: string; message: string }> {
  const alerts: Array<{ budgetId: string; message: string }> = []

  for (const budget of budgets) {
    const newSpend = budget.current_spend + costUsd

    // Check alert threshold
    if (newSpend > budget.alert_threshold) {
      alerts.push({
        budgetId: budget.id,
        message: `Alert: Budget ${budget.id} exceeded alert threshold. Current spend: ${newSpend}`
      })
    }
  }

  return alerts
}

describe('Budget Threshold Checking', () => {
  describe('processBudgetUpdates', () => {
    it('should update current spend for all budgets', () => {
      const budgets: Budget[] = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Monthly Budget',
          limit: 100,
          alert_threshold: 80,
          current_spend: 50,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          user_id: 'user1',
          name: 'Weekly Budget',
          limit: 50,
          alert_threshold: 40,
          current_spend: 20,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const updates = processBudgetUpdates(budgets, 10.5)

      expect(updates).toHaveLength(2)
      expect(updates[0]).toEqual({
        id: '1',
        current_spend: 60.5,
        status: 'active',
        updated_at: expect.any(String)
      })
      expect(updates[1]).toEqual({
        id: '2',
        current_spend: 30.5,
        status: 'active',
        updated_at: expect.any(String)
      })
    })

    it('should set status to exceeded when limit is exceeded', () => {
      const budgets: Budget[] = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Budget',
          limit: 100,
          alert_threshold: 80,
          current_spend: 95,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const updates = processBudgetUpdates(budgets, 10)

      expect(updates[0].status).toBe('exceeded')
      expect(updates[0].current_spend).toBe(105)
    })

    it('should not change status if already exceeded', () => {
      const budgets: Budget[] = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Budget',
          limit: 100,
          alert_threshold: 80,
          current_spend: 50,
          status: 'exceeded',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const updates = processBudgetUpdates(budgets, 10)

      expect(updates[0].status).toBe('exceeded') // Should remain exceeded
      expect(updates[0].current_spend).toBe(60)
    })

    it('should handle zero cost', () => {
      const budgets: Budget[] = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Budget',
          limit: 100,
          alert_threshold: 80,
          current_spend: 50,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const updates = processBudgetUpdates(budgets, 0)

      expect(updates[0].current_spend).toBe(50)
      expect(updates[0].status).toBe('active')
    })

    it('should handle negative cost (refunds)', () => {
      const budgets: Budget[] = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Budget',
          limit: 100,
          alert_threshold: 80,
          current_spend: 50,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const updates = processBudgetUpdates(budgets, -10)

      expect(updates[0].current_spend).toBe(40)
      expect(updates[0].status).toBe('active')
    })

    it('should handle empty budgets array', () => {
      const updates = processBudgetUpdates([], 10)
      expect(updates).toHaveLength(0)
    })

    it('should handle budgets at exactly the limit', () => {
      const budgets: Budget[] = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Budget',
          limit: 100,
          alert_threshold: 80,
          current_spend: 100,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const updates = processBudgetUpdates(budgets, 0.01)

      expect(updates[0].status).toBe('exceeded')
      expect(updates[0].current_spend).toBe(100.01)
    })

    it('should include updated_at timestamp', () => {
      const budgets: Budget[] = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Budget',
          limit: 100,
          alert_threshold: 80,
          current_spend: 50,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const updates = processBudgetUpdates(budgets, 10)

      expect(updates[0].updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('checkBudgetAlerts', () => {
    it('should generate alerts when threshold is exceeded', () => {
      const budgets: Budget[] = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Budget',
          limit: 100,
          alert_threshold: 80,
          current_spend: 75,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const alerts = checkBudgetAlerts(budgets, 10)

      expect(alerts).toHaveLength(1)
      expect(alerts[0]).toEqual({
        budgetId: '1',
        message: 'Alert: Budget 1 exceeded alert threshold. Current spend: 85'
      })
    })

    it('should not generate alerts when threshold is not exceeded', () => {
      const budgets: Budget[] = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Budget',
          limit: 100,
          alert_threshold: 80,
          current_spend: 70,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const alerts = checkBudgetAlerts(budgets, 5)

      expect(alerts).toHaveLength(0)
    })

    it('should generate alerts for multiple budgets', () => {
      const budgets: Budget[] = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Budget 1',
          limit: 100,
          alert_threshold: 80,
          current_spend: 75,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          user_id: 'user1',
          name: 'Budget 2',
          limit: 50,
          alert_threshold: 40,
          current_spend: 35,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const alerts = checkBudgetAlerts(budgets, 10)

      expect(alerts).toHaveLength(2)
      expect(alerts[0].budgetId).toBe('1')
      expect(alerts[1].budgetId).toBe('2')
    })

    it('should handle budgets at exactly the threshold', () => {
      const budgets: Budget[] = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Budget',
          limit: 100,
          alert_threshold: 80,
          current_spend: 80,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const alerts = checkBudgetAlerts(budgets, 0.01)

      expect(alerts).toHaveLength(1)
    })

    it('should handle zero cost', () => {
      const budgets: Budget[] = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Budget',
          limit: 100,
          alert_threshold: 80,
          current_spend: 75,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const alerts = checkBudgetAlerts(budgets, 0)

      expect(alerts).toHaveLength(0)
    })

    it('should handle empty budgets array', () => {
      const alerts = checkBudgetAlerts([], 10)
      expect(alerts).toHaveLength(0)
    })
  })

  describe('integration scenarios', () => {
    it('should handle complex budget scenarios', () => {
      const budgets: Budget[] = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Monthly Budget',
          limit: 100,
          alert_threshold: 80,
          current_spend: 75,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          user_id: 'user1',
          name: 'Already Exceeded',
          limit: 50,
          alert_threshold: 40,
          current_spend: 60,
          status: 'exceeded',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '3',
          user_id: 'user1',
          name: 'Safe Budget',
          limit: 200,
          alert_threshold: 150,
          current_spend: 50,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const cost = 10
      const updates = processBudgetUpdates(budgets, cost)
      const alerts = checkBudgetAlerts(budgets, cost)

      // Updates
      expect(updates).toHaveLength(3)
      expect(updates[0].current_spend).toBe(85) // 75 + 10
      expect(updates[0].status).toBe('active') // Still under limit
      expect(updates[1].current_spend).toBe(70) // 60 + 10
      expect(updates[1].status).toBe('exceeded') // Already exceeded
      expect(updates[2].current_spend).toBe(60) // 50 + 10
      expect(updates[2].status).toBe('active') // Still safe

      // Alerts
      expect(alerts).toHaveLength(2) // Budget 1 and 2 trigger alerts
      expect(alerts[0].budgetId).toBe('1')
      expect(alerts[1].budgetId).toBe('2')
    })
  })
})
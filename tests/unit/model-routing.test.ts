import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Extracted model routing logic for testing
type RuleConditions = {
  promptLength?: number
  keywords?: string[]
  timeOfDay?: 'off-peak' | 'business-hours' | string
}

type OptimizationRule = {
  id: string
  source_model: string
  target_model: string
  conditions: RuleConditions
  enabled: boolean
}

function applyModelRouting(
  model: string,
  inputText: string,
  rules: OptimizationRule[]
): { routedModel: string; appliedRule: OptimizationRule | null } {
  let routedModel = model
  let appliedRule: OptimizationRule | null = null

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
        const hasKeyword = conditions.keywords.some((k: string) =>
          inputText.toLowerCase().includes(k.toLowerCase())
        )
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
        routedModel = rule.target_model
        appliedRule = rule
        break // apply first matching rule
      }
    }
  }

  return { routedModel, appliedRule }
}

describe('Model Routing', () => {
  beforeEach(() => {
    // Mock Date to have consistent time for testing
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z')) // Noon UTC
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('applyModelRouting', () => {
    it('should return original model when no rules match', () => {
      const rules: OptimizationRule[] = []
      const result = applyModelRouting('gpt-4', 'Hello world', rules)
      expect(result.routedModel).toBe('gpt-4')
      expect(result.appliedRule).toBeNull()
    })

    it('should return original model when no rules for the source model', () => {
      const rules: OptimizationRule[] = [
        {
          id: '1',
          source_model: 'gpt-3.5-turbo',
          target_model: 'gpt-3.5-turbo-16k',
          conditions: {},
          enabled: true
        }
      ]
      const result = applyModelRouting('gpt-4', 'Hello world', rules)
      expect(result.routedModel).toBe('gpt-4')
      expect(result.appliedRule).toBeNull()
    })

    it('should route model when prompt length condition is met', () => {
      const rules: OptimizationRule[] = [
        {
          id: '1',
          source_model: 'gpt-4',
          target_model: 'gpt-3.5-turbo',
          conditions: { promptLength: 100 },
          enabled: true
        }
      ]
      const result = applyModelRouting('gpt-4', 'Short prompt', rules)
      expect(result.routedModel).toBe('gpt-3.5-turbo')
      expect(result.appliedRule?.id).toBe('1')
    })

    it('should not route model when prompt length condition is not met', () => {
      const rules: OptimizationRule[] = [
        {
          id: '1',
          source_model: 'gpt-4',
          target_model: 'gpt-3.5-turbo',
          conditions: { promptLength: 10 },
          enabled: true
        }
      ]
      const result = applyModelRouting('gpt-4', 'This is a longer prompt that exceeds the limit', rules)
      expect(result.routedModel).toBe('gpt-4')
      expect(result.appliedRule).toBeNull()
    })

    it('should route model when keywords condition is met', () => {
      const rules: OptimizationRule[] = [
        {
          id: '1',
          source_model: 'gpt-4',
          target_model: 'gpt-3.5-turbo',
          conditions: { keywords: ['simple', 'basic'] },
          enabled: true
        }
      ]
      const result = applyModelRouting('gpt-4', 'This is a simple question', rules)
      expect(result.routedModel).toBe('gpt-3.5-turbo')
      expect(result.appliedRule?.id).toBe('1')
    })

    it('should not route model when keywords condition is not met', () => {
      const rules: OptimizationRule[] = [
        {
          id: '1',
          source_model: 'gpt-4',
          target_model: 'gpt-3.5-turbo',
          conditions: { keywords: ['complex', 'advanced'] },
          enabled: true
        }
      ]
      const result = applyModelRouting('gpt-4', 'This is a simple question', rules)
      expect(result.routedModel).toBe('gpt-4')
      expect(result.appliedRule).toBeNull()
    })

    it('should be case insensitive for keywords', () => {
      const rules: OptimizationRule[] = [
        {
          id: '1',
          source_model: 'gpt-4',
          target_model: 'gpt-3.5-turbo',
          conditions: { keywords: ['SIMPLE'] },
          enabled: true
        }
      ]
      const result = applyModelRouting('gpt-4', 'This is a simple question', rules)
      expect(result.routedModel).toBe('gpt-3.5-turbo')
    })

    it('should route model during business hours', () => {
      // Set time to 12:00 UTC (business hours)
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))

      const rules: OptimizationRule[] = [
        {
          id: '1',
          source_model: 'gpt-4',
          target_model: 'gpt-3.5-turbo',
          conditions: { timeOfDay: 'business-hours' },
          enabled: true
        }
      ]
      const result = applyModelRouting('gpt-4', 'Hello world', rules)
      expect(result.routedModel).toBe('gpt-3.5-turbo')
    })

    it('should not route model outside business hours', () => {
      // Set time to 20:00 UTC (outside business hours)
      vi.setSystemTime(new Date('2024-01-01T20:00:00Z'))

      const rules: OptimizationRule[] = [
        {
          id: '1',
          source_model: 'gpt-4',
          target_model: 'gpt-3.5-turbo',
          conditions: { timeOfDay: 'business-hours' },
          enabled: true
        }
      ]
      const result = applyModelRouting('gpt-4', 'Hello world', rules)
      expect(result.routedModel).toBe('gpt-4')
    })

    it('should route model during off-peak hours', () => {
      // Set time to 02:00 UTC (off-peak)
      vi.setSystemTime(new Date('2024-01-01T02:00:00Z'))

      const rules: OptimizationRule[] = [
        {
          id: '1',
          source_model: 'gpt-4',
          target_model: 'gpt-3.5-turbo',
          conditions: { timeOfDay: 'off-peak' },
          enabled: true
        }
      ]
      const result = applyModelRouting('gpt-4', 'Hello world', rules)
      expect(result.routedModel).toBe('gpt-3.5-turbo')
    })

    it('should not route model during peak hours for off-peak rule', () => {
      // Set time to 15:00 UTC (peak/business hours)
      vi.setSystemTime(new Date('2024-01-01T15:00:00Z'))

      const rules: OptimizationRule[] = [
        {
          id: '1',
          source_model: 'gpt-4',
          target_model: 'gpt-3.5-turbo',
          conditions: { timeOfDay: 'off-peak' },
          enabled: true
        }
      ]
      const result = applyModelRouting('gpt-4', 'Hello world', rules)
      expect(result.routedModel).toBe('gpt-4')
    })

    it('should handle multiple conditions - all must match', () => {
      const rules: OptimizationRule[] = [
        {
          id: '1',
          source_model: 'gpt-4',
          target_model: 'gpt-3.5-turbo',
          conditions: {
            promptLength: 50,
            keywords: ['simple'],
            timeOfDay: 'business-hours'
          },
          enabled: true
        }
      ]

      // All conditions met
      const result1 = applyModelRouting('gpt-4', 'This is a simple question', rules)
      expect(result1.routedModel).toBe('gpt-3.5-turbo')

      // One condition not met (long prompt)
      const result2 = applyModelRouting('gpt-4', 'This is a very long simple question that exceeds the prompt length limit and should not match', rules)
      expect(result2.routedModel).toBe('gpt-4')

      // One condition not met (no keyword)
      const result3 = applyModelRouting('gpt-4', 'This is a complex question', rules)
      expect(result3.routedModel).toBe('gpt-4')
    })

    it('should apply first matching rule', () => {
      const rules: OptimizationRule[] = [
        {
          id: '1',
          source_model: 'gpt-4',
          target_model: 'gpt-3.5-turbo',
          conditions: { keywords: ['test'] },
          enabled: true
        },
        {
          id: '2',
          source_model: 'gpt-4',
          target_model: 'claude-3-haiku',
          conditions: { keywords: ['test'] },
          enabled: true
        }
      ]
      const result = applyModelRouting('gpt-4', 'This is a test', rules)
      expect(result.routedModel).toBe('gpt-3.5-turbo')
      expect(result.appliedRule?.id).toBe('1')
    })

    it('should handle empty conditions', () => {
      const rules: OptimizationRule[] = [
        {
          id: '1',
          source_model: 'gpt-4',
          target_model: 'gpt-3.5-turbo',
          conditions: {},
          enabled: true
        }
      ]
      const result = applyModelRouting('gpt-4', 'Hello world', rules)
      expect(result.routedModel).toBe('gpt-3.5-turbo')
    })

    it('should handle unknown timeOfDay value', () => {
      const rules: OptimizationRule[] = [
        {
          id: '1',
          source_model: 'gpt-4',
          target_model: 'gpt-3.5-turbo',
          conditions: { timeOfDay: 'unknown' },
          enabled: true
        }
      ]
      const result = applyModelRouting('gpt-4', 'Hello world', rules)
      expect(result.routedModel).toBe('gpt-4') // Should not match
    })
  })

  describe('time-based routing edge cases', () => {
    it('should handle midnight correctly for off-peak', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z')) // Midnight
      const rules: OptimizationRule[] = [
        {
          id: '1',
          source_model: 'gpt-4',
          target_model: 'gpt-3.5-turbo',
          conditions: { timeOfDay: 'off-peak' },
          enabled: true
        }
      ]
      const result = applyModelRouting('gpt-4', 'Hello', rules)
      expect(result.routedModel).toBe('gpt-3.5-turbo')
    })

    it('should handle 6am correctly (end of off-peak)', () => {
      vi.setSystemTime(new Date('2024-01-01T06:00:00Z')) // 6am
      const rules: OptimizationRule[] = [
        {
          id: '1',
          source_model: 'gpt-4',
          target_model: 'gpt-3.5-turbo',
          conditions: { timeOfDay: 'off-peak' },
          enabled: true
        }
      ]
      const result = applyModelRouting('gpt-4', 'Hello', rules)
      expect(result.routedModel).toBe('gpt-3.5-turbo')
    })

    it('should handle 8am correctly (not off-peak)', () => {
      vi.setSystemTime(new Date('2024-01-01T08:00:00Z')) // 8am
      const rules: OptimizationRule[] = [
        {
          id: '1',
          source_model: 'gpt-4',
          target_model: 'gpt-3.5-turbo',
          conditions: { timeOfDay: 'off-peak' },
          enabled: true
        }
      ]
      const result = applyModelRouting('gpt-4', 'Hello', rules)
      expect(result.routedModel).toBe('gpt-4')
    })
  })
})
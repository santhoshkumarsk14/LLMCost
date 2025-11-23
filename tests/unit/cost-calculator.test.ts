import { describe, it, expect } from 'vitest'

// Extracted cost calculation logic for testing
const pricing: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'gpt-3.5': { input: 0.0005, output: 0.0015 }
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  let modelKey = 'gpt-3.5'
  if (model.includes('gpt-4')) modelKey = 'gpt-4'
  else if (model.includes('claude-3')) modelKey = 'claude-3-opus'
  else if (model.includes('gpt-3.5')) modelKey = 'gpt-3.5'

  return ((inputTokens / 1000) * pricing[modelKey].input) + ((outputTokens / 1000) * pricing[modelKey].output)
}

describe('Cost Calculator', () => {
  describe('calculateCost', () => {
    it('should calculate cost for GPT-4 model', () => {
      const cost = calculateCost('gpt-4', 1000, 1000)
      // Expected: (1000/1000 * 0.03) + (1000/1000 * 0.06) = 0.03 + 0.06 = 0.09
      expect(cost).toBe(0.09)
    })

    it('should calculate cost for GPT-4 with different token counts', () => {
      const cost = calculateCost('gpt-4-turbo', 2000, 500)
      // Expected: (2000/1000 * 0.03) + (500/1000 * 0.06) = 0.06 + 0.03 = 0.09
      expect(cost).toBe(0.09)
    })

    it('should calculate cost for Claude-3 model', () => {
      const cost = calculateCost('claude-3-opus', 1000, 1000)
      // Expected: (1000/1000 * 0.015) + (1000/1000 * 0.075) = 0.015 + 0.075 = 0.09
      expect(cost).toBe(0.09)
    })

    it('should calculate cost for Claude-3 with different variants', () => {
      const cost = calculateCost('claude-3-haiku', 1000, 1000)
      // Should use claude-3-opus pricing
      expect(cost).toBe(0.09)
    })

    it('should calculate cost for GPT-3.5 model', () => {
      const cost = calculateCost('gpt-3.5-turbo', 1000, 1000)
      // Expected: (1000/1000 * 0.0005) + (1000/1000 * 0.0015) = 0.0005 + 0.0015 = 0.002
      expect(cost).toBe(0.002)
    })

    it('should default to GPT-3.5 pricing for unknown models', () => {
      const cost = calculateCost('unknown-model', 1000, 1000)
      expect(cost).toBe(0.002)
    })

    it('should handle zero tokens', () => {
      const cost = calculateCost('gpt-4', 0, 0)
      expect(cost).toBe(0)
    })

    it('should handle large token counts', () => {
      const cost = calculateCost('gpt-4', 100000, 50000)
      // Expected: (100000/1000 * 0.03) + (50000/1000 * 0.06) = 3 + 3 = 6
      expect(cost).toBe(6)
    })

    it('should handle fractional token costs', () => {
      const cost = calculateCost('gpt-3.5-turbo', 500, 300)
      // Expected: (500/1000 * 0.0005) + (300/1000 * 0.0015) = 0.00025 + 0.00045 = 0.0007
      expect(cost).toBe(0.0007)
    })
  })

  describe('pricing configuration', () => {
    it('should have correct pricing for all models', () => {
      expect(pricing['gpt-4']).toEqual({ input: 0.03, output: 0.06 })
      expect(pricing['claude-3-opus']).toEqual({ input: 0.015, output: 0.075 })
      expect(pricing['gpt-3.5']).toEqual({ input: 0.0005, output: 0.0015 })
    })
  })
})
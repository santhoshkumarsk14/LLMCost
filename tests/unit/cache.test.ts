import { describe, it, expect } from 'vitest'
import CryptoJS from 'crypto-js'

// Extracted cache key generation logic for testing
type Message = { role: string; content: string | unknown[] | unknown }
function generateCacheKey(model: string, messages: Message[]): string {
  const hashInput = JSON.stringify({ model, messages })
  return CryptoJS.SHA256(hashInput).toString()
}

describe('Cache Key Hashing', () => {
  describe('generateCacheKey', () => {
    it('should generate consistent hash for same model and messages', () => {
      const messages = [{ role: 'user', content: 'Hello world' }]
      const key1 = generateCacheKey('gpt-4', messages)
      const key2 = generateCacheKey('gpt-4', messages)
      expect(key1).toBe(key2)
      expect(key1).toMatch(/^[a-f0-9]{64}$/) // SHA256 produces 64 character hex string
    })

    it('should generate different hashes for different models', () => {
      const messages = [{ role: 'user', content: 'Hello world' }]
      const key1 = generateCacheKey('gpt-4', messages)
      const key2 = generateCacheKey('gpt-3.5-turbo', messages)
      expect(key1).not.toBe(key2)
    })

    it('should generate different hashes for different messages', () => {
      const messages1 = [{ role: 'user', content: 'Hello world' }]
      const messages2 = [{ role: 'user', content: 'Goodbye world' }]
      const key1 = generateCacheKey('gpt-4', messages1)
      const key2 = generateCacheKey('gpt-4', messages2)
      expect(key1).not.toBe(key2)
    })

    it('should generate different hashes for different message order', () => {
      const messages1 = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' }
      ]
      const messages2 = [
        { role: 'assistant', content: 'Hi' },
        { role: 'user', content: 'Hello' }
      ]
      const key1 = generateCacheKey('gpt-4', messages1)
      const key2 = generateCacheKey('gpt-4', messages2)
      expect(key1).not.toBe(key2)
    })

    it('should handle empty messages array', () => {
      const key = generateCacheKey('gpt-4', [])
      expect(key).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should handle complex message structures', () => {
      const messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Hello' },
            { type: 'image', image_url: 'http://example.com/image.jpg' }
          ]
        }
      ]
      const key = generateCacheKey('gpt-4', messages)
      expect(key).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should handle messages with different content types', () => {
      const messages1 = [{ role: 'user', content: 'Hello world' }]
      const messages2 = [{ role: 'user', content: ['Hello', 'world'] }]
      const key1 = generateCacheKey('gpt-4', messages1)
      const key2 = generateCacheKey('gpt-4', messages2)
      expect(key1).not.toBe(key2)
    })

    it('should be deterministic', () => {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'What is 2+2?' },
        { role: 'assistant', content: '4' }
      ]

      const keys = Array.from({ length: 10 }, () => generateCacheKey('gpt-4', messages))
      const uniqueKeys = new Set(keys)
      expect(uniqueKeys.size).toBe(1) // All should be the same
    })

    it('should handle special characters in messages', () => {
      const messages = [{ role: 'user', content: 'Hello 🌍 with émojis & spëcial chars!' }]
      const key = generateCacheKey('gpt-4', messages)
      expect(key).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should handle very long messages', () => {
      const longContent = 'a'.repeat(10000)
      const messages = [{ role: 'user', content: longContent }]
      const key = generateCacheKey('gpt-4', messages)
      expect(key).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  describe('hash properties', () => {
    it('should produce SHA256 hashes', () => {
      const messages = [{ role: 'user', content: 'test' }]
      const key = generateCacheKey('gpt-4', messages)

      // SHA256 produces 64 character hexadecimal string
      expect(key).toHaveLength(64)
      expect(key).toMatch(/^[a-f0-9]+$/)
    })

    it('should be case sensitive', () => {
      const messages1 = [{ role: 'user', content: 'Hello' }]
      const messages2 = [{ role: 'user', content: 'HELLO' }]
      const key1 = generateCacheKey('gpt-4', messages1)
      const key2 = generateCacheKey('gpt-4', messages2)
      expect(key1).not.toBe(key2)
    })
  })
})
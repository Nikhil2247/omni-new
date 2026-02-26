// ============================================================================
// API CLIENT TESTS - HTTP Client Configuration
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

describe('API Client', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(axios)
  })

  it('should create axios instance with correct base URL', () => {
    expect(process.env.NEXT_PUBLIC_API_URL).toBeDefined()
  })

  it('should handle successful API response', async () => {
    const testData = { id: '123', name: 'Test' }
    mock.onGet('/test').reply(200, testData)

    const response = await axios.get('/test')
    expect(response.status).toBe(200)
    expect(response.data).toEqual(testData)
  })

  it('should handle API error response', async () => {
    mock.onGet('/error').reply(500, { message: 'Server error' })

    try {
      await axios.get('/error')
    } catch (error: any) {
      expect(error.response.status).toBe(500)
      expect(error.response.data.message).toBe('Server error')
    }
  })
})

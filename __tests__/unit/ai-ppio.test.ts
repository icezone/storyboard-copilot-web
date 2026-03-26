import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ppioProvider } from '@/server/ai/providers/ppio'

describe('ppioProvider', () => {
  const originalEnv = process.env.PPIO_API_KEY

  beforeEach(() => {
    process.env.PPIO_API_KEY = 'test-ppio-key'
  })

  afterEach(() => {
    process.env.PPIO_API_KEY = originalEnv
    vi.restoreAllMocks()
  })

  describe('generate', () => {
    it('should call PPIO images/generations endpoint with correct headers', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ url: 'https://example.com/image.png' }],
        }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await ppioProvider.generate!({
        modelId: 'ppio/gemini-3.1-flash',
        prompt: 'A beautiful sunset',
      })

      expect(result.imageUrl).toBe('https://example.com/image.png')
      expect(mockFetch).toHaveBeenCalledOnce()

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toContain('/images/generations')
      expect(options.method).toBe('POST')
      expect(options.headers).toMatchObject({
        Authorization: 'Bearer test-ppio-key',
        'Content-Type': 'application/json',
      })

      const body = JSON.parse(options.body as string)
      expect(body.model).toBe('gemini-3.1-flash')
      expect(body.prompt).toBe('A beautiful sunset')
    })

    it('should strip ppio/ prefix from modelId', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ url: 'https://example.com/img.png' }] }),
      })
      vi.stubGlobal('fetch', mockFetch)

      await ppioProvider.generate!({
        modelId: 'ppio/gemini-3.1-flash',
        prompt: 'test',
      })

      const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string)
      expect(body.model).toBe('gemini-3.1-flash')
    })

    it('should include optional parameters when provided', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ url: 'https://example.com/img.png' }] }),
      })
      vi.stubGlobal('fetch', mockFetch)

      await ppioProvider.generate!({
        modelId: 'ppio/test-model',
        prompt: 'test',
        negativePrompt: 'blurry',
        aspectRatio: '16:9',
        seed: 42,
        steps: 20,
        imageUrl: 'https://input.com/image.jpg',
      })

      const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string)
      expect(body.negative_prompt).toBe('blurry')
      expect(body.aspect_ratio).toBe('16:9')
      expect(body.seed).toBe(42)
      expect(body.steps).toBe(20)
      expect(body.image).toBe('https://input.com/image.jpg')
    })

    it('should throw on API error response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit exceeded',
      }))

      await expect(
        ppioProvider.generate!({ modelId: 'ppio/test', prompt: 'test' })
      ).rejects.toThrow('PPIO API error 429')
    })

    it('should throw when API key is missing', async () => {
      delete process.env.PPIO_API_KEY

      await expect(
        ppioProvider.generate!({ modelId: 'ppio/test', prompt: 'test' })
      ).rejects.toThrow('PPIO_API_KEY is not configured')
    })

    it('should throw when response contains no image URL', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      }))

      await expect(
        ppioProvider.generate!({ modelId: 'ppio/test', prompt: 'test' })
      ).rejects.toThrow('PPIO API returned no image URL')
    })
  })
})

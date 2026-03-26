import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { falProvider } from '@/server/ai/providers/fal'

describe('falProvider', () => {
  const originalEnv = process.env.FAL_KEY

  beforeEach(() => {
    process.env.FAL_KEY = 'test-fal-key'
  })

  afterEach(() => {
    process.env.FAL_KEY = originalEnv
    vi.restoreAllMocks()
  })

  describe('submitJob', () => {
    it('should POST to fal queue and return request_id', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ request_id: 'fal-req-001', status: 'IN_QUEUE' }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const jobId = await falProvider.submitJob!({
        modelId: 'fal/nano-banana-pro',
        prompt: 'A futuristic city',
      })

      expect(jobId).toBe('fal-req-001')

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toContain('nano-banana-pro')
      expect(options.method).toBe('POST')
      expect((options.headers as Record<string, string>)['Authorization']).toBe('Key test-fal-key')
    })

    it('should map request parameters to fal input format', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ request_id: 'fal-req-002' }),
      })
      vi.stubGlobal('fetch', mockFetch)

      await falProvider.submitJob!({
        modelId: 'fal/nano-banana-pro',
        prompt: 'test prompt',
        negativePrompt: 'bad quality',
        aspectRatio: '16:9',
        steps: 30,
        cfgScale: 7.5,
        seed: 12345,
        imageUrl: 'https://example.com/ref.jpg',
      })

      const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string)
      expect(body.input.negative_prompt).toBe('bad quality')
      expect(body.input.aspect_ratio).toBe('16:9')
      expect(body.input.num_inference_steps).toBe(30)
      expect(body.input.guidance_scale).toBe(7.5)
      expect(body.input.seed).toBe(12345)
      expect(body.input.image_url).toBe('https://example.com/ref.jpg')
    })

    it('should strip fal/ prefix from modelId in URL', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ request_id: 'fal-req-003' }),
      })
      vi.stubGlobal('fetch', mockFetch)

      await falProvider.submitJob!({
        modelId: 'fal/flux/dev',
        prompt: 'test',
      })

      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toContain('flux/dev')
      expect(url).not.toContain('fal/flux')
    })

    it('should throw when request_id is missing', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'IN_QUEUE' }),
      }))

      await expect(
        falProvider.submitJob!({ modelId: 'fal/test', prompt: 'test' })
      ).rejects.toThrow('no request_id')
    })

    it('should throw when FAL_KEY is missing', async () => {
      delete process.env.FAL_KEY

      await expect(
        falProvider.submitJob!({ modelId: 'fal/test', prompt: 'test' })
      ).rejects.toThrow('FAL_KEY is not configured')
    })
  })

  describe('pollJob', () => {
    it('should return completed with imageUrl when status is COMPLETED', async () => {
      const mockFetch = vi.fn()
        // Status check
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'COMPLETED' }),
        })
        // Result fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            images: [{ url: 'https://fal.media/output.png', width: 1024, height: 1024 }],
          }),
        })

      vi.stubGlobal('fetch', mockFetch)

      const result = await falProvider.pollJob!('nano-banana-pro:fal-req-001')

      expect(result.status).toBe('completed')
      expect(result.imageUrl).toBe('https://fal.media/output.png')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should return pending when status is IN_QUEUE', async () => {
      const stubFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'IN_QUEUE', queue_position: 5 }),
      })
      vi.stubGlobal('fetch', stubFetch)

      const result = await falProvider.pollJob!('test-model:fal-req-002')

      expect(result.status).toBe('pending')
      expect(stubFetch).toHaveBeenCalledTimes(1)
    })

    it('should return processing when status is IN_PROGRESS', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'IN_PROGRESS' }),
      }))

      const result = await falProvider.pollJob!('test-model:fal-req-003')

      expect(result.status).toBe('processing')
    })

    it('should return failed when result has no images', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'COMPLETED' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ images: [] }),
        })

      vi.stubGlobal('fetch', mockFetch)

      const result = await falProvider.pollJob!('test-model:fal-req-004')

      expect(result.status).toBe('failed')
      expect(result.errorMessage).toContain('no images')
    })

    it('should throw when jobId has invalid format', async () => {
      await expect(
        falProvider.pollJob!('invalid-job-id-no-colon')
      ).rejects.toThrow('Invalid fal jobId format')
    })

    it('should include queue position in progress estimate', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'IN_QUEUE', queue_position: 3 }),
      }))

      const result = await falProvider.pollJob!('test-model:fal-req-005')
      expect(result.status).toBe('pending')
      expect(result.progress).toBeDefined()
    })
  })
})

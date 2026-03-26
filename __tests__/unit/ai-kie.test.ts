import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { kieProvider } from '@/server/ai/providers/kie'

describe('kieProvider', () => {
  const originalEnv = process.env.KIE_API_KEY

  beforeEach(() => {
    process.env.KIE_API_KEY = 'test-kie-key'
  })

  afterEach(() => {
    process.env.KIE_API_KEY = originalEnv
    vi.restoreAllMocks()
  })

  describe('submitJob', () => {
    it('should POST to images/generations and return task_id', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ task_id: 'kie-task-001' }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const taskId = await kieProvider.submitJob!({
        modelId: 'kie/nano-banana-pro',
        prompt: 'A beautiful landscape',
      })

      expect(taskId).toBe('kie-task-001')

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toContain('/images/generations')
      expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer test-kie-key')

      const body = JSON.parse(options.body as string)
      expect(body.model).toBe('nano-banana-pro')
    })

    it('should upload http image before submitting job', async () => {
      const mockFetch = vi.fn()
        // First call: upload by URL
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: 'https://storage.kie.com/uploaded.png' }),
        })
        // Second call: submit job
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ task_id: 'kie-task-002' }),
        })

      vi.stubGlobal('fetch', mockFetch)

      await kieProvider.submitJob!({
        modelId: 'kie/nano-banana-pro',
        prompt: 'Edit this image',
        imageUrl: 'http://example.com/input.jpg',
      })

      expect(mockFetch).toHaveBeenCalledTimes(2)
      // First call should be upload
      const [uploadUrl] = mockFetch.mock.calls[0] as [string]
      expect(uploadUrl).toContain('upload')

      // Second call should use the uploaded URL
      const submitBody = JSON.parse((mockFetch.mock.calls[1] as [string, RequestInit])[1].body as string)
      expect(submitBody.image_url).toBe('https://storage.kie.com/uploaded.png')
    })

    it('should handle data URI image upload', async () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: 'https://storage.kie.com/uploaded-data.png' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ task_id: 'kie-task-003' }),
        })

      vi.stubGlobal('fetch', mockFetch)

      const taskId = await kieProvider.submitJob!({
        modelId: 'kie/nano-banana-pro',
        prompt: 'Transform this',
        imageUrl: dataUri,
      })

      expect(taskId).toBe('kie-task-003')
      // Upload call should use FormData (not JSON body)
      const [, uploadOptions] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(uploadOptions.body).toBeInstanceOf(FormData)
    })

    it('should throw when task_id is missing', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ code: 400, msg: 'Invalid model' }),
      }))

      await expect(
        kieProvider.submitJob!({ modelId: 'kie/test', prompt: 'test' })
      ).rejects.toThrow('no task_id')
    })

    it('should throw when API key is missing', async () => {
      delete process.env.KIE_API_KEY

      await expect(
        kieProvider.submitJob!({ modelId: 'kie/test', prompt: 'test' })
      ).rejects.toThrow('KIE_API_KEY is not configured')
    })
  })

  describe('pollJob', () => {
    it('should return completed with imageUrl from result field', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'succeed',
          result: 'https://cdn.kie.com/output.png',
        }),
      }))

      const result = await kieProvider.pollJob!('kie-task-001')

      expect(result.status).toBe('completed')
      expect(result.imageUrl).toBe('https://cdn.kie.com/output.png')
    })

    it('should return completed with imageUrl from output.images', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'completed',
          output: { images: [{ url: 'https://cdn.kie.com/out2.png' }] },
        }),
      }))

      const result = await kieProvider.pollJob!('kie-task-001')

      expect(result.status).toBe('completed')
      expect(result.imageUrl).toBe('https://cdn.kie.com/out2.png')
    })

    it('should return failed with errorMessage', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'failed', error: 'NSFW content detected' }),
      }))

      const result = await kieProvider.pollJob!('kie-task-001')

      expect(result.status).toBe('failed')
      expect(result.errorMessage).toBe('NSFW content detected')
    })

    it('should return processing when status is processing', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'processing', progress: 60 }),
      }))

      const result = await kieProvider.pollJob!('kie-task-001')

      expect(result.status).toBe('processing')
      expect(result.progress).toBe(60)
    })
  })
})

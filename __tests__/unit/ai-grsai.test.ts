import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { grsaiProvider } from '@/server/ai/providers/grsai'

describe('grsaiProvider', () => {
  const originalEnv = process.env.GRSAI_API_KEY

  beforeEach(() => {
    process.env.GRSAI_API_KEY = 'test-grsai-key'
  })

  afterEach(() => {
    process.env.GRSAI_API_KEY = originalEnv
    vi.restoreAllMocks()
  })

  describe('submitJob', () => {
    it('should POST to images/generations and return task_id', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ task_id: 'task-abc-123' }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const taskId = await grsaiProvider.submitJob!({
        modelId: 'grsai/nano-banana-pro',
        prompt: 'A mountain landscape',
      })

      expect(taskId).toBe('task-abc-123')

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toContain('/images/generations')
      expect(options.method).toBe('POST')
      expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer test-grsai-key')

      const body = JSON.parse(options.body as string)
      expect(body.model).toBe('nano-banana-pro')
      expect(body.prompt).toBe('A mountain landscape')
    })

    it('should strip grsai/ prefix from modelId', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ task_id: 'task-xyz' }),
      })
      vi.stubGlobal('fetch', mockFetch)

      await grsaiProvider.submitJob!({
        modelId: 'grsai/nano-banana-pro-vip',
        prompt: 'test',
      })

      const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string)
      expect(body.model).toBe('nano-banana-pro-vip')
    })

    it('should throw when no task_id in response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ code: 500, msg: 'server error' }),
      }))

      await expect(
        grsaiProvider.submitJob!({ modelId: 'grsai/test', prompt: 'test' })
      ).rejects.toThrow('no task_id')
    })

    it('should throw when API key is missing', async () => {
      delete process.env.GRSAI_API_KEY

      await expect(
        grsaiProvider.submitJob!({ modelId: 'grsai/test', prompt: 'test' })
      ).rejects.toThrow('GRSAI_API_KEY is not configured')
    })

    it('should throw on HTTP error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key',
      }))

      await expect(
        grsaiProvider.submitJob!({ modelId: 'grsai/test', prompt: 'test' })
      ).rejects.toThrow('GRSAI submit error 401')
    })
  })

  describe('pollJob', () => {
    it('should return completed with imageUrl when status is 2', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 2,
          result: 'https://cdn.grsai.com/output.png',
          progress: 100,
        }),
      }))

      const result = await grsaiProvider.pollJob!('task-abc-123')

      expect(result.status).toBe('completed')
      expect(result.imageUrl).toBe('https://cdn.grsai.com/output.png')
    })

    it('should return failed with errorMessage when status is 3', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 3, error: 'Content policy violation' }),
      }))

      const result = await grsaiProvider.pollJob!('task-abc-123')

      expect(result.status).toBe('failed')
      expect(result.errorMessage).toBe('Content policy violation')
    })

    it('should return processing when status is 1', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 1, progress: 45 }),
      }))

      const result = await grsaiProvider.pollJob!('task-abc-123')

      expect(result.status).toBe('processing')
      expect(result.progress).toBe(45)
    })

    it('should return pending for unknown status', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 0 }),
      }))

      const result = await grsaiProvider.pollJob!('task-abc-123')
      expect(result.status).toBe('pending')
    })

    it('should call poll endpoint with task id', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 0 }),
      })
      vi.stubGlobal('fetch', mockFetch)

      await grsaiProvider.pollJob!('my-task-id')

      const [url] = mockFetch.mock.calls[0] as [string]
      expect(url).toContain('my-task-id')
    })
  })
})

// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mock state ─────────────────────────────────────────────────────────
const mock = vi.hoisted(() => {
  const mockCreateJob = vi.fn().mockResolvedValue('job-123')
  const mockUpdateJobStatus = vi.fn().mockResolvedValue(undefined)
  let authUser: { id: string } | null = { id: 'user-1' }

  const mockSupabaseInsert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data: { id: 'asset-1' }, error: null })),
    })),
  }))

  return {
    mockCreateJob,
    mockUpdateJobStatus,
    mockSupabaseInsert,
    getAuthUser: () => authUser,
    setAuth: (user: { id: string } | null) => { authUser = user },
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({
      insert: mock.mockSupabaseInsert,
    }),
    auth: {
      getUser: async () => {
        const user = mock.getAuthUser()
        return {
          data: { user },
          error: user ? null : { message: 'not authenticated' },
        }
      },
    },
  }),
  getAuthUser: async () => mock.getAuthUser(),
}))

vi.mock('@/server/jobs/jobService', () => ({
  createJob: mock.mockCreateJob,
  updateJobStatus: mock.mockUpdateJobStatus,
  JobNotFoundError: class JobNotFoundError extends Error {
    constructor(jobId: string) {
      super(`Job not found: ${jobId}`)
      this.name = 'JobNotFoundError'
    }
  },
  InsufficientCreditsError: class InsufficientCreditsError extends Error {},
}))

// Mock the scene detection and frame extraction to avoid real ffmpeg calls
vi.mock('@/server/video/analysis/sceneDetector', () => ({
  detectScenes: vi.fn().mockResolvedValue([
    { startTimeMs: 0, endTimeMs: 5000, keyframeTimestampMs: 0, confidence: 1.0 },
  ]),
  getVideoMetadata: vi.fn().mockResolvedValue({
    durationMs: 10000,
    fps: 30,
    width: 1920,
    height: 1080,
  }),
}))

vi.mock('@/server/video/analysis/frameExtractor', () => ({
  extractFrames: vi.fn().mockResolvedValue([
    {
      timestampMs: 0,
      frameBuffer: Buffer.from('frame'),
      thumbnailBuffer: Buffer.from('thumb'),
      width: 1920,
      height: 1080,
    },
  ]),
}))

import { POST } from '../../src/app/api/video/analyze/route'
import { NextRequest } from 'next/server'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/video/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/video/analyze', () => {
  beforeEach(() => {
    mock.setAuth({ id: 'user-1' })
    mock.mockCreateJob.mockClear()
    mock.mockCreateJob.mockResolvedValue('job-123')
    mock.mockUpdateJobStatus.mockClear()
  })

  it('should return 401 for unauthenticated requests', async () => {
    mock.setAuth(null)

    const response = await POST(makeRequest({
      videoUrl: 'https://example.com/video.mp4',
      projectId: 'proj-1',
    }))

    expect(response.status).toBe(401)
  })

  it('should return 400 for missing videoUrl', async () => {
    const response = await POST(makeRequest({
      projectId: 'proj-1',
    }))

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/videoUrl/i)
  })

  it('should return 400 for missing projectId', async () => {
    const response = await POST(makeRequest({
      videoUrl: 'https://example.com/video.mp4',
    }))

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/projectId/i)
  })

  it('should create job and return jobId', async () => {
    const response = await POST(makeRequest({
      videoUrl: 'https://example.com/video.mp4',
      projectId: 'proj-1',
    }))

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.jobId).toBe('job-123')
    expect(mock.mockCreateJob).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        projectId: 'proj-1',
        type: 'video',
        providerId: 'video-analysis',
        modelId: 'video-analysis/scene-detect',
        creditCost: 1,
      })
    )
  })

  it('should accept optional parameters', async () => {
    const response = await POST(makeRequest({
      videoUrl: 'https://example.com/video.mp4',
      projectId: 'proj-1',
      sensitivityThreshold: 0.5,
      minSceneDurationMs: 1000,
      maxKeyframes: 20,
    }))

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.jobId).toBe('job-123')
  })
})

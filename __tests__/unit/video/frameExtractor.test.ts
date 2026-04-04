// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ──────────────────────────────────────────────────────────────
const mockFrameData = vi.hoisted(() => {
  const fullFrameBuffer = Buffer.from('fake-full-frame-data')
  const thumbnailBuffer = Buffer.from('fake-thumbnail-data')

  // Track ffmpeg screenshot calls
  const screenshotCalls: Array<{ timestamps: string[]; folder: string; filename: string }> = []

  // Mock sharp
  const sharpInstance = {
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(thumbnailBuffer),
    metadata: vi.fn().mockResolvedValue({ width: 1920, height: 1080 }),
  }

  const sharpFn = vi.fn(() => sharpInstance)

  // Mock ffmpeg for frame extraction
  const ffmpegInstance = {
    screenshots: vi.fn((opts: { timestamps: string[]; folder: string; filename: string }) => {
      screenshotCalls.push(opts)
      return ffmpegInstance
    }),
    outputOptions: vi.fn().mockReturnThis(),
    output: vi.fn().mockReturnThis(),
    format: vi.fn().mockReturnThis(),
    on: vi.fn(function (this: typeof ffmpegInstance, event: string, cb: (...args: unknown[]) => void) {
      if (event === 'end') {
        (ffmpegInstance as unknown as Record<string, unknown>)._endCb = cb
      }
      if (event === 'error') {
        (ffmpegInstance as unknown as Record<string, unknown>)._errorCb = cb
      }
      return ffmpegInstance
    }),
    run: vi.fn(() => {
      const endCb = (ffmpegInstance as unknown as Record<string, (...args: unknown[]) => void>)._endCb
      if (endCb) endCb()
    }),
  }

  const ffmpegConstructor = vi.fn(() => ffmpegInstance)

  return {
    fullFrameBuffer,
    thumbnailBuffer,
    screenshotCalls,
    sharpFn,
    sharpInstance,
    ffmpegConstructor,
    ffmpegInstance,
    reset() {
      screenshotCalls.length = 0
      vi.clearAllMocks()
      sharpInstance.toBuffer.mockResolvedValue(thumbnailBuffer)
      sharpInstance.metadata.mockResolvedValue({ width: 1920, height: 1080 })
    },
  }
})

vi.mock('fluent-ffmpeg', () => {
  const fn = mockFrameData.ffmpegConstructor as unknown as Record<string, unknown>
  fn.ffprobe = vi.fn()
  return { default: fn }
})

vi.mock('@ffmpeg-installer/ffmpeg', () => ({
  path: '/usr/bin/ffmpeg',
}))

vi.mock('sharp', () => ({
  default: mockFrameData.sharpFn,
}))

// Mock fs for reading extracted frames
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(mockFrameData.fullFrameBuffer),
  mkdir: vi.fn().mockResolvedValue(undefined),
  rm: vi.fn().mockResolvedValue(undefined),
  access: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('os', () => ({
  tmpdir: () => '/tmp',
}))

import { extractFrames } from '@/server/video/analysis/frameExtractor'

describe('FrameExtractor', () => {
  beforeEach(() => {
    mockFrameData.reset()
  })

  it('should extract frames at specified timestamps', async () => {
    const frames = await extractFrames({
      videoUrl: 'https://example.com/video.mp4',
      timestamps: [1000, 3000, 5000],
    })

    expect(frames).toHaveLength(3)
    expect(frames[0].timestampMs).toBe(1000)
    expect(frames[1].timestampMs).toBe(3000)
    expect(frames[2].timestampMs).toBe(5000)
  })

  it('should return frame buffers for each timestamp', async () => {
    const frames = await extractFrames({
      videoUrl: 'https://example.com/video.mp4',
      timestamps: [2000],
    })

    expect(frames).toHaveLength(1)
    expect(Buffer.isBuffer(frames[0].frameBuffer)).toBe(true)
    expect(frames[0].frameBuffer.length).toBeGreaterThan(0)
  })

  it('should generate thumbnails with specified width', async () => {
    await extractFrames({
      videoUrl: 'https://example.com/video.mp4',
      timestamps: [1000],
      thumbnailWidth: 200,
    })

    expect(mockFrameData.sharpInstance.resize).toHaveBeenCalledWith(
      200,
      expect.any(Number),
      expect.objectContaining({ fit: 'inside' })
    )
  })

  it('should generate thumbnails with default width of 320', async () => {
    await extractFrames({
      videoUrl: 'https://example.com/video.mp4',
      timestamps: [1000],
    })

    expect(mockFrameData.sharpInstance.resize).toHaveBeenCalledWith(
      320,
      expect.any(Number),
      expect.objectContaining({ fit: 'inside' })
    )
  })

  it('should return thumbnail buffers', async () => {
    const frames = await extractFrames({
      videoUrl: 'https://example.com/video.mp4',
      timestamps: [1000],
    })

    expect(Buffer.isBuffer(frames[0].thumbnailBuffer)).toBe(true)
    expect(frames[0].thumbnailBuffer.length).toBeGreaterThan(0)
  })

  it('should throw for empty video URL', async () => {
    await expect(
      extractFrames({ videoUrl: '', timestamps: [1000] })
    ).rejects.toThrow('videoUrl is required')
  })

  it('should throw for empty timestamps array', async () => {
    await expect(
      extractFrames({ videoUrl: 'https://example.com/video.mp4', timestamps: [] })
    ).rejects.toThrow('timestamps must not be empty')
  })
})

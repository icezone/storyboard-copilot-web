import ffmpeg from 'fluent-ffmpeg'
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg'
import sharp from 'sharp'
import { readFile, mkdir, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'
import type { FrameExtractOptions, ExtractedFrame } from './types'

// Set ffmpeg path (guard for test environment where mock may not include setFfmpegPath)
if (typeof ffmpeg.setFfmpegPath === 'function') {
  ffmpeg.setFfmpegPath(ffmpegPath)
}

/**
 * Format milliseconds to HH:MM:SS.mmm for ffmpeg seek.
 */
function msToTimestamp(ms: number): string {
  const totalSeconds = ms / 1000
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`
}

/**
 * Extract frames from a video at specified timestamps.
 *
 * For each timestamp, extracts the full-resolution frame and generates
 * a thumbnail using sharp.
 */
export async function extractFrames(options: FrameExtractOptions): Promise<ExtractedFrame[]> {
  const {
    videoUrl,
    timestamps,
    format = 'jpeg',
    quality = 85,
    thumbnailWidth = 320,
  } = options

  if (!videoUrl) {
    throw new Error('videoUrl is required')
  }

  if (!timestamps || timestamps.length === 0) {
    throw new Error('timestamps must not be empty')
  }

  // Create a temporary directory for extracted frames
  const tempDir = join(tmpdir(), `frame-extract-${randomUUID()}`)
  await mkdir(tempDir, { recursive: true })

  try {
    const frames: ExtractedFrame[] = []

    for (const ts of timestamps) {
      const filename = `frame-${ts}.${format === 'png' ? 'png' : 'jpg'}`
      const outputPath = join(tempDir, filename)

      // Extract single frame using ffmpeg
      await extractSingleFrame(videoUrl, ts, outputPath, format)

      // Read the extracted frame
      const frameBuffer = await readFile(outputPath)

      // Get metadata for dimensions
      const sharpInstance = sharp(frameBuffer)
      const metadata = await sharpInstance.metadata()
      const width = metadata.width ?? 0
      const height = metadata.height ?? 0

      // Generate thumbnail
      const thumbHeight = height > 0 && width > 0
        ? Math.round((thumbnailWidth / width) * height)
        : thumbnailWidth

      let thumbnailBuffer: Buffer
      const thumbSharp = sharp(frameBuffer).resize(thumbnailWidth, thumbHeight, { fit: 'inside' })
      if (format === 'png') {
        thumbnailBuffer = await thumbSharp.png().toBuffer()
      } else {
        thumbnailBuffer = await thumbSharp.jpeg({ quality }).toBuffer()
      }

      frames.push({
        timestampMs: ts,
        frameBuffer,
        thumbnailBuffer,
        width,
        height,
      })
    }

    return frames
  } finally {
    // Clean up temp directory
    await rm(tempDir, { recursive: true, force: true }).catch(() => {
      // Ignore cleanup errors
    })
  }
}

/**
 * Extract a single frame from a video at the given timestamp.
 */
function extractSingleFrame(
  videoUrl: string,
  timestampMs: number,
  outputPath: string,
  format: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timestamp = msToTimestamp(timestampMs)

    const command = ffmpeg(videoUrl)
      .outputOptions([
        '-ss', timestamp,
        '-frames:v', '1',
        '-f', 'image2',
      ])
      .output(outputPath)
      .on('error', (err: Error) => {
        reject(new Error(`Frame extraction failed at ${timestampMs}ms: ${err.message}`))
      })
      .on('end', () => {
        resolve()
      })

    command.run()
  })
}

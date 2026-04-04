import ffmpeg from 'fluent-ffmpeg'
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg'
import type { SceneDetectOptions, SceneDetectResult, VideoMetadata } from './types'

// Set ffmpeg path (guard for test environment where mock may not include setFfmpegPath)
if (typeof ffmpeg.setFfmpegPath === 'function') {
  ffmpeg.setFfmpegPath(ffmpegPath)
}

/**
 * Extract video metadata using ffprobe.
 */
export async function getVideoMetadata(videoUrl: string): Promise<VideoMetadata> {
  if (!videoUrl) {
    throw new Error('videoUrl is required')
  }

  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoUrl, (err, data) => {
      if (err) {
        reject(new Error(`Failed to probe video: ${err.message}`))
        return
      }

      const videoStream = data.streams.find((s) => s.codec_type === 'video')
      if (!videoStream) {
        reject(new Error('No video stream found'))
        return
      }

      const durationMs = Math.round((data.format.duration ?? 0) * 1000)
      const fpsStr = videoStream.r_frame_rate ?? '30/1'
      const [num, den] = fpsStr.split('/').map(Number)
      const fps = den ? num / den : num

      resolve({
        durationMs,
        fps,
        width: videoStream.width ?? 0,
        height: videoStream.height ?? 0,
      })
    })
  })
}

/**
 * Parse ffmpeg showinfo output to extract scene change timestamps and scores.
 */
function parseShowInfoLine(line: string): { timestampMs: number; score: number } | null {
  // Match pts_time and score from showinfo filter output
  const ptsMatch = line.match(/pts_time:([\d.]+)/)
  const scoreMatch = line.match(/score:([\d.]+)/)

  if (!ptsMatch) return null

  const timestampMs = Math.round(parseFloat(ptsMatch[1]) * 1000)
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0

  return { timestampMs, score }
}

/**
 * Detect scene changes in a video using ffmpeg's scene filter.
 *
 * Returns an array of scenes with start/end timestamps and confidence scores.
 * Each scene represents a continuous segment between two scene change points.
 */
export async function detectScenes(options: SceneDetectOptions): Promise<SceneDetectResult[]> {
  const {
    videoUrl,
    sensitivityThreshold = 0.3,
    minSceneDurationMs = 500,
    maxKeyframes = 50,
  } = options

  if (!videoUrl) {
    throw new Error('videoUrl is required')
  }

  // Get video metadata for total duration
  const metadata = await getVideoMetadata(videoUrl)
  const totalDurationMs = metadata.durationMs

  // Run ffmpeg with scene detection filter and collect stderr output
  const sceneCuts = await runSceneDetection(videoUrl, sensitivityThreshold)

  // If no scene cuts detected, return the entire video as one scene
  if (sceneCuts.length === 0) {
    return [{
      startTimeMs: 0,
      endTimeMs: totalDurationMs,
      keyframeTimestampMs: 0,
      confidence: 1.0,
    }]
  }

  // Build scenes from cut points
  let scenes = buildScenesFromCuts(sceneCuts, totalDurationMs)

  // Filter scenes shorter than minSceneDurationMs
  scenes = filterShortScenes(scenes, minSceneDurationMs)

  // Apply maxKeyframes limit
  if (scenes.length > maxKeyframes) {
    // Keep the scenes with highest confidence, maintaining order
    const sorted = scenes
      .map((s, i) => ({ scene: s, index: i }))
      .sort((a, b) => b.scene.confidence - a.scene.confidence)
      .slice(0, maxKeyframes)
      .sort((a, b) => a.index - b.index)
      .map((item) => item.scene)
    scenes = sorted
  }

  return scenes
}

/**
 * Run ffmpeg scene detection and collect scene change timestamps.
 */
function runSceneDetection(
  videoUrl: string,
  threshold: number,
): Promise<Array<{ timestampMs: number; score: number }>> {
  return new Promise((resolve, reject) => {
    const cuts: Array<{ timestampMs: number; score: number }> = []

    const command = ffmpeg(videoUrl)
      .videoFilters([
        `select='gt(scene,${threshold})'`,
        'showinfo',
      ])
      .format('null')
      .output('/dev/null')
      .on('stderr', (line: string) => {
        const parsed = parseShowInfoLine(line)
        if (parsed) {
          cuts.push(parsed)
        }
      })
      .on('error', (err: Error) => {
        reject(new Error(`Scene detection failed: ${err.message}`))
      })
      .on('end', () => {
        resolve(cuts)
      })

    command.run()
  })
}

/**
 * Build scene segments from a list of cut points.
 * N cut points produce N+1 scenes.
 */
function buildScenesFromCuts(
  cuts: Array<{ timestampMs: number; score: number }>,
  totalDurationMs: number,
): SceneDetectResult[] {
  const scenes: SceneDetectResult[] = []

  // First scene: from start to first cut
  scenes.push({
    startTimeMs: 0,
    endTimeMs: cuts[0].timestampMs,
    keyframeTimestampMs: 0,
    confidence: cuts[0].score,
  })

  // Middle scenes: between consecutive cuts
  for (let i = 0; i < cuts.length - 1; i++) {
    scenes.push({
      startTimeMs: cuts[i].timestampMs,
      endTimeMs: cuts[i + 1].timestampMs,
      keyframeTimestampMs: cuts[i].timestampMs,
      confidence: cuts[i + 1].score,
    })
  }

  // Last scene: from last cut to end
  const lastCut = cuts[cuts.length - 1]
  scenes.push({
    startTimeMs: lastCut.timestampMs,
    endTimeMs: totalDurationMs,
    keyframeTimestampMs: lastCut.timestampMs,
    confidence: lastCut.score,
  })

  return scenes
}

/**
 * Filter out scenes shorter than the minimum duration by merging them
 * with adjacent scenes.
 */
function filterShortScenes(
  scenes: SceneDetectResult[],
  minDurationMs: number,
): SceneDetectResult[] {
  if (scenes.length <= 1) return scenes

  const result: SceneDetectResult[] = []

  for (const scene of scenes) {
    const duration = scene.endTimeMs - scene.startTimeMs
    if (duration < minDurationMs && result.length > 0) {
      // Merge with previous scene
      const prev = result[result.length - 1]
      prev.endTimeMs = scene.endTimeMs
      // Keep higher confidence
      prev.confidence = Math.max(prev.confidence, scene.confidence)
    } else {
      result.push({ ...scene })
    }
  }

  return result
}

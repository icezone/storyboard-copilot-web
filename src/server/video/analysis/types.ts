/**
 * Options for scene detection in a video.
 */
export interface SceneDetectOptions {
  /** Video file URL or local path */
  videoUrl: string
  /** Scene change sensitivity threshold (0.0 ~ 1.0). Higher = fewer scenes. Default 0.3 */
  sensitivityThreshold?: number
  /** Minimum scene duration in milliseconds. Scenes shorter than this are filtered. Default 500 */
  minSceneDurationMs?: number
  /** Maximum number of keyframes to extract. Default 50 */
  maxKeyframes?: number
}

/**
 * A single detected scene with its keyframe.
 */
export interface SceneDetectResult {
  /** Start time of the scene in milliseconds */
  startTimeMs: number
  /** End time of the scene in milliseconds */
  endTimeMs: number
  /** Timestamp of the extracted keyframe in milliseconds */
  keyframeTimestampMs: number
  /** Scene change confidence score (0 ~ 1) */
  confidence: number
}

/**
 * Video metadata extracted via ffprobe.
 */
export interface VideoMetadata {
  /** Total duration in milliseconds */
  durationMs: number
  /** Frames per second */
  fps: number
  /** Video width in pixels */
  width: number
  /** Video height in pixels */
  height: number
}

/**
 * Options for extracting frames from a video.
 */
export interface FrameExtractOptions {
  /** Video file URL or local path */
  videoUrl: string
  /** Timestamps (in ms) at which to extract frames */
  timestamps: number[]
  /** Output format for extracted frames. Default 'jpeg' */
  format?: 'jpeg' | 'png'
  /** JPEG quality (1-100). Default 85 */
  quality?: number
  /** Thumbnail width for preview images. Default 320 */
  thumbnailWidth?: number
}

/**
 * Result of a single frame extraction.
 */
export interface ExtractedFrame {
  /** Timestamp in milliseconds where the frame was extracted */
  timestampMs: number
  /** Full-resolution frame as a Buffer */
  frameBuffer: Buffer
  /** Thumbnail frame as a Buffer */
  thumbnailBuffer: Buffer
  /** Width of the extracted frame */
  width: number
  /** Height of the extracted frame */
  height: number
}

/**
 * Full result returned from the video analysis job.
 * Stored in ai_jobs.result when the job completes.
 */
export interface VideoAnalyzeJobResult {
  scenes: Array<{
    startTimeMs: number
    endTimeMs: number
    keyframeUrl: string
    previewUrl: string
    confidence: number
  }>
  totalDurationMs: number
  fps: number
}

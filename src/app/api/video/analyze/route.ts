import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { createJob, updateJobStatus } from '@/server/jobs/jobService'
import { detectScenes, getVideoMetadata } from '@/server/video/analysis/sceneDetector'
import { extractFrames } from '@/server/video/analysis/frameExtractor'
import type { VideoAnalyzeJobResult } from '@/server/video/analysis/types'

/**
 * POST /api/video/analyze
 *
 * Submit a video for scene detection and keyframe extraction.
 * Creates an async job and returns a jobId for polling.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const user = await getAuthUser(supabase)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const videoUrl = body.videoUrl as string | undefined
  const projectId = body.projectId as string | undefined
  const sensitivityThreshold = body.sensitivityThreshold as number | undefined
  const minSceneDurationMs = body.minSceneDurationMs as number | undefined
  const maxKeyframes = body.maxKeyframes as number | undefined

  // Validate required fields
  if (!videoUrl || typeof videoUrl !== 'string') {
    return NextResponse.json(
      { error: 'videoUrl is required and must be a string' },
      { status: 400 },
    )
  }

  if (!projectId || typeof projectId !== 'string') {
    return NextResponse.json(
      { error: 'projectId is required and must be a string' },
      { status: 400 },
    )
  }

  // Validate optional numeric parameters
  if (sensitivityThreshold !== undefined) {
    if (typeof sensitivityThreshold !== 'number' || sensitivityThreshold < 0.01 || sensitivityThreshold > 1) {
      return NextResponse.json(
        { error: 'sensitivityThreshold must be a number between 0.01 and 1.0' },
        { status: 400 },
      )
    }
  }

  if (maxKeyframes !== undefined) {
    if (typeof maxKeyframes !== 'number' || maxKeyframes < 1 || maxKeyframes > 200) {
      return NextResponse.json(
        { error: 'maxKeyframes must be a number between 1 and 200' },
        { status: 400 },
      )
    }
  }

  try {
    // Create a job record
    const jobId = await createJob({
      userId: user.id,
      projectId,
      type: 'video',
      providerId: 'video-analysis',
      modelId: 'video-analysis/scene-detect',
      creditCost: 1,
    })

    // Run analysis asynchronously (fire and forget)
    runAnalysis(jobId, {
      videoUrl,
      sensitivityThreshold,
      minSceneDurationMs,
      maxKeyframes,
      projectId,
    }).catch((err) => {
      console.error(`Video analysis job ${jobId} failed:`, err)
    })

    return NextResponse.json({ jobId })
  } catch (error) {
    console.error('Failed to create video analysis job:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

/**
 * Run the video analysis pipeline asynchronously.
 * Updates the job status upon completion or failure.
 */
async function runAnalysis(
  jobId: string,
  params: {
    videoUrl: string
    sensitivityThreshold?: number
    minSceneDurationMs?: number
    maxKeyframes?: number
    projectId: string
  },
): Promise<void> {
  try {
    // Step 1: Get video metadata
    const metadata = await getVideoMetadata(params.videoUrl)

    // Step 2: Detect scenes
    const sceneResults = await detectScenes({
      videoUrl: params.videoUrl,
      sensitivityThreshold: params.sensitivityThreshold,
      minSceneDurationMs: params.minSceneDurationMs,
      maxKeyframes: params.maxKeyframes,
    })

    // Step 3: Extract keyframes for each scene
    const timestamps = sceneResults.map((s) => s.keyframeTimestampMs)
    const frames = await extractFrames({
      videoUrl: params.videoUrl,
      timestamps,
    })

    // Step 4: Upload frames to Supabase Storage
    const supabase = await (await import('@/lib/supabase/server')).createClient()
    const scenes: VideoAnalyzeJobResult['scenes'] = []

    for (let i = 0; i < sceneResults.length; i++) {
      const scene = sceneResults[i]
      const frame = frames[i]

      // Upload full frame
      const framePath = `projects/${params.projectId}/video-analysis/${jobId}/frame-${i}.jpg`
      const { data: frameUpload } = await supabase.storage
        .from('assets')
        .upload(framePath, frame.frameBuffer, { contentType: 'image/jpeg' })

      // Upload thumbnail
      const thumbPath = `projects/${params.projectId}/video-analysis/${jobId}/thumb-${i}.jpg`
      const { data: thumbUpload } = await supabase.storage
        .from('assets')
        .upload(thumbPath, frame.thumbnailBuffer, { contentType: 'image/jpeg' })

      const keyframeUrl = frameUpload
        ? supabase.storage.from('assets').getPublicUrl(framePath).data.publicUrl
        : ''
      const previewUrl = thumbUpload
        ? supabase.storage.from('assets').getPublicUrl(thumbPath).data.publicUrl
        : ''

      scenes.push({
        startTimeMs: scene.startTimeMs,
        endTimeMs: scene.endTimeMs,
        keyframeUrl,
        previewUrl,
        confidence: scene.confidence,
      })

      // Register as project asset
      if (keyframeUrl) {
        await supabase.from('project_assets').insert({
          project_id: params.projectId,
          type: 'image',
          url: keyframeUrl,
          job_id: jobId,
        }).then(({ error }) => {
          if (error) console.error('Failed to register frame asset:', error.message)
        })
      }
    }

    // Step 5: Update job with results
    const result: VideoAnalyzeJobResult = {
      scenes,
      totalDurationMs: metadata.durationMs,
      fps: metadata.fps,
    }

    await updateJobStatus(jobId, 'completed', {
      outputUrl: JSON.stringify(result),
    })
  } catch (error) {
    console.error(`Video analysis failed for job ${jobId}:`, error)
    await updateJobStatus(jobId, 'failed', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

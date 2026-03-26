import type { AIProvider, AiGenerateRequest, JobPollResult } from '../types'

const FAL_API_BASE = 'https://queue.fal.run'

interface FalQueueSubmitResponse {
  request_id?: string
  status?: string
}

interface FalQueueStatusResponse {
  status?: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  queue_position?: number
  logs?: unknown[]
}

interface FalQueueResultResponse {
  images?: Array<{ url: string; width?: number; height?: number }>
  seed?: number
  error?: string
}

function mapFalStatus(status: string | undefined): JobPollResult['status'] {
  switch (status) {
    case 'COMPLETED':
      return 'completed'
    case 'FAILED':
      return 'failed'
    case 'IN_PROGRESS':
      return 'processing'
    case 'IN_QUEUE':
    default:
      return 'pending'
  }
}

/**
 * fal.ai Provider — queue-based asynchronous image generation.
 * submitJob: POST to fal queue, returns request_id
 * pollJob: GET queue status, fetch result when completed
 * API Key: process.env.FAL_KEY
 */
export const falProvider: AIProvider = {
  id: 'fal',
  name: 'fal',

  async submitJob(request: AiGenerateRequest): Promise<string> {
    const apiKey = process.env.FAL_KEY
    if (!apiKey) {
      throw new Error('FAL_KEY is not configured')
    }

    // fal model IDs use slash format, strip provider prefix if present
    const model = request.modelId.startsWith('fal/')
      ? request.modelId.slice('fal/'.length)
      : request.modelId

    const input: Record<string, unknown> = {
      prompt: request.prompt,
    }

    if (request.negativePrompt) {
      input.negative_prompt = request.negativePrompt
    }
    if (request.aspectRatio) {
      input.aspect_ratio = request.aspectRatio
    }
    if (request.width && request.height) {
      input.image_size = { width: request.width, height: request.height }
    }
    if (request.steps !== undefined) {
      input.num_inference_steps = request.steps
    }
    if (request.cfgScale !== undefined) {
      input.guidance_scale = request.cfgScale
    }
    if (request.seed !== undefined) {
      input.seed = request.seed
    }
    if (request.imageUrl) {
      input.image_url = request.imageUrl
    }
    if (request.extraParams) {
      Object.assign(input, request.extraParams)
    }

    const response = await fetch(`${FAL_API_BASE}/${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({ input }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`fal submit error ${response.status}: ${errorText}`)
    }

    const data = (await response.json()) as FalQueueSubmitResponse
    if (!data.request_id) {
      throw new Error('fal submit returned no request_id')
    }

    return data.request_id
  },

  async pollJob(jobId: string): Promise<JobPollResult> {
    const apiKey = process.env.FAL_KEY
    if (!apiKey) {
      throw new Error('FAL_KEY is not configured')
    }

    // jobId is stored as "model:request_id" to allow status endpoint lookup
    const separatorIdx = jobId.indexOf(':')
    if (separatorIdx === -1) {
      throw new Error(`Invalid fal jobId format (expected "model:request_id"): ${jobId}`)
    }
    const model = jobId.slice(0, separatorIdx)
    const requestId = jobId.slice(separatorIdx + 1)

    // Check queue status
    const statusResponse = await fetch(`${FAL_API_BASE}/${model}/requests/${requestId}/status`, {
      headers: {
        Authorization: `Key ${apiKey}`,
      },
    })

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text().catch(() => statusResponse.statusText)
      throw new Error(`fal status error ${statusResponse.status}: ${errorText}`)
    }

    const statusData = (await statusResponse.json()) as FalQueueStatusResponse
    const status = mapFalStatus(statusData.status)

    if (status !== 'completed') {
      // Estimate progress from queue position
      let progress: number | undefined
      if (statusData.queue_position !== undefined && statusData.queue_position >= 0) {
        progress = Math.max(0, Math.min(90, 100 - statusData.queue_position * 10))
      }
      return { status, progress }
    }

    // Fetch result when completed
    const resultResponse = await fetch(`${FAL_API_BASE}/${model}/requests/${requestId}`, {
      headers: {
        Authorization: `Key ${apiKey}`,
      },
    })

    if (!resultResponse.ok) {
      const errorText = await resultResponse.text().catch(() => resultResponse.statusText)
      throw new Error(`fal result error ${resultResponse.status}: ${errorText}`)
    }

    const resultData = (await resultResponse.json()) as FalQueueResultResponse

    if (resultData.error) {
      return { status: 'failed', errorMessage: resultData.error }
    }

    const imageUrl = resultData.images?.[0]?.url
    if (!imageUrl) {
      return { status: 'failed', errorMessage: 'fal returned no images' }
    }

    return {
      status: 'completed',
      imageUrl,
    }
  },
}

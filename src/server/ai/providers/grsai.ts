import type { AIProvider, AiGenerateRequest, JobPollResult } from '../types'

const GRSAI_API_BASE = 'https://api.grsai.com'

interface GrsaiSubmitResponse {
  task_id?: string
  code?: number
  msg?: string
}

interface GrsaiPollResponse {
  status?: number       // 0=pending, 1=processing, 2=completed, 3=failed
  result?: string       // image URL when completed
  progress?: number
  error?: string
  code?: number
  msg?: string
}

// Map GRSAI status codes to our status enum
function mapGrsaiStatus(status: number | undefined): JobPollResult['status'] {
  switch (status) {
    case 2:
      return 'completed'
    case 3:
      return 'failed'
    case 1:
      return 'processing'
    default:
      return 'pending'
  }
}

/**
 * GRSAI Provider — asynchronous image generation.
 * submitJob: POST task, returns task_id
 * pollJob: GET task status
 * API Key: process.env.GRSAI_API_KEY
 */
export const grsaiProvider: AIProvider = {
  id: 'grsai',
  name: 'GRSAI',

  async submitJob(request: AiGenerateRequest): Promise<string> {
    const apiKey = process.env.GRSAI_API_KEY
    if (!apiKey) {
      throw new Error('GRSAI_API_KEY is not configured')
    }

    // Resolve variant model — strip provider prefix if present
    const model = request.modelId.startsWith('grsai/')
      ? request.modelId.slice('grsai/'.length)
      : request.modelId

    const body: Record<string, unknown> = {
      model,
      prompt: request.prompt,
    }

    if (request.negativePrompt) {
      body.negative_prompt = request.negativePrompt
    }
    if (request.aspectRatio) {
      body.aspect_ratio = request.aspectRatio
    }
    if (request.width && request.height) {
      body.width = request.width
      body.height = request.height
    }
    if (request.steps !== undefined) {
      body.steps = request.steps
    }
    if (request.seed !== undefined) {
      body.seed = request.seed
    }
    if (request.imageUrl) {
      body.image_url = request.imageUrl
    }
    if (request.extraParams) {
      Object.assign(body, request.extraParams)
    }

    const response = await fetch(`${GRSAI_API_BASE}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`GRSAI submit error ${response.status}: ${errorText}`)
    }

    const data = (await response.json()) as GrsaiSubmitResponse
    if (!data.task_id) {
      throw new Error(`GRSAI submit returned no task_id: ${data.msg ?? 'unknown error'}`)
    }

    return data.task_id
  },

  async pollJob(jobId: string): Promise<JobPollResult> {
    const apiKey = process.env.GRSAI_API_KEY
    if (!apiKey) {
      throw new Error('GRSAI_API_KEY is not configured')
    }

    const response = await fetch(`${GRSAI_API_BASE}/v1/images/tasks/${encodeURIComponent(jobId)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`GRSAI poll error ${response.status}: ${errorText}`)
    }

    const data = (await response.json()) as GrsaiPollResponse

    const status = mapGrsaiStatus(data.status)

    return {
      status,
      imageUrl: status === 'completed' ? data.result : undefined,
      errorMessage: status === 'failed' ? (data.error ?? data.msg ?? 'Generation failed') : undefined,
      progress: data.progress,
    }
  },
}

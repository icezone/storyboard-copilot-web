import type { AIProvider, AiGenerateRequest, JobPollResult } from '../types'

const KIE_API_BASE = 'https://kieai.erp.mofasuan.com/api'

interface KieUploadResponse {
  url?: string
  data?: { url?: string }
  code?: number
  msg?: string
}

interface KieSubmitResponse {
  task_id?: string
  data?: { task_id?: string }
  code?: number
  msg?: string
}

interface KiePollResponse {
  status?: string   // 'pending' | 'processing' | 'succeed' | 'failed'
  result?: string   // image URL
  output?: { images?: Array<{ url: string }> }
  progress?: number
  error?: string
  code?: number
  msg?: string
}

function mapKieStatus(status: string | undefined): JobPollResult['status'] {
  switch (status) {
    case 'succeed':
    case 'completed':
      return 'completed'
    case 'failed':
      return 'failed'
    case 'processing':
    case 'running':
      return 'processing'
    default:
      return 'pending'
  }
}

/**
 * Upload an image to KIE storage.
 * Supports http/https URLs (proxied), data URIs, and raw base64 strings.
 */
async function uploadImageToKie(imageUrl: string, apiKey: string): Promise<string> {
  // If already an https URL (not data:), use directly
  if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
    // Upload by URL reference
    const response = await fetch(`${KIE_API_BASE}/upload/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ url: imageUrl }),
    })
    if (response.ok) {
      const data = (await response.json()) as KieUploadResponse
      const uploadedUrl = data.url ?? data.data?.url
      if (uploadedUrl) return uploadedUrl
    }
    // Fallback: return the URL directly
    return imageUrl
  }

  // Handle data URI or base64
  let base64Data: string
  let mimeType = 'image/png'

  if (imageUrl.startsWith('data:')) {
    const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) throw new Error('Invalid data URI format')
    mimeType = matches[1]
    base64Data = matches[2]
  } else {
    base64Data = imageUrl
  }

  const binaryData = Buffer.from(base64Data, 'base64')
  const ext = mimeType.split('/')[1] || 'png'
  const formData = new FormData()
  const blob = new Blob([binaryData], { type: mimeType })
  formData.append('file', blob, `image.${ext}`)

  const response = await fetch(`${KIE_API_BASE}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(`KIE image upload failed ${response.status}: ${errorText}`)
  }

  const data = (await response.json()) as KieUploadResponse
  const uploadedUrl = data.url ?? data.data?.url
  if (!uploadedUrl) {
    throw new Error(`KIE image upload returned no URL: ${data.msg ?? 'unknown'}`)
  }
  return uploadedUrl
}

/**
 * KIE Provider — asynchronous image generation with optional image upload.
 * API Key: process.env.KIE_API_KEY
 */
export const kieProvider: AIProvider = {
  id: 'kie',
  name: 'KIE',

  async submitJob(request: AiGenerateRequest): Promise<string> {
    const apiKey = process.env.KIE_API_KEY
    if (!apiKey) {
      throw new Error('KIE_API_KEY is not configured')
    }

    const model = request.modelId.startsWith('kie/')
      ? request.modelId.slice('kie/'.length)
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

    // Upload image if provided for image-to-image
    if (request.imageUrl) {
      body.image_url = await uploadImageToKie(request.imageUrl, apiKey)
    }

    if (request.extraParams) {
      Object.assign(body, request.extraParams)
    }

    const response = await fetch(`${KIE_API_BASE}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`KIE submit error ${response.status}: ${errorText}`)
    }

    const data = (await response.json()) as KieSubmitResponse
    const taskId = data.task_id ?? data.data?.task_id
    if (!taskId) {
      throw new Error(`KIE submit returned no task_id: ${data.msg ?? 'unknown error'}`)
    }

    return taskId
  },

  async pollJob(jobId: string): Promise<JobPollResult> {
    const apiKey = process.env.KIE_API_KEY
    if (!apiKey) {
      throw new Error('KIE_API_KEY is not configured')
    }

    const response = await fetch(`${KIE_API_BASE}/v1/images/tasks/${encodeURIComponent(jobId)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`KIE poll error ${response.status}: ${errorText}`)
    }

    const data = (await response.json()) as KiePollResponse
    const status = mapKieStatus(data.status)

    // Extract image URL from various possible response shapes
    const imageUrl =
      status === 'completed'
        ? (data.result ?? data.output?.images?.[0]?.url)
        : undefined

    return {
      status,
      imageUrl,
      errorMessage: status === 'failed' ? (data.error ?? data.msg ?? 'Generation failed') : undefined,
      progress: data.progress,
    }
  },
}

import type { AIProvider, AiGenerateRequest, AiGenerateResult } from '../types'

const PPIO_API_BASE = 'https://api.ppio.cloud/openai/v1'

/**
 * PPIO Provider — synchronous image generation via OpenAI-compatible images endpoint.
 * API Key: process.env.PPIO_API_KEY
 */
export const ppioProvider: AIProvider = {
  id: 'ppio',
  name: 'PPIO',

  async generate(request: AiGenerateRequest): Promise<AiGenerateResult> {
    const apiKey = process.env.PPIO_API_KEY
    if (!apiKey) {
      throw new Error('PPIO_API_KEY is not configured')
    }

    // Resolve model name — strip provider prefix if present
    const model = request.modelId.startsWith('ppio/')
      ? request.modelId.slice('ppio/'.length)
      : request.modelId

    // Build request body
    const body: Record<string, unknown> = {
      model,
      prompt: request.prompt,
      n: 1,
      response_format: 'url',
    }

    if (request.negativePrompt) {
      body.negative_prompt = request.negativePrompt
    }
    if (request.width && request.height) {
      body.size = `${request.width}x${request.height}`
    } else if (request.aspectRatio) {
      body.aspect_ratio = request.aspectRatio
    }
    if (request.steps !== undefined) {
      body.steps = request.steps
    }
    if (request.seed !== undefined) {
      body.seed = request.seed
    }
    if (request.imageUrl) {
      body.image = request.imageUrl
    }
    if (request.extraParams) {
      Object.assign(body, request.extraParams)
    }

    const response = await fetch(`${PPIO_API_BASE}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`PPIO API error ${response.status}: ${errorText}`)
    }

    const data = (await response.json()) as {
      data?: Array<{ url?: string; b64_json?: string }>
      error?: { message?: string }
    }

    if (data.error?.message) {
      throw new Error(`PPIO API error: ${data.error.message}`)
    }

    const imageUrl = data.data?.[0]?.url
    if (!imageUrl) {
      throw new Error('PPIO API returned no image URL')
    }

    return { imageUrl }
  },
}

'use client'

/**
 * Web AI Gateway — canvas-side adapter that calls the Next.js AI API routes.
 * This is a skeleton implementation; canvas-dev will wire it up to the full
 * AiGateway port defined in application/ports.ts.
 */

export interface WebAiGenerateRequest {
  modelId: string
  prompt: string
  negativePrompt?: string
  aspectRatio?: string
  width?: number
  height?: number
  imageUrl?: string
  steps?: number
  cfgScale?: number
  seed?: number
  extraParams?: Record<string, unknown>
  projectId: string
  creditCost?: number
}

export interface WebAiGenerateResult {
  /** Populated immediately for synchronous providers */
  imageUrl?: string
  /** Populated for asynchronous providers — use to poll job status */
  jobId?: string
  /** 'completed' for sync, 'pending' for async */
  status: 'completed' | 'pending'
}

export interface WebJobStatusResult {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  imageUrl?: string
  errorMessage?: string
  progress?: number
}

/**
 * Submit an image generation request.
 * Returns immediately with either an imageUrl (sync) or a jobId (async).
 */
export async function generateImage(
  request: WebAiGenerateRequest
): Promise<WebAiGenerateResult> {
  const response = await fetch('/api/ai/image/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    const message = (errorData as { error?: string }).error ?? 'Image generation failed'
    throw new Error(message)
  }

  const data = (await response.json()) as {
    imageUrl?: string
    jobId?: string
    status?: string
  }

  if (data.imageUrl) {
    return { imageUrl: data.imageUrl, jobId: data.jobId, status: 'completed' }
  }

  if (data.jobId) {
    return { jobId: data.jobId, status: 'pending' }
  }

  throw new Error('AI generate returned neither imageUrl nor jobId')
}

/**
 * Poll the status of an async image generation job.
 */
export async function pollJobStatus(jobId: string): Promise<WebJobStatusResult> {
  const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
    method: 'GET',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    const message = (errorData as { error?: string }).error ?? 'Failed to get job status'
    throw new Error(message)
  }

  return response.json() as Promise<WebJobStatusResult>
}

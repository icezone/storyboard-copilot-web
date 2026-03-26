import type { AiGateway, GenerateImagePayload } from '../application/ports';
import { imageUrlToDataUrl } from '../application/imageData';

async function normalizeReferenceImages(
  payload: GenerateImagePayload
): Promise<string[] | undefined> {
  if (!payload.referenceImages || payload.referenceImages.length === 0) {
    return undefined;
  }

  // For KIE and FAL models, convert images to data URLs for upload
  const isKieModel = payload.model.startsWith('kie/');
  const isFalModel = payload.model.startsWith('fal/');

  if (isKieModel || isFalModel) {
    return Promise.all(
      payload.referenceImages.map((imageUrl) => imageUrlToDataUrl(imageUrl))
    );
  }

  return payload.referenceImages;
}

export class WebAiGateway implements AiGateway {
  async setApiKey(_provider: string, _apiKey: string): Promise<void> {
    // Web version: API keys are stored in settings store and sent per-request.
    // This is a no-op for the gateway itself.
  }

  async generateImage(payload: GenerateImagePayload): Promise<string> {
    const normalizedReferenceImages = await normalizeReferenceImages(payload);
    const response = await fetch('/api/ai/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: payload.prompt,
        model: payload.model,
        size: payload.size,
        aspect_ratio: payload.aspectRatio,
        reference_images: normalizedReferenceImages,
        extra_params: payload.extraParams,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `AI generation failed: ${response.status}`);
    }

    const data = await response.json() as { imageUrl: string };
    return data.imageUrl;
  }

  async submitGenerateImageJob(payload: GenerateImagePayload): Promise<string> {
    const normalizedReferenceImages = await normalizeReferenceImages(payload);
    const response = await fetch('/api/ai/image/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: payload.prompt,
        model: payload.model,
        size: payload.size,
        aspect_ratio: payload.aspectRatio,
        reference_images: normalizedReferenceImages,
        extra_params: payload.extraParams,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `AI job submission failed: ${response.status}`);
    }

    const data = await response.json() as { jobId: string };
    return data.jobId;
  }

  async getGenerateImageJob(jobId: string): Promise<{
    job_id: string;
    status: 'queued' | 'running' | 'succeeded' | 'failed' | 'not_found';
    result?: string | null;
    error?: string | null;
  }> {
    const response = await fetch(`/api/jobs/${jobId}`);

    if (response.status === 404) {
      return { job_id: jobId, status: 'not_found' };
    }

    if (!response.ok) {
      throw new Error(`Failed to get job status: ${response.status}`);
    }

    return response.json();
  }
}

export const webAiGateway = new WebAiGateway();

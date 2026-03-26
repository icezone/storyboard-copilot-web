import type { VideoAiGateway, GenerateVideoPayload, VideoJobStatus } from '../application/ports';

export class WebVideoGateway implements VideoAiGateway {
  async setApiKey(_provider: string, _apiKey: string): Promise<void> {
    // Web version: API keys are managed by settings store; no-op here.
  }

  async generateVideo(payload: GenerateVideoPayload): Promise<{ jobId: string }> {
    const response = await fetch('/api/ai/video/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: payload.prompt,
        model: payload.model,
        duration: payload.duration,
        aspect_ratio: payload.aspectRatio,
        enable_audio: payload.enableAudio,
        seed: payload.seed,
        start_frame_url: payload.startFrameUrl,
        end_frame_url: payload.endFrameUrl,
        extra_params: payload.extraParams,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Video generation failed: ${response.status}`);
    }

    const data = await response.json() as { jobId: string };
    return { jobId: data.jobId };
  }

  async pollJobStatus(jobId: string, _model: string): Promise<VideoJobStatus> {
    const response = await fetch(`/api/jobs/${jobId}`);

    if (response.status === 404) {
      return {
        jobId,
        state: 'failed',
        errorMessage: 'Job not found',
      };
    }

    if (!response.ok) {
      throw new Error(`Failed to poll job: ${response.status}`);
    }

    const data = await response.json() as {
      job_id: string;
      state: 'pending' | 'processing' | 'completed' | 'failed' | 'timeout';
      progress?: number;
      video_url?: string;
      error_message?: string;
      created_at?: number;
      updated_at?: number;
    };

    return {
      jobId: data.job_id,
      state: data.state,
      progress: data.progress,
      videoUrl: data.video_url,
      errorMessage: data.error_message,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async cacheVideo(videoUrl: string, _videoId: string): Promise<string> {
    // Web version: no local caching; return URL as-is.
    return videoUrl;
  }

  async downloadVideo(videoUrl: string, _targetPath: string, _revealInExplorer: boolean): Promise<void> {
    const filename = `video_${Date.now()}.mp4`;
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  }
}

export const webVideoGateway = new WebVideoGateway();

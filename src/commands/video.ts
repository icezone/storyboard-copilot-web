/**
 * Web shims for Tauri video commands.
 * These replace Tauri invoke() calls with Web API / server-side API calls.
 */

export interface GenerateVideoRequest {
  prompt: string;
  model: string;
  duration?: number;
  aspect_ratio?: string;
  enable_audio?: boolean;
  seed?: number;
  start_frame_url?: string;
  end_frame_url?: string;
  extra_params?: Record<string, unknown>;
}

export interface VideoJobStatusResponse {
  job_id: string;
  state: 'pending' | 'processing' | 'completed' | 'failed' | 'timeout';
  progress?: number;
  video_url?: string;
  error_message?: string;
  created_at?: number;
  updated_at?: number;
}

export interface VideoCacheStats {
  total_videos: number;
  total_size_bytes: number;
  oldest_video_age_seconds?: number;
}

/**
 * Generate a video job via the Web video API.
 * Returns the job ID.
 */
export async function generateVideo(request: GenerateVideoRequest): Promise<string> {
  const response = await fetch('/api/ai/video/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`generateVideo failed: ${await response.text()}`);
  }
  const data = await response.json() as { jobId: string };
  return data.jobId;
}

/**
 * Poll video job status via the Web jobs API.
 */
export async function pollVideoJobStatus(
  jobId: string,
  _model: string
): Promise<VideoJobStatusResponse> {
  const response = await fetch(`/api/jobs/${jobId}`);
  if (!response.ok) {
    if (response.status === 404) {
      return {
        job_id: jobId,
        state: 'failed',
        error_message: 'Job not found',
      };
    }
    throw new Error(`pollVideoJobStatus failed: ${await response.text()}`);
  }
  return response.json() as Promise<VideoJobStatusResponse>;
}

/**
 * Set video API key via the Web settings API.
 */
export async function setVideoApiKey(provider: string, apiKey: string): Promise<void> {
  const response = await fetch('/api/settings/api-keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, apiKey }),
  });
  if (!response.ok) {
    throw new Error(`setVideoApiKey failed: ${await response.text()}`);
  }
}

/**
 * Cache video locally — Web version: returns the original URL (no local caching in browser).
 */
export async function cacheVideoLocally(videoUrl: string, _videoId: string): Promise<string> {
  // Web version: no local caching, return URL as-is.
  return videoUrl;
}

/**
 * Download video to directory — Web version triggers browser download.
 */
export async function downloadVideoToDirectory(
  videoUrl: string,
  _targetPath: string,
  _revealInExplorer: boolean
): Promise<void> {
  const filename = `video_${Date.now()}.mp4`;
  try {
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
  } catch (error) {
    console.error('[downloadVideoToDirectory] Failed:', error);
    throw error;
  }
}

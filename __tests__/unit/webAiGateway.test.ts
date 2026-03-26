import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock imageData to avoid DOM dependencies
vi.mock('@/features/canvas/application/imageData', () => ({
  imageUrlToDataUrl: vi.fn(async (url: string) => url),
}));

describe('WebAiGateway', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('generateImage', () => {
    it('should call /api/ai/image/generate with correct payload', async () => {
      const { WebAiGateway } = await import('@/features/canvas/infrastructure/webAiGateway');
      const gateway = new WebAiGateway();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ imageUrl: 'https://example.com/result.png' }),
      });

      const result = await gateway.generateImage({
        prompt: 'a cat',
        model: 'fal/nano-banana',
        size: '1024x1024',
        aspectRatio: '1:1',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/ai/image/generate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(body.prompt).toBe('a cat');
      expect(body.model).toBe('fal/nano-banana');
      expect(result).toBe('https://example.com/result.png');
    });

    it('should throw error when response is not ok', async () => {
      const { WebAiGateway } = await import('@/features/canvas/infrastructure/webAiGateway');
      const gateway = new WebAiGateway();

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(
        gateway.generateImage({
          prompt: 'test',
          model: 'fal/test',
          size: '512x512',
          aspectRatio: '1:1',
        })
      ).rejects.toThrow('Internal Server Error');
    });
  });

  describe('submitGenerateImageJob', () => {
    it('should call /api/ai/image/submit and return jobId', async () => {
      const { WebAiGateway } = await import('@/features/canvas/infrastructure/webAiGateway');
      const gateway = new WebAiGateway();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'job-123' }),
      });

      const jobId = await gateway.submitGenerateImageJob({
        prompt: 'a dog',
        model: 'kie/nano-banana-pro',
        size: '1024x1024',
        aspectRatio: '16:9',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/ai/image/submit',
        expect.objectContaining({ method: 'POST' })
      );
      expect(jobId).toBe('job-123');
    });
  });

  describe('getGenerateImageJob', () => {
    it('should call /api/jobs/:id and return job status', async () => {
      const { WebAiGateway } = await import('@/features/canvas/infrastructure/webAiGateway');
      const gateway = new WebAiGateway();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          job_id: 'job-123',
          status: 'succeeded',
          result: 'https://example.com/image.png',
        }),
      });

      const result = await gateway.getGenerateImageJob('job-123');

      expect(fetchMock).toHaveBeenCalledWith('/api/jobs/job-123');
      expect(result.job_id).toBe('job-123');
      expect(result.status).toBe('succeeded');
    });

    it('should return not_found when job returns 404', async () => {
      const { WebAiGateway } = await import('@/features/canvas/infrastructure/webAiGateway');
      const gateway = new WebAiGateway();

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'not found' }),
      });

      const result = await gateway.getGenerateImageJob('missing-job');
      expect(result.status).toBe('not_found');
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('WebImageSplitGateway', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('split', () => {
    it('should call /api/image/split with correct parameters', async () => {
      const { WebImageSplitGateway } = await import(
        '@/features/canvas/infrastructure/webImageSplitGateway'
      );
      const gateway = new WebImageSplitGateway();

      const mockImages = [
        'data:image/png;base64,abc',
        'data:image/png;base64,def',
        'data:image/png;base64,ghi',
        'data:image/png;base64,jkl',
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ images: mockImages }),
      });

      const results = await gateway.split('data:image/png;base64,source', 2, 2, 0);

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/image/split',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(body.source).toBe('data:image/png;base64,source');
      expect(body.rows).toBe(2);
      expect(body.cols).toBe(2);
      expect(body.lineThickness).toBe(0);
      expect(results).toEqual(mockImages);
    });

    it('should pass line thickness to the API', async () => {
      const { WebImageSplitGateway } = await import(
        '@/features/canvas/infrastructure/webImageSplitGateway'
      );
      const gateway = new WebImageSplitGateway();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ images: ['data:image/png;base64,result'] }),
      });

      await gateway.split('https://example.com/image.png', 3, 3, 5);

      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(body.lineThickness).toBe(5);
    });

    it('should throw error when API returns non-ok response', async () => {
      const { WebImageSplitGateway } = await import(
        '@/features/canvas/infrastructure/webImageSplitGateway'
      );
      const gateway = new WebImageSplitGateway();

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid image source',
      });

      await expect(
        gateway.split('invalid-source', 3, 3, 0)
      ).rejects.toThrow('Invalid image source');
    });
  });
});

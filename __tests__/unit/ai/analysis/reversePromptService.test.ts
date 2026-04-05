import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mock state ─────────────────────────────────────────────
const mock = vi.hoisted(() => {
  const mockAnalyzeMultimodal = vi.fn()
  return { mockAnalyzeMultimodal }
})

vi.mock('@/server/ai/analysis/providers/geminiAnalysis', () => ({
  analyzeWithGeminiMultimodal: mock.mockAnalyzeMultimodal,
}))

import { generateReversePrompt } from '@/server/ai/analysis/reversePromptService'

describe('reversePromptService', () => {
  beforeEach(() => {
    mock.mockAnalyzeMultimodal.mockReset()
  })

  const sampleGenericResponse = JSON.stringify({
    prompt: 'A cinematic wide shot of a solitary figure standing on a cliff edge, backlit by golden hour sunlight, dramatic clouds in the background',
    negative_prompt: 'blurry, low quality, text, watermark, deformed',
    tags: ['cinematic', 'landscape', 'golden hour', 'dramatic', 'silhouette'],
    confidence: 0.88,
  })

  const sampleChineseResponse = JSON.stringify({
    prompt: '电影感的广角镜头，一个孤独的人物站在悬崖边缘，被黄金时刻的阳光从背后照亮，背景是戏剧性的云层',
    negative_prompt: '模糊, 低质量, 文字, 水印, 变形',
    tags: ['电影感', '风景', '黄金时刻', '戏剧性', '剪影'],
    confidence: 0.85,
  })

  describe('generateReversePrompt', () => {
    it('should generate a generic (English) reverse prompt', async () => {
      mock.mockAnalyzeMultimodal.mockResolvedValue(sampleGenericResponse)

      const result = await generateReversePrompt({
        imageUrl: 'https://example.com/image.jpg',
        style: 'generic',
      })

      expect(result.prompt).toContain('cinematic')
      expect(result.negativePrompt).toContain('blurry')
      expect(result.tags).toContain('landscape')
      expect(result.confidence).toBe(0.88)
    })

    it('should generate a Chinese reverse prompt', async () => {
      mock.mockAnalyzeMultimodal.mockResolvedValue(sampleChineseResponse)

      const result = await generateReversePrompt({
        imageUrl: 'https://example.com/image.jpg',
        style: 'chinese',
      })

      expect(result.prompt).toContain('电影感')
      expect(result.tags).toContain('风景')
      expect(result.confidence).toBe(0.85)
    })

    it('should pass imageUrl to the multimodal LLM', async () => {
      mock.mockAnalyzeMultimodal.mockResolvedValue(sampleGenericResponse)

      await generateReversePrompt({
        imageUrl: 'https://example.com/test.png',
        style: 'generic',
      })

      const callArgs = mock.mockAnalyzeMultimodal.mock.calls[0][0]
      expect(callArgs.imageUrl).toBe('https://example.com/test.png')
    })

    it('should use generic system prompt for generic style', async () => {
      mock.mockAnalyzeMultimodal.mockResolvedValue(sampleGenericResponse)

      await generateReversePrompt({
        imageUrl: 'https://example.com/image.jpg',
        style: 'generic',
      })

      const callArgs = mock.mockAnalyzeMultimodal.mock.calls[0][0]
      expect(callArgs.systemPrompt).toContain('expert AI image prompt engineer')
    })

    it('should use Chinese system prompt for chinese style', async () => {
      mock.mockAnalyzeMultimodal.mockResolvedValue(sampleChineseResponse)

      await generateReversePrompt({
        imageUrl: 'https://example.com/image.jpg',
        style: 'chinese',
      })

      const callArgs = mock.mockAnalyzeMultimodal.mock.calls[0][0]
      expect(callArgs.systemPrompt).toContain('专业的 AI 图片提示词工程师')
    })

    it('should include additionalContext in user message', async () => {
      mock.mockAnalyzeMultimodal.mockResolvedValue(sampleGenericResponse)

      await generateReversePrompt({
        imageUrl: 'https://example.com/image.jpg',
        style: 'generic',
        additionalContext: 'This is a sci-fi scene',
      })

      const callArgs = mock.mockAnalyzeMultimodal.mock.calls[0][0]
      expect(callArgs.userMessage).toContain('sci-fi scene')
    })

    it('should use temperature 0.4', async () => {
      mock.mockAnalyzeMultimodal.mockResolvedValue(sampleGenericResponse)

      await generateReversePrompt({
        imageUrl: 'https://example.com/image.jpg',
        style: 'generic',
      })

      const callArgs = mock.mockAnalyzeMultimodal.mock.calls[0][0]
      expect(callArgs.temperature).toBe(0.4)
    })

    it('should throw error for empty imageUrl', async () => {
      await expect(
        generateReversePrompt({ imageUrl: '', style: 'generic' })
      ).rejects.toThrow('imageUrl is required')
    })

    it('should throw error for whitespace-only imageUrl', async () => {
      await expect(
        generateReversePrompt({ imageUrl: '   ', style: 'generic' })
      ).rejects.toThrow('imageUrl is required')
    })

    it('should default style to generic when not specified', async () => {
      mock.mockAnalyzeMultimodal.mockResolvedValue(sampleGenericResponse)

      await generateReversePrompt({
        imageUrl: 'https://example.com/image.jpg',
        style: 'generic',
      })

      const callArgs = mock.mockAnalyzeMultimodal.mock.calls[0][0]
      expect(callArgs.systemPrompt).toContain('expert AI image prompt engineer')
    })

    it('should handle malformed LLM JSON gracefully', async () => {
      mock.mockAnalyzeMultimodal.mockResolvedValue('Not valid JSON at all')

      const result = await generateReversePrompt({
        imageUrl: 'https://example.com/image.jpg',
        style: 'generic',
      })

      expect(result.prompt).toBe('')
      expect(result.confidence).toBe(0.8)
    })

    it('should handle JSON with markdown code fences', async () => {
      const wrapped = '```json\n' + sampleGenericResponse + '\n```'
      mock.mockAnalyzeMultimodal.mockResolvedValue(wrapped)

      const result = await generateReversePrompt({
        imageUrl: 'https://example.com/image.jpg',
        style: 'generic',
      })

      expect(result.prompt).toContain('cinematic')
    })

    it('should clamp confidence to 0-1 range', async () => {
      const overConfident = JSON.stringify({
        prompt: 'test',
        negative_prompt: '',
        tags: [],
        confidence: 1.5,
      })
      mock.mockAnalyzeMultimodal.mockResolvedValue(overConfident)

      const result = await generateReversePrompt({
        imageUrl: 'https://example.com/image.jpg',
        style: 'generic',
      })

      expect(result.confidence).toBe(1)
    })

    it('should filter non-string tags', async () => {
      const badTags = JSON.stringify({
        prompt: 'test',
        tags: ['valid', 123, null, 'also-valid'],
        confidence: 0.8,
      })
      mock.mockAnalyzeMultimodal.mockResolvedValue(badTags)

      const result = await generateReversePrompt({
        imageUrl: 'https://example.com/image.jpg',
        style: 'generic',
      })

      expect(result.tags).toEqual(['valid', 'also-valid'])
    })

    it('should propagate LLM errors', async () => {
      mock.mockAnalyzeMultimodal.mockRejectedValue(new Error('Gemini API error 429: Rate limited'))

      await expect(
        generateReversePrompt({
          imageUrl: 'https://example.com/image.jpg',
          style: 'generic',
        })
      ).rejects.toThrow('Gemini API error 429')
    })
  })
})

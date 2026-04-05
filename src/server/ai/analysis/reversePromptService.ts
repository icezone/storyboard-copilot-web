import { analyzeWithGeminiMultimodal } from './providers/geminiAnalysis'
import { reversePromptGenericPrompt } from './prompts/reversePromptGeneric'
import { reversePromptChinesePrompt } from './prompts/reversePromptChinese'
import type { ReversePromptParams, ReversePromptResult } from './types'
import { safeJsonParse } from './novelAnalysisService'

/**
 * Generate a reverse prompt from an image using multimodal LLM.
 * Supports 'generic' (English) and 'chinese' output styles.
 */
export async function generateReversePrompt(params: ReversePromptParams): Promise<ReversePromptResult> {
  // Validate input
  if (!params.imageUrl || params.imageUrl.trim().length === 0) {
    throw new Error('imageUrl is required')
  }

  const style = params.style || 'generic'
  const promptTemplate = style === 'chinese'
    ? reversePromptChinesePrompt
    : reversePromptGenericPrompt

  // Call multimodal LLM
  const rawResult = await analyzeWithGeminiMultimodal({
    systemPrompt: promptTemplate.system,
    userMessage: promptTemplate.userTemplate(params.additionalContext),
    imageUrl: params.imageUrl,
    temperature: 0.4,
  })

  // Parse JSON robustly
  const parsed = safeJsonParse(rawResult)

  return {
    prompt: typeof parsed.prompt === 'string' ? parsed.prompt : '',
    negativePrompt: typeof parsed.negative_prompt === 'string' ? parsed.negative_prompt : undefined,
    tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t): t is string => typeof t === 'string') : undefined,
    confidence: typeof parsed.confidence === 'number' ? clampConfidence(parsed.confidence) : 0.8,
  }
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value))
}

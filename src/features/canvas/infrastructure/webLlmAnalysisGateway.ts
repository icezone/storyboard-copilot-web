import type {
  LlmAnalysisGateway,
  ReversePromptPayload,
  ReversePromptResult,
  ShotAnalysisPayload,
  ShotAnalysisResult,
} from '../application/ports';

export class WebLlmAnalysisGateway implements LlmAnalysisGateway {
  async reversePrompt(payload: ReversePromptPayload): Promise<ReversePromptResult> {
    const response = await fetch('/api/ai/reverse-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: payload.imageUrl,
        style: payload.style,
        additionalContext: payload.additionalContext,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Request failed: ${response.status}` }));
      throw new Error((errorData as { error?: string }).error || `Reverse prompt failed: ${response.status}`);
    }

    return response.json() as Promise<ReversePromptResult>;
  }

  async analyzeShot(payload: ShotAnalysisPayload): Promise<ShotAnalysisResult> {
    const response = await fetch('/api/ai/shot-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: payload.imageUrl,
        additionalContext: payload.additionalContext,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Request failed: ${response.status}` }));
      throw new Error((errorData as { error?: string }).error || `Shot analysis failed: ${response.status}`);
    }

    return response.json() as Promise<ShotAnalysisResult>;
  }
}

export const webLlmAnalysisGateway = new WebLlmAnalysisGateway();

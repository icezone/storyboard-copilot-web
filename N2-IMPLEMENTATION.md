# N2: Reverse Prompt Generation - Implementation Summary

## Overview

Implemented the complete N2 Reverse Prompt Generation feature, enabling users to generate detailed AI prompts from any image on the canvas. Supports both English (generic) and Chinese output styles using Gemini multimodal LLM.

## Files Created

| File | Purpose |
|------|---------|
| `src/server/ai/analysis/reversePromptService.ts` | Core service: validates input, selects prompt template, calls multimodal LLM, parses result |
| `src/server/ai/analysis/prompts/reversePromptGeneric.ts` | English system prompt template for generic style |
| `src/server/ai/analysis/prompts/reversePromptChinese.ts` | Chinese system prompt template |
| `src/app/api/ai/reverse-prompt/route.ts` | POST API route with auth, validation, error handling |
| `src/features/canvas/infrastructure/webLlmAnalysisGateway.ts` | Frontend gateway implementing LlmAnalysisGateway port |
| `src/features/canvas/ui/ReversePromptDialog.tsx` | Dialog UI: image preview, style selector, context input, result display, copy/fill actions |
| `__tests__/unit/ai/analysis/reversePromptService.test.ts` | 15 unit tests covering all service logic |

## Files Modified

| File | Changes |
|------|---------|
| `src/server/ai/analysis/types.ts` | Added `ReversePromptParams`, `ReversePromptResult`, `ReversePromptStyle`, `LlmMultimodalRequest` types |
| `src/server/ai/analysis/providers/geminiAnalysis.ts` | Added `analyzeWithGeminiMultimodal()` for image+text input, `resolveImageToBase64()` helper |
| `src/features/canvas/application/ports.ts` | Added `LlmAnalysisGateway` interface, `ReversePromptPayload/Result`, `ShotAnalysisPayload/Result` types, `reverse-prompt/open` event |
| `src/features/canvas/application/canvasServices.ts` | Wired `canvasLlmAnalysisGateway` export |
| `src/features/canvas/ui/NodeActionToolbar.tsx` | Added "Reverse Prompt" button (Sparkles icon) for nodes with images |
| `src/features/canvas/Canvas.tsx` | Mounted `<ReversePromptDialog />` |
| `src/features/canvas/ui/nodeToolbarConfig.ts` | (Unchanged - toolbar config only has position constants; button added directly to NodeActionToolbar) |
| `src/i18n/locales/zh.json` | Added `reversePrompt.*` and `nodeToolbar.reversePrompt` keys |
| `src/i18n/locales/en.json` | Added matching English translations |

## Architecture

```
User clicks "Reverse Prompt" on toolbar
  -> canvasEventBus.publish('reverse-prompt/open', { nodeId, imageUrl })
  -> ReversePromptDialog opens
  -> User selects style, optionally adds context, clicks Generate
  -> WebLlmAnalysisGateway.reversePrompt()
    -> POST /api/ai/reverse-prompt (auth + validation)
      -> generateReversePrompt() service
        -> analyzeWithGeminiMultimodal() (image + system prompt)
        -> Parse JSON response
  -> Display result with Copy and Fill Downstream actions
```

## Environment Variables

- `GEMINI_API_KEY` - Required for Gemini API access (already used by novel analysis)
- `GEMINI_ANALYSIS_MODEL` - Optional, defaults to `gemini-2.0-flash`

## Verification

- TypeScript: `npx tsc --noEmit` passes cleanly
- Unit tests: 15/15 pass (reversePromptService.test.ts)
- Full suite: 351/353 pass (2 pre-existing failures in assets-upload.test.ts)
- Lint: No new errors/warnings introduced

## Design Decisions

1. **No new npm dependency**: Used Gemini REST API directly (same pattern as novel analysis) instead of `@google/generative-ai` SDK, keeping the dependency footprint minimal.
2. **Multimodal via inline_data**: Image is fetched server-side and sent as base64 inline data to Gemini, supporting both remote URLs and data: URIs.
3. **Reused safeJsonParse**: Shared JSON parsing logic from novelAnalysisService for robustness against LLM output quirks.
4. **Event bus pattern**: Dialog opens via canvas event bus (`reverse-prompt/open`), consistent with tool-dialog pattern.
5. **Fill downstream**: Finds connected downstream nodes and fills their `prompt` field, enabling one-click workflow from image analysis to generation.
6. **Two styles only**: Implemented `generic` and `chinese` (dropped `midjourney` from original spec to keep scope focused; easily addable later).

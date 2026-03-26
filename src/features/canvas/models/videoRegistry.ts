import type { VideoModelDefinition } from './types';

// Explicit imports replacing Vite's import.meta.glob (Next.js doesn't support it)
import { videoModel as kling30Model } from './video/kling/kling30';
import { videoModel as sora2ProModel } from './video/sora2/sora2-pro';
import { videoModel as sora2StandardModel } from './video/sora2/sora2-standard';
import { videoModel as veo3FastModel } from './video/veo/veo3-fast';
import { videoModel as veo3QualityModel } from './video/veo/veo3-quality';

const allVideoModels: (VideoModelDefinition | undefined)[] = [
  kling30Model,
  sora2ProModel,
  sora2StandardModel,
  veo3FastModel,
  veo3QualityModel,
];

const videoModels: VideoModelDefinition[] = allVideoModels
  .filter((model): model is VideoModelDefinition => Boolean(model))
  .sort((a, b) => a.id.localeCompare(b.id));

const videoModelMap = new Map<string, VideoModelDefinition>(
  videoModels.map((model) => [model.id, model])
);

export const DEFAULT_VIDEO_MODEL_ID = 'kling/kling-3.0';

const videoModelAliasMap = new Map<string, string>([
  ['kling-3.0', DEFAULT_VIDEO_MODEL_ID],
]);

export function listVideoModels(): VideoModelDefinition[] {
  return videoModels;
}

export function getVideoModel(modelId: string): VideoModelDefinition {
  const resolvedModelId = videoModelAliasMap.get(modelId) ?? modelId;
  return videoModelMap.get(resolvedModelId) ?? videoModelMap.get(DEFAULT_VIDEO_MODEL_ID)!;
}

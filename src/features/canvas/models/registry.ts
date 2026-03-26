import type {
  ImageModelDefinition,
  ImageModelRuntimeContext,
  ModelProviderDefinition,
  ResolutionOption,
} from './types';

// Explicit imports replacing Vite's import.meta.glob (Next.js doesn't support it)
import { provider as falProvider } from './providers/fal';
import { provider as grsaiProvider } from './providers/grsai';
import { provider as kieProvider } from './providers/kie';
import { provider as klingProvider } from './providers/kling';
import { provider as ppioProvider } from './providers/ppio';
import { provider as sora2Provider } from './providers/sora2';
import { provider as veoProvider } from './providers/veo';

import { imageModel as falNanoBanana2 } from './image/fal/nanoBanana2';
import { imageModel as falNanoBananaPro } from './image/fal/nanoBananaPro';
import { imageModel as grsaiNanoBanana2 } from './image/grsai/nanoBanana2';
import { imageModel as grsaiNanoBananaPro } from './image/grsai/nanoBananaPro';
import { imageModel as kieNanoBanana2 } from './image/kie/nanoBanana2';
import { imageModel as kieNanoBananaPro } from './image/kie/nanoBananaPro';
import { imageModel as ppioGemini31Flash } from './image/ppio/gemini31Flash';

const allProviders: (ModelProviderDefinition | undefined)[] = [
  falProvider,
  grsaiProvider,
  kieProvider,
  klingProvider,
  ppioProvider,
  sora2Provider,
  veoProvider,
];

const allImageModels: (ImageModelDefinition | undefined)[] = [
  falNanoBanana2,
  falNanoBananaPro,
  grsaiNanoBanana2,
  grsaiNanoBananaPro,
  kieNanoBanana2,
  kieNanoBananaPro,
  ppioGemini31Flash,
];

const providers: ModelProviderDefinition[] = allProviders
  .filter((p): p is ModelProviderDefinition => Boolean(p))
  .sort((a, b) => a.id.localeCompare(b.id));

const imageModels: ImageModelDefinition[] = allImageModels
  .filter((m): m is ImageModelDefinition => Boolean(m))
  .sort((a, b) => a.id.localeCompare(b.id));

const providerMap = new Map<string, ModelProviderDefinition>(
  providers.map((provider) => [provider.id, provider])
);
const imageModelMap = new Map<string, ImageModelDefinition>(
  imageModels.map((model) => [model.id, model])
);

export const DEFAULT_IMAGE_MODEL_ID = 'kie/nano-banana-2';

const imageModelAliasMap = new Map<string, string>([
  ['gemini-3.1-flash', 'ppio/gemini-3.1-flash'],
  ['gemini-3.1-flash-edit', 'ppio/gemini-3.1-flash'],
]);

export function listImageModels(): ImageModelDefinition[] {
  return imageModels;
}

export function listModelProviders(): ModelProviderDefinition[] {
  return providers;
}

export function getImageModel(modelId: string): ImageModelDefinition {
  const resolvedModelId = imageModelAliasMap.get(modelId) ?? modelId;
  return imageModelMap.get(resolvedModelId) ?? imageModelMap.get(DEFAULT_IMAGE_MODEL_ID)!;
}

export function resolveImageModelResolutions(
  model: ImageModelDefinition,
  context: ImageModelRuntimeContext = {}
): ResolutionOption[] {
  const resolvedOptions = model.resolveResolutions?.(context);
  return resolvedOptions && resolvedOptions.length > 0 ? resolvedOptions : model.resolutions;
}

export function resolveImageModelResolution(
  model: ImageModelDefinition,
  requestedResolution: string | undefined,
  context: ImageModelRuntimeContext = {}
): ResolutionOption {
  const resolutionOptions = resolveImageModelResolutions(model, context);

  return (
    (requestedResolution
      ? resolutionOptions.find((item) => item.value === requestedResolution)
      : undefined) ??
    resolutionOptions.find((item) => item.value === model.defaultResolution) ??
    resolutionOptions[0] ??
    model.resolutions[0]
  );
}

export function getModelProvider(providerId: string): ModelProviderDefinition {
  return (
    providerMap.get(providerId) ?? {
      id: 'unknown',
      name: 'Unknown Provider',
      label: 'Unknown',
    }
  );
}
